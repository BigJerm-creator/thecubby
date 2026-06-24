import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChefHat, Loader2, Sparkles, BookPlus, Check, CheckSquare, Search, Globe, Clock, Users, X, Filter, UtensilsCrossed } from "lucide-react";
import { useInventory } from "@/lib/InventoryContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getNativeAuthHeaders } from "@/lib/queryClient";

interface SearchMeal {
  id: string;
  title: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  ingredients: string[];
  source: string;
  youtube: string;
}

export default function RecipeGenerator() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { inventory, isLoading: inventoryLoading } = useInventory();
  const [recipe, setRecipe] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMarkedCooked, setIsMarkedCooked] = useState(false);
  const recipeRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMeal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewingMeal, setViewingMeal] = useState<SearchMeal | null>(null);
  const [savedSearchRecipes, setSavedSearchRecipes] = useState<Set<string>>(new Set());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<{ categories: string[]; areas: string[] }>({ categories: [], areas: [] });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const extractIngredients = (text: string): string[] => {
    const lines = text.split('\n');
    const ingredients: string[] = [];
    let inIngredients = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^#+ /) || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
        const heading = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').toLowerCase();
        inIngredients = heading.includes('ingredient');
        continue;
      }
      if (inIngredients && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d/))) {
        const cleaned = trimmed.replace(/^[-•]\s*/, '').trim();
        if (cleaned && cleaned !== '--') ingredients.push(cleaned);
      }
    }
    return ingredients;
  };

  const markCookedMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const res = await apiRequest("POST", "/api/inventory/use-ingredients", { ingredients });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/expired"] });
      setIsMarkedCooked(true);
      const matched = data.used.filter((u: any) => u.matched).length;
      const total = data.used.filter((u: any) => u.name.trim()).length;
      toast({
        title: "Marked as cooked!",
        description: `${matched} of ${total} ingredients removed from inventory.`,
      });
    },
    onError: () => {
      toast({ title: "Failed to update inventory", variant: "destructive" });
    },
  });

  const ingredientCount = Object.values(inventory).flat().length;

  useEffect(() => {
    if (recipeRef.current) {
      recipeRef.current.scrollTop = recipeRef.current.scrollHeight;
    }
  }, [recipe]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/recipe-search/filters", { credentials: "include", headers: getNativeAuthHeaders() })
      .then(r => r.ok ? r.json() : { categories: [], areas: [] })
      .then(d => setFilters(d))
      .catch(() => {});
  }, []);

  const searchRecipes = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/recipe-search?q=${encodeURIComponent(query.trim())}`, { credentials: "include", headers: getNativeAuthHeaders() });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.meals || []);
    } catch {
      setSearchResults([]);
      toast({ title: "Recipe search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const browseByFilter = async (type: "category" | "area", value: string) => {
    if (type === "category") {
      setActiveCategory(prev => prev === value ? null : value);
      setActiveArea(null);
      if (activeCategory === value) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }
    } else {
      setActiveArea(prev => prev === value ? null : value);
      setActiveCategory(null);
      if (activeArea === value) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }
    }
    setSearchQuery("");
    setIsSearching(true);
    setHasSearched(true);
    try {
      const param = type === "category" ? `category=${encodeURIComponent(value)}` : `area=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/recipe-search?${param}`, { credentials: "include", headers: getNativeAuthHeaders() });
      if (!res.ok) throw new Error("Browse failed");
      const data = await res.json();
      setSearchResults(data.meals || []);
    } catch {
      setSearchResults([]);
      toast({ title: "Failed to load recipes", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setActiveCategory(null);
    setActiveArea(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => searchRecipes(value), 500);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const saveSearchRecipe = async (meal: SearchMeal) => {
    try {
      await apiRequest("POST", "/api/recipes", {
        title: meal.title,
        description: `${meal.area} ${meal.category}`.trim(),
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        category: (meal.category || "dinner").toLowerCase(),
        source: meal.source || "TheMealDB",
      });
      setSavedSearchRecipes(prev => new Set(prev).add(meal.id));
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe saved to your Recipe Book!" });
    } catch {
      toast({ title: "Failed to save recipe", variant: "destructive" });
    }
  };

  const generateRecipe = async () => {
    setIsGenerating(true);
    setRecipe("");
    setError(null);
    setIsSaved(false);
    setIsMarkedCooked(false);

    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getNativeAuthHeaders() },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate recipe");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setRecipe(prev => prev + data.content);
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recipe");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToRecipeBook = async () => {
    if (!recipe || isSaving) return;
    
    setIsSaving(true);
    try {
      const lines = recipe.split('\n');
      let title = "Generated Recipe";
      const ingredients: string[] = [];
      let instructions = "";
      let inIngredients = false;
      let inInstructions = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^#+ /) || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
          const heading = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').toLowerCase();
          if (heading.includes('recipe name') || lines.indexOf(line) === 0) {
            title = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
          }
          inIngredients = heading.includes('ingredient');
          inInstructions = heading.includes('instruction') || heading.includes('step') || heading.includes('direction');
          continue;
        }
        
        if (inIngredients && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d/))) {
          ingredients.push(trimmed.replace(/^[-•]\s*/, ''));
        }
        if (inInstructions && trimmed) {
          instructions += trimmed + '\n';
        }
      }
      
      const res = await fetch("/api/recipes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getNativeAuthHeaders() },
        body: JSON.stringify({
          title: title || "Generated Recipe",
          description: "AI-generated recipe from pantry ingredients",
          ingredients: ingredients.length > 0 ? ingredients : [recipe.substring(0, 500)],
          instructions: instructions || recipe,
          source: "AI Generated",
          category: "dinner",
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save recipe");
      
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe saved to your Recipe Book!" });
    } catch (err) {
      toast({ 
        title: "Failed to save recipe", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatRecipe = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-serif font-bold text-foreground mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-serif font-semibold text-foreground mt-6 mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-foreground mt-4 mb-2">{line.slice(2, -2)}</p>;
      }
      if (line.match(/^\d+\./)) {
        return <p key={i} className="ml-4 text-muted-foreground mb-2">{line}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} className="ml-4 text-muted-foreground mb-1">{line}</p>;
      }
      if (line.trim() === '') {
        return <br key={i} />;
      }
      return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <header className="pt-4 pb-2">
          <h1 className="text-3xl font-serif text-foreground">Recipe Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-powered recipes from your pantry</p>
        </header>

        <Card className="bg-card backdrop-blur-sm border-primary/20 shadow-md">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h2 className="text-sm font-serif font-medium text-foreground">Search Recipes</h2>
              </div>
              {(filters.categories.length > 0 || filters.areas.length > 0) && (
                <button
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${showFilters ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-3 w-3" />
                  Browse
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                placeholder="Search by name or ingredient..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pr-8"
                data-testid="input-recipe-search"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false); setActiveCategory(null); setActiveArea(null); }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-3 pt-1">
                {filters.categories.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Category</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.categories.map((cat) => (
                        <button
                          key={cat}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                          onClick={() => browseByFilter("category", cat)}
                          data-testid={`filter-category-${cat}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filters.areas.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Cuisine</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filters.areas.map((area) => (
                        <button
                          key={area}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${activeArea === area ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                          onClick={() => browseByFilter("area", area)}
                          data-testid={`filter-area-${area}`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeCategory || activeArea) && !isSearching && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Browsing: <span className="font-medium text-foreground">{activeCategory || activeArea}</span>
                </span>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setActiveCategory(null); setActiveArea(null); setSearchResults([]); setHasSearched(false); }}
                >
                  Clear
                </button>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {!isSearching && hasSearched && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">No recipes found. Try a different search or browse by category.</p>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">{searchResults.length} recipe{searchResults.length !== 1 ? "s" : ""} found</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {searchResults.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setViewingMeal(meal)}
                      data-testid={`search-result-${meal.id}`}
                    >
                      {meal.thumbnail && (
                        <img
                          src={`${meal.thumbnail}/preview`}
                          alt={meal.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{meal.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {[meal.area, meal.category].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card backdrop-blur-sm border-primary/20 shadow-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-serif font-medium text-foreground mb-2">
              {inventoryLoading ? "Loading..." : `${ingredientCount} ingredients in your pantry`}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Our AI chef will create a delicious recipe using what you have
            </p>
            <Button
              onClick={generateRecipe}
              disabled={isGenerating || inventoryLoading || ingredientCount === 0}
              className="w-full gap-2"
              data-testid="button-generate-recipe"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cooking up ideas...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>
            {ingredientCount === 0 && !inventoryLoading && (
              <p className="text-sm text-destructive mt-2">
                Add some ingredients to your pantry first!
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-card backdrop-blur-sm shadow-md">
            <CardContent className="p-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {recipe && (
          <Card className="overflow-hidden bg-card backdrop-blur-sm shadow-md">
            <CardContent className="p-6" ref={recipeRef}>
              <div className="prose prose-sm max-w-none">
                {formatRecipe(recipe)}
              </div>
              {isGenerating && (
                <div className="flex items-center gap-2 text-primary mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Writing recipe...</span>
                </div>
              )}
              {!isGenerating && (
                <div className="space-y-3 mt-6">
                  <Button
                    onClick={saveToRecipeBook}
                    disabled={isSaving || isSaved}
                    variant={isSaved ? "outline" : "default"}
                    className="w-full gap-2"
                    data-testid="button-save-to-recipe-book"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <Check className="h-4 w-4" />
                        Saved to Recipe Book
                      </>
                    ) : (
                      <>
                        <BookPlus className="h-4 w-4" />
                        Save to Recipe Book
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      const ingredients = extractIngredients(recipe);
                      if (ingredients.length > 0) {
                        markCookedMutation.mutate(ingredients);
                      } else {
                        toast({ title: "Could not find ingredients in the recipe" });
                      }
                    }}
                    disabled={markCookedMutation.isPending || isMarkedCooked}
                    variant="outline"
                    className="w-full gap-2"
                    data-testid="button-mark-cooked-generated"
                  >
                    {markCookedMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating Inventory...
                      </>
                    ) : isMarkedCooked ? (
                      <>
                        <Check className="h-4 w-4" />
                        Ingredients Removed
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Mark as Cooked
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!viewingMeal} onOpenChange={(open) => { if (!open) setViewingMeal(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {viewingMeal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-serif">{viewingMeal.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {viewingMeal.thumbnail && (
                  <img
                    src={viewingMeal.thumbnail}
                    alt={viewingMeal.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {viewingMeal.area && (
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {viewingMeal.area}
                    </span>
                  )}
                  {viewingMeal.category && (
                    <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {viewingMeal.category}
                    </span>
                  )}
                </div>

                {viewingMeal.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Ingredients</h3>
                    <ul className="space-y-1.5">
                      {viewingMeal.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingMeal.instructions && (
                  <div>
                    <h3 className="text-sm font-serif font-medium mb-2">Instructions</h3>
                    <div className="prose prose-sm text-foreground whitespace-pre-wrap text-sm">
                      {viewingMeal.instructions}
                    </div>
                  </div>
                )}

                {viewingMeal.source && (
                  <a
                    href={viewingMeal.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    View Original Source
                  </a>
                )}

                <Button
                  onClick={() => saveSearchRecipe(viewingMeal)}
                  disabled={savedSearchRecipes.has(viewingMeal.id)}
                  variant={savedSearchRecipes.has(viewingMeal.id) ? "outline" : "default"}
                  className="w-full gap-2"
                  data-testid="button-save-search-recipe"
                >
                  {savedSearchRecipes.has(viewingMeal.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved to Recipe Book
                    </>
                  ) : (
                    <>
                      <BookPlus className="h-4 w-4" />
                      Save to Recipe Book
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
