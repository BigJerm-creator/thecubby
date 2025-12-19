import Layout from "@/components/layout";
import { ArrowLeft, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useInventory } from "@/lib/InventoryContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function ExpiredItems() {
  const [, setLocation] = useLocation();
  const { getExpiredItems, deleteItem } = useInventory();
  const { toast } = useToast();
  const expiredItems = getExpiredItems();

  const handleDelete = (item: any) => {
    deleteItem(item.category, item.id);
    toast({
      title: "Item Removed",
      description: `${item.name} has been removed from inventory.`
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Expired Items List */}
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
                      {item.quantity} <span className="text-xs font-sans">{item.unit}</span>
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
    </Layout>
  );
}
