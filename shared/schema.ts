import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  amount: doublePrecision("amount"),
  amountUnit: text("amount_unit"),
  quantity: integer("quantity").notNull().default(1),
  category: text("category").notNull(),
  expiryDate: text("expiry_date"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems, {
  brand: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  amountUnit: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  checked: boolean("checked").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
  createdAt: true,
  checked: true,
});

export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  name: text("name"),
  dateOfBirth: text("date_of_birth"),
  height: doublePrecision("height"),
  heightUnit: text("height_unit").default("in"),
  weight: doublePrecision("weight"),
  weightUnit: text("weight_unit").default("lbs"),
  dietaryPreferences: text("dietary_preferences").array(),
  restrictions: text("restrictions").array(),
  themeMode: text("theme_mode").default("light"),
  iconStyle: text("icon_style").default("default"),
  colorTheme: text("color_theme").default("farmhouse"),
  background: text("background").default("none"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles, {
  name: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  height: z.number().nullable().optional(),
  heightUnit: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.string().nullable().optional(),
  dietaryPreferences: z.array(z.string()).nullable().optional(),
  restrictions: z.array(z.string()).nullable().optional(),
  themeMode: z.string().nullable().optional(),
  iconStyle: z.string().nullable().optional(),
  colorTheme: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  ingredients: text("ingredients").array(),
  instructions: text("instructions"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  servings: text("servings"),
  category: text("category"),
  source: text("source"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertRecipeSchema = createInsertSchema(recipes, {
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string()).nullable().optional(),
  instructions: z.string().nullable().optional(),
  prepTime: z.string().nullable().optional(),
  cookTime: z.string().nullable().optional(),
  servings: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(),
  recipeId: integer("recipe_id"),
  customMealName: text("custom_meal_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMealPlanSchema = createInsertSchema(mealPlans, {
  recipeId: z.number().nullable().optional(),
  customMealName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
