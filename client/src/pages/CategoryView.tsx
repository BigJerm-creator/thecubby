import Layout from "@/components/layout";
import { Link, useRoute, useLocation } from "wouter";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInventory } from "@/lib/InventoryContext";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CategoryView() {
  const [match, params] = useRoute("/category/:id");
  const [, setLocation] = useLocation();
  const categoryId = params?.id || "";
  const category = KITCHEN_CATEGORIES.find(c => c.id === categoryId);
  const { inventory, deleteItem, updateItem, isLoading } = useInventory();
  const { addItem: addToShoppingList } = useShoppingList();
  const { toast } = useToast();
  const items = inventory[categoryId] || [];
  const [movingItem, setMovingItem] = useState<{ id: number; name: string } | null>(null);

  const handleDeleteItem = async (itemId: number) => {
    await deleteItem(categoryId, itemId);
    toast({
      title: "Item Removed",
      description: "Item has been deleted from inventory"
    });
  };

  const handleMoveItem = async (newCategory: string) => {
    if (!movingItem) return;
    const targetCategory = KITCHEN_CATEGORIES.find(c => c.id === newCategory);
    await updateItem(movingItem.id, { category: newCategory });
    toast({
      title: "Item Moved",
      description: `${movingItem.name} moved to ${targetCategory?.name || newCategory}`
    });
    setMovingItem(null);
  };

  const handleAddToShoppingList = async (itemName: string) => {
    await addToShoppingList({
      name: itemName,
      category: categoryId,
      checked: false
    });
    toast({
      title: "Added to Shopping List",
      description: `${itemName} added to your shopping list`
    });
  };

  if (!category) return <Layout><div>Category not found</div></Layout>;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between pt-4 pb-2">
          <Link href="/kitchen">
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground text-xl">
              ←
            </button>
          </Link>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground text-lg">
              🔽
            </button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground text-lg">
              ⋯
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-serif text-foreground">{category.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} items in inventory</p>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No items in this category yet.</p>
              <button 
                onClick={() => setLocation("/scan")}
                className="mt-4 text-primary font-medium text-sm hover:underline"
              >
                Add your first item
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="bg-card border border-border/50 p-4 rounded-xl shadow-sm flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-medium text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.brand}</p>
                  
                  {item.expiryDate && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded-full">
                      <span>📅</span>
                      <span>Exp: {item.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-serif font-medium text-primary">
                      {item.quantity}x
                    </span>
                    {item.amount && item.amountUnit && (
                      <span className="text-xs text-muted-foreground">
                        {item.amount} {item.amountUnit}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setMovingItem({ id: item.id, name: item.name })}
                    className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center hover:bg-purple-600 transition-colors text-sm"
                    data-testid={`button-move-item-${item.id}`}
                    title="Move to another category"
                  >
                    ↔️
                  </button>
                  
                  <button 
                    onClick={() => handleAddToShoppingList(item.name)}
                    className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-600 transition-colors text-sm"
                    data-testid={`button-add-to-shopping-list-${item.id}`}
                    title="Add to shopping list"
                  >
                    🛒
                  </button>

                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive transition-colors text-sm"
                    data-testid={`button-delete-item-${item.id}`}
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {movingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center pb-safe"
            onClick={() => setMovingItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-serif text-lg font-medium text-foreground">
                  Move "{movingItem.name}"
                </h3>
                <button
                  onClick={() => setMovingItem(null)}
                  className="p-2 -mr-2 hover:bg-muted rounded-full transition-colors text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                <p className="text-sm text-muted-foreground mb-4">Select a new category:</p>
                <div className="grid grid-cols-3 gap-3">
                  {KITCHEN_CATEGORIES.filter(c => c.id !== categoryId).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleMoveItem(cat.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                      data-testid={`button-move-to-${cat.id}`}
                    >
                      <span className="text-2xl">{cat.image}</span>
                      <span className="text-xs text-center font-medium text-foreground">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
