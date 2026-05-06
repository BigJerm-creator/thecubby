import { useRef, useState } from "react";
import Layout from "@/components/layout";
import { ArrowLeft, Sun, Moon, Check, Save, Sparkles, X, Upload, Trash2, ImagePlus } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTheme, type ThemeMode, type ColorTheme, type Background } from "@/lib/ThemeContext";
import christmasWallpaper1 from '@assets/generated_images/christmas_themed_wallpaper.png';
import christmasWallpaper2 from '@assets/generated_images/christmas_fireplace_wallpaper.png';
import christmasWallpaper3 from '@assets/generated_images/christmas_gold_ornaments_wallpaper.png';
import christmasWallpaper4 from '@assets/generated_images/nordic_christmas_wallpaper.png';
import christmasWallpaper5 from '@assets/generated_images/christmas_night_sky_wallpaper.png';
import halloweenWallpaper1 from '@assets/generated_images/halloween_themed_wallpaper.png';
import halloweenWallpaper2 from '@assets/generated_images/halloween_haunted_house_wallpaper.png';
import halloweenWallpaper3 from '@assets/generated_images/halloween_pumpkin_patch_wallpaper.png';
import halloweenWallpaper4 from '@assets/generated_images/halloween_forest_wallpaper.png';
import halloweenWallpaper5 from '@assets/generated_images/halloween_witch_cauldron_wallpaper.png';
import thanksgivingWallpaper1 from '@assets/generated_images/thanksgiving_themed_wallpaper.png';
import thanksgivingWallpaper2 from '@assets/generated_images/thanksgiving_harvest_wallpaper.png';
import thanksgivingWallpaper3 from '@assets/generated_images/thanksgiving_autumn_path_wallpaper.png';
import thanksgivingWallpaper4 from '@assets/generated_images/thanksgiving_pumpkins_wallpaper.png';
import thanksgivingWallpaper5 from '@assets/generated_images/thanksgiving_cabin_wallpaper.png';
import easterWallpaper1 from '@assets/generated_images/easter_themed_wallpaper.png';
import easterWallpaper2 from '@assets/generated_images/easter_garden_wallpaper.png';
import easterWallpaper3 from '@assets/generated_images/easter_basket_wallpaper.png';
import easterWallpaper4 from '@assets/generated_images/easter_meadow_wallpaper.png';
import easterWallpaper5 from '@assets/generated_images/easter_sunrise_wallpaper.png';
import valentinesWallpaper1 from '@assets/generated_images/valentine_themed_wallpaper.png';
import valentinesWallpaper2 from '@assets/generated_images/valentine_roses_wallpaper.png';
import valentinesWallpaper3 from '@assets/generated_images/valentine_candy_hearts_wallpaper.png';
import valentinesWallpaper4 from '@assets/generated_images/valentine_paris_wallpaper.png';
import valentinesWallpaper5 from '@assets/generated_images/valentine_love_letters_wallpaper.png';
import summerWallpaper1 from '@assets/generated_images/summer_themed_wallpaper.png';
import summerWallpaper2 from '@assets/generated_images/summer_beach_sunset_wallpaper.png';
import summerWallpaper3 from '@assets/generated_images/summer_tropical_paradise_wallpaper.png';
import summerWallpaper4 from '@assets/generated_images/summer_poolside_wallpaper.png';
import summerWallpaper5 from '@assets/generated_images/summer_ice_cream_wallpaper.png';

const COLOR_THEMES: { id: ColorTheme; label: string; colors: string[] }[] = [
  { id: "farmhouse", label: "Modern Farmhouse", colors: ["#5D7052", "#E8E4DB"] },
  { id: "ocean", label: "Ocean Breeze", colors: ["#1A8FBC", "#A8D5E5"] },
  { id: "sunset", label: "Sunset Glow", colors: ["#E85D32", "#FFCA7A"] },
  { id: "forest", label: "Forest", colors: ["#2D5A3D", "#B5D4A3"] },
  { id: "lavender", label: "Lavender Dream", colors: ["#8B5DC8", "#DCC8F0"] },
  { id: "midnight", label: "Midnight", colors: ["#4A5899", "#9AA8D4"] },
];

const WALLPAPER_CATEGORIES = [
  { 
    category: "Christmas", 
    emoji: "🎄",
    wallpapers: [
      { id: "christmas-1" as Background, image: christmasWallpaper1 },
      { id: "christmas-2" as Background, image: christmasWallpaper2 },
      { id: "christmas-3" as Background, image: christmasWallpaper3 },
      { id: "christmas-4" as Background, image: christmasWallpaper4 },
      { id: "christmas-5" as Background, image: christmasWallpaper5 },
    ]
  },
  { 
    category: "Halloween", 
    emoji: "🎃",
    wallpapers: [
      { id: "halloween-1" as Background, image: halloweenWallpaper1 },
      { id: "halloween-2" as Background, image: halloweenWallpaper2 },
      { id: "halloween-3" as Background, image: halloweenWallpaper3 },
      { id: "halloween-4" as Background, image: halloweenWallpaper4 },
      { id: "halloween-5" as Background, image: halloweenWallpaper5 },
    ]
  },
  { 
    category: "Thanksgiving", 
    emoji: "🦃",
    wallpapers: [
      { id: "thanksgiving-1" as Background, image: thanksgivingWallpaper1 },
      { id: "thanksgiving-2" as Background, image: thanksgivingWallpaper2 },
      { id: "thanksgiving-3" as Background, image: thanksgivingWallpaper3 },
      { id: "thanksgiving-4" as Background, image: thanksgivingWallpaper4 },
      { id: "thanksgiving-5" as Background, image: thanksgivingWallpaper5 },
    ]
  },
  { 
    category: "Easter", 
    emoji: "🐣",
    wallpapers: [
      { id: "easter-1" as Background, image: easterWallpaper1 },
      { id: "easter-2" as Background, image: easterWallpaper2 },
      { id: "easter-3" as Background, image: easterWallpaper3 },
      { id: "easter-4" as Background, image: easterWallpaper4 },
      { id: "easter-5" as Background, image: easterWallpaper5 },
    ]
  },
  { 
    category: "Valentine's", 
    emoji: "💕",
    wallpapers: [
      { id: "valentines-1" as Background, image: valentinesWallpaper1 },
      { id: "valentines-2" as Background, image: valentinesWallpaper2 },
      { id: "valentines-3" as Background, image: valentinesWallpaper3 },
      { id: "valentines-4" as Background, image: valentinesWallpaper4 },
      { id: "valentines-5" as Background, image: valentinesWallpaper5 },
    ]
  },
  { 
    category: "Summer", 
    emoji: "☀️",
    wallpapers: [
      { id: "summer-1" as Background, image: summerWallpaper1 },
      { id: "summer-2" as Background, image: summerWallpaper2 },
      { id: "summer-3" as Background, image: summerWallpaper3 },
      { id: "summer-4" as Background, image: summerWallpaper4 },
      { id: "summer-5" as Background, image: summerWallpaper5 },
    ]
  },
];

