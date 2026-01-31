import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, UtensilsCrossed, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import type { MealPlan, Recipe } from "@shared/schema";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: "dinner",
    recipeId: null as number | null,
    customMealName: "",
    notes: "",
  });

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Meal Plan
          </h1>
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
                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded ${colorClass}`}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">
                                        {meal.recipeId ? getRecipeTitle(meal.recipeId) : meal.customMealName}
                                      </div>
                                      <div className="text-xs text-muted-foreground capitalize">{meal.mealType}</div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteMealPlan.mutate(meal.id)}
                                    data-testid={`delete-meal-${meal.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
    </div>
  );
}
