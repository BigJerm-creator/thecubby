import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getCookie } from "hono/cookie";
import OpenAI from "openai";
import {
  insertInventoryItemSchema,
  insertShoppingListItemSchema,
  insertUserProfileSchema,
  insertRecipeSchema,
  insertMealPlanSchema,
} from "../shared/schema.d1";
import { getDb } from "./db";
import { D1Storage } from "./storage";
import {
  injectDb,
  isAuthenticated,
  handleRegister,
  handleLogin,
  handleLogout,
  handleGetUser,
  handleGoogleOAuth,
  handleGoogleCallback,
  type HonoEnv,
} from "./auth";
import type { Env } from "./types";

const app = new Hono<HonoEnv>();

// ── CORS ──────────────────────────────────────────────────────────────────────

const CAPACITOR_ORIGINS = ["capacitor://localhost", "https://localhost", "http://localhost"];

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  if (origin && CAPACITOR_ORIGINS.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Allow-Credentials", "true");
  } else if (!origin || origin === "null") {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  return next();
});

// ── DB injection ──────────────────────────────────────────────────────────────

app.use("*", injectDb);

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post("/api/auth/register", handleRegister);
app.post("/api/auth/login", handleLogin);
app.post("/api/auth/logout", handleLogout);
app.get("/api/auth/user", isAuthenticated, handleGetUser);
app.get("/api/auth/google", handleGoogleOAuth);
app.get("/api/auth/google/callback", handleGoogleCallback);

// ── UPC lookup (public) ───────────────────────────────────────────────────────

function guessCategory(categories: string[], productName?: string, brand?: string): string {
  const categoryKeywords: Record<string, string[]> = {
    spices: ["spice","seasoning","herb","pepper","salt","cinnamon","oregano","basil","thyme","rosemary","cumin","paprika","turmeric","garlic powder","onion powder","chili","curry","ginger","nutmeg","cloves","bay leaves","dill","parsley","cilantro","sage","extract","bouillon"],
    refrigerated: ["dairy","milk","cheese","yogurt","butter","cream","egg","eggs","margarine","sour cream","cottage cheese","deli","cold cuts","bacon","sausage","hot dog","fresh pasta","orange juice","hummus","guacamole","salsa","tofu","tempeh","fresh","refrigerate","chilled","dough","biscuits","croissant","tortilla"],
    frozen: ["frozen","ice cream","gelato","sorbet","popsicle","freezer","fish sticks","tv dinner","microwave meal","pot pie","eggo","lean cuisine","stouffers"],
    canned: ["canned","tinned","preserved","jarred","pickled","tuna","salmon","sardine","tomato sauce","tomato paste","coconut milk","evaporated milk","condensed milk","campbell","progresso","chef boyardee"],
    boxed: ["cereal","oatmeal","granola","pasta","noodle","macaroni","spaghetti","ramen","cracker","cookie","chip","pretzel","popcorn","granola bar","protein bar","boxed","dry mix","cake mix","instant","mac and cheese","kraft","kellogg"],
    bulk: ["rice","grain","flour","sugar","baking","bean","lentil","quinoa","barley","oat","wheat","almond flour","brown sugar","baking soda","baking powder","yeast","cornstarch","nut","almond","walnut","cashew","peanut","seed","honey","maple syrup"],
    beverages: ["beverage","drink","soda","cola","water","tea","coffee","juice","lemonade","sports drink","energy drink","kombucha","almond milk","oat milk","soy milk","wine","beer","alcohol"],
    condiments: ["condiment","sauce","ketchup","mustard","mayonnaise","mayo","relish","bbq sauce","hot sauce","sriracha","soy sauce","teriyaki","worcestershire","vinegar","oil","olive oil","dressing","jam","jelly","peanut butter","spread"],
    produce: ["produce","vegetable","fruit","apple","banana","orange","grape","strawberry","lemon","lime","avocado","tomato","potato","onion","garlic","carrot","celery","broccoli","spinach","lettuce","kale","mushroom"],
    meat: ["meat","beef","pork","chicken","turkey","lamb","steak","ground beef","roast","chop","ham","prosciutto","salami","pepperoni","chorizo"],
    seafood: ["seafood","fish","shrimp","salmon","tilapia","cod","tuna steak","crab","lobster","clam","mussel","oyster","scallop"],
    bakery: ["bakery","bread","baguette","loaf","roll","bun","bagel","croissant","pastry","donut","muffin","scone","cake","cupcake","pie","cookie","brownie","sourdough"],
    baby: ["baby","infant","toddler","baby food","formula","gerber","similac","enfamil"],
    pet: ["pet","dog","cat","pet food","dog food","cat food","kibble","purina","pedigree"],
  };

  const allText = [...categories.map((c) => c.toLowerCase().replace(/^en:/, "")), (productName || "").toLowerCase(), (brand || "").toLowerCase()].join(" ");
  let bestCategory = "boxed";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (allText.includes(kw)) score += kw.split(" ").length;
    }
    if (score > bestScore) { bestScore = score; bestCategory = category; }
  }
  return bestCategory;
}

