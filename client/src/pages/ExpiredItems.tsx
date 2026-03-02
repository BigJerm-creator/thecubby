import Layout from "@/components/layout";
import { ArrowLeft, Trash2, AlertTriangle, Calendar, Loader2, Minus, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useInventory, InventoryItem } from "@/lib/InventoryContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ExpiredItems() {
  const [, setLocation] = useLocation();
  const { getExpiredItems, deleteItem, updateItem, isLoading } = useInventory();
  const { toast } = useToast();
  const expiredItems = getExpiredItems();
  const [removingItem, setRemovingItem] = useState<InventoryItem | null>(null);
  const [removeCount, setRemoveCount] = useState(1);

  const handleDelete = async (item: InventoryItem) => {
    if (item.quantity <= 1) {
      await deleteItem(item.category, item.id);
      toast({
        title: "Item Removed",
        description: `${item.name} has been removed from inventory.`
      });
    } else {
      setRemovingItem(item);
      setRemoveCount(1);
    }
  };

  const confirmRemove = async () => {
    if (!removingItem) return;
    if (removeCount >= removingItem.quantity) {
      await deleteItem(removingItem.category, removingItem.id);
      toast({
        title: "Item Removed",
        description: `${removingItem.name} has been removed from inventory.`
      });
    } else {
      await updateItem(removingItem.id, { quantity: removingItem.quantity - removeCount });
      toast({
        title: "Quantity Updated",
        description: `Removed ${removeCount} of ${removingItem.name} (${removingItem.quantity - removeCount} remaining)`
      });
    }
    setRemovingItem(null);
  };

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
            data-testid="button-back-from-expired"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Expired Items</h1>
            <p className="text-muted-foreground text-sm">{expiredItems.length} item{expiredItems.length !== 1 ? 's' : ''} past expiration</p>
          </div>
        </div>

        <div className="space-y-3">
          {expiredItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <AlertTriangle size={40} className="mx-auto text-green-600 mb-3 opacity-50" />
              <p className="text-foreground font-medium">No expired items</p>
              <p className="text-muted-foreground text-sm mt-1">All your items are fresh!</p>
            </div>
          ) : (
            expiredItems.map((item, index) => {
              const daysExpired = Math.floor(
                (new Date().getTime() - new Date(item.expiryDate!).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.id}
                  className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl shadow-sm flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.brand}</p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium">
                      <div className="flex items-center gap-1 text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        <Calendar size={12} />
                        <span>Expired {daysExpired} day{daysExpired !== 1 ? 's' : ''} ago</span>
                      </div>
                      <span className="text-muted-foreground">{item.expiryDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-serif font-medium text-muted-foreground">
                      {item.quantity}x
                      {item.amount && item.amountUnit && (
                        <span className="text-xs font-sans ml-1">{item.amount} {item.amountUnit}</span>
                      )}
                    </span>
                    <button 
                      onClick={() => handleDelete(item)}
                      className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      data-testid={`button-delete-expired-${item.id}`}
                      title="Remove from inventory"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {removingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setRemovingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <h3 className="font-serif text-xl font-medium text-foreground">
                    Remove {removingItem.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {removingItem.quantity} in inventory. How many do you want to remove?
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setRemoveCount(Math.max(1, removeCount - 1))}
                    className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    data-testid="button-remove-decrease"
                    disabled={removeCount <= 1}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-3xl font-serif font-medium text-primary w-16 text-center" data-testid="text-remove-count">
                    {removeCount}
                  </span>
                  <button
                    onClick={() => setRemoveCount(Math.min(removingItem.quantity, removeCount + 1))}
                    className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                    data-testid="button-remove-increase"
                    disabled={removeCount >= removingItem.quantity}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {removeCount >= removingItem.quantity && (
                  <p className="text-center text-xs text-destructive font-medium">
                    This will completely remove the item from inventory
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setRemovingItem(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                    data-testid="button-cancel-remove"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemove}
                    className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
                    data-testid="button-confirm-remove"
                  >
                    Remove {removeCount}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
