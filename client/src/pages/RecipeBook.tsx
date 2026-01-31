import { useState, useRef } from "react";
import Layout from "@/components/layout";
import { Book, Plus, Upload, Heart, Clock, Users, Trash2, ChevronRight, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";

export default function RecipeBook() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"pdf" | "image" | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    category: "dinner",
  });

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    queryFn: async () => {
      const res = await fetch("/api/recipes");
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (recipe: any) => {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });
      if (!res.ok) throw new Error("Failed to create recipe");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowAddForm(false);
      resetForm();
      toast({ title: "Recipe saved!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setSelectedRecipe(null);
      toast({ title: "Recipe deleted" });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      });
      if (!res.ok) throw new Error("Failed to update recipe");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ingredients: "",
      instructions: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      category: "dinner",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Please enter a recipe title", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      ingredients: formData.ingredients.split("\n").filter(i => i.trim()),
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadType("pdf");
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("/api/recipes/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to parse PDF");
      }

      const recipeData = await res.json();
      
      setFormData({
        title: recipeData.title || "",
        description: recipeData.description || "",
        ingredients: (recipeData.ingredients || []).join("\n"),
        instructions: recipeData.instructions || "",
        prepTime: recipeData.prepTime || "",
        cookTime: recipeData.cookTime || "",
        servings: recipeData.servings || "",
        category: recipeData.category || "dinner",
      });
      setShowAddForm(true);
      toast({ title: "Recipe extracted from PDF! Review and save." });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to parse PDF",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadType("image");
    const formDataObj = new FormData();
    formDataObj.append("image", file);

    try {
      const res = await fetch("/api/recipes/parse-image", {
        method: "POST",
        body: formDataObj,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to parse image");
      }

      const recipeData = await res.json();
      
      setFormData({
        title: recipeData.title || "",
        description: recipeData.description || "",
        ingredients: (recipeData.ingredients || []).join("\n"),
        instructions: recipeData.instructions || "",
        prepTime: recipeData.prepTime || "",
        cookTime: recipeData.cookTime || "",
        servings: recipeData.servings || "",
        category: recipeData.category || "dinner",
      });
      setShowAddForm(true);
      toast({ title: "Recipe extracted from image! Review and save." });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to parse image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  if (selectedRecipe) {
    return (
      <Layout>
        <div className="pb-20">
          <header className="flex items-center justify-between py-4">
            <button onClick={() => setSelectedRecipe(null)} className="text-primary font-medium" data-testid="button-back">
              ← Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavoriteMutation.mutate({ id: selectedRecipe.id, isFavorite: !selectedRecipe.isFavorite })}
                className="p-2"
                data-testid="button-toggle-favorite"
              >
                <Heart className={selectedRecipe.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} size={20} />
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedRecipe.id)}
                className="p-2 text-red-500"
                data-testid="button-delete-recipe"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </header>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-recipe-title">{selectedRecipe.title}</h1>
              {selectedRecipe.description && (
                <p className="text-muted-foreground mt-2">{selectedRecipe.description}</p>
              )}
            </div>

            <div className="flex gap-4 text-sm">
              {selectedRecipe.prepTime && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock size={16} />
                  <span>Prep: {selectedRecipe.prepTime}</span>
                </div>
              )}
              {selectedRecipe.cookTime && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock size={16} />
                  <span>Cook: {selectedRecipe.cookTime}</span>
                </div>
              )}
              {selectedRecipe.servings && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users size={16} />
                  <span>{selectedRecipe.servings}</span>
                </div>
              )}
            </div>

            {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
              <div>
                <h2 className="text-lg font-serif font-medium mb-3">Ingredients</h2>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                      <span className="text-foreground">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.instructions && (
              <div>
                <h2 className="text-lg font-serif font-medium mb-3">Instructions</h2>
                <div className="prose prose-sm text-foreground whitespace-pre-wrap">{selectedRecipe.instructions}</div>
              </div>
            )}

            {selectedRecipe.source && (
              <p className="text-xs text-muted-foreground">Source: {selectedRecipe.source}</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (showAddForm) {
    return (
      <Layout>
        <div className="pb-20">
          <header className="flex items-center justify-between py-4">
            <button onClick={() => { setShowAddForm(false); resetForm(); }} className="text-primary font-medium" data-testid="button-cancel-add">
              Cancel
            </button>
            <h1 className="text-lg font-serif font-medium">Add Recipe</h1>
            <div className="w-16"></div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Recipe name"
                data-testid="input-recipe-title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
                data-testid="input-recipe-description"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Prep Time</label>
                <Input
                  value={formData.prepTime}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                  placeholder="15 mins"
                  data-testid="input-prep-time"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Cook Time</label>
                <Input
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                  placeholder="30 mins"
                  data-testid="input-cook-time"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Servings</label>
                <Input
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                  placeholder="4"
                  data-testid="input-servings"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="select-category"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="dessert">Dessert</option>
                <option value="snack">Snack</option>
                <option value="appetizer">Appetizer</option>
                <option value="beverage">Beverage</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Ingredients (one per line)</label>
              <Textarea
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="1 cup flour&#10;2 eggs&#10;1/2 cup milk"
                rows={6}
                data-testid="input-ingredients"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Instructions</label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Step-by-step instructions..."
                rows={8}
                data-testid="input-instructions"
              />
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-recipe">
              {createMutation.isPending ? "Saving..." : "Save Recipe"}
            </Button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-20">
        <header className="py-4">
          <div className="flex items-center gap-3 mb-2">
            <Book className="text-primary" size={28} />
            <h1 className="text-2xl font-serif font-bold text-foreground">Recipe Book</h1>
          </div>
          <p className="text-sm text-muted-foreground">Your saved recipes and favorites</p>
        </header>

        <div className="space-y-3 mb-6">
          <Button onClick={() => setShowAddForm(true)} className="w-full" data-testid="button-add-recipe">
            <Plus size={18} className="mr-2" />
            Add Recipe Manually
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
              data-testid="button-upload-pdf"
            >
              {isUploading && uploadType === "pdf" ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <Upload size={18} className="mr-2" />
              )}
              {isUploading && uploadType === "pdf" ? "Processing..." : "Upload PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
              data-testid="button-upload-image"
            >
              {isUploading && uploadType === "image" ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : (
                <Camera size={18} className="mr-2" />
              )}
              {isUploading && uploadType === "image" ? "Processing..." : "Upload Image"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <Book className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-lg font-medium text-foreground mb-2">No recipes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first recipe manually or upload a PDF/image</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
                data-testid={`recipe-card-${recipe.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{recipe.title}</h3>
                      {recipe.isFavorite && <Heart className="fill-red-500 text-red-500 flex-shrink-0" size={14} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {recipe.category && (
                        <span className="capitalize">{recipe.category}</span>
                      )}
                      {recipe.cookTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {recipe.cookTime}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="text-muted-foreground flex-shrink-0" size={20} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