app.get("/api/upc/:barcode", async (c) => {
  const { barcode } = c.req.param();
  const formatOFF = (product: any, source: string) => {
    const name = product.product_name || product.product_name_en || product.generic_name || null;
    const brand = product.brands || null;
    const categoryHints = [...(product.categories_tags || []), ...(product.categories?.split(",") || []), ...(product.labels_tags || []), product.packaging || ""];
    return { found: true, name, brand, category: guessCategory(categoryHints, name, brand), quantity: product.quantity || null, imageUrl: product.image_front_url || product.image_url || null, ingredients: product.ingredients_text || null, allergens: product.allergens_tags?.map((a: string) => a.replace("en:", "")) || [], nutrition: null, source };
  };

  try {
    const [worldRes, usRes] = await Promise.all([
      fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`).catch(() => null),
      fetch(`https://us.openfoodfacts.org/api/v0/product/${barcode}.json`).catch(() => null),
    ]);
    if (worldRes?.ok) { const d = await worldRes.json() as any; if (d.status === 1 && d.product?.product_name) return c.json(formatOFF(d.product, "openfoodfacts-world")); }
    if (usRes?.ok) { const d = await usRes.json() as any; if (d.status === 1 && d.product?.product_name) return c.json(formatOFF(d.product, "openfoodfacts-us")); }

    const beautyRes = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`).catch(() => null);
    if (beautyRes?.ok) { const d = await beautyRes.json() as any; if (d.status === 1 && d.product?.product_name) return c.json({ found: true, name: d.product.product_name, brand: d.product.brands || null, category: "other", quantity: d.product.quantity || null, imageUrl: d.product.image_front_url || null, source: "openbeautyfacts" }); }

    const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`).catch(() => null);
    if (upcRes?.ok) { const d = await upcRes.json() as any; if (d.items?.length > 0) { const item = d.items[0]; return c.json({ found: true, name: item.title, brand: item.brand || null, category: guessCategory(item.category ? [item.category] : [], item.title, item.brand), quantity: null, imageUrl: item.images?.[0] || null, source: "upcitemdb" }); } }

    return c.json({ found: false, barcode, message: "Product not found" });
  } catch {
    return c.json({ found: false, error: "Lookup failed" });
  }
});

// ── Inventory ─────────────────────────────────────────────────────────────────

app.get("/api/inventory", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json(await store.getInventoryItems(c.get("userId")));
});

app.get("/api/inventory/expired", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json(await store.getExpiredItems(c.get("userId")));
});

app.get("/api/inventory/category/:category", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json(await store.getInventoryItemsByCategory(c.get("userId"), c.req.param("category")));
});

