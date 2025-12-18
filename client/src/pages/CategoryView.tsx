import Layout from "@/components/layout";
import { Link, useRoute, useLocation } from "wouter";
import { MOCK_INVENTORY, KITCHEN_CATEGORIES } from "@/lib/mockData";
import { ArrowLeft, Plus, Filter, MoreHorizontal, Calendar, Clock, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function CategoryView() {
  const [match, params] = useRoute("/category/:id");
  const [, setLocation] = useLocation();
  const categoryId = params?.id || "";
  const category = KITCHEN_CATEGORIES.find(c => c.id === categoryId);
  const [items, setItems] = useState(MOCK_INVENTORY[categoryId] || []);

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  if (!category) return <Layout><div>Category not found</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Inventory List */}
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

                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-serif font-medium text-primary">
                    {item.quantity} <span className="text-xs font-sans text-muted-foreground">{item.unit}</span>
                  </span>
                  
                  {/* Quick Actions (Hidden by default, visible on hover/swipe) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 mt-1">
                    <button className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-xs" data-testid="button-decrease-qty">-</button>
                    <button className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors text-xs" data-testid="button-increase-qty">+</button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      data-testid={`button-delete-item-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Floating Action Button */}
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
