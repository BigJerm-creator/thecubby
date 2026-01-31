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
  
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByCategory(category: string): Promise<InventoryItem[]>;
  getExpiredItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;
  
  getShoppingListItems(): Promise<ShoppingListItem[]>;
  createShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: number, checked: boolean): Promise<ShoppingListItem | undefined>;
  deleteShoppingListItem(id: number): Promise<void>;
  
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
  
  getUserProfile(): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<void>;
  
  getMealPlans(): Promise<MealPlan[]>;
  getMealPlansByDateRange(startDate: string, endDate: string): Promise<MealPlan[]>;
  getMealPlansByDate(date: string): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<void>;
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

  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt));
  }

  async getInventoryItemsByCategory(category: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.category, category)).orderBy(desc(inventoryItems.createdAt));
  }

  async getExpiredItems(): Promise<InventoryItem[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(inventoryItems).where(lt(inventoryItems.expiryDate, today)).orderBy(inventoryItems.expiryDate);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [inventoryItem] = await db.insert(inventoryItems).values(item).returning();
    return inventoryItem;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getShoppingListItems(): Promise<ShoppingListItem[]> {
    return db.select().from(shoppingListItems).orderBy(desc(shoppingListItems.createdAt));
  }

  async createShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const [shoppingItem] = await db.insert(shoppingListItems).values(item).returning();
    return shoppingItem;
  }

  async updateShoppingListItem(id: number, checked: boolean): Promise<ShoppingListItem | undefined> {
    const [updated] = await db.update(shoppingListItems).set({ checked }).where(eq(shoppingListItems.id, id)).returning();
    return updated;
  }

  async deleteShoppingListItem(id: number): Promise<void> {
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async createConversation(title: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }

  async getUserProfile(): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).limit(1);
    return profile;
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile();
    if (existing) {
      const [updated] = await db.update(userProfiles)
        .set({ ...profile, updatedAt: new Date() })
        .where(eq(userProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userProfiles).values(profile).returning();
      return created;
    }
  }

  async getRecipes(): Promise<Recipe[]> {
    return db.select().from(recipes).orderBy(desc(recipes.createdAt));
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async getMealPlans(): Promise<MealPlan[]> {
    return db.select().from(mealPlans).orderBy(mealPlans.date);
  }

  async getMealPlansByDateRange(startDate: string, endDate: string): Promise<MealPlan[]> {
    return db.select().from(mealPlans)
      .where(and(gte(mealPlans.date, startDate), lte(mealPlans.date, endDate)))
      .orderBy(mealPlans.date);
  }

  async getMealPlansByDate(date: string): Promise<MealPlan[]> {
    return db.select().from(mealPlans).where(eq(mealPlans.date, date));
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const [created] = await db.insert(mealPlans).values(mealPlan).returning();
    return created;
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    const [updated] = await db.update(mealPlans).set(mealPlan).where(eq(mealPlans.id, id)).returning();
    return updated;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
