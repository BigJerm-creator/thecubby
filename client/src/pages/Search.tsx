import Layout from "@/components/layout";
import { Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { useInventory } from "@/lib/InventoryContext";

export default function Search() {
  const [query, setQuery] = useState("");
  const { inventory } = useInventory();

  const allItems = Object.values(inventory).flat();
  const results = query 
    ? allItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <Layout>
      <div className="space-y-6 pt-4">
        <header>
          <h1 className="text-3xl font-serif text-foreground">Search</h1>
        </header>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input 
            type="text" 
            placeholder="Search pantry..." 
            className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {query ? (
            results.length > 0 ? (
              results.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                  <div>
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.brand ? `${item.brand} • ` : ''}{item.category}</p>
                  </div>
                  <span className="font-medium text-primary">
                    {item.quantity}x
                    {item.amount && item.amountUnit && (
                      <span className="text-sm text-muted-foreground ml-1">({item.amount} {item.amountUnit})</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No items found matching "{query}"</p>
            )
          ) : (
            <div className="text-center py-12 opacity-50">
              <SearchIcon className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-sm text-muted-foreground">Type to search your inventory</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