app.post("/api/inventory", isAuthenticated, async (c) => {
  const body = await c.req.json();
  const parsed = insertInventoryItemSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  const store = new D1Storage(c.get("db"));
  return c.json(await store.createInventoryItem(c.get("userId"), parsed.data), 201);
});

app.patch("/api/inventory/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const item = await store.updateInventoryItem(c.get("userId"), Number(c.req.param("id")), await c.req.json());
  if (!item) return c.json({ error: "Item not found" }, 404);
  return c.json(item);
});

app.delete("/api/inventory/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  await store.deleteInventoryItem(c.get("userId"), Number(c.req.param("id")));
  return c.body(null, 204);
});

app.post("/api/inventory/use-ingredients", isAuthenticated, async (c) => {
  const { ingredients } = await c.req.json() as { ingredients: string[] };
  if (!Array.isArray(ingredients)) return c.json({ error: "ingredients array is required" }, 400);
  const store = new D1Storage(c.get("db"));
  const userId = c.get("userId");
  const allItems = await store.getInventoryItems(userId);
  const used: { name: string; matched: string | null }[] = [];
  const updates: { id: number; quantity: number }[] = [];
  const deletes: number[] = [];
  const consumed = new Set<number>();

  for (const ingredientLine of ingredients) {
    const normalized = ingredientLine.replace(/\*\*/g, "").replace(/--/g, "").replace(/^\d+[\.\)]\s*/, "").replace(/^[-•]\s*/, "").trim().toLowerCase();
    if (!normalized) continue;
    let bestMatch: (typeof allItems)[0] | null = null;
    let bestScore = 0;
    for (const item of allItems) {
      if (consumed.has(item.id)) continue;
      const itemName = item.name.toLowerCase();
      if (normalized.includes(itemName) || itemName.includes(normalized)) {
        if (itemName.length > bestScore) { bestScore = itemName.length; bestMatch = item; }
      } else {
        const words = itemName.split(/\s+/).filter((w) => w.length > 2);
        const matched = words.filter((w) => normalized.includes(w));
        if (matched.length >= Math.ceil(words.length * 0.6) && matched.length >= 1 && matched.length > bestScore) { bestScore = matched.length; bestMatch = item; }
      }
    }
    if (bestMatch) {
      consumed.add(bestMatch.id);
      if (bestMatch.quantity > 1) { bestMatch.quantity -= 1; updates.push({ id: bestMatch.id, quantity: bestMatch.quantity }); }
      else { deletes.push(bestMatch.id); allItems.splice(allItems.indexOf(bestMatch), 1); }
      used.push({ name: ingredientLine, matched: bestMatch.name });
    } else {
      used.push({ name: ingredientLine, matched: null });
    }
  }
  for (const u of updates) await store.updateInventoryItem(userId, u.id, { quantity: u.quantity });
  for (const id of deletes) await store.deleteInventoryItem(userId, id);
  return c.json({ used });
});

// ── Shopping list ─────────────────────────────────────────────────────────────

app.get("/api/shopping-list", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json(await store.getShoppingListItems(c.get("userId")));
});

app.post("/api/shopping-list", isAuthenticated, async (c) => {
  const parsed = insertShoppingListItemSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  const store = new D1Storage(c.get("db"));
  return c.json(await store.createShoppingListItem(c.get("userId"), parsed.data), 201);
});

app.patch("/api/shopping-list/:id", isAuthenticated, async (c) => {
  const { checked } = await c.req.json();
  const store = new D1Storage(c.get("db"));
  const item = await store.updateShoppingListItem(c.get("userId"), Number(c.req.param("id")), checked);
  if (!item) return c.json({ error: "Item not found" }, 404);
  return c.json(item);
});

app.delete("/api/shopping-list/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  await store.deleteShoppingListItem(c.get("userId"), Number(c.req.param("id")));
  return c.body(null, 204);
});

// ── Profile ───────────────────────────────────────────────────────────────────

