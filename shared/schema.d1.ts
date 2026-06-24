import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Auth tables ──────────────────────────────────────────────────────────────

export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess", { mode: "json" }).notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  passwordHash: text("password_hash"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ── Inventory ────────────────────────────────────────────────────────────────

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  amount: real("amount"),
  amountUnit: text("amount_unit"),
  quantity: integer("quantity").notNull().default(1),
  category: text("category").notNull(),
  expiryDate: text("expiry_date"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  lowStockThreshold: integer("low_stock_threshold"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems, {
  brand: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  amountUnit: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// ── Shopping list ────────────────────────────────────────────────────────────

export const shoppingListItems = sqliteTable("shopping_list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
  userId: true,
  createdAt: true,
  checked: true,
});

export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;

// ── Conversations & messages ─────────────────────────────────────────────────

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  userId: true,
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

// ── User profiles ────────────────────────────────────────────────────────────
// dietaryPreferences and restrictions are stored as JSON arrays in SQLite

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  name: text("name"),
  dateOfBirth: text("date_of_birth"),
  height: real("height"),
  heightUnit: text("height_unit").default("in"),
  weight: real("weight"),
  weightUnit: text("weight_unit").default("lbs"),
  dietaryPreferences: text("dietary_preferences", { mode: "json" }).$type<string[] | null>(),
  restrictions: text("restrictions", { mode: "json" }).$type<string[] | null>(),
  themeMode: text("theme_mode").default("light"),
  iconStyle: text("icon_style").default("default"),
  colorTheme: text("color_theme").default("farmhouse"),
  background: text("background").default("none"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// ── Recipes ──────────────────────────────────────────────────────────────────
// ingredients stored as JSON array in SQLite

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ingredients: text("ingredients", { mode: "json" }).$type<string[] | null>(),
  instructions: text("instructions"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  servings: text("servings"),
  category: text("category"),
  source: text("source"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
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
}).omit({ id: true, userId: true, createdAt: true, updatedAt: true });

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

// ── Meal plans ───────────────────────────────────────────────────────────────

export const mealPlans = sqliteTable("meal_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(),
  recipeId: integer("recipe_id"),
  customMealName: text("custom_meal_name"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMealPlanSchema = createInsertSchema(mealPlans, {
  recipeId: z.number().nullable().optional(),
  customMealName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).omit({ id: true, userId: true, createdAt: true });

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
