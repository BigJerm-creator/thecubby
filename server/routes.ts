import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertShoppingListItemSchema, insertUserProfileSchema, insertRecipeSchema, insertMealPlanSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import multer from "multer";
// @ts-ignore - pdf-parse uses CommonJS
import pdfParse from "pdf-parse";

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function guessCategory(categories: string[], productName?: string, brand?: string): string {
  const categoryKeywords: Record<string, string[]> = {
    'spices': [
      'spice', 'spices', 'seasoning', 'seasonings', 'herb', 'herbs', 'pepper', 'salt',
      'cinnamon', 'oregano', 'basil', 'thyme', 'rosemary', 'cumin', 'paprika', 'turmeric',
      'garlic powder', 'onion powder', 'chili', 'curry', 'ginger', 'nutmeg', 'cloves',
      'bay leaves', 'dill', 'parsley', 'cilantro', 'sage', 'tarragon', 'cardamom',
      'coriander', 'fennel', 'mustard seed', 'cayenne', 'allspice', 'vanilla extract',
      'extract', 'flavoring', 'bouillon', 'stock cube'
    ],
    'refrigerated': [
      'dairy', 'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'eggs',
      'margarine', 'sour cream', 'cottage cheese', 'cream cheese', 'ricotta', 'mozzarella',
      'cheddar', 'parmesan', 'feta', 'brie', 'gouda', 'swiss', 'provolone', 'deli',
      'cold cuts', 'bacon', 'sausage', 'hot dog', 'fresh pasta', 'fresh juice',
      'orange juice', 'apple juice', 'hummus', 'dip', 'guacamole', 'salsa', 'pesto',
      'tofu', 'tempeh', 'fresh', 'refrigerate', 'chilled', 'keep cold', 'lunchable',
      'dough', 'biscuits', 'croissant', 'pie crust', 'tortilla'
    ],
    'frozen': [
      'frozen', 'ice cream', 'ice-cream', 'gelato', 'sorbet', 'popsicle', 'freezer',
      'frozen pizza', 'frozen dinner', 'frozen vegetable', 'frozen fruit', 'frozen meal',
      'fish sticks', 'fish fingers', 'frozen fish', 'frozen shrimp', 'frozen chicken',
      'frozen beef', 'frozen pork', 'tv dinner', 'microwave meal', 'pot pie',
      'frozen waffle', 'frozen pancake', 'frozen breakfast', 'frozen dessert',
      'frozen appetizer', 'frozen snack', 'frozen bread', 'frozen bagel', 'eggo',
      'lean cuisine', 'stouffers', 'marie callender', 'birds eye', 'green giant'
    ],
    'canned': [
      'canned', 'can', 'tinned', 'preserved', 'jarred', 'pickled', 'pickle',
      'canned vegetable', 'canned fruit', 'canned bean', 'canned soup', 'canned meat',
      'canned fish', 'tuna', 'salmon', 'sardine', 'anchovy', 'canned tomato',
      'tomato sauce', 'tomato paste', 'crushed tomato', 'diced tomato', 'stewed tomato',
      'canned corn', 'canned pea', 'canned green bean', 'canned mushroom',
      'canned olive', 'olive', 'caper', 'artichoke', 'roasted pepper', 'chipotle',
      'coconut milk', 'evaporated milk', 'condensed milk', 'canned pumpkin',
      'canned chili', 'canned ravioli', 'spam', 'corned beef', 'vienna sausage',
      'campbell', 'progresso', 'chef boyardee', 'del monte', 'dole', 'libby'
    ],
    'boxed': [
      'cereal', 'breakfast cereal', 'oatmeal', 'granola', 'muesli', 'pasta', 'noodle',
      'macaroni', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'lasagna', 'ramen',
      'cracker', 'cookie', 'biscuit', 'snack', 'chip', 'pretzel', 'popcorn',
      'granola bar', 'protein bar', 'energy bar', 'fruit snack', 'gummy',
      'boxed', 'box', 'dry mix', 'cake mix', 'brownie mix', 'pancake mix',
      'muffin mix', 'bread mix', 'stuffing', 'instant', 'ready to eat',
      'mac and cheese', 'hamburger helper', 'rice a roni', 'kraft', 'general mills',
      'kellogg', 'post', 'quaker', 'nabisco', 'pepperidge farm', 'little debbie',
      'hostess', 'pop tart', 'toaster pastry', 'breakfast bar'
    ],
    'bulk': [
      'rice', 'grain', 'flour', 'sugar', 'salt', 'baking', 'bean', 'lentil',
      'quinoa', 'couscous', 'barley', 'farro', 'bulgur', 'millet', 'buckwheat',
      'oat', 'wheat', 'corn meal', 'polenta', 'grits', 'semolina',
      'all purpose flour', 'bread flour', 'whole wheat flour', 'almond flour',
      'coconut flour', 'brown sugar', 'powdered sugar', 'confectioner',
      'baking soda', 'baking powder', 'yeast', 'cornstarch', 'arrowroot',
      'dried bean', 'dried lentil', 'chickpea', 'black bean', 'kidney bean',
      'pinto bean', 'navy bean', 'split pea', 'dried fruit', 'raisin', 'date',
      'dried apricot', 'prune', 'nut', 'almond', 'walnut', 'pecan', 'cashew',
      'peanut', 'seed', 'sunflower seed', 'pumpkin seed', 'chia seed', 'flax seed',
      'honey', 'maple syrup', 'agave', 'molasses', 'corn syrup'
    ],
    'beverages': [
      'beverage', 'drink', 'soda', 'cola', 'pop', 'soft drink', 'sparkling',
      'water', 'mineral water', 'spring water', 'tea', 'coffee', 'espresso',
      'juice', 'lemonade', 'punch', 'sports drink', 'energy drink', 'gatorade',
      'powerade', 'red bull', 'monster', 'kombucha', 'coconut water',
      'almond milk', 'oat milk', 'soy milk', 'plant milk', 'non-dairy',
      'wine', 'beer', 'alcohol', 'spirit', 'liquor', 'mixer', 'tonic',
      'coca cola', 'pepsi', 'sprite', 'fanta', 'dr pepper', 'mountain dew',
      'starbucks', 'nescafe', 'lipton', 'snapple', 'arizona', 'tropicana'
    ],
    'condiments': [
      'condiment', 'sauce', 'ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish',
      'bbq sauce', 'barbecue', 'hot sauce', 'sriracha', 'tabasco', 'soy sauce',
      'teriyaki', 'worcestershire', 'fish sauce', 'oyster sauce', 'hoisin',
      'vinegar', 'balsamic', 'apple cider vinegar', 'red wine vinegar',
      'oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
      'dressing', 'salad dressing', 'ranch', 'italian dressing', 'caesar',
      'jam', 'jelly', 'preserve', 'marmalade', 'peanut butter', 'nutella',
      'almond butter', 'tahini', 'hummus', 'spread', 'heinz', 'hellmann',
      'french', 'hidden valley', 'kraft dressing', 'wish bone', 'newman'
    ],
    'produce': [
      'produce', 'vegetable', 'fruit', 'fresh produce', 'organic', 'apple',
      'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
      'lemon', 'lime', 'avocado', 'tomato', 'potato', 'onion', 'garlic',
      'carrot', 'celery', 'broccoli', 'cauliflower', 'spinach', 'lettuce',
      'kale', 'cabbage', 'pepper', 'cucumber', 'zucchini', 'squash',
      'mushroom', 'corn', 'pea', 'green bean', 'asparagus', 'eggplant'
    ],
    'meat': [
      'meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'poultry',
      'steak', 'ground beef', 'ground turkey', 'ground chicken', 'roast',
      'chop', 'rib', 'tenderloin', 'brisket', 'ham', 'prosciutto', 'salami',
      'pepperoni', 'chorizo', 'bratwurst', 'kielbasa', 'fresh meat', 'butcher',
      'deli meat', 'lunch meat', 'oscar mayer', 'hillshire', 'johnsonville',
      'tyson', 'perdue', 'foster farms', 'jennie-o', 'butterball'
    ],
    'seafood': [
      'seafood', 'fish', 'shrimp', 'salmon', 'tilapia', 'cod', 'halibut',
      'tuna steak', 'fresh tuna', 'swordfish', 'mahi', 'sea bass', 'trout',
      'catfish', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop',
      'calamari', 'squid', 'octopus', 'crawfish', 'crayfish', 'fresh fish',
      'sushi grade', 'sashimi', 'gorton', 'van de kamp'
    ],
    'bakery': [
      'bakery', 'bread', 'baguette', 'loaf', 'roll', 'bun', 'bagel', 'english muffin',
      'croissant', 'danish', 'pastry', 'donut', 'doughnut', 'muffin', 'scone',
      'cake', 'cupcake', 'pie', 'tart', 'cookie', 'brownie', 'baked goods',
      'sara lee', 'pepperidge', 'entenmann', 'thomas', 'arnold', 'nature own',
      'dave killer bread', 'wonder bread', 'sourdough', 'whole wheat bread',
      'white bread', 'rye bread', 'multigrain', 'ciabatta', 'focaccia', 'pita',
      'naan', 'flatbread', 'wrap', 'tortilla wrap'
    ],
    'baby': [
      'baby', 'infant', 'toddler', 'baby food', 'formula', 'baby formula',
      'gerber', 'similac', 'enfamil', 'baby cereal', 'baby snack', 'puffs',
      'baby puree', 'stage 1', 'stage 2', 'stage 3', 'teething', 'baby juice'
    ],
    'pet': [
      'pet', 'dog', 'cat', 'pet food', 'dog food', 'cat food', 'pet treat',
      'dog treat', 'cat treat', 'kibble', 'purina', 'pedigree', 'iams',
      'blue buffalo', 'fancy feast', 'meow mix', 'friskies', 'cesar', 'beneful'
    ]
  };

  // Combine all text sources for matching
  const allText = [
    ...categories.map(c => c.toLowerCase().replace(/^en:/, '')),
    (productName || '').toLowerCase(),
    (brand || '').toLowerCase()
  ].join(' ');

  // Score each category based on keyword matches
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        scores[category] += keyword.split(' ').length;
      }
    }
  }

  // Find the category with the highest score
  let bestCategory = 'boxed';
  let bestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
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
    const formatOpenFoodFactsResponse = (product: any, source: string) => {
      const name = product.product_name || product.product_name_en || product.generic_name || null;
      const brand = product.brands || null;
      
      // Gather all possible category hints from the product data
      const categoryHints = [
        ...(product.categories_tags || []),
        ...(product.categories?.split(',') || []),
        ...(product.labels_tags || []),
        ...(product.stores_tags || []),
        product.stores || '',
        product.conservation_conditions || '',
        product.storage_conditions || '',
        product.packaging || '',
      ];
      
      return {
        found: true,
        name,
        brand,
        category: guessCategory(categoryHints, name, brand),
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
      };
    };

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
            const itemName = item.title || null;
            const itemBrand = item.brand || null;
            return res.json({
              found: true,
              name: itemName,
              brand: itemBrand,
              category: guessCategory(item.category ? [item.category] : [], itemName, itemBrand),
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
            const goName = goUpcData.product.name || null;
            const goBrand = goUpcData.product.brand || null;
            return res.json({
              found: true,
              name: goName,
              brand: goBrand,
              category: guessCategory(
                goUpcData.product.category ? [goUpcData.product.category] : [],
                goName,
                goBrand
              ),
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

  app.patch("/api/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Failed to update item" });
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