app.get("/api/profile", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json((await store.getUserProfile(c.get("userId"))) ?? null);
});

app.post("/api/profile", isAuthenticated, async (c) => {
  const parsed = insertUserProfileSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  const store = new D1Storage(c.get("db"));
  return c.json(await store.upsertUserProfile(c.get("userId"), parsed.data));
});

// ── AI: generate recipe (SSE) ─────────────────────────────────────────────────

app.post("/api/generate-recipe", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const userId = c.get("userId");
  const [items, profile] = await Promise.all([store.getInventoryItems(userId), store.getUserProfile(userId)]);
  if (items.length === 0) return c.json({ error: "No ingredients in your pantry. Add some items first!" }, 400);

  const ingredientsList = items.map((item) => {
    const amountStr = item.amount && item.amountUnit ? ` (${item.amount} ${item.amountUnit})` : "";
    const qtyStr = item.quantity > 1 ? `${item.quantity}x ` : "";
    return `${qtyStr}${item.name}${amountStr}${item.brand ? ` - ${item.brand}` : ""}`;
  }).join(", ");

  let dietaryContext = "";
  if (profile) {
    const prefs = profile.dietaryPreferences || [];
    const restrictions = profile.restrictions || [];
    if (prefs.length > 0) dietaryContext += `Dietary preferences: ${prefs.join(", ")}. `;
    if (restrictions.length > 0) dietaryContext += `Food restrictions (MUST AVOID): ${restrictions.join(", ")}. `;
  }

  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

  return streamSSE(c, async (stream) => {
    const aiStream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are a helpful chef assistant. Generate a delicious recipe using the available ingredients. ${dietaryContext}Format your response with clear sections: Recipe Name, Prep Time, Cook Time, Servings, Ingredients, Instructions, and Tips.` },
        { role: "user", content: `Create a recipe using some or all of these ingredients from my pantry: ${ingredientsList}` },
      ],
      stream: true,
      max_tokens: 1500,
    });

    for await (const chunk of aiStream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) await stream.writeSSE({ data: JSON.stringify({ content }) });
    }
    await stream.writeSSE({ data: JSON.stringify({ done: true }) });
  });
});

// ── Recipes ───────────────────────────────────────────────────────────────────

app.get("/api/recipes", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  return c.json(await store.getRecipes(c.get("userId")));
});

app.get("/api/recipes/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const recipe = await store.getRecipe(c.get("userId"), Number(c.req.param("id")));
  if (!recipe) return c.json({ error: "Recipe not found" }, 404);
  return c.json(recipe);
});

app.post("/api/recipes", isAuthenticated, async (c) => {
  const parsed = insertRecipeSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  const store = new D1Storage(c.get("db"));
  return c.json(await store.createRecipe(c.get("userId"), parsed.data), 201);
});

app.patch("/api/recipes/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const recipe = await store.updateRecipe(c.get("userId"), Number(c.req.param("id")), await c.req.json());
  if (!recipe) return c.json({ error: "Recipe not found" }, 404);
  return c.json(recipe);
});

app.delete("/api/recipes/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  await store.deleteRecipe(c.get("userId"), Number(c.req.param("id")));
  return c.body(null, 204);
});

// ── Recipe from image (replaces multer) ───────────────────────────────────────

app.post("/api/recipes/parse-image", isAuthenticated, async (c) => {
  const form = await c.req.formData().catch(() => null);
  if (!form) return c.json({ error: "No form data" }, 400);
  const files = form.getAll("images") as File[];
  if (files.length === 0) return c.json({ error: "No image files uploaded" }, 400);

  const imageContents = await Promise.all(
    files.map(async (file) => {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      return { type: "image_url" as const, image_url: { url: `data:${file.type || "image/jpeg"};base64,${b64}` } };
    })
  );

  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: `Extract recipe information from the image(s) and return valid JSON: {"title","description","ingredients":[],"instructions","prepTime","cookTime","servings","category"}. Multiple images = one recipe. Return JSON only.` },
      { role: "user", content: [{ type: "text", text: files.length > 1 ? `Extract the recipe from these ${files.length} images:` : "Extract the recipe from this image:" }, ...imageContents] },
    ],
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content || "";
  try {
    const recipeData = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
    recipeData.source = "Image Upload";
    return c.json(recipeData);
  } catch {
    return c.json({ error: "Failed to parse recipe from images" }, 500);
  }
});

// ── Meal plan generation ──────────────────────────────────────────────────────

app.post("/api/generate-meal-plan", isAuthenticated, async (c) => {
  const body = await c.req.json() as any;
  const { days = 7, mealTypes = ["breakfast", "lunch", "dinner"], startDate } = body;

  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return c.json({ error: "A valid startDate (YYYY-MM-DD) is required" }, 400);
  if (!Number.isInteger(days) || days < 1 || days > 14) return c.json({ error: "Days must be between 1 and 14" }, 400);
  const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
  if (!Array.isArray(mealTypes) || !mealTypes.every((t: string) => validMealTypes.includes(t))) return c.json({ error: "Invalid meal types" }, 400);

  const store = new D1Storage(c.get("db"));
  const userId = c.get("userId");
  const [items, profile] = await Promise.all([store.getInventoryItems(userId), store.getUserProfile(userId)]);
  if (items.length === 0) return c.json({ error: "No ingredients in your pantry. Add some items first!" }, 400);

  const ingredientsList = items.map((item) => {
    const parts: string[] = [];
    if (item.quantity > 1) parts.push(`${item.quantity}x`);
    parts.push(item.name);
    if (item.amount && item.amountUnit) parts.push(`(${item.amount} ${item.amountUnit})`);
    if (item.brand) parts.push(`- ${item.brand}`);
    return parts.join(" ");
  }).join("\n");

  let dietaryContext = "";
  if (profile) {
    const prefs = profile.dietaryPreferences || [];
    const restrictions = profile.restrictions || [];
    if (prefs.length) dietaryContext += `Dietary preferences: ${prefs.join(", ")}. `;
    if (restrictions.length) dietaryContext += `Food restrictions (MUST AVOID): ${restrictions.join(", ")}. `;
  }

  const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: `You are a meal planning assistant. Generate a ${days}-day meal plan with FULL recipes. ${dietaryContext}\nRespond with valid JSON only:\n{"meals":[{"day":1,"date":"YYYY-MM-DD","mealType":"breakfast|lunch|dinner|snack","name":"","description":"","ingredients":[],"instructions":"","prepTime":"","cookTime":"","servings":""}],"shoppingList":[{"name":"","quantity":"","category":""}]}` },
      { role: "user", content: `Create a ${days}-day meal plan starting ${startDate}. My pantry:\n${ingredientsList}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return c.json({ error: "No response from AI" }, 500);
  const mealPlan = JSON.parse(content) as any;
  if (!Array.isArray(mealPlan.meals)) mealPlan.meals = [];
  if (!Array.isArray(mealPlan.shoppingList)) mealPlan.shoppingList = [];
  mealPlan.meals = mealPlan.meals.filter((m: any) => m?.name && m?.mealType && m?.date);
  mealPlan.shoppingList = mealPlan.shoppingList.filter((s: any) => s?.name);
  return c.json(mealPlan);
});

// ── Recipe search (TheMealDB) ─────────────────────────────────────────────────

function normalizeMeal(m: any) {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = m[`strIngredient${i}`]; const measure = m[`strMeasure${i}`];
    if (ing?.trim()) ingredients.push(measure?.trim() ? `${measure.trim()} ${ing.trim()}` : ing.trim());
  }
  return { id: m.idMeal, title: m.strMeal, category: m.strCategory || "", area: m.strArea || "", instructions: m.strInstructions || "", thumbnail: m.strMealThumb || "", ingredients, source: m.strSource || "", youtube: m.strYoutube || "" };
}

