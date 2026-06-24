import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  User, Bell, Palette, Shield, HelpCircle, LogOut, ChevronRight,
} from "lucide-react";

const PREF_ITEMS = [
  { icon: Bell, label: "Notifications", path: "/notifications", testId: "button-settings-notifications" },
  { icon: Palette, label: "Appearance", path: "/appearance", testId: "button-settings-appearance" },
  { icon: Shield, label: "Privacy & Security", path: "/privacy-security", testId: "button-settings-privacy-security" },
] as const;

export default function Settings() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <Layout>
      <div className="space-y-6 pt-4 pb-8">
        <header>
          <h1 className="text-3xl font-serif text-foreground">Settings</h1>
        </header>

        {/* Profile row */}
        <button
          onClick={() => setLocation("/profile")}
          className="w-full bg-card border border-border rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
          data-testid="button-profile"
        >
          <div className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center">
              <User size={22} className="text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-foreground">My Profile</h3>
              <p className="text-xs text-muted-foreground">Personal info & dietary preferences</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </button>

        {/* Preferences */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Preferences
          </h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            {PREF_ITEMS.map(({ icon: Icon, label, path, testId }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left"
                data-testid={testId}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-foreground">{label}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Support
          </h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left"
              data-testid="button-settings-help-faq"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-muted-foreground" strokeWidth={1.5} />
                <span className="text-foreground">Help & FAQ</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 p-4 text-destructive hover:bg-destructive/5 active:bg-destructive/10 rounded-2xl transition-colors font-medium border border-destructive/20"
          data-testid="button-sign-out"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </Layout>
  );
}
