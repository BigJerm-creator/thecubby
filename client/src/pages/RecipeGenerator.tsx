import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChefHat, Loader2, Sparkles, BookPlus, Check } from "lucide-react";
import { useInventory } from "@/lib/InventoryContext";
import { useToast } from "@/hooks/use-toast";

export default function RecipeGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { inventory, isLoading: inventoryLoading } = useInventory();
  const [recipe, setRecipe] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recipeRef = useRef<HTMLDivElement>(null);

  const ingredientCount = Object.values(inventory).flat().length;

  useEffect(() => {
    if (recipeRef.current) {
      recipeRef.current.scrollTop = recipeRef.current.scrollHeight;
    }
  }, [recipe]);

  const generateRecipe = async () => {
    setIsGenerating(true);
    setRecipe("");
    setError(null);
    setIsSaved(false);

    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex items-center gap-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recipe Generator</h1>
            <p className="text-sm text-muted-foreground">AI-powered recipes from your pantry</p>
          </div>
        </header>

        <Card className="bg-card/95 backdrop-blur-sm border-primary/20 shadow-md">
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
          <Card className="border-destructive/50 bg-card/95 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {recipe && (
          <Card className="overflow-hidden bg-card/95 backdrop-blur-sm shadow-md">
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
                <Button
                  onClick={saveToRecipeBook}
                  disabled={isSaving || isSaved}
                  variant={isSaved ? "outline" : "default"}
                  className="w-full mt-6 gap-2"
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
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
