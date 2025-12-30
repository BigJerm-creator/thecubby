import Layout from "@/components/layout";
import { Link, useRoute, useLocation } from "wouter";
import { KITCHEN_CATEGORIES } from "@/lib/mockData";
import { ArrowLeft, Plus, Filter, MoreHorizontal, Calendar, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useInventory } from "@/lib/InventoryContext";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { useToast } from "@/hooks/use-toast";

export default function CategoryView() {
  const [match, params] = useRoute("/category/:id");
  const [, setLocation] = useLocation();
  const categoryId = params?.id || "";
  const category = KITCHEN_CATEGORIES.find(c => c.id === categoryId);
  const { inventory, deleteItem, isLoading } = useInventory();
  const { addItem: addToShoppingList } = useShoppingList();
  const { toast } = useToast();
  const items = inventory[categoryId] || [];

  const handleDeleteItem = async (itemId: number) => {
    await deleteItem(categoryId, itemId);
    toast({
      title: "Item Removed",
      description: "Item has been deleted from inventory"
    });
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
            <button className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <Filter size={20} />
            </button>
            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <MoreHorizontal size={20} />
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
                      <Calendar size={10} />
                      <span>Exp: {item.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-serif font-medium text-primary">
                      {item.quantity} <span className="text-xs font-sans text-muted-foreground">{item.unit}</span>
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToShoppingList(item.name)}
                    className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-blue-50 transition-colors"
                    data-testid={`button-add-to-shopping-list-${item.id}`}
                    title="Add to shopping list"
                  >
                    <ShoppingCart size={16} />
                  </button>

                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    data-testid={`button-delete-item-${item.id}`}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <div className="fixed bottom-24 right-6 z-30">
        <button 
          onClick={() => setLocation("/scan")}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Plus size={24} />
        </button>
      </div>
    </Layout>
  );
}
