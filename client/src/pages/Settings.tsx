import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleMenuClick = (label: string) => {
    toast({
      title: label,
      description: `Opening ${label} settings...`
    });
  };

  const handleSignOut = () => {
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully."
    });
    setLocation("/");
  };

  return (
    <Layout>
      <div className="space-y-6 pt-4">
        <header>
          <h1 className="text-3xl font-serif text-foreground">Settings</h1>
        </header>

        <button 
          onClick={() => setLocation("/profile")}
          className="w-full bg-card border border-border rounded-2xl overflow-hidden"
          data-testid="button-profile"
        >
          <div className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-foreground">My Profile</h3>
              <p className="text-xs text-muted-foreground">Personal info & dietary preferences</p>
            </div>
            <span className="text-muted-foreground">›</span>
          </div>
        </button>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Preferences</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
            <button 
              onClick={() => handleMenuClick("Notifications")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              data-testid="button-settings-notifications"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <span className="text-foreground">Notifications</span>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
            <button 
              onClick={() => setLocation("/appearance")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              data-testid="button-settings-appearance"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🎨</span>
                <span className="text-foreground">Appearance</span>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
            <button 
              onClick={() => handleMenuClick("Privacy & Security")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              data-testid="button-settings-privacy-security"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔒</span>
                <span className="text-foreground">Privacy & Security</span>
              </div>
              <span className="text-muted-foreground">›</span>
            </button>
          </div>

          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 mt-6">Support</h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/50">
             <button 
               onClick={() => handleMenuClick("Help & FAQ")}
               className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
               data-testid="button-settings-help-faq"
             >
                <div className="flex items-center gap-3">
                  <span className="text-lg">❓</span>
                  <span className="text-foreground">Help & FAQ</span>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
          </div>
          
           <button 
             onClick={handleSignOut}
             className="w-full flex items-center justify-center gap-2 p-4 text-destructive hover:bg-destructive/5 rounded-2xl transition-colors mt-6 font-medium"
             data-testid="button-sign-out"
           >
              <span className="text-lg">🚪</span>
              Sign Out
           </button>
        </div>
      </div>
    </Layout>
  );
}
