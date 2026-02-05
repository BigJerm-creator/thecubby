import { 
  type User, type InsertUser, users,
  type InventoryItem, type InsertInventoryItem, inventoryItems,
  type ShoppingListItem, type InsertShoppingListItem, shoppingListItems,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages,
  type UserProfile, type InsertUserProfile, userProfiles,
  type Recipe, type InsertRecipe, recipes,
  type MealPlan, type InsertMealPlan, mealPlans
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt, gte, lte, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getInventoryItems(userId: string): Promise<InventoryItem[]>;
  getInventoryItemsByCategory(userId: string, category: string): Promise<InventoryItem[]>;
  getExpiredItems(userId: string): Promise<InventoryItem[]>;
  createInventoryItem(userId: string, item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(userId: string, id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(userId: string, id: number): Promise<void>;
  
  getShoppingListItems(userId: string): Promise<ShoppingListItem[]>;
  createShoppingListItem(userId: string, item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(userId: string, id: number, checked: boolean): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(userId: string, id: number): Promise<void>;
  
  getConversation(userId: string, id: number): Promise<Conversation | undefined>;
  getAllConversations(userId: string): Promise<Conversation[]>;
  createConversation(userId: string, title: string): Promise<Conversation>;
  deleteConversation(userId: string, id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
  
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(userId: string, profile: InsertUserProfile): Promise<UserProfile>;
  
  getRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(userId: string, id: number): Promise<Recipe | undefined>;
  createRecipe(userId: string, recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(userId: string, id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(userId: string, id: number): Promise<void>;
  
  getMealPlans(userId: string): Promise<MealPlan[]>;
  getMealPlansByDateRange(userId: string, startDate: string, endDate: string): Promise<MealPlan[]>;
  getMealPlansByDate(userId: string, date: string): Promise<MealPlan[]>;
  createMealPlan(userId: string, mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(userId: string, id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(userId: string, id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getInventoryItems(userId: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItemsByCategory(userId: string, category: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.userId, userId), eq(inventoryItems.category, category)))
      .orderBy(desc(inventoryItems.createdAt));
  }

  async getExpiredItems(userId: string): Promise<InventoryItem[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.userId, userId), lt(inventoryItems.expiryDate, today)))
      .orderBy(inventoryItems.expiryDate);
  }

  async createInventoryItem(userId: string, item: InsertInventoryItem): Promise<InventoryItem> {
    const [inventoryItem] = await db.insert(inventoryItems).values({ ...item, userId }).returning();
    return inventoryItem;
  }

  async updateInventoryItem(userId: string, id: number, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db.update(inventoryItems).set(updates)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteInventoryItem(userId: string, id: number): Promise<void> {
    await db.delete(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
  }

  async getShoppingListItems(userId: string): Promise<ShoppingListItem[]> {
    return db.select().from(shoppingListItems).where(eq(shoppingListItems.userId, userId)).orderBy(desc(shoppingListItems.createdAt));
  }

  async createShoppingListItem(userId: string, item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [shoppingItem] = await db.insert(shoppingListItems).values({ ...item, userId }).returning();
    return shoppingItem;
  }

  async updateShoppingListItem(userId: string, id: number, checked: boolean): Promise<ShoppingListItem | undefined> {
    const [updated] = await db.update(shoppingListItems).set({ checked })
      .where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)))
      .returning();
    return updated;
  }

  async deleteShoppingListItem(userId: string, id: number): Promise<void> {
    await db.delete(shoppingListItems).where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, userId)));
  }

  async getConversation(userId: string, id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return conversation;
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
  }

  async createConversation(userId: string, title: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({ title, userId }).returning();
    return conversation;
  }

  async deleteConversation(userId: string, id: number): Promise<void> {
    const conversation = await this.getConversation(userId, id);
    if (conversation) {
      await db.delete(messages).where(eq(messages.conversationId, id));
      await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    }
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return profile;
  }

  async upsertUserProfile(userId: string, profile: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [updated] = await db.update(userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProfiles).values({ ...profile, userId }).returning();
      return created;
    }
  }

  async getRecipes(userId: string): Promise<Recipe[]> {
    return db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(desc(recipes.createdAt));
  }

  async getRecipe(userId: string, id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return recipe;
  }

  async createRecipe(userId: string, recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values({ ...recipe, userId }).returning();
    return created;
  }

  async updateRecipe(userId: string, id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return updated;
  }

  async deleteRecipe(userId: string, id: number): Promise<void> {
    await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
  }

  async getMealPlans(userId: string): Promise<MealPlan[]> {
    return db.select().from(mealPlans).where(eq(mealPlans.userId, userId)).orderBy(mealPlans.date);
  }

  async getMealPlansByDateRange(userId: string, startDate: string, endDate: string): Promise<MealPlan[]> {
    return db.select().from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), gte(mealPlans.date, startDate), lte(mealPlans.date, endDate)))
      .orderBy(mealPlans.date);
  }

  async getMealPlansByDate(userId: string, date: string): Promise<MealPlan[]> {
    return db.select().from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.date, date)));
  }

  async createMealPlan(userId: string, mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [created] = await db.insert(mealPlans).values({ ...mealPlan, userId }).returning();
    return created;
  }

  async updateMealPlan(userId: string, id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const [updated] = await db.update(mealPlans).set(mealPlan)
      .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)))
      .returning();
    return updated;
  }

  async deleteMealPlan(userId: string, id: number): Promise<void> {
    await db.delete(mealPlans).where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
