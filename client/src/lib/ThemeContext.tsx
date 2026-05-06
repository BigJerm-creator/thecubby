import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type IconStyle = 'default' | 'rounded' | 'sharp' | 'playful';
export type ColorTheme =
  | 'farmhouse'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'lavender'
  | 'midnight'
  | 'rose'
  | 'mint'
  | 'amber'
  | 'slate'
  | 'berry'
  | 'sky';

interface ThemeSettings {
  themeMode: ThemeMode;
  iconStyle: IconStyle;
  colorTheme: ColorTheme;
}

interface ThemeContextType extends ThemeSettings {
  setThemeMode: (mode: ThemeMode) => void;
  setIconStyle: (style: IconStyle) => void;
  setColorTheme: (theme: ColorTheme) => void;
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
  rose: { primary: '340 70% 55%', accent: '350 60% 85%' },
  mint: { primary: '165 55% 42%', accent: '160 45% 80%' },
  amber: { primary: '38 90% 50%', accent: '45 90% 80%' },
  slate: { primary: '215 20% 40%', accent: '210 20% 80%' },
  berry: { primary: '300 45% 40%', accent: '310 40% 80%' },
  sky: { primary: '205 85% 55%', accent: '200 80% 85%' },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [iconStyle, setIconStyleState] = useState<IconStyle>('default');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('farmhouse');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setThemeModeState((data.themeMode as ThemeMode) || 'light');
          setIconStyleState((data.iconStyle as IconStyle) || 'default');
          if (data.colorTheme && data.colorTheme in COLOR_THEMES) {
            setColorThemeState(data.colorTheme as ColorTheme);
          }
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

    root.setAttribute('data-icon-style', iconStyle);
  }, [themeMode, colorTheme, iconStyle]);

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
      }),
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        iconStyle,
        colorTheme,
        setThemeMode: setThemeModeState,
        setIconStyle: setIconStyleState,
        setColorTheme: setColorThemeState,
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
