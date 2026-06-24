import Layout from "@/components/layout";
import { Link, useLocation } from "wouter";
import { useInventory } from "@/lib/InventoryContext";
import { useShoppingList } from "@/lib/ShoppingListContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import type { MealPlan, Recipe } from "@shared/schema";
import { useTheme } from "@/lib/ThemeContext";
import { getIconStyleConfig } from "@/components/StyledIcon";
import { cn } from "@/lib/utils";
import { apiRequest, resolveUrl, getNativeAuthHeaders } from "@/lib/queryClient";
import {
  ShoppingCart, AlertTriangle, ChefHat, BookOpen, CalendarDays,
  ScanLine, PenLine, User,
} from "lucide-react";
import logo from "@/assets/logo.png";

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-emerald-100 text-emerald-800",
  dinner: "bg-purple-100 text-purple-800",
  snack: "bg-rose-100 text-rose-800",
};

const mealTypeLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function LowStockSection() {
  const { inventory } = useInventory();
  const lowStockItems = Object.values(inventory)
    .flat()
    .filter(item => item.lowStockThreshold != null && item.quantity <= (item.lowStockThreshold ?? 0));

  return (
    <section className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-medium">Low Stock</h2>
        <Link href="/kitchen" className="text-xs text-primary font-bold tracking-wide uppercase">
          View All
        </Link>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <p className="text-sm text-muted-foreground">Your pantry is well stocked!</p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="list-low-stock">
          {lowStockItems.slice(0, 5).map(item => (
            <Link key={item.id} href={`/category/${item.category}`}>
              <div
                className="bg-card border border-amber-200 rounded-2xl p-3 flex items-center justify-between hover:border-amber-400 transition-colors cursor-pointer active:scale-[0.98]"
                data-testid={`low-stock-item-${item.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>
                </div>
                <span className="text-sm font-serif font-medium text-amber-600 flex-shrink-0 ml-2">
                  {item.quantity} left
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyPantryState() {
  const [, setLocation] = useLocation();
  return (
    <section className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
        <ChefHat size={28} className="text-primary" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-serif text-lg text-foreground">Welcome to The Cubby!</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Start by adding items to your pantry — scan barcodes or enter them manually.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setLocation("/scan")}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
        >
          <ScanLine size={16} /> Scan item
        </button>
        <button
          onClick={() => setLocation("/manual-entry")}
          className="flex items-center gap-2 bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
        >
          <PenLine size={16} /> Add manually
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { getExpiredItems, inventory, isLoading: inventoryLoading } = useInventory();
  const { items: shoppingItems } = useShoppingList();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);

  const expiredCount = getExpiredItems().length;
  const shoppingListCount = shoppingItems.filter(item => !item.checked).length;
  const totalItems = Object.values(inventory).flat().length;
  const isPantryEmpty = !inventoryLoading && totalItems === 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

  const { data: todaysMeals = [] } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans", today],
    queryFn: () =>
      fetch(resolveUrl(`/api/meal-plans?date=${today}`), {
        credentials: "include",
        headers: getNativeAuthHeaders(),
      }).then(r => r.json()),
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    queryFn: () => apiRequest("GET", "/api/recipes").then(r => r.json()),
  });

  const getRecipeTitle = (recipeId: number | null) => {
    if (!recipeId) return null;
    return recipes.find((r) => r.id === recipeId)?.title || "Unknown Recipe";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <header className="pt-4">
          <div className="flex items-center justify-between mb-5">
            <img src={logo} alt="The Cubby" className="h-12 w-auto rounded-xl" />
            <button
              onClick={() => setLocation("/profile")}
              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
              aria-label="Profile"
            >
              <User size={18} className="text-primary" strokeWidth={1.5} />
            </button>
          </div>
          <h1 className="text-3xl font-serif text-foreground leading-tight">
            Hello, <span className="text-primary">{displayName}.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocation("/shopping-list")}
            className={cn(
              "bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 active:scale-[0.97] transition-all text-left",
              styleConfig.containerClass
            )}
            data-testid="button-shopping-list"
          >
            <div className="flex items-start justify-between mb-2">
              <ShoppingCart size={20} className="text-blue-500" strokeWidth={1.75} />
              <span className="text-2xl font-serif font-bold text-foreground">{shoppingListCount}</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Shopping List</p>
          </button>

          <button
            onClick={() => setLocation("/expired")}
            className={cn(
              "bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 active:scale-[0.97] transition-all text-left w-full",
              styleConfig.containerClass
            )}
            data-testid="button-expired-items"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertTriangle size={20} className="text-amber-500" strokeWidth={1.75} />
              <span className="text-2xl font-serif font-bold text-foreground">{expiredCount}</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Expired Items</p>
          </button>
        </div>

        {/* Empty pantry onboarding */}
        {isPantryEmpty && <EmptyPantryState />}

        {/* Feature buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setLocation("/recipes")}
            className={cn(
              "w-full bg-card p-4 border border-primary/25 hover:border-primary/50 active:scale-[0.98] transition-all text-left flex items-center gap-4",
              styleConfig.containerClass
            )}
            data-testid="button-recipe-generator"
          >
            <div className={cn("h-11 w-11 bg-primary/15 flex items-center justify-center", styleConfig.containerClass)}>
              <ChefHat size={22} className="text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Recipe Generator</h3>
              <p className="text-xs text-muted-foreground">AI recipes from your ingredients</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/recipe-book")}
            className={cn(
              "w-full bg-card p-4 border border-amber-500/25 hover:border-amber-500/50 active:scale-[0.98] transition-all text-left flex items-center gap-4",
              styleConfig.containerClass
            )}
            data-testid="button-recipe-book"
          >
            <div className={cn("h-11 w-11 bg-amber-500/15 flex items-center justify-center", styleConfig.containerClass)}>
              <BookOpen size={22} className="text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Recipe Book</h3>
              <p className="text-xs text-muted-foreground">Store and browse your favorites</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/meal-plan")}
            className={cn(
              "w-full bg-card p-4 border border-violet-500/25 hover:border-violet-500/50 active:scale-[0.98] transition-all text-left flex items-center gap-4",
              styleConfig.containerClass
            )}
            data-testid="button-meal-plan"
          >
            <div className={cn("h-11 w-11 bg-violet-500/15 flex items-center justify-center", styleConfig.containerClass)}>
              <CalendarDays size={22} className="text-violet-600" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Meal Plan</h3>
              <p className="text-xs text-muted-foreground">Plan your week ahead</p>
            </div>
          </button>
        </div>

        {/* Today's Meals */}
        {todaysMeals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-medium">Today's Meals</h2>
              <Link href="/meal-plan" className="text-xs text-primary font-bold tracking-wide uppercase">
                Calendar
              </Link>
            </div>
            <div className="space-y-2">
              {todaysMeals.map((meal) => {
                const colorClass = mealTypeColors[meal.mealType] || "bg-gray-100 text-gray-800";
                const label = mealTypeLabels[meal.mealType] || meal.mealType;
                return (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border"
                    data-testid={`today-meal-${meal.id}`}
                  >
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${colorClass}`}>
                      {label}
                    </span>
                    <p className="font-medium text-foreground text-sm flex-1 truncate">
                      {meal.recipeId ? getRecipeTitle(meal.recipeId) : meal.customMealName}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <LowStockSection />
      </div>
    </Layout>
  );
}
