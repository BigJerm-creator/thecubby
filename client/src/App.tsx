import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InventoryProvider } from "@/lib/InventoryContext";
import { ShoppingListProvider } from "@/lib/ShoppingListContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Kitchen from "@/pages/Kitchen";
import CategoryView from "@/pages/CategoryView";
import Scan from "@/pages/Scan";
import ManualEntry from "@/pages/ManualEntry";
import ExpiredItems from "@/pages/ExpiredItems";
import ShoppingListPage from "@/pages/ShoppingList";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import RecipeGenerator from "@/pages/RecipeGenerator";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/category/:id" component={CategoryView} />
      <Route path="/scan" component={Scan} />
      <Route path="/manual-entry" component={ManualEntry} />
      <Route path="/expired" component={ExpiredItems} />
      <Route path="/shopping-list" component={ShoppingListPage} />
      <Route path="/search" component={Search} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/recipes" component={RecipeGenerator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InventoryProvider>
        <ShoppingListProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ShoppingListProvider>
      </InventoryProvider>
    </QueryClientProvider>
  );
}

export default App;
