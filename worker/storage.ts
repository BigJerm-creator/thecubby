import { eq, desc, lt, gte, lte, and } from "drizzle-orm";
import {
  users, inventoryItems, shoppingListItems, conversations,
  messages, userProfiles, recipes, mealPlans,
  type User, type InventoryItem, type InsertInventoryItem,
  type ShoppingListItem, type InsertShoppingListItem,
  type Conversation, type Message,
  type UserProfile, type InsertUserProfile,
  type Recipe, type InsertRecipe,
  type MealPlan, type InsertMealPlan,
} from "../shared/schema.d1";
import type { DB } from "./db";

export class D1Storage {
  constructor(private db: DB) {}

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(data: { id: string; email?: string | null; firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null }): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({ target: users.id, set: { ...data, updatedAt: new Date().toISOString() } })
      .returning();
    return user;
  }

  // ── Inventory ──────────────────────────────────────────────────────────────

  async getInventoryItems(userId: string): Promise<InventoryItem[]> {
    return this.db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItemsByCategory(userId: string, category: string): Promise<InventoryItem[]> {
    return this.db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.userId, userId), eq(inventoryItems.category, category)))
      .orderBy(desc(inventoryItems.createdAt));
  }

  async getExpiredItems(userId: string): Promise<InventoryItem[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.userId, userId), lt(inventoryItems.expiryDate, today)))
      .orderBy(inventoryItems.expiryDate);
  }

  async createInventoryItem(userId: string, item: InsertInventoryItem): Promise<InventoryItem> {
    const [row] = await this.db.insert(inventoryItems).values({ ...item, userId }).returning();
    return row;
  }

  async updateInventoryItem(userId: string, id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [row] = await this.db.update(inventoryItems).set(updates)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
      .returning();
    return row;
  }

  async deleteInventoryItem(userId: string, id: number): Promise<void> {
    await this.db.delete(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
  }

  // ── Shopping list ──────────────────────────────────────────────────────────

  async getShoppingListItems(userId: string): Promise<ShoppingListItem[]> {
    return this.db.select().from(shoppingListItems).where(eq(shoppingListItems.userId, userId)).orderBy(desc(shoppingListItems.createdAt));
  }

  async createShoppingListItem(userId: string, item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [row] = await this.db.insert(shoppingListItems).values({ ...item, userId }).returning();
    return row;
  }

  async updateShoppingListItem(userId: string, id: number, checked: boolean): Promise<ShoppingListItem | undefined> {
    const [row] = await this.db.update(shoppingListItems).set({ checked })
      .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)))
      .returning();
    return row;
  }

  async deleteShoppingListItem(userId: string, id: number): Promise<void> {
    await this.db.delete(shoppingListItems).where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)));
  }

  // ── Conversations & messages ───────────────────────────────────────────────

  async getConversation(userId: string, id: number): Promise<Conversation | undefined> {
    const [row] = await this.db.select().from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return row;
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return this.db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
  }

  async createConversation(userId: string, title: string): Promise<Conversation> {
    const [row] = await this.db.insert(conversations).values({ title, userId }).returning();
    return row;
  }

  async deleteConversation(userId: string, id: number): Promise<void> {
    const conv = await this.getConversation(userId, id);
    if (conv) {
      await this.db.delete(messages).where(eq(messages.conversationId, id));
      await this.db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    }
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [row] = await this.db.insert(messages).values({ conversationId, role, content }).returning();
    return row;
  }

  // ── User profiles ──────────────────────────────────────────────────────────

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [row] = await this.db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return row;
  }

  async upsertUserProfile(userId: string, profile: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [row] = await this.db.update(userProfiles)
        .set({ ...profile, updatedAt: new Date().toISOString() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(userProfiles).values({ ...profile, userId }).returning();
    return row;
  }

  // ── Recipes ────────────────────────────────────────────────────────────────

  async getRecipes(userId: string): Promise<Recipe[]> {
    return this.db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(desc(recipes.createdAt));
  }

  async getRecipe(userId: string, id: number): Promise<Recipe | undefined> {
    const [row] = await this.db.select().from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return row;
  }

  async createRecipe(userId: string, recipe: InsertRecipe): Promise<Recipe> {
    const [row] = await this.db.insert(recipes).values({ ...recipe, userId }).returning();
    return row;
  }

  async updateRecipe(userId: string, id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [row] = await this.db.update(recipes)
      .set({ ...recipe, updatedAt: new Date().toISOString() })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return row;
  }

  async deleteRecipe(userId: string, id: number): Promise<void> {
    await this.db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
  }

  // ── Meal plans ─────────────────────────────────────────────────────────────

  async getMealPlans(userId: string): Promise<MealPlan[]> {
    return this.db.select().from(mealPlans).where(eq(mealPlans.userId, userId)).orderBy(mealPlans.date);
  }

  async getMealPlansByDateRange(userId: string, startDate: string, endDate: string): Promise<MealPlan[]> {
    return this.db.select().from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), gte(mealPlans.date, startDate), lte(mealPlans.date, endDate)))
      .orderBy(mealPlans.date);
  }

  async getMealPlansByDate(userId: string, date: string): Promise<MealPlan[]> {
    return this.db.select().from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.date, date)));
  }

  async createMealPlan(userId: string, mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [row] = await this.db.insert(mealPlans).values({ ...mealPlan, userId }).returning();
    return row;
  }

  async updateMealPlan(userId: string, id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const [row] = await this.db.update(mealPlans).set(mealPlan)
      .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)))
      .returning();
    return row;
  }

  async deleteMealPlan(userId: string, id: number): Promise<void> {
    await this.db.delete(mealPlans).where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)));
  }
}
