import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, UtensilsCrossed, Coffee, Sun, Moon, Cookie, ArrowLeft, Sparkles, ShoppingCart, Check, Loader2, X, RefreshCw, CheckSquare, BookPlus, Clock, Users } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import type { MealPlan, Recipe } from "@shared/schema";

interface GeneratedMeal {
  day: number;
  date: string;
  mealType: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

interface ShoppingItem {
  name: string;
  quantity?: string;
  category: string;
}

interface GeneratedPlan {
  meals: GeneratedMeal[];
  shoppingList: ShoppingItem[];
}

const mealTypeIcons: Record<string, any> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  lunch: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  dinner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  snack: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function MealPlan() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: "dinner",
    recipeId: null as number | null,
    customMealName: "",
    notes: "",
  });

  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [viewingCustomMeal, setViewingCustomMeal] = useState<{ name: string; notes: string; mealType: string; recipeData?: { description: string; ingredients: string[]; instructions: string; prepTime: string; cookTime: string; servings: string } } | null>(null);
  const [viewingGeneratedMeal, setViewingGeneratedMeal] = useState<GeneratedMeal | null>(null);

  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiDays, setAiDays] = useState(7);
  const [aiMealTypes, setAiMealTypes] = useState(["breakfast", "lunch", "dinner"]);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [savedMeals, setSavedMeals] = useState<Set<number>>(new Set());
  const [addedShoppingItems, setAddedShoppingItems] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const { data: mealPlans = [] } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plans?startDate=${startDate}&endDate=${endDate}`);
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

  const addMealPlan = useMutation({
    mutationFn: async (data: { date: string; mealType: string; recipeId?: number | null; customMealName?: string; notes?: string }) => {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const deleteMealPlan = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/meal-plans/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
    },
  });

  const [cookedMeals, setCookedMeals] = useState<Set<number>>(new Set());
  const [cookedGenMeals, setCookedGenMeals] = useState<Set<number>>(new Set());

  const markCookedMutation = useMutation({
    mutationFn: async ({ ingredients, mealId, isGenerated }: { ingredients: string[]; mealId: number; isGenerated?: boolean }) => {
      const res = await apiRequest("POST", "/api/inventory/use-ingredients", { ingredients });
      return { data: await res.json(), mealId, isGenerated };
    },
    onSuccess: ({ data, mealId, isGenerated }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/expired"] });
      if (isGenerated) {
        setCookedGenMeals(prev => new Set(prev).add(mealId));
      } else {
        setCookedMeals(prev => new Set(prev).add(mealId));
      }
      const matched = data.used.filter((u: any) => u.matched).length;
      const total = data.used.filter((u: any) => u.name.trim() && u.name !== "--").length;
      toast({
        title: "Marked as cooked!",
        description: `${matched} of ${total} ingredients removed from inventory.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to update inventory", variant: "destructive" });
    },
  });

  const [savedToBook, setSavedToBook] = useState<Set<number>>(new Set());
  const [savedGenToBook, setSavedGenToBook] = useState<Set<number>>(new Set());

  const saveToRecipeBookMutation = useMutation({
    mutationFn: async ({ title, description, ingredients, instructions, prepTime, cookTime, servings, mealType, mealId, isGenerated }: {
      title: string;
      description: string;
      ingredients: string[];
      instructions?: string;
      prepTime?: string;
      cookTime?: string;
      servings?: string;
      mealType: string;
      mealId: number;
      isGenerated?: boolean;
    }) => {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ingredients,
          instructions: instructions || "",
          prepTime: prepTime || "",
          cookTime: cookTime || "",
          servings: servings || "",
          category: mealType,
          source: "Meal Plan",
        }),
      });
      if (!res.ok) throw new Error("Failed to save recipe");
      return { data: await res.json(), mealId, isGenerated };
    },
    onSuccess: ({ data, mealId, isGenerated }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      if (isGenerated) {
        setSavedGenToBook(prev => new Set(prev).add(mealId));
      } else {
        setSavedToBook(prev => new Set(prev).add(mealId));
      }
      toast({
        title: "Saved to Recipe Book!",
        description: `${data.title} has been added to your recipes.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to save recipe", variant: "destructive" });
    },
  });

  const generateMealPlan = useMutation({
    mutationFn: async () => {
      const genStartDate = format(new Date(), "yyyy-MM-dd");
      const res = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: aiDays,
          mealTypes: aiMealTypes,
          startDate: genStartDate,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate meal plan");
      }
      return res.json();
    },
    onSuccess: (data: GeneratedPlan) => {
      setGeneratedPlan(data);
      setSavedMeals(new Set());
      setAddedShoppingItems(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewMeal({
      mealType: "dinner",
      recipeId: null,
      customMealName: "",
      notes: "",
    });
  };

  const handleAddMeal = () => {
    if (!selectedDate) return;
    addMealPlan.mutate({
      date: selectedDate,
      mealType: newMeal.mealType,
      recipeId: newMeal.recipeId,
      customMealName: newMeal.customMealName || undefined,
      notes: newMeal.notes || undefined,
    });
  };

  const parseMealNotes = (notes: string | null | undefined) => {
    if (!notes) return null;
    try {
      const parsed = JSON.parse(notes);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.ingredients)) {
        return parsed as { description: string; ingredients: string[]; instructions: string; prepTime: string; cookTime: string; servings: string };
      }
    } catch {}
    return null;
  };

  const serializeMealNotes = (meal: GeneratedMeal) => {
    return JSON.stringify({
      description: meal.description || "",
      ingredients: meal.ingredients || [],
      instructions: meal.instructions || "",
      prepTime: meal.prepTime || "",
      cookTime: meal.cookTime || "",
      servings: meal.servings || "",
    });
  };

  const handleSaveMeal = async (meal: GeneratedMeal, index: number) => {
    await addMealPlan.mutateAsync({
      date: meal.date,
      mealType: meal.mealType,
      customMealName: meal.name,
      notes: serializeMealNotes(meal),
    });
    setSavedMeals(prev => new Set(prev).add(index));
    toast({
      title: "Meal Added",
      description: `${meal.name} added to ${format(parseISO(meal.date), "MMM d")}`,
    });
  };

  const handleSaveAllMeals = async () => {
    if (!generatedPlan) return;
    let count = 0;
    for (let i = 0; i < generatedPlan.meals.length; i++) {
      if (savedMeals.has(i)) continue;
      const meal = generatedPlan.meals[i];
      await addMealPlan.mutateAsync({
        date: meal.date,
        mealType: meal.mealType,
        customMealName: meal.name,
        notes: serializeMealNotes(meal),
      });
      setSavedMeals(prev => new Set(prev).add(i));
      count++;
    }
    toast({
      title: "All Meals Added",
      description: `${count} meals added to your plan`,
    });
    setShowAiDialog(false);
    setGeneratedPlan(null);
  };

  const handleAddToShoppingList = async (item: ShoppingItem, index: number) => {
    const itemName = item.quantity ? `${item.name} (${item.quantity})` : item.name;
    const res = await fetch("/api/shopping-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: itemName, category: item.category }),
    });
    if (res.ok) {
      setAddedShoppingItems(prev => new Set(prev).add(index));
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      toast({
        title: "Added to Shopping List",
        description: item.name,
      });
    }
  };

  const handleAddAllToShoppingList = async () => {
    if (!generatedPlan) return;
    let count = 0;
    for (let i = 0; i < generatedPlan.shoppingList.length; i++) {
      if (addedShoppingItems.has(i)) continue;
      const item = generatedPlan.shoppingList[i];
      const itemName = item.quantity ? `${item.name} (${item.quantity})` : item.name;
      await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: itemName, category: item.category }),
      });
      setAddedShoppingItems(prev => new Set(prev).add(i));
      count++;
    }
    queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    toast({
      title: "Shopping List Updated",
      description: `${count} items added to your shopping list`,
    });
  };

  const toggleMealType = (type: string) => {
    setAiMealTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getMealsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mealPlans.filter((mp) => mp.date === dateStr);
  };

  const getRecipeTitle = (recipeId: number | null) => {
    if (!recipeId) return null;
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe?.title || "Unknown Recipe";
  };

  const firstDayOfMonth = startOfMonth(currentDate).getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  const groupedMeals = generatedPlan?.meals.reduce((acc, meal, index) => {
    if (!acc[meal.date]) acc[meal.date] = [];
    acc[meal.date].push({ ...meal, _index: index });
    return acc;
  }, {} as Record<string, (GeneratedMeal & { _index: number })[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="h-9 w-9"
              data-testid="button-back-home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Meal Plan
            </h1>
          </div>
          <Button
            onClick={() => {
              setGeneratedPlan(null);
              setSavedMeals(new Set());
              setAddedShoppingItems(new Set());
              setShowAiDialog(true);
            }}
            className="gap-2"
            data-testid="button-ai-meal-plan"
          >
            <Sparkles className="h-4 w-4" />
            AI Generate
          </Button>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-lg font-serif">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="h-24 md:h-28" />
              ))}
              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const meals = getMealsForDate(day);
                const isSelected = selectedDate === dateStr;

                return (
                  <Dialog
                    key={dateStr}
                    open={isAddDialogOpen && selectedDate === dateStr}
                    onOpenChange={(open) => {
                      setIsAddDialogOpen(open);
                      if (open) setSelectedDate(dateStr);
                      if (!open) resetForm();
                    }}
                  >
                    <DialogTrigger asChild>
                      <button
                        className={`h-24 md:h-28 p-1 rounded-lg border text-left transition-all hover:bg-accent/50 ${
                          isToday(day) ? "border-primary bg-primary/5" : "border-border"
                        } ${isSelected ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setIsAddDialogOpen(true);
                        }}
                        data-testid={`day-cell-${dateStr}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5 overflow-y-auto max-h-16 md:max-h-20">
                          {meals.map((meal) => {
                            const Icon = mealTypeIcons[meal.mealType] || UtensilsCrossed;
                            const colorClass = mealTypeColors[meal.mealType] || "bg-gray-100 text-gray-800";
                            return (
                              <div
                                key={meal.id}
                                className={`flex items-center gap-1 text-[10px] rounded px-1 py-0.5 ${colorClass}`}
                                data-testid={`meal-${meal.id}`}
                              >
                                <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">
                                  {meal.recipeId ? getRecipeTitle(meal.recipeId) : meal.customMealName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          {format(parseISO(dateStr), "EEEE, MMMM d")}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {meals.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Planned Meals</Label>
                            {meals.map((meal) => {
                              const Icon = mealTypeIcons[meal.mealType] || UtensilsCrossed;
                              const colorClass = mealTypeColors[meal.mealType] || "bg-gray-100 text-gray-800";
                              return (
                                <div
                                  key={meal.id}
                                  className="p-3 rounded-lg bg-muted/50 space-y-2"
                                >
                                  <button
                                    className="flex items-center gap-2 text-left w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (meal.recipeId) {
                                        const recipe = recipes.find(r => r.id === meal.recipeId);
                                        if (recipe) setViewingRecipe(recipe);
                                      } else {
                                        const recipeData = parseMealNotes(meal.notes);
                                        setViewingCustomMeal({
                                          name: meal.customMealName || "Untitled Meal",
                                          notes: recipeData?.description || meal.notes || "",
                                          mealType: meal.mealType,
                                          recipeData: recipeData || undefined,
                                        });
                                      }
                                    }}
                                    data-testid={`button-view-meal-${meal.id}`}
                                  >
                                    <div className={`p-1.5 rounded ${colorClass}`}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                                        {meal.recipeId ? getRecipeTitle(meal.recipeId) : meal.customMealName}
                                      </div>
                                      <div className="text-xs text-muted-foreground capitalize">{meal.mealType}</div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-1 pl-9">
                                    {!meal.recipeId && !savedToBook.has(meal.id) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 text-primary border-primary/30"
                                        onClick={() => {
                                          const rd = parseMealNotes(meal.notes);
                                          saveToRecipeBookMutation.mutate({
                                            title: meal.customMealName || "Untitled Meal",
                                            description: rd?.description || meal.notes || "",
                                            ingredients: rd?.ingredients || [],
                                            instructions: rd?.instructions,
                                            prepTime: rd?.prepTime,
                                            cookTime: rd?.cookTime,
                                            servings: rd?.servings,
                                            mealType: meal.mealType,
                                            mealId: meal.id,
                                          });
                                        }}
                                        disabled={saveToRecipeBookMutation.isPending}
                                        data-testid={`button-save-recipe-${meal.id}`}
                                      >
                                        <BookPlus className="h-3.5 w-3.5" />
                                        Save
                                      </Button>
                                    ) : !meal.recipeId && savedToBook.has(meal.id) ? (
                                      <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                                        <Check className="h-3.5 w-3.5" /> Saved
                                      </span>
                                    ) : null}
                                    {!cookedMeals.has(meal.id) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 text-primary border-primary/30"
                                        onClick={() => {
                                          const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
                                          const rd = parseMealNotes(meal.notes);
                                          const ingredients = recipe?.ingredients?.filter(i => i.trim() && i !== "--") || rd?.ingredients || [];
                                          if (ingredients.length > 0) {
                                            markCookedMutation.mutate({ ingredients, mealId: meal.id });
                                          } else {
                                            toast({ title: "No ingredients found for this meal" });
                                          }
                                        }}
                                        disabled={markCookedMutation.isPending}
                                        data-testid={`button-cooked-meal-${meal.id}`}
                                      >
                                        <CheckSquare className="h-3.5 w-3.5" />
                                        Cooked
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-primary flex items-center gap-1 px-2">
                                        <Check className="h-3.5 w-3.5" /> Cooked
                                      </span>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-1 text-destructive border-destructive/30 ml-auto"
                                      onClick={() => deleteMealPlan.mutate(meal.id)}
                                      data-testid={`delete-meal-${meal.id}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="border-t pt-4 space-y-3">
                          <Label className="text-sm font-medium">Add a Meal</Label>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Meal Type</Label>
                            <Select
                              value={newMeal.mealType}
                              onValueChange={(value) => setNewMeal((p) => ({ ...p, mealType: value }))}
                            >
                              <SelectTrigger data-testid="select-meal-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                                <SelectItem value="snack">Snack</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Link a Recipe (optional)</Label>
                            <Select
                              value={newMeal.recipeId?.toString() || "none"}
                              onValueChange={(value) => setNewMeal((p) => ({ 
                                ...p, 
                                recipeId: value === "none" ? null : parseInt(value),
                                customMealName: value !== "none" ? "" : p.customMealName
                              }))}
                            >
                              <SelectTrigger data-testid="select-recipe">
                                <SelectValue placeholder="Select a recipe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No recipe - enter custom meal</SelectItem>
                                {recipes.map((recipe) => (
                                  <SelectItem key={recipe.id} value={recipe.id.toString()}>
                                    {recipe.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {!newMeal.recipeId && (
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Custom Meal Name</Label>
                              <Input
                                placeholder="e.g., Leftover pasta"
                                value={newMeal.customMealName}
                                onChange={(e) => setNewMeal((p) => ({ ...p, customMealName: e.target.value }))}
                                data-testid="input-custom-meal"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                            <Input
                              placeholder="Add any notes..."
                              value={newMeal.notes}
                              onChange={(e) => setNewMeal((p) => ({ ...p, notes: e.target.value }))}
                              data-testid="input-notes"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <DialogClose asChild>
                              <Button variant="outline" className="flex-1">
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button
                              className="flex-1 gap-2"
                              onClick={handleAddMeal}
                              disabled={!newMeal.recipeId && !newMeal.customMealName}
                              data-testid="button-add-meal"
                            >
                              <Plus className="h-4 w-4" />
                              Add Meal
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/95 backdrop-blur-sm shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-muted-foreground">Legend:</span>
              {Object.entries(mealTypeColors).map(([type, colorClass]) => {
                const Icon = mealTypeIcons[type];
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`p-1 rounded ${colorClass}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="capitalize text-muted-foreground">{type}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showAiDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => {
              if (!generateMealPlan.isPending) setShowAiDialog(false);
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Meal Plan
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => !generateMealPlan.isPending && setShowAiDialog(false)}
                  data-testid="button-close-ai-dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                {!generatedPlan ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">How many days?</Label>
                      <div className="flex gap-2">
                        {[3, 5, 7, 14].map((d) => (
                          <button
                            key={d}
                            onClick={() => setAiDays(d)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              aiDays === d
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            data-testid={`button-days-${d}`}
                          >
                            {d} days
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Which meals to include?</Label>
                      <div className="flex flex-wrap gap-2">
                        {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
                          const Icon = mealTypeIcons[type];
                          const isSelected = aiMealTypes.includes(type);
                          return (
                            <button
                              key={type}
                              onClick={() => toggleMealType(type)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                              data-testid={`button-meal-type-${type}`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="capitalize">{type}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      The AI will create meals based on what's in your pantry and suggest a shopping list for anything you'll need to buy.
                    </p>

                    <Button
                      className="w-full gap-2 h-12 text-base"
                      onClick={() => generateMealPlan.mutate()}
                      disabled={generateMealPlan.isPending || aiMealTypes.length === 0}
                      data-testid="button-generate-plan"
                    >
                      {generateMealPlan.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generating your meal plan...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Generate Meal Plan
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-medium">Your Meal Plan</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => {
                            setGeneratedPlan(null);
                            setSavedMeals(new Set());
                            setAddedShoppingItems(new Set());
                            generateMealPlan.mutate();
                          }}
                          disabled={generateMealPlan.isPending}
                          data-testid="button-regenerate"
                        >
                          {generateMealPlan.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Re-generate
                        </Button>
                        {generatedPlan.meals.some((_, i) => !savedMeals.has(i)) && (
                          <Button
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={handleSaveAllMeals}
                            disabled={addMealPlan.isPending}
                            data-testid="button-save-all-meals"
                          >
                            <Check className="h-3 w-3" />
                            Save All Meals
                          </Button>
                        )}
                      </div>
                    </div>

                    {groupedMeals && Object.entries(groupedMeals).map(([date, meals]) => (
                      <div key={date} className="space-y-2">
                        <h4 className="text-sm font-medium text-primary">
                          {format(parseISO(date), "EEEE, MMM d")}
                        </h4>
                        {meals.map((meal) => {
                          const mealIndex = meal._index;
                          const isSaved = savedMeals.has(mealIndex);
                          const Icon = mealTypeIcons[meal.mealType] || UtensilsCrossed;
                          const colorClass = mealTypeColors[meal.mealType] || "bg-gray-100 text-gray-800";

                          return (
                            <div
                              key={mealIndex}
                              className={`rounded-xl border p-3 space-y-2 transition-colors ${
                                isSaved ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                              }`}
                              data-testid={`generated-meal-${mealIndex}`}
                            >
                              <button
                                className="flex items-start gap-2 text-left w-full"
                                onClick={() => setViewingGeneratedMeal(meal)}
                                data-testid={`button-view-gen-meal-${mealIndex}`}
                              >
                                <div className={`p-1.5 rounded flex-shrink-0 ${colorClass}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium hover:text-primary transition-colors">
                                    {meal.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground capitalize">{meal.mealType}</div>
                                  {meal.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>
                                  )}
                                </div>
                              </button>
                              <div className="flex items-center gap-1.5 pl-9 flex-wrap">
                                {!savedGenToBook.has(mealIndex) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 text-primary border-primary/30"
                                    onClick={() => {
                                      saveToRecipeBookMutation.mutate({
                                        title: meal.name,
                                        description: meal.description || "",
                                        ingredients: meal.ingredients,
                                        instructions: meal.instructions,
                                        prepTime: meal.prepTime,
                                        cookTime: meal.cookTime,
                                        servings: meal.servings,
                                        mealType: meal.mealType,
                                        mealId: mealIndex,
                                        isGenerated: true,
                                      });
                                    }}
                                    disabled={saveToRecipeBookMutation.isPending}
                                    data-testid={`button-save-recipe-gen-${mealIndex}`}
                                  >
                                    <BookPlus className="h-3.5 w-3.5" />
                                    Save
                                  </Button>
                                ) : (
                                  <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                                    <Check className="h-3.5 w-3.5" /> Saved
                                  </span>
                                )}
                                {!cookedGenMeals.has(mealIndex) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 text-primary border-primary/30"
                                    onClick={() => {
                                      if (meal.ingredients.length > 0) {
                                        markCookedMutation.mutate({ ingredients: meal.ingredients, mealId: mealIndex, isGenerated: true });
                                      } else {
                                        toast({ title: "No ingredients found for this meal" });
                                      }
                                    }}
                                    disabled={markCookedMutation.isPending}
                                    data-testid={`button-cooked-gen-${mealIndex}`}
                                  >
                                    <CheckSquare className="h-3.5 w-3.5" />
                                    Cooked
                                  </Button>
                                ) : (
                                  <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                                    <Check className="h-3.5 w-3.5" /> Cooked
                                  </span>
                                )}
                                {!isSaved ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1 text-primary border-primary/30"
                                    onClick={() => handleSaveMeal(meal, mealIndex)}
                                    disabled={addMealPlan.isPending}
                                    data-testid={`button-save-meal-${mealIndex}`}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                  </Button>
                                ) : (
                                  <span className="text-xs text-primary flex items-center gap-1 px-2">
                                    <Check className="h-3.5 w-3.5" /> Added
                                  </span>
                                )}
                              </div>
                              {meal.ingredients.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-9">
                                  {meal.ingredients.map((ing, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-background border text-muted-foreground"
                                    >
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {generatedPlan.shoppingList.length > 0 && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-lg font-medium flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Shopping List
                          </h3>
                          {generatedPlan.shoppingList.some((_, i) => !addedShoppingItems.has(i)) && (
                            <Button
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={handleAddAllToShoppingList}
                              data-testid="button-add-all-shopping"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              Add All
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          These items aren't in your pantry and will be needed for the planned meals.
                        </p>
                        <div className="space-y-1.5">
                          {generatedPlan.shoppingList.map((item, index) => {
                            const isAdded = addedShoppingItems.has(index);
                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                                  isAdded ? "bg-primary/5" : "bg-muted/50"
                                }`}
                                data-testid={`shopping-item-${index}`}
                              >
                                <div>
                                  <span className="text-sm">{item.name}</span>
                                  {item.quantity && (
                                    <span className="text-xs text-primary font-medium ml-2">{item.quantity}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-2 capitalize">{item.category}</span>
                                </div>
                                {!isAdded ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-primary"
                                    onClick={() => handleAddToShoppingList(item, index)}
                                    data-testid={`button-add-shopping-${index}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div className="h-8 w-8 flex items-center justify-center text-primary">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!viewingRecipe} onOpenChange={(open) => { if (!open) setViewingRecipe(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {viewingRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{viewingRecipe.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {viewingRecipe.description && (
                  <p className="text-sm text-muted-foreground">{viewingRecipe.description}</p>
                )}

                <div className="flex gap-4 text-sm">
                  {viewingRecipe.prepTime && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={14} />
                      <span>Prep: {viewingRecipe.prepTime}</span>
                    </div>
                  )}
                  {viewingRecipe.cookTime && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={14} />
                      <span>Cook: {viewingRecipe.cookTime}</span>
                    </div>
                  )}
                  {viewingRecipe.servings && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users size={14} />
                      <span>{viewingRecipe.servings}</span>
                    </div>
                  )}
                </div>

                {viewingRecipe.ingredients && viewingRecipe.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Ingredients</h3>
                    <ul className="space-y-1.5">
                      {viewingRecipe.ingredients.filter(i => i.trim() && i !== "--").map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingRecipe.instructions && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Instructions</h3>
                    <div className="prose prose-sm text-foreground whitespace-pre-wrap text-sm">{viewingRecipe.instructions}</div>
                  </div>
                )}

                {viewingRecipe.source && (
                  <p className="text-xs text-muted-foreground">Source: {viewingRecipe.source}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingCustomMeal} onOpenChange={(open) => { if (!open) setViewingCustomMeal(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {viewingCustomMeal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{viewingCustomMeal.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="text-xs text-muted-foreground capitalize">{viewingCustomMeal.mealType}</div>
                {viewingCustomMeal.recipeData ? (
                  <>
                    {viewingCustomMeal.recipeData.description && (
                      <p className="text-sm text-muted-foreground">{viewingCustomMeal.recipeData.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      {viewingCustomMeal.recipeData.prepTime && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={14} />
                          <span>Prep: {viewingCustomMeal.recipeData.prepTime}</span>
                        </div>
                      )}
                      {viewingCustomMeal.recipeData.cookTime && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={14} />
                          <span>Cook: {viewingCustomMeal.recipeData.cookTime}</span>
                        </div>
                      )}
                      {viewingCustomMeal.recipeData.servings && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users size={14} />
                          <span>{viewingCustomMeal.recipeData.servings}</span>
                        </div>
                      )}
                    </div>
                    {viewingCustomMeal.recipeData.ingredients.length > 0 && (
                      <div>
                        <h3 className="text-sm font-serif font-medium mb-2">Ingredients</h3>
                        <ul className="space-y-1.5">
                          {viewingCustomMeal.recipeData.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewingCustomMeal.recipeData.instructions && (
                      <div>
                        <h3 className="text-sm font-serif font-medium mb-2">Instructions</h3>
                        <div className="prose prose-sm text-foreground whitespace-pre-wrap text-sm">{viewingCustomMeal.recipeData.instructions}</div>
                      </div>
                    )}
                  </>
                ) : viewingCustomMeal.notes ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{viewingCustomMeal.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description available for this meal.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingGeneratedMeal} onOpenChange={(open) => { if (!open) setViewingGeneratedMeal(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {viewingGeneratedMeal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{viewingGeneratedMeal.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {viewingGeneratedMeal.description && (
                  <p className="text-sm text-muted-foreground">{viewingGeneratedMeal.description}</p>
                )}

                <div className="flex gap-4 text-sm">
                  {viewingGeneratedMeal.prepTime && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={14} />
                      <span>Prep: {viewingGeneratedMeal.prepTime}</span>
                    </div>
                  )}
                  {viewingGeneratedMeal.cookTime && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={14} />
                      <span>Cook: {viewingGeneratedMeal.cookTime}</span>
                    </div>
                  )}
                  {viewingGeneratedMeal.servings && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users size={14} />
                      <span>{viewingGeneratedMeal.servings}</span>
                    </div>
                  )}
                </div>

                {viewingGeneratedMeal.ingredients && viewingGeneratedMeal.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Ingredients</h3>
                    <ul className="space-y-1.5">
                      {viewingGeneratedMeal.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingGeneratedMeal.instructions && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Instructions</h3>
                    <div className="prose prose-sm text-foreground whitespace-pre-wrap text-sm">{viewingGeneratedMeal.instructions}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