export default function Appearance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    themeMode,
    colorTheme,
    background,
    setThemeMode,
    setColorTheme,
    setBackground,
    customBackground,
    setCustomBackground,
    wallpaperOpacity,
    setWallpaperOpacity,
    overlayOpacity,
    setOverlayOpacity,
    foregroundOpacity,
    setForegroundOpacity,
    saveSettings,
    isLoading,
  } = useTheme();

  const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "Image too large",
        description: "Please choose an image under 4 MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      const ok = setCustomBackground(dataUrl);
      if (!ok) {
        toast({
          title: "Couldn't save image",
          description: "The image is too large for your browser's storage. Try a smaller one.",
          variant: "destructive",
        });
        return;
      }
      setBackground("custom");
      toast({
        title: "Background uploaded",
        description: "Tap Save to keep your new wallpaper.",
      });
    };
    reader.onerror = () => {
      toast({
        title: "Couldn't read image",
        description: "Try a different file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustom = () => {
    setCustomBackground(null);
    if (background === "custom") setBackground("none");
  };

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
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    colorTheme === theme.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`button-color-${theme.id}`}
                >
                  <div className="flex gap-1">
                    {theme.colors.map((color, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border border-white/50"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">{theme.label}</span>
                  {colorTheme === theme.id && (
                    <Check className="text-primary" size={16} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Sparkles size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Wallpapers</h3>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-4 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Wallpaper brightness</label>
                <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-wallpaper-opacity">
                  {wallpaperOpacity}%
                </span>
              </div>
              <Slider
                value={[wallpaperOpacity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setWallpaperOpacity(v[0] ?? 0)}
                data-testid="slider-wallpaper-opacity"
              />
              <p className="text-[11px] text-muted-foreground">How vivid the wallpaper appears.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Background overlay</label>
                <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-overlay-opacity">
                  {overlayOpacity}%
                </span>
              </div>
              <Slider
                value={[overlayOpacity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setOverlayOpacity(v[0] ?? 0)}
                data-testid="slider-overlay-opacity"
              />
              <p className="text-[11px] text-muted-foreground">Tints the wallpaper to improve readability.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Content opacity</label>
                <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-foreground-opacity">
                  {foregroundOpacity}%
                </span>
              </div>
              <Slider
                value={[foregroundOpacity]}
                min={10}
                max={100}
                step={1}
                onValueChange={(v) => setForegroundOpacity(v[0] ?? 100)}
                data-testid="slider-foreground-opacity"
              />
              <p className="text-[11px] text-muted-foreground">Fade cards, text, and the nav bar over your wallpaper.</p>
            </div>
          </div>

          <button
            onClick={() => setBackground("none")}
            className={`w-full bg-card border rounded-2xl p-4 flex items-center gap-3 transition-all ${
              background === "none"
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            }`}
            data-testid="button-bg-none"
          >
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <X className="text-muted-foreground" size={20} />
            </div>
            <span className="font-medium">No Wallpaper</span>
            {background === "none" && (
              <Check className="text-primary ml-auto" size={18} />
            )}
          </button>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ImagePlus size={16} className="text-muted-foreground" />
              <h4 className="font-medium text-sm">Your Wallpaper</h4>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-custom-background"
            />

            {customBackground ? (
              <div className="space-y-3">
                <button
                  onClick={() => setBackground("custom")}
                  className={`relative w-full aspect-[16/9] rounded-xl overflow-hidden border-2 transition-all ${
                    background === "custom"
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid="button-bg-custom"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url("${customBackground}")` }}
                  />
                  {background === "custom" && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check size={12} />
                    </div>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadClick}
                    className="gap-2"
                    data-testid="button-replace-custom-bg"
                  >
                    <Upload size={16} />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveCustom}
                    className="gap-2 text-destructive hover:text-destructive"
                    data-testid="button-remove-custom-bg"
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
                data-testid="button-upload-custom-bg"
              >
                <Upload size={24} />
                <span className="text-sm font-medium">Upload an image</span>
                <span className="text-[10px]">PNG, JPG up to 4 MB</span>
              </button>
            )}
          </div>

          {WALLPAPER_CATEGORIES.map((cat) => (
            <div key={cat.category} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.emoji}</span>
                <h4 className="font-medium text-sm">{cat.category}</h4>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {cat.wallpapers.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => setBackground(wp.id)}
                    className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${
                      background === wp.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-bg-${wp.id}`}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${wp.image})` }}
                    />
                    {background === wp.id && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check size={10} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
