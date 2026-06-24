import React from 'react';
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/ThemeContext";
import { getIconStyleConfig } from "./StyledIcon";
import { Home, ChefHat, ScanLine, Search, Settings } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { iconStyle } = useTheme();
  const styleConfig = getIconStyleConfig(iconStyle);

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: ChefHat, label: "Kitchen", path: "/kitchen" },
    { icon: ScanLine, label: "Scan", path: "/scan", isPrimary: true },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full md:max-w-md md:mx-auto bg-background md:shadow-2xl relative overflow-hidden md:my-4 md:rounded-[3rem] md:border-4 md:border-stone-900/5">
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 scrollbar-hide">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 w-full md:absolute">
        <div className="bg-card/95 backdrop-blur-lg border-t border-border w-full md:max-w-md md:mx-auto pb-6 pt-3 px-2 flex justify-around items-end">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <Link key={item.path} href={item.path}>
                  <div className="relative -top-5 group cursor-pointer">
                    <div className={cn(
                      "absolute inset-0 bg-primary/20 blur-md group-hover:bg-primary/30 transition-all",
                      styleConfig.containerClass
                    )} />
                    <div className={cn(
                      "bg-primary h-14 w-14 flex items-center justify-center shadow-lg transform transition-transform group-active:scale-95 border-4 border-background",
                      styleConfig.containerClass
                    )}>
                      <Icon size={24} className="text-primary-foreground" strokeWidth={1.75} />
                    </div>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  "flex flex-col items-center gap-1 p-2 transition-all cursor-pointer",
                  isActive ? "opacity-100" : "opacity-50 hover:opacity-75"
                )}>
                  <Icon
                    size={22}
                    className={cn("transition-colors", isActive ? "text-primary" : "text-foreground")}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
