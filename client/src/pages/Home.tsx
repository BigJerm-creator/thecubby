import Layout from "@/components/layout";
import { Package, AlertCircle, TrendingDown, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useInventory } from "@/lib/InventoryContext";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { getExpiredItems, inventory } = useInventory();
  const { addItem: addToShoppingList, items: shoppingItems } = useShoppingList();
  const { toast } = useToast();
  const expiredCount = getExpiredItems().length;
  const shoppingListCount = shoppingItems.filter(item => !item.checked).length;

  const handleRestock = (itemName: string, category: string) => {
    addToShoppingList({
      name: itemName,
      category: category,
      checked: false
    });
    toast({
      title: "Added to Shopping List",
      description: `${itemName} added to your shopping list`
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="pt-6 text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2 block">The Cubby</span>
          <h1 className="text-4xl font-serif text-foreground leading-tight">
            Hello,<br />
            <span className="text-primary">Chef.</span>
          </h1>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLocation("/shopping-list")}
            className="bg-blue-50 p-4 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors text-left"
            data-testid="button-shopping-list"
          >
            <div className="flex items-start justify-between mb-2">
              <ShoppingCart className="text-blue-600" size={24} />
              <span className="text-2xl font-serif font-bold text-foreground">{shoppingListCount}</span>
            </div>
            <p className="text-xs text-blue-700 font-medium">Shopping List</p>
          </button>
          <button
            onClick={() => setLocation("/expired")}
            className="bg-amber-50 p-4 rounded-2xl border border-amber-100 hover:border-amber-200 transition-colors text-left w-full"
            data-testid="button-expired-items"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertCircle className="text-amber-600" size={24} />
              <span className="text-2xl font-serif font-bold text-foreground">{expiredCount}</span>
            </div>
            <p className="text-xs text-amber-700 font-medium">Expired Items</p>
          </button>
        </div>

        {/* Recent Activity / Low Stock */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-medium">Low Stock Alerts</h2>
            <Link href="/kitchen" className="text-xs text-primary font-bold tracking-wide uppercase">View All</Link>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "Almond Milk", amount: "10% left", icon: "🥛", category: "refrigerated" },
              { name: "Olive Oil", amount: "1 bottle", icon: "🫒", category: "bulk" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border shadow-sm">
                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">{item.name}</h3>
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <TrendingDown size={12} />
                    {item.amount}
                  </p>
                </div>
                <button 
                  onClick={() => handleRestock(item.name, item.category)}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  data-testid={`button-restock-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Tip */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1 block">Pantry Tip</span>
            <h3 className="font-serif text-lg text-foreground mb-2">Organize your Spices</h3>
            <p className="text-sm text-muted-foreground mb-4">Keep spices away from heat and light to preserve flavor potency longer.</p>
            <button className="text-xs font-bold text-primary border-b border-primary/30 pb-0.5">Read More</button>
          </div>
          <div className="absolute -right-4 -bottom-8 opacity-10">
             <Package size={120} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
