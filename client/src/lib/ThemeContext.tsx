import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type IconStyle = 'default' | 'rounded' | 'sharp' | 'playful';
export type ColorTheme = 'farmhouse' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'midnight';
export type Background = 'none' | 'christmas' | 'halloween' | 'thanksgiving' | 'easter' | 'valentines' | 'summer';

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

const BACKGROUNDS: Record<Background, string> = {
  none: '',
  christmas: 'linear-gradient(135deg, rgba(255,0,0,0.05) 0%, rgba(0,128,0,0.05) 100%)',
  halloween: 'linear-gradient(135deg, rgba(255,140,0,0.08) 0%, rgba(75,0,130,0.05) 100%)',
  thanksgiving: 'linear-gradient(135deg, rgba(210,105,30,0.06) 0%, rgba(184,134,11,0.05) 100%)',
  easter: 'linear-gradient(135deg, rgba(255,182,193,0.08) 0%, rgba(173,216,230,0.08) 100%)',
  valentines: 'linear-gradient(135deg, rgba(255,105,180,0.08) 0%, rgba(255,182,193,0.06) 100%)',
  summer: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(0,191,255,0.06) 100%)',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [iconStyle, setIconStyleState] = useState<IconStyle>('default');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('farmhouse');
  const [background, setBackgroundState] = useState<Background>('none');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    
    const bg = BACKGROUNDS[background];
    if (bg) {
      document.body.style.backgroundImage = bg;
    } else {
      document.body.style.backgroundImage = '';
    }
    
    root.setAttribute('data-icon-style', iconStyle);
  }, [themeMode, colorTheme, background, iconStyle]);

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