async function lookupMealsByIds(ids: string[]) {
  const results = await Promise.all(ids.map(async (id) => {
    try { const r = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`); const d = await r.json() as any; return d.meals?.[0] ? normalizeMeal(d.meals[0]) : null; } catch { return null; }
  }));
  return results.filter(Boolean);
}

app.get("/api/recipe-search", isAuthenticated, async (c) => {
  const { q, category, area } = c.req.query();
  if (category?.trim()) {
    const r = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category.trim())}`);
    const d = await r.json() as any;
    return c.json({ meals: await lookupMealsByIds((d.meals || []).slice(0, 20).map((s: any) => s.idMeal)) });
  }
  if (area?.trim()) {
    const r = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(area.trim())}`);
    const d = await r.json() as any;
    return c.json({ meals: await lookupMealsByIds((d.meals || []).slice(0, 20).map((s: any) => s.idMeal)) });
  }
  if (!q?.trim()) return c.json({ meals: [] });

  const [nameRes, ingRes] = await Promise.all([
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`).catch(() => null),
    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(q)}`).catch(() => null),
  ]);
  const seen = new Set<string>(); const allMeals: any[] = [];
  if (nameRes?.ok) { const d = await nameRes.json() as any; for (const m of d.meals || []) { if (!seen.has(m.idMeal)) { seen.add(m.idMeal); allMeals.push(normalizeMeal(m)); } } }
  if (ingRes?.ok) { const d = await ingRes.json() as any; const stubs = (d.meals || []).filter((s: any) => !seen.has(s.idMeal)); const ids = stubs.slice(0, 15).map((s: any) => s.idMeal); if (ids.length) { for (const m of await lookupMealsByIds(ids)) { if (m && !seen.has((m as any).id)) { seen.add((m as any).id); allMeals.push(m); } } } }
  return c.json({ meals: allMeals });
});

app.get("/api/recipe-search/filters", isAuthenticated, async (c) => {
  const [catRes, areaRes] = await Promise.all([
    fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list").catch(() => null),
    fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list").catch(() => null),
  ]);
  const categories: string[] = []; const areas: string[] = [];
  if (catRes?.ok) { const d = await catRes.json() as any; for (const c of d.meals || []) { if (c.strCategory) categories.push(c.strCategory); } }
  if (areaRes?.ok) { const d = await areaRes.json() as any; for (const a of d.meals || []) { if (a.strArea && a.strArea !== "Unknown") areas.push(a.strArea); } }
  return c.json({ categories, areas });
});

// ── Meal plans ────────────────────────────────────────────────────────────────

app.get("/api/meal-plans", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const userId = c.get("userId");
  const { startDate, endDate, date } = c.req.query();
  let plans;
  if (date) plans = await store.getMealPlansByDate(userId, date);
  else if (startDate && endDate) plans = await store.getMealPlansByDateRange(userId, startDate, endDate);
  else plans = await store.getMealPlans(userId);
  return c.json(plans);
});

app.post("/api/meal-plans", isAuthenticated, async (c) => {
  const parsed = insertMealPlanSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
  const store = new D1Storage(c.get("db"));
  return c.json(await store.createMealPlan(c.get("userId"), parsed.data), 201);
});

app.patch("/api/meal-plans/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  const plan = await store.updateMealPlan(c.get("userId"), Number(c.req.param("id")), await c.req.json());
  if (!plan) return c.json({ error: "Meal plan not found" }, 404);
  return c.json(plan);
});

app.delete("/api/meal-plans/:id", isAuthenticated, async (c) => {
  const store = new D1Storage(c.get("db"));
  await store.deleteMealPlan(c.get("userId"), Number(c.req.param("id")));
  return c.body(null, 204);
});

// ── Static asset fallthrough ──────────────────────────────────────────────────

app.all("*", async (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
