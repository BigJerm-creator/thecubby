import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export type ThemeMode = 'light' | 'dark';
export type IconStyle = 'default' | 'rounded' | 'sharp' | 'playful';
export type ColorTheme = 'farmhouse' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'midnight';
export type Background = 'none' | 'custom' | 'christmas-1' | 'christmas-2' | 'christmas-3' | 'christmas-4' | 'christmas-5' | 'halloween-1' | 'halloween-2' | 'halloween-3' | 'halloween-4' | 'halloween-5' | 'thanksgiving-1' | 'thanksgiving-2' | 'thanksgiving-3' | 'thanksgiving-4' | 'thanksgiving-5' | 'easter-1' | 'easter-2' | 'easter-3' | 'easter-4' | 'easter-5' | 'valentines-1' | 'valentines-2' | 'valentines-3' | 'valentines-4' | 'valentines-5' | 'summer-1' | 'summer-2' | 'summer-3' | 'summer-4' | 'summer-5';

const CUSTOM_BG_KEY = 'cubby_custom_background';
const WALLPAPER_OPACITY_KEY = 'cubby_wallpaper_opacity';
const OVERLAY_OPACITY_KEY = 'cubby_overlay_opacity';
const DEFAULT_WALLPAPER_OPACITY = 70;
const DEFAULT_OVERLAY_OPACITY = 0;

interface ThemeSettings {
  themeMode: ThemeMode;
  iconStyle: IconStyle;
  colorTheme: ColorTheme;
  background: Background;
}

