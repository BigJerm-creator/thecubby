import Layout from "@/components/layout";
import { LogOut } from "lucide-react";
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
import logo from "@/assets/logo.png";

const mealTypeEmojis: Record<string, string> = {
  breakfast: "☕",
  lunch: "🌞",
  dinner: "🌙",
  snack: "🍪",
};

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800",
  lunch: "bg-emerald-100 text-emerald-800",
  dinner: "bg-purple-100 text-purple-800",
  snack: "bg-rose-100 text-rose-800",
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { getExpiredItems } = useInventory();
  const { items: shoppingItems } = useShoppingList();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);
  const expiredCount = getExpiredItems().length;
  const shoppingListCount = shoppingItems.filter(item => !item.checked).length;

  const today = format(new Date(), "yyyy-MM-dd");
  
  const displayName = user?.firstName || user?.email?.split("@")[0] || "Chef";
  
  const { data: todaysMeals = [] } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans", today],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans?date=${today}`);
      return res.json();
    },
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    queryFn: async () => {
      const res = await fetch("/api/recipes");
      return res.json();
    },
  });

  const getRecipeTitle = (recipeId: number | null) => {
    if (!recipeId) return null;
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe?.title || "Unknown Recipe";
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <img src={logo} alt="The Cubby" className="h-14 w-auto rounded-xl" />
            <a 
              href="/api/logout" 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-logout"
            >
              <LogOut size={20} />
            </a>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-serif text-foreground leading-tight">
              Hello,<br />
              <span className="text-primary">{displayName}.</span>
            </h1>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLocation("/shopping-list")}
            className={cn("bg-blue-50 p-4 border border-blue-100 hover:border-blue-200 transition-colors text-left", styleConfig.containerClass)}
            data-testid="button-shopping-list"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">🛒</span>
              <span className="text-2xl font-serif font-bold text-foreground">{shoppingListCount}</span>
            </div>
            <p className="text-xs text-blue-700 font-medium">Shopping List</p>
          </button>
          <button
            onClick={() => setLocation("/expired")}
            className={cn("bg-amber-50 p-4 border border-amber-100 hover:border-amber-200 transition-colors text-left w-full", styleConfig.containerClass)}
            data-testid="button-expired-items"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-2xl font-serif font-bold text-foreground">{expiredCount}</span>
            </div>
            <p className="text-xs text-amber-700 font-medium">Expired Items</p>
          </button>
        </div>

        {/* Recipe Generator & Recipe Book */}
        <div className="space-y-3">
          <button
            onClick={() => setLocation("/recipes")}
            className={cn("w-full bg-card/95 backdrop-blur-sm p-4 border border-primary/30 hover:border-primary/50 transition-colors text-left flex items-center gap-4 shadow-sm", styleConfig.containerClass)}
            data-testid="button-recipe-generator"
          >
            <div className={cn("h-12 w-12 bg-primary/20 flex items-center justify-center text-2xl", styleConfig.containerClass)}>
              👨‍🍳
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Recipe Generator</h3>
              <p className="text-xs text-muted-foreground">Create recipes from your ingredients using AI</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/recipe-book")}
            className={cn("w-full bg-card/95 backdrop-blur-sm p-4 border border-amber-500/30 hover:border-amber-500/50 transition-colors text-left flex items-center gap-4 shadow-sm", styleConfig.containerClass)}
            data-testid="button-recipe-book"
          >
            <div className={cn("h-12 w-12 bg-amber-500/20 flex items-center justify-center text-2xl", styleConfig.containerClass)}>
              📖
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Recipe Book</h3>
              <p className="text-xs text-muted-foreground">Store and manage your favorite recipes</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/meal-plan")}
            className={cn("w-full bg-card/95 backdrop-blur-sm p-4 border border-violet-500/30 hover:border-violet-500/50 transition-colors text-left flex items-center gap-4 shadow-sm", styleConfig.containerClass)}
            data-testid="button-meal-plan"
          >
            <div className={cn("h-12 w-12 bg-violet-500/20 flex items-center justify-center text-2xl", styleConfig.containerClass)}>
              📅
            </div>
            <div>
              <h3 className="font-serif font-medium text-foreground">Meal Plan</h3>
              <p className="text-xs text-muted-foreground">Plan your meals for the week or month</p>
            </div>
          </button>
        </div>

        {/* Today's Meals */}
        {todaysMeals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-medium">Today's Meals</h2>
              <Link href="/meal-plan" className="text-xs text-primary font-bold tracking-wide uppercase">View Calendar</Link>
            </div>
            <div className="space-y-2">
              {todaysMeals.map((meal) => {
                const emoji = mealTypeEmojis[meal.mealType] || "🍽️";
                const colorClass = mealTypeColors[meal.mealType] || "bg-gray-100 text-gray-800";
                return (
                  <div
                    key={meal.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                    data-testid={`today-meal-${meal.id}`}
                  >
                    <div className={`p-2 rounded-lg ${colorClass} text-lg`}>
                      {emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {meal.recipeId ? getRecipeTitle(meal.recipeId) : meal.customMealName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{meal.mealType}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity / Low Stock */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-medium">Low Stock Alerts</h2>
            <Link href="/kitchen" className="text-xs text-primary font-bold tracking-wide uppercase">View All</Link>
          </div>
          
          <div className="p-4 bg-card rounded-xl border border-border text-center">
            <p className="text-sm text-muted-foreground">No low stock items. Your pantry is well stocked!</p>
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
          <div className="absolute -right-4 -bottom-8 opacity-10 text-[120px] select-none pointer-events-none">
             🧂
          </div>
        </div>
      </div>
    </Layout>
  );
}
