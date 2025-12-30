import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventoryItemSchema, insertShoppingListItemSchema } from "@shared/schema";
import OpenAI from "openai";

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

  app.get("/api/upc/:barcode", async (req, res) => {
    const { barcode } = req.params;
    
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        res.json({
          found: true,
          name: product.product_name || product.generic_name || null,
          brand: product.brands || null,
          category: guessCategory(product.categories_tags || []),
          quantity: product.quantity || null,
        });
      } else {
        const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
        const upcData = await upcResponse.json();
        
        if (upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          res.json({
            found: true,
            name: item.title || null,
            brand: item.brand || null,
            category: guessCategory(item.category ? [item.category] : []),
            quantity: null,
          });
        } else {
          res.json({ found: false });
        }
      }
    } catch (error) {
      console.error("UPC lookup error:", error);
      res.json({ found: false, error: "Lookup failed" });
    }
  });

  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/category/:category", async (req, res) => {
    try {
      const items = await storage.getInventoryItemsByCategory(req.params.category);
      res.json(items);
    } catch (error) {
      console.error("Error fetching category items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/inventory/expired", async (req, res) => {
    try {
      const items = await storage.getExpiredItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching expired items:", error);
      res.status(500).json({ error: "Failed to fetch expired items" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
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

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      await storage.deleteInventoryItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.get("/api/shopping-list", async (req, res) => {
    try {
      const items = await storage.getShoppingListItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      res.status(500).json({ error: "Failed to fetch shopping list" });
    }
  });

  app.post("/api/shopping-list", async (req, res) => {
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

  app.patch("/api/shopping-list/:id", async (req, res) => {
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

  app.delete("/api/shopping-list/:id", async (req, res) => {
    try {
      await storage.deleteShoppingListItem(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shopping list item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.post("/api/generate-recipe", async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      const ingredientsList = items.map(item => `${item.quantity} ${item.unit} ${item.name}${item.brand ? ` (${item.brand})` : ''}`).join(", ");
      
      if (items.length === 0) {
        return res.status(400).json({ error: "No ingredients in your pantry. Add some items first!" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful chef assistant. Generate a delicious recipe using the available ingredients. Format your response with clear sections: Recipe Name, Prep Time, Cook Time, Servings, Ingredients (list which ones from the pantry you're using), Instructions (numbered steps), and Tips. Be creative but practical."
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

  return httpServer;
}
