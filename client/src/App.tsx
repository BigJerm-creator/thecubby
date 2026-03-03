import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InventoryProvider } from "@/lib/InventoryContext";
import { ShoppingListProvider } from "@/lib/ShoppingListContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Kitchen from "@/pages/Kitchen";
import CategoryView from "@/pages/CategoryView";
import Scan from "@/pages/Scan";
import ManualEntry from "@/pages/ManualEntry";
import ExpiredItems from "@/pages/ExpiredItems";
import ShoppingListPage from "@/pages/ShoppingList";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import RecipeGenerator from "@/pages/RecipeGenerator";
import RecipeBook from "@/pages/RecipeBook";
import MealPlan from "@/pages/MealPlan";
import Profile from "@/pages/Profile";
import Appearance from "@/pages/Appearance";

function AuthenticatedRouter() {
  return (
    <InventoryProvider>
      <ShoppingListProvider>
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
          <Route path="/appearance" component={Appearance} />
          <Route path="/recipes" component={RecipeGenerator} />
          <Route path="/recipe-book" component={RecipeBook} />
          <Route path="/meal-plan" component={MealPlan} />
          <Route component={NotFound} />
        </Switch>
      </ShoppingListProvider>
    </InventoryProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
