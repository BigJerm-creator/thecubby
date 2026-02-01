import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertShoppingListItemSchema, insertUserProfileSchema, insertRecipeSchema, insertMealPlanSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import multer from "multer";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function guessCategory(categories: string[]): string {
  const categoryMap: Record<string, string> = {
    'spices': 'spices',
    'seasonings': 'spices',
    'herbs': 'spices',
    'dairy': 'refrigerated',
    'milk': 'refrigerated',
    'cheese': 'refrigerated',
    'yogurt': 'refrigerated',
    'refrigerated': 'refrigerated',
    'frozen': 'frozen',
    'ice cream': 'frozen',
    'canned': 'canned',
    'preserved': 'canned',
    'cereal': 'boxed',
    'pasta': 'boxed',
    'crackers': 'boxed',
    'rice': 'bulk',
    'grains': 'bulk',
    'flour': 'bulk',
    'sugar': 'bulk',
    'beans': 'bulk',
    'lentils': 'bulk',
  };
  
  const normalized = categories.map(c => c.toLowerCase().replace(/^en:/, ''));
  for (const cat of normalized) {
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (cat.includes(keyword)) {
        return category;
      }
    }
  }
  return 'boxed';
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup authentication BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/upc/:barcode", async (req, res) => {
    const { barcode } = req.params;
    
    // Helper to extract nutrition data from Open Food Facts
    const extractNutrition = (nutriments: any) => {
      const nutritionData: Record<string, string | number | null> = {};
      if (nutriments['energy-kcal_100g']) nutritionData.calories = nutriments['energy-kcal_100g'];
      if (nutriments.proteins_100g) nutritionData.protein = nutriments.proteins_100g;
      if (nutriments.carbohydrates_100g) nutritionData.carbs = nutriments.carbohydrates_100g;
      if (nutriments.fat_100g) nutritionData.fat = nutriments.fat_100g;
      if (nutriments.fiber_100g) nutritionData.fiber = nutriments.fiber_100g;
      if (nutriments.sugars_100g) nutritionData.sugar = nutriments.sugars_100g;
      if (nutriments.sodium_100g) nutritionData.sodium = nutriments.sodium_100g;
      return Object.keys(nutritionData).length > 0 ? nutritionData : null;
    };

    // Helper to format Open Food Facts response
    const formatOpenFoodFactsResponse = (product: any, source: string) => ({
      found: true,
      name: product.product_name || product.product_name_en || product.generic_name || null,
      brand: product.brands || null,
      category: guessCategory(product.categories_tags || product.categories?.split(',') || []),
      quantity: product.quantity || product.product_quantity || null,
      imageUrl: product.image_front_url || product.image_url || product.image_front_small_url || null,
      ingredients: product.ingredients_text || product.ingredients_text_en || null,
      allergens: product.allergens_tags?.map((a: string) => a.replace('en:', '')) || [],
      nutrition: extractNutrition(product.nutriments || {}),
      servingSize: product.serving_size || null,
      nutriscore: product.nutriscore_grade || null,
      novaGroup: product.nova_group || null,
      countries: product.countries || null,
      source,
    });

    try {
      // Try multiple Open Food Facts endpoints in parallel for better coverage
      const [worldResponse, usResponse] = await Promise.all([
        fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`).catch(() => null),
        fetch(`https://us.openfoodfacts.org/api/v0/product/${barcode}.json`).catch(() => null),
      ]);

      // Check world.openfoodfacts.org first
      if (worldResponse?.ok) {
        const data = await worldResponse.json();
        if (data.status === 1 && data.product && data.product.product_name) {
          return res.json(formatOpenFoodFactsResponse(data.product, 'openfoodfacts-world'));
        }
      }

      // Check US-specific Open Food Facts
      if (usResponse?.ok) {
        const usData = await usResponse.json();
        if (usData.status === 1 && usData.product && usData.product.product_name) {
          return res.json(formatOpenFoodFactsResponse(usData.product, 'openfoodfacts-us'));
        }
      }

      // Try Open Beauty Facts for personal care items
      try {
        const beautyResponse = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`);
        if (beautyResponse.ok) {
          const beautyData = await beautyResponse.json();
          if (beautyData.status === 1 && beautyData.product && beautyData.product.product_name) {
            return res.json({
              found: true,
              name: beautyData.product.product_name || null,
              brand: beautyData.product.brands || null,
              category: 'other',
              quantity: beautyData.product.quantity || null,
              imageUrl: beautyData.product.image_front_url || beautyData.product.image_url || null,
              ingredients: beautyData.product.ingredients_text || null,
              source: 'openbeautyfacts',
            });
          }
        }
      } catch (e) {
        // Continue to next source
      }

      // Try UPCitemdb as fallback
      try {
        const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
        if (upcResponse.ok) {
          const upcData = await upcResponse.json();
          if (upcData.items && upcData.items.length > 0) {
            const item = upcData.items[0];
            return res.json({
              found: true,
              name: item.title || null,
              brand: item.brand || null,
              category: guessCategory(item.category ? [item.category] : []),
              quantity: null,
              imageUrl: item.images?.[0] || null,
              description: item.description || null,
              ean: item.ean || null,
              upc: item.upc || null,
              source: 'upcitemdb',
            });
          }
        }
      } catch (e) {
        // Continue to next source
      }

      // Try Go-UPC API as another fallback (free tier)
      try {
        const goUpcResponse = await fetch(`https://go-upc.com/api/v1/code/${barcode}`);
        if (goUpcResponse.ok) {
          const goUpcData = await goUpcResponse.json();
          if (goUpcData.product && goUpcData.product.name) {
            return res.json({
              found: true,
              name: goUpcData.product.name || null,
              brand: goUpcData.product.brand || null,
              category: guessCategory(goUpcData.product.category ? [goUpcData.product.category] : []),
              quantity: null,
              imageUrl: goUpcData.product.imageUrl || null,
              description: goUpcData.product.description || null,
              source: 'go-upc',
            });
          }
        }
      } catch (e) {
        // Continue
      }

      // No product found in any source
      res.json({ found: false, barcode, message: "Product not found in any database" });
    } catch (error) {
      console.error("UPC lookup error:", error);
      res.json({ found: false, error: "Lookup failed" });
    }
  });

  app.get("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/category/:category", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getInventoryItemsByCategory(req.params.category);
      res.json(items);
    } catch (error) {
      console.error("Error fetching category items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/inventory/expired", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getExpiredItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching expired items:", error);
      res.status(500).json({ error: "Failed to fetch expired items" });
    }
  });

  app.post("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertInventoryItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const item = await storage.createInventoryItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.delete("/api/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInventoryItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.get("/api/shopping-list", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getShoppingListItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      res.status(500).json({ error: "Failed to fetch shopping list" });
    }
  });

  app.post("/api/shopping-list", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertShoppingListItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const item = await storage.createShoppingListItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating shopping list item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.patch("/api/shopping-list/:id", isAuthenticated, async (req, res) => {
    try {
      const { checked } = req.body;
      const item = await storage.updateShoppingListItem(parseInt(req.params.id), checked);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/shopping-list/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteShoppingListItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shopping list item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getUserProfile();
      res.json(profile || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const profile = await storage.upsertUserProfile(parsed.data);
      res.json(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  app.post("/api/generate-recipe", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      const profile = await storage.getUserProfile();
      const ingredientsList = items.map(item => {
        const amountStr = item.amount && item.amountUnit ? `${item.amount} ${item.amountUnit}` : '';
        const qtyStr = item.quantity > 1 ? `${item.quantity}x` : '';
        return `${qtyStr} ${item.name}${amountStr ? ` (${amountStr})` : ''}${item.brand ? ` - ${item.brand}` : ''}`;
      }).join(", ");
      
      if (items.length === 0) {
        return res.status(400).json({ error: "No ingredients in your pantry. Add some items first!" });
      }

      let dietaryContext = "";
      if (profile) {
        const prefs = profile.dietaryPreferences || [];
        const restrictions = profile.restrictions || [];
        if (prefs.length > 0) {
          dietaryContext += `Dietary preferences: ${prefs.join(", ")}. `;
        }
        if (restrictions.length > 0) {
          dietaryContext += `Food restrictions (MUST AVOID): ${restrictions.join(", ")}. `;
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful chef assistant. Generate a delicious recipe using the available ingredients. ${dietaryContext}Format your response with clear sections: Recipe Name, Prep Time, Cook Time, Servings, Ingredients (list which ones from the pantry you're using), Instructions (numbered steps), and Tips. Be creative but practical. If there are dietary restrictions, strictly avoid those ingredients.`
          },
          {
            role: "user",
            content: `Create a recipe using some or all of these ingredients from my pantry: ${ingredientsList}. You don't have to use all ingredients, just create something delicious!`
          }
        ],
        stream: true,
        max_tokens: 1500,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error generating recipe:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate recipe" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate recipe" });
      }
    }
  });

  // Recipe Book routes
  app.get("/api/recipes", isAuthenticated, async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", isAuthenticated, async (req, res) => {
    try {
      const recipe = await storage.getRecipe(parseInt(req.params.id));
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRecipeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const recipe = await storage.createRecipe(parsed.data);
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  app.patch("/api/recipes/:id", isAuthenticated, async (req, res) => {
    try {
      const recipe = await storage.updateRecipe(parseInt(req.params.id), req.body);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteRecipe(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Image to Recipe conversion (multiple images = single recipe)
  app.post("/api/recipes/parse-image", isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No image files uploaded" });
      }

      const imageContents: any[] = [];
      
      for (const file of files) {
        const base64Image = file.buffer.toString("base64");
        const mimeType = file.mimetype || "image/jpeg";
        imageContents.push({
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a recipe extraction assistant. Extract recipe information from the provided image(s) and return it as valid JSON with the following structure:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": "Step-by-step cooking instructions",
  "prepTime": "prep time (e.g., '15 mins')",
  "cookTime": "cook time (e.g., '30 mins')",
  "servings": "number of servings (e.g., '4 servings')",
  "category": "one of: breakfast, lunch, dinner, dessert, snack, appetizer, beverage, other"
}
If multiple images are provided, they are parts of the SAME recipe. Combine all the information from all images into a single complete recipe.
Only return the JSON object, no additional text or markdown. If you cannot read all the text clearly, do your best to extract what you can see.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: files.length > 1 
                  ? `Please extract and combine the recipe information from these ${files.length} images into one complete recipe:`
                  : "Please extract the recipe information from this image:"
              },
              ...imageContents
            ]
          }
        ],
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content || "";
      
      try {
        const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
        const recipeData = JSON.parse(cleanedContent);
        recipeData.source = "Image Upload";
        res.json(recipeData);
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        res.status(500).json({ error: "Failed to parse recipe from images" });
      }
    } catch (error) {
      console.error("Error parsing images:", error);
      res.status(500).json({ error: "Failed to process images" });
    }
  });

  // PDF to Recipe conversion
  app.post("/api/recipes/parse-pdf", isAuthenticated, upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length < 50) {
        return res.status(400).json({ error: "Could not extract enough text from PDF" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a recipe extraction assistant. Extract recipe information from the provided text and return it as valid JSON with the following structure:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": "Step-by-step cooking instructions",
  "prepTime": "prep time (e.g., '15 mins')",
  "cookTime": "cook time (e.g., '30 mins')",
  "servings": "number of servings (e.g., '4 servings')",
  "category": "one of: breakfast, lunch, dinner, dessert, snack, appetizer, beverage, other"
}
Only return the JSON object, no additional text or markdown.`
          },
          {
            role: "user",
            content: `Extract the recipe from this text:\n\n${pdfText.substring(0, 8000)}`
          }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "";
      
      try {
        const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
        const recipeData = JSON.parse(cleanedContent);
        recipeData.source = "PDF Upload";
        res.json(recipeData);
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        res.status(500).json({ error: "Failed to parse recipe from PDF" });
      }
    } catch (error) {
      console.error("Error parsing PDF:", error);
      res.status(500).json({ error: "Failed to process PDF" });
    }
  });

  // Meal Plan routes
  app.get("/api/meal-plans", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, date } = req.query;
      let plans;
      if (date) {
        plans = await storage.getMealPlansByDate(date as string);
      } else if (startDate && endDate) {
        plans = await storage.getMealPlansByDateRange(startDate as string, endDate as string);
      } else {
        plans = await storage.getMealPlans();
      }
      res.json(plans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ error: "Failed to fetch meal plans" });
    }
  });

  app.post("/api/meal-plans", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertMealPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const mealPlan = await storage.createMealPlan(parsed.data);
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  });

  app.patch("/api/meal-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const mealPlan = await storage.updateMealPlan(parseInt(req.params.id), req.body);
      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }
      res.json(mealPlan);
    } catch (error) {
      console.error("Error updating meal plan:", error);
      res.status(500).json({ error: "Failed to update meal plan" });
    }
  });

  app.delete("/api/meal-plans/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMealPlan(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({ error: "Failed to delete meal plan" });
    }
  });

  return httpServer;
}
