import Layout from "@/components/layout";
import { ArrowLeft, Trash2, Check, ShoppingCart, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ShoppingListPage() {
  const [, setLocation] = useLocation();
  const { items, removeItem, toggleItem, clearCompleted, isLoading } = useShoppingList();

  const checkedCount = items.filter(item => item.checked).length;
  const uncheckedCount = items.filter(item => !item.checked).length;

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
        <div className="flex items-center gap-3 pt-4 pb-2">
          <button 
            onClick={() => setLocation("/")}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            data-testid="button-back-from-shopping"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Shopping List</h1>
            <p className="text-muted-foreground text-sm">{uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to buy</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <ShoppingCart size={40} className="mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-foreground font-medium">No items yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add items from the restock button on the home page</p>
            </div>
          ) : (
            <AnimatePresence>
              {items.filter(item => !item.checked).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-card border border-border/50 p-4 rounded-xl shadow-sm flex justify-between items-center group hover:border-primary/20 transition-colors"
                  data-testid={`shopping-item-${item.id}`}
                >
                  <button
                    onClick={() => toggleItem(item.id, true)}
                    className="flex items-center gap-3 flex-1 text-left"
                    data-testid={`button-toggle-shopping-${item.id}`}
                  >
                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors">
                      <div className="h-3 w-3 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    data-testid={`button-delete-shopping-${item.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}

              {items.filter(item => item.checked).length > 0 && (
                <div className="space-y-3 mt-6">
                  <div className="px-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed ({checkedCount})</p>
                  </div>
                  {items.filter(item => item.checked).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-muted/30 border border-muted/50 p-4 rounded-xl shadow-sm flex justify-between items-center group opacity-60"
                    >
                      <button
                        onClick={() => toggleItem(item.id, false)}
                        className="flex items-center gap-3 flex-1 text-left"
                        data-testid={`button-uncheck-shopping-${item.id}`}
                      >
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check size={16} className="text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground line-through">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        data-testid={`button-delete-completed-${item.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </div>

        {checkedCount > 0 && (
          <button
            onClick={() => clearCompleted()}
            className="w-full py-3 text-muted-foreground hover:text-foreground rounded-lg font-medium transition-colors hover:bg-muted/50"
            data-testid="button-clear-completed"
          >
            Clear Completed Items ({checkedCount})
          </button>
        )}
      </div>
    </Layout>
  );
}
