import React from 'react';
import { useLocation, Link } from "wouter";
import { Home, Search, ScanLine, Settings, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: UtensilsCrossed, label: "Kitchen", path: "/kitchen" },
    { icon: ScanLine, label: "Scan", path: "/scan", isPrimary: true },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col w-full md:max-w-md md:mx-auto bg-background md:shadow-2xl relative overflow-hidden md:my-4 md:rounded-[3rem] md:border-4 md:border-stone-900/5">
      <div 
        className="absolute inset-0 pointer-events-none z-0 transition-all duration-300"
        style={{ backgroundImage: 'var(--holiday-background, none)' }}
      />
      {/* Top Status Bar Decoration (Simulated - only visible on desktop/preview) */}
      <div className="h-1 bg-primary w-full absolute top-0 z-50 opacity-50 md:hidden" />

      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 scrollbar-hide relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 w-full md:absolute">
        <div className="bg-card/80 backdrop-blur-lg border-t border-border w-full md:max-w-md md:mx-auto pb-6 pt-3 px-2 flex justify-around items-end">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            if (item.isPrimary) {
               return (
                <Link key={item.path} href={item.path}>
                  <div className="relative -top-5 group cursor-pointer">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-all" />
                    <div className="bg-primary text-primary-foreground h-14 w-14 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-active:scale-95 border-4 border-background">
                      <Icon size={24} />
                    </div>
                  </div>
                </Link>
               )
            }

            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
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