interface ThemeContextType extends ThemeSettings {
  setThemeMode: (mode: ThemeMode) => void;
  setIconStyle: (style: IconStyle) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setBackground: (bg: Background) => void;
  customBackground: string | null;
  setCustomBackground: (dataUrl: string | null) => boolean;
  wallpaperOpacity: number;
  setWallpaperOpacity: (value: number) => void;
  overlayOpacity: number;
  setOverlayOpacity: (value: number) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_THEMES: Record<ColorTheme, { primary: string; accent: string }> = {
  farmhouse: { primary: '142 35% 45%', accent: '36 33% 85%' },
  ocean: { primary: '200 74% 40%', accent: '195 53% 79%' },
  sunset: { primary: '20 84% 55%', accent: '35 91% 75%' },
  forest: { primary: '150 45% 35%', accent: '120 25% 75%' },
  lavender: { primary: '270 50% 55%', accent: '280 40% 85%' },
  midnight: { primary: '230 50% 45%', accent: '220 40% 70%' },
};

const BACKGROUNDS: Record<Exclude<Background, 'custom'>, string> = {
  none: '',
  'christmas-1': christmasWallpaper1,
  'christmas-2': christmasWallpaper2,
  'christmas-3': christmasWallpaper3,
  'christmas-4': christmasWallpaper4,
  'christmas-5': christmasWallpaper5,
  'halloween-1': halloweenWallpaper1,
  'halloween-2': halloweenWallpaper2,
  'halloween-3': halloweenWallpaper3,
  'halloween-4': halloweenWallpaper4,
  'halloween-5': halloweenWallpaper5,
  'thanksgiving-1': thanksgivingWallpaper1,
  'thanksgiving-2': thanksgivingWallpaper2,
  'thanksgiving-3': thanksgivingWallpaper3,
  'thanksgiving-4': thanksgivingWallpaper4,
  'thanksgiving-5': thanksgivingWallpaper5,
  'easter-1': easterWallpaper1,
  'easter-2': easterWallpaper2,
  'easter-3': easterWallpaper3,
  'easter-4': easterWallpaper4,
  'easter-5': easterWallpaper5,
  'valentines-1': valentinesWallpaper1,
  'valentines-2': valentinesWallpaper2,
  'valentines-3': valentinesWallpaper3,
  'valentines-4': valentinesWallpaper4,
  'valentines-5': valentinesWallpaper5,
  'summer-1': summerWallpaper1,
  'summer-2': summerWallpaper2,
  'summer-3': summerWallpaper3,
  'summer-4': summerWallpaper4,
  'summer-5': summerWallpaper5,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [iconStyle, setIconStyleState] = useState<IconStyle>('default');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('farmhouse');
  const [background, setBackgroundState] = useState<Background>('none');
  const [customBackground, setCustomBackgroundState] = useState<string | null>(null);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(DEFAULT_WALLPAPER_OPACITY);
  const [overlayOpacity, setOverlayOpacityState] = useState<number>(DEFAULT_OVERLAY_OPACITY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_BG_KEY);
      if (stored) setCustomBackgroundState(stored);
      const wp = localStorage.getItem(WALLPAPER_OPACITY_KEY);
      if (wp !== null) {
        const n = Number(wp);
        if (Number.isFinite(n)) setWallpaperOpacityState(Math.max(0, Math.min(100, n)));
      }
      const ov = localStorage.getItem(OVERLAY_OPACITY_KEY);
      if (ov !== null) {
        const n = Number(ov);
        if (Number.isFinite(n)) setOverlayOpacityState(Math.max(0, Math.min(100, n)));
      }
    } catch {}

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setThemeModeState((data.themeMode as ThemeMode) || 'light');
          setIconStyleState((data.iconStyle as IconStyle) || 'default');
          setColorThemeState((data.colorTheme as ColorTheme) || 'farmhouse');
          setBackgroundState((data.background as Background) || 'none');
        }
      })
      .catch(err => console.error('Failed to load theme settings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    const colors = COLOR_THEMES[colorTheme];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    
    let bgUrl = '';
    if (background === 'custom') {
      bgUrl = customBackground || '';
      if (!bgUrl && !isLoading) {
        setBackgroundState('none');
      }
    } else {
      bgUrl = BACKGROUNDS[background] || '';
    }
    const safeUrl = bgUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    root.style.setProperty('--holiday-background', bgUrl ? `url("${safeUrl}")` : 'none');
    root.style.setProperty('--wallpaper-opacity', String(wallpaperOpacity / 100));
    root.style.setProperty('--wallpaper-overlay-opacity', String(overlayOpacity / 100));

    root.setAttribute('data-icon-style', iconStyle);
  }, [themeMode, colorTheme, background, iconStyle, customBackground, isLoading, wallpaperOpacity, overlayOpacity]);

  const setWallpaperOpacity = (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setWallpaperOpacityState(clamped);
    try { localStorage.setItem(WALLPAPER_OPACITY_KEY, String(clamped)); } catch {}
  };

  const setOverlayOpacity = (value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setOverlayOpacityState(clamped);
    try { localStorage.setItem(OVERLAY_OPACITY_KEY, String(clamped)); } catch {}
  };

  const setCustomBackground = (dataUrl: string | null): boolean => {
    try {
      if (dataUrl) localStorage.setItem(CUSTOM_BG_KEY, dataUrl);
      else localStorage.removeItem(CUSTOM_BG_KEY);
      setCustomBackgroundState(dataUrl);
      return true;
    } catch (e) {
      console.error('Failed to persist custom background', e);
      return false;
    }
  };

  const saveSettings = async () => {
    const currentProfile = await fetch('/api/profile').then(res => res.json()) || {};
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...currentProfile,
        themeMode,
        iconStyle,
        colorTheme,
        background,
      }),
    });
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setIconStyle = (style: IconStyle) => {
    setIconStyleState(style);
  };

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const setBackground = (bg: Background) => {
    setBackgroundState(bg);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        iconStyle,
        colorTheme,
        background,
        setThemeMode,
        setIconStyle,
        setColorTheme,
        setBackground,
        customBackground,
        setCustomBackground,
        wallpaperOpacity,
        setWallpaperOpacity,
        overlayOpacity,
        setOverlayOpacity,
        saveSettings,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
