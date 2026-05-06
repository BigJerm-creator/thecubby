import { useState } from "react";
import Layout from "@/components/layout";
import { ArrowLeft, Sun, Moon, Check, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useTheme, type ColorTheme } from "@/lib/ThemeContext";

const COLOR_THEMES: { id: ColorTheme; label: string; colors: string[] }[] = [
  { id: "farmhouse", label: "Modern Farmhouse", colors: ["#5D7052", "#E8E4DB"] },
  { id: "ocean", label: "Ocean Breeze", colors: ["#1A8FBC", "#A8D5E5"] },
  { id: "sunset", label: "Sunset Glow", colors: ["#E85D32", "#FFCA7A"] },
  { id: "forest", label: "Forest", colors: ["#2D5A3D", "#B5D4A3"] },
  { id: "lavender", label: "Lavender Dream", colors: ["#8B5DC8", "#DCC8F0"] },
  { id: "midnight", label: "Midnight", colors: ["#4A5899", "#9AA8D4"] },
  { id: "rose", label: "Rose", colors: ["#D94F7A", "#F4B8C8"] },
  { id: "mint", label: "Mint", colors: ["#3DAA8A", "#A8DECC"] },
  { id: "amber", label: "Amber", colors: ["#F2A30F", "#FAD98A"] },
  { id: "slate", label: "Slate", colors: ["#566578", "#B8C0CC"] },
  { id: "berry", label: "Berry", colors: ["#943D94", "#D9B0D9"] },
  { id: "sky", label: "Sky", colors: ["#2EA0F0", "#B0DCF7"] },
];

export default function Appearance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const {
    themeMode,
    colorTheme,
    setThemeMode,
    setColorTheme,
    saveSettings,
    isLoading,
  } = useTheme();

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings();
      toast({
        title: "Appearance Saved",
        description: "Your appearance settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save appearance settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pt-4 pb-8">
        <header className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/settings")}
            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-serif text-foreground">Appearance</h1>
        </header>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Theme Mode</h3>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setThemeMode("light")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  themeMode === "light"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="button-theme-light"
              >
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Sun className="text-amber-500" size={24} />
                </div>
                <span className="font-medium">Light</span>
                {themeMode === "light" && (
                  <Check className="text-primary" size={16} />
                )}
              </button>
              <button
                onClick={() => setThemeMode("dark")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  themeMode === "dark"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid="button-theme-dark"
              >
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <Moon className="text-slate-300" size={24} />
                </div>
                <span className="font-medium">Dark</span>
                {themeMode === "dark" && (
                  <Check className="text-primary" size={16} />
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Color Theme</h3>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {COLOR_THEMES.map((theme) => {
                const isActive = colorTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id)}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-color-${theme.id}`}
                  >
                    {isActive && (
                      <Check className="text-primary absolute top-2 right-2" size={14} />
                    )}
                    <div
                      className="h-14 w-full rounded-lg shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[0]} 50%, ${theme.colors[1]} 50%, ${theme.colors[1]} 100%)`,
                      }}
                    />
                    <span className="text-sm font-medium text-center leading-tight">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium gap-2"
          data-testid="button-save-appearance"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Appearance"}
        </Button>
      </div>
    </Layout>
  );
}
