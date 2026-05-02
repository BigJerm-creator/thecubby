import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Save,
  Volume2,
  Vibrate,
  CircleDot,
  Moon,
  Calendar,
  ShoppingCart,
  ChefHat,
  Sparkles,
  AlertTriangle,
  PackageMinus,
  Mail,
  Loader2,
} from "lucide-react";

type LeadTime = "1" | "3" | "7" | "14";
type Preview = "always" | "unlocked" | "never";

interface NotificationSettings {
  enabled: boolean;
  expirationAlerts: boolean;
  expirationLeadDays: LeadTime;
  lowStockAlerts: boolean;
  shoppingListReminders: boolean;
  mealPlanReminders: boolean;
  recipeSuggestions: boolean;
  weeklySummary: boolean;
  sound: boolean;
  vibration: boolean;
  appBadge: boolean;
  preview: Preview;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const STORAGE_KEY = "cubby_notification_settings";

const DEFAULTS: NotificationSettings = {
  enabled: true,
  expirationAlerts: true,
  expirationLeadDays: "3",
  lowStockAlerts: true,
  shoppingListReminders: true,
  mealPlanReminders: true,
  recipeSuggestions: false,
  weeklySummary: true,
  sound: true,
  vibration: true,
  appBadge: true,
  preview: "always",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

const VALID_LEAD_TIMES: LeadTime[] = ["1", "3", "7", "14"];
const VALID_PREVIEWS: Preview[] = ["always", "unlocked", "never"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitize(parsed: any): NotificationSettings {
  const s = { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : DEFAULTS.enabled,
    expirationAlerts: typeof s.expirationAlerts === "boolean" ? s.expirationAlerts : DEFAULTS.expirationAlerts,
    expirationLeadDays: VALID_LEAD_TIMES.includes(s.expirationLeadDays) ? s.expirationLeadDays : DEFAULTS.expirationLeadDays,
    lowStockAlerts: typeof s.lowStockAlerts === "boolean" ? s.lowStockAlerts : DEFAULTS.lowStockAlerts,
    shoppingListReminders: typeof s.shoppingListReminders === "boolean" ? s.shoppingListReminders : DEFAULTS.shoppingListReminders,
    mealPlanReminders: typeof s.mealPlanReminders === "boolean" ? s.mealPlanReminders : DEFAULTS.mealPlanReminders,
    recipeSuggestions: typeof s.recipeSuggestions === "boolean" ? s.recipeSuggestions : DEFAULTS.recipeSuggestions,
    weeklySummary: typeof s.weeklySummary === "boolean" ? s.weeklySummary : DEFAULTS.weeklySummary,
    sound: typeof s.sound === "boolean" ? s.sound : DEFAULTS.sound,
    vibration: typeof s.vibration === "boolean" ? s.vibration : DEFAULTS.vibration,
    appBadge: typeof s.appBadge === "boolean" ? s.appBadge : DEFAULTS.appBadge,
    preview: VALID_PREVIEWS.includes(s.preview) ? s.preview : DEFAULTS.preview,
    quietHoursEnabled: typeof s.quietHoursEnabled === "boolean" ? s.quietHoursEnabled : DEFAULTS.quietHoursEnabled,
    quietHoursStart: typeof s.quietHoursStart === "string" && TIME_RE.test(s.quietHoursStart) ? s.quietHoursStart : DEFAULTS.quietHoursStart,
    quietHoursEnd: typeof s.quietHoursEnd === "string" && TIME_RE.test(s.quietHoursEnd) ? s.quietHoursEnd : DEFAULTS.quietHoursEnd,
  };
}

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

interface RowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
  disabled?: boolean;
}

function ToggleRow({ icon, title, description, checked, onChange, testId, disabled }: RowProps) {
  const labelId = `${testId}-label`;
  return (
    <div className={`flex items-center gap-3 p-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p id={labelId} className="font-medium text-foreground text-sm">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-label={title}
        data-testid={testId}
      />
    </div>
  );
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULTS);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleRequestPermission = async () => {
    if (permission === "unsupported") {
      toast({
        title: "Not supported",
        description: "Notifications aren't available in this browser.",
        variant: "destructive",
      });
      return;
    }
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        toast({ title: "Notifications enabled", description: "You'll now receive alerts from The Cubby." });
      } else if (result === "denied") {
        toast({
          title: "Permission denied",
          description: "Enable notifications in your device settings to receive alerts.",
          variant: "destructive",
        });
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({ title: "Notifications Saved", description: "Your notification preferences have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save notification settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const allDisabled = !settings.enabled;

  const permissionBadge = () => {
    if (permission === "granted") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
          Allowed
        </span>
      );
    }
    if (permission === "denied") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
          Blocked
        </span>
      );
    }
    if (permission === "unsupported") {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
          Unsupported
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
        Not Set
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 pt-4 pb-8">
        <header className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/settings")}
            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Back to settings"
            data-testid="button-back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-serif text-foreground">Notifications</h1>
        </header>

        <section className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {settings.enabled ? (
                <Bell className="text-primary" size={22} />
              ) : (
                <BellOff className="text-muted-foreground" size={22} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-foreground">System Permission</p>
                {permissionBadge()}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {permission === "granted"
                  ? "The Cubby can send notifications to your device."
                  : permission === "denied"
                  ? "Update your device settings to allow notifications."
                  : permission === "unsupported"
                  ? "Notifications aren't supported in this environment."
                  : "Tap below to allow notifications from The Cubby."}
              </p>
            </div>
          </div>
          {permission !== "granted" && permission !== "unsupported" && (
            <Button
              onClick={handleRequestPermission}
              disabled={requesting || permission === "denied"}
              variant="outline"
              className="w-full gap-2"
              data-testid="button-request-permission"
            >
              {requesting ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
              {permission === "denied" ? "Blocked – open device settings" : "Allow Notifications"}
            </Button>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Master Control
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<Bell size={18} className="text-primary" />}
              title="Allow Notifications"
              description="Master switch for all alerts from The Cubby"
              checked={settings.enabled}
              onChange={(v) => update("enabled", v)}
              testId="switch-enabled"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Alerts
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<AlertTriangle size={18} className="text-amber-600" />}
              title="Expiration Alerts"
              description="Get notified before food expires"
              checked={settings.expirationAlerts}
              onChange={(v) => update("expirationAlerts", v)}
              testId="switch-expiration-alerts"
              disabled={allDisabled}
            />
            {settings.expirationAlerts && !allDisabled && (
              <div className="flex items-center justify-between p-4 pl-16">
                <div>
                  <p className="text-sm font-medium text-foreground">Remind me</p>
                  <p className="text-xs text-muted-foreground">Days before expiration</p>
                </div>
                <Select
                  value={settings.expirationLeadDays}
                  onValueChange={(v) => update("expirationLeadDays", v as LeadTime)}
                >
                  <SelectTrigger className="w-32" data-testid="select-lead-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <ToggleRow
              icon={<PackageMinus size={18} className="text-orange-600" />}
              title="Low Stock Alerts"
              description="When pantry items are running low"
              checked={settings.lowStockAlerts}
              onChange={(v) => update("lowStockAlerts", v)}
              testId="switch-low-stock"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<ShoppingCart size={18} className="text-purple-600" />}
              title="Shopping List Reminders"
              description="Reminders when you're near the store"
              checked={settings.shoppingListReminders}
              onChange={(v) => update("shoppingListReminders", v)}
              testId="switch-shopping-reminders"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<ChefHat size={18} className="text-rose-600" />}
              title="Meal Plan Reminders"
              description="Daily reminders of what's planned"
              checked={settings.mealPlanReminders}
              onChange={(v) => update("mealPlanReminders", v)}
              testId="switch-meal-plan-reminders"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<Sparkles size={18} className="text-blue-600" />}
              title="Recipe Suggestions"
              description="AI-powered ideas based on your pantry"
              checked={settings.recipeSuggestions}
              onChange={(v) => update("recipeSuggestions", v)}
              testId="switch-recipe-suggestions"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<Mail size={18} className="text-teal-600" />}
              title="Weekly Summary"
              description="A recap of your week every Sunday"
              checked={settings.weeklySummary}
              onChange={(v) => update("weeklySummary", v)}
              testId="switch-weekly-summary"
              disabled={allDisabled}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Sounds & Haptics
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<Volume2 size={18} className="text-foreground" />}
              title="Sound"
              description="Play a sound for new notifications"
              checked={settings.sound}
              onChange={(v) => update("sound", v)}
              testId="switch-sound"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<Vibrate size={18} className="text-foreground" />}
              title="Vibration"
              description="Vibrate when notifications arrive"
              checked={settings.vibration}
              onChange={(v) => update("vibration", v)}
              testId="switch-vibration"
              disabled={allDisabled}
            />
            <ToggleRow
              icon={<CircleDot size={18} className="text-foreground" />}
              title="App Badge"
              description="Show unread count on the app icon"
              checked={settings.appBadge}
              onChange={(v) => update("appBadge", v)}
              testId="switch-app-badge"
              disabled={allDisabled}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Lock Screen Preview
          </h3>
          <div className="bg-card border border-border rounded-2xl p-4">
            <Select
              value={settings.preview}
              onValueChange={(v) => update("preview", v as Preview)}
              disabled={allDisabled}
            >
              <SelectTrigger className="w-full" data-testid="select-preview">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always Show</SelectItem>
                <SelectItem value="unlocked">When Unlocked</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Controls how notification content appears on your lock screen.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Quiet Hours
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<Moon size={18} className="text-indigo-600" />}
              title="Do Not Disturb"
              description="Silence notifications during set hours"
              checked={settings.quietHoursEnabled}
              onChange={(v) => update("quietHoursEnabled", v)}
              testId="switch-quiet-hours"
              disabled={allDisabled}
            />
            {settings.quietHoursEnabled && !allDisabled && (
              <div className="grid grid-cols-2 gap-3 p-4">
                <div>
                  <label htmlFor="quiet-hours-start" className="text-xs font-medium text-muted-foreground block mb-1.5 ml-1">
                    From
                  </label>
                  <input
                    id="quiet-hours-start"
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => update("quietHoursStart", e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    data-testid="input-quiet-start"
                  />
                </div>
                <div>
                  <label htmlFor="quiet-hours-end" className="text-xs font-medium text-muted-foreground block mb-1.5 ml-1">
                    To
                  </label>
                  <input
                    id="quiet-hours-end"
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => update("quietHoursEnd", e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                    data-testid="input-quiet-end"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium gap-2"
          data-testid="button-save-notifications"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Notifications"}
        </Button>
      </div>
    </Layout>
  );
}
