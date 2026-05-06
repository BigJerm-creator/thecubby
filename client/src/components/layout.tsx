import React from 'react';
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";
import { getIconStyleConfig } from "./StyledIcon";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);

  const navItems = [
    { emoji: "🏠", label: "Home", path: "/" },
    { emoji: "🍳", label: "Kitchen", path: "/kitchen" },
    { emoji: "📷", label: "Scan", path: "/scan", isPrimary: true },
    { emoji: "🔍", label: "Search", path: "/search" },
    { emoji: "⚙️", label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full md:max-w-md md:mx-auto bg-background md:shadow-2xl relative overflow-hidden md:my-4 md:rounded-[3rem] md:border-4 md:border-stone-900/5">
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-300 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'var(--holiday-background, none)',
          opacity: 'var(--wallpaper-opacity, 0.7)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-background transition-opacity duration-300"
        style={{ opacity: 'var(--wallpaper-overlay-opacity, 0)' }}
      />

      <main
        className="flex-1 overflow-y-auto pb-24 px-4 pt-6 scrollbar-hide relative z-10"
        style={{ opacity: 'var(--foreground-opacity, 1)' }}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 w-full md:absolute"
        style={{ opacity: 'var(--foreground-opacity, 1)' }}
      >
        <div className="bg-card/90 backdrop-blur-lg border-t border-border w-full md:max-w-md md:mx-auto pb-6 pt-3 px-2 flex justify-around items-end">
          {navItems.map((item) => {
            const isActive = location === item.path;
            
            if (item.isPrimary) {
               return (
                <Link key={item.path} href={item.path}>
                  <div className="relative -top-5 group cursor-pointer">
                    <div className={cn("absolute inset-0 bg-primary/20 blur-md group-hover:bg-primary/30 transition-all", styleConfig.containerClass)} />
                    <div className={cn("bg-primary h-14 w-14 flex items-center justify-center shadow-lg transform transition-transform group-active:scale-95 border-4 border-background", styleConfig.containerClass)}>
                      <span className="text-2xl">{item.emoji}</span>
                    </div>
                  </div>
                </Link>
               )
            }

            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-colors cursor-pointer",
                  styleConfig.containerClass,
                  isActive ? "opacity-100" : "opacity-60 hover:opacity-80"
                )}>
                  <span className={cn("text-xl", isActive && "scale-110")}>{item.emoji}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
