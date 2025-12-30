import { 
  type User, type InsertUser, users,
  type InventoryItem, type InsertInventoryItem, inventoryItems,
  type ShoppingListItem, type InsertShoppingListItem, shoppingListItems,
  type Conversation, type InsertConversation, conversations,
  type Message, type InsertMessage, messages
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lt } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
