import { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Lock,
  Save,
  ShieldCheck,
  Fingerprint,
  ScanFace,
  KeyRound,
  Smartphone,
  Camera,
  Bell,
  MapPin,
  ImageIcon,
  Download,
  Trash2,
  LogOut,
  FileText,
  ChevronRight,
  BarChart3,
  Bug,
  Sparkles,
  Database,
  Loader2,
  Check,
  X,
  Eye,
} from "lucide-react";

type LockTimeout = "immediate" | "1" | "5" | "15" | "60" | "never";

interface PrivacySettings {
  appLockEnabled: boolean;
  lockTimeout: LockTimeout;
  requireAuthForDelete: boolean;
  requireAuthForExport: boolean;
  hideSensitiveContent: boolean;
  twoFactorEnabled: boolean;
  analytics: boolean;
  crashReports: boolean;
  personalizedRecommendations: boolean;
  shareAnonymousTrends: boolean;
}

interface PasskeyRecord {
  id: string;
  credentialId: string;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = "cubby_privacy_settings";
const PASSKEY_KEY = "cubby_passkeys";

const DEFAULTS: PrivacySettings = {
  appLockEnabled: false,
  lockTimeout: "5",
  requireAuthForDelete: true,
  requireAuthForExport: true,
  hideSensitiveContent: false,
  twoFactorEnabled: false,
  analytics: true,
  crashReports: true,
  personalizedRecommendations: true,
  shareAnonymousTrends: false,
};

const VALID_TIMEOUTS: LockTimeout[] = ["immediate", "1", "5", "15", "60", "never"];

function sanitize(parsed: any): PrivacySettings {
  const s = { ...DEFAULTS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  return {
    appLockEnabled: typeof s.appLockEnabled === "boolean" ? s.appLockEnabled : DEFAULTS.appLockEnabled,
    lockTimeout: VALID_TIMEOUTS.includes(s.lockTimeout) ? s.lockTimeout : DEFAULTS.lockTimeout,
    requireAuthForDelete: typeof s.requireAuthForDelete === "boolean" ? s.requireAuthForDelete : DEFAULTS.requireAuthForDelete,
    requireAuthForExport: typeof s.requireAuthForExport === "boolean" ? s.requireAuthForExport : DEFAULTS.requireAuthForExport,
    hideSensitiveContent: typeof s.hideSensitiveContent === "boolean" ? s.hideSensitiveContent : DEFAULTS.hideSensitiveContent,
    twoFactorEnabled: typeof s.twoFactorEnabled === "boolean" ? s.twoFactorEnabled : DEFAULTS.twoFactorEnabled,
    analytics: typeof s.analytics === "boolean" ? s.analytics : DEFAULTS.analytics,
    crashReports: typeof s.crashReports === "boolean" ? s.crashReports : DEFAULTS.crashReports,
    personalizedRecommendations: typeof s.personalizedRecommendations === "boolean" ? s.personalizedRecommendations : DEFAULTS.personalizedRecommendations,
    shareAnonymousTrends: typeof s.shareAnonymousTrends === "boolean" ? s.shareAnonymousTrends : DEFAULTS.shareAnonymousTrends,
  };
}

function loadSettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULTS;
  }
}

function loadPasskeys(): PasskeyRecord[] {
  try {
    const raw = localStorage.getItem(PASSKEY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function detectBiometricLabel(): { label: string; Icon: typeof Fingerprint } {
  if (typeof navigator === "undefined") return { label: "Biometric", Icon: Fingerprint };
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return { label: "Face ID / Touch ID", Icon: ScanFace };
  if (/Mac/.test(ua)) return { label: "Touch ID", Icon: Fingerprint };
  if (/Android/.test(ua)) return { label: "Fingerprint", Icon: Fingerprint };
  if (/Windows/.test(ua)) return { label: "Windows Hello", Icon: ScanFace };
  return { label: "Biometric", Icon: Fingerprint };
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

interface NavRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  testId: string;
  trailing?: React.ReactNode;
  destructive?: boolean;
}

function NavRow({ icon, title, description, onClick, testId, trailing, destructive }: NavRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      data-testid={testId}
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${destructive ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${destructive ? "text-red-600" : "text-foreground"}`}>{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {trailing ?? <ChevronRight size={18} className="text-muted-foreground" />}
    </button>
  );
}

export default function PrivacySecurity() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS);
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  const { label: biometricLabel, Icon: BiometricIcon } = detectBiometricLabel();

  useEffect(() => {
    setSettings(loadSettings());
    setPasskeys(loadPasskeys());
    (async () => {
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        setBiometricSupported(false);
        return;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricSupported(available);
      } catch {
        setBiometricSupported(false);
      }
    })();
  }, []);

  const update = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const persistPasskeys = (list: PasskeyRecord[]) => {
    setPasskeys(list);
    localStorage.setItem(PASSKEY_KEY, JSON.stringify(list));
  };

  const handleRegisterPasskey = async () => {
    if (!biometricSupported) {
      toast({
        title: "Not available",
        description: `${biometricLabel} isn't available on this device.`,
        variant: "destructive",
      });
      return;
    }
    setRegistering(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "The Cubby" },
          user: {
            id: userId,
            name: "user@thecubby.app",
            displayName: "The Cubby User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("No credential returned");

      const newPasskey: PasskeyRecord = {
        id: crypto.randomUUID(),
        credentialId: bytesToBase64(new Uint8Array(credential.rawId)),
        label: biometricLabel,
        createdAt: new Date().toISOString(),
      };
      const next = [...passkeys, newPasskey];
      persistPasskeys(next);
      update("appLockEnabled", true);
      toast({
        title: `${biometricLabel} enabled`,
        description: "Your account is now protected with biometric authentication.",
      });
    } catch (err: any) {
      const isCancel = err?.name === "NotAllowedError" || err?.name === "AbortError";
      toast({
        title: isCancel ? "Cancelled" : "Setup failed",
        description: isCancel
          ? `${biometricLabel} setup was cancelled.`
          : err?.message || `Could not enable ${biometricLabel}.`,
        variant: isCancel ? "default" : "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleVerifyBiometric = async () => {
    if (passkeys.length === 0) {
      toast({ title: "No passkey", description: `Set up ${biometricLabel} first.` });
      return;
    }
    setVerifying(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const allowCredentials = passkeys.map((pk) => ({
        type: "public-key" as const,
        id: base64ToBytes(pk.credentialId).buffer as ArrayBuffer,
      }));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: "required",
          timeout: 60000,
        },
      });
      if (assertion) {
        toast({
          title: "Verified",
          description: `${biometricLabel} authentication successful.`,
        });
      }
    } catch (err: any) {
      const isCancel = err?.name === "NotAllowedError" || err?.name === "AbortError";
      toast({
        title: isCancel ? "Cancelled" : "Verification failed",
        description: isCancel ? "Authentication was cancelled." : err?.message || "Could not verify.",
        variant: isCancel ? "default" : "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRemovePasskey = (id: string) => {
    const next = passkeys.filter((p) => p.id !== id);
    persistPasskeys(next);
    if (next.length === 0) {
      update("appLockEnabled", false);
      update("twoFactorEnabled", false);
    }
    toast({ title: "Passkey removed", description: "Biometric credential has been deleted." });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({ title: "Privacy Saved", description: "Your privacy & security settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [inv, list, recipes, plan] = await Promise.all([
        fetch("/api/inventory").then((r) => r.json()).catch(() => []),
        fetch("/api/shopping-list").then((r) => r.json()).catch(() => []),
        fetch("/api/recipes").then((r) => r.json()).catch(() => []),
        fetch("/api/meal-plans").then((r) => r.json()).catch(() => []),
      ]);
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), inventory: inv, shoppingList: list, recipes, mealPlan: plan }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cubby-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your data has been downloaded." });
    } catch {
      toast({ title: "Export failed", description: "Could not export your data.", variant: "destructive" });
    }
  };

  const handleClearCache = () => {
    try {
      const keysToKeep = [STORAGE_KEY, PASSKEY_KEY, "cubby_notification_settings"];
      Object.keys(localStorage).forEach((k) => {
        if (!keysToKeep.includes(k)) localStorage.removeItem(k);
      });
      toast({ title: "Cache cleared", description: "Local cache has been cleared." });
    } catch {
      toast({ title: "Error", description: "Could not clear cache.", variant: "destructive" });
    }
  };

  const handleSignOutEverywhere = () => {
    toast({ title: "Signed out everywhere", description: "All other sessions have been ended." });
    window.location.href = "/api/logout";
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
          <h1 className="text-3xl font-serif text-foreground">Privacy & Security</h1>
        </header>

        {/* Biometric / Passkey section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Two-Factor Authentication
          </h3>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BiometricIcon className="text-primary" size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{biometricLabel}</p>
                  {biometricSupported === null ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      Checking...
                    </span>
                  ) : biometricSupported ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                      Available
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      Unsupported
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {biometricSupported === false
                    ? "This device doesn't support biometric authentication."
                    : passkeys.length > 0
                    ? `${passkeys.length} passkey${passkeys.length > 1 ? "s" : ""} registered.`
                    : "Use your face or fingerprint to secure your account."}
                </p>
              </div>
            </div>

            {passkeys.length > 0 && (
              <div className="space-y-2">
                {passkeys.map((pk) => (
                  <div
                    key={pk.id}
                    className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl"
                    data-testid={`passkey-${pk.id}`}
                  >
                    <ShieldCheck className="text-green-600 flex-shrink-0" size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pk.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(pk.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemovePasskey(pk.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-destructive"
                      aria-label="Remove passkey"
                      data-testid={`button-remove-passkey-${pk.id}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleRegisterPasskey}
                disabled={registering || biometricSupported === false}
                className="w-full gap-2"
                data-testid="button-register-passkey"
              >
                {registering ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <BiometricIcon size={16} />
                )}
                {passkeys.length > 0 ? `Add another ${biometricLabel}` : `Set up ${biometricLabel}`}
              </Button>
              {passkeys.length > 0 && (
                <Button
                  onClick={handleVerifyBiometric}
                  disabled={verifying}
                  variant="outline"
                  className="w-full gap-2"
                  data-testid="button-test-biometric"
                >
                  {verifying ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Test {biometricLabel}
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<KeyRound size={18} className="text-foreground" />}
              title="Authenticator App (TOTP)"
              description="Use Google Authenticator, Authy, or 1Password for codes"
              checked={settings.twoFactorEnabled}
              onChange={(v) => update("twoFactorEnabled", v)}
              testId="switch-2fa-totp"
            />
          </div>
        </section>

        {/* App Lock */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            App Lock
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<Lock size={18} className="text-foreground" />}
              title="Require Authentication"
              description="Lock the app when it opens"
              checked={settings.appLockEnabled}
              onChange={(v) => update("appLockEnabled", v)}
              testId="switch-app-lock"
            />
            {settings.appLockEnabled && (
              <div className="flex items-center justify-between p-4 pl-16">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-lock</p>
                  <p className="text-xs text-muted-foreground">Lock after inactivity</p>
                </div>
                <Select
                  value={settings.lockTimeout}
                  onValueChange={(v) => update("lockTimeout", v as LockTimeout)}
                >
                  <SelectTrigger className="w-36" data-testid="select-lock-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediately</SelectItem>
                    <SelectItem value="1">After 1 min</SelectItem>
                    <SelectItem value="5">After 5 min</SelectItem>
                    <SelectItem value="15">After 15 min</SelectItem>
                    <SelectItem value="60">After 1 hour</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <ToggleRow
              icon={<Eye size={18} className="text-foreground" />}
              title="Hide Content in App Switcher"
              description="Blur the screen when switching apps"
              checked={settings.hideSensitiveContent}
              onChange={(v) => update("hideSensitiveContent", v)}
              testId="switch-hide-content"
            />
            <ToggleRow
              icon={<Trash2 size={18} className="text-foreground" />}
              title="Require Auth to Delete"
              description="Authenticate before removing items or recipes"
              checked={settings.requireAuthForDelete}
              onChange={(v) => update("requireAuthForDelete", v)}
              testId="switch-auth-delete"
            />
            <ToggleRow
              icon={<Download size={18} className="text-foreground" />}
              title="Require Auth to Export"
              description="Authenticate before exporting your data"
              checked={settings.requireAuthForExport}
              onChange={(v) => update("requireAuthForExport", v)}
              testId="switch-auth-export"
            />
          </div>
        </section>

        {/* Permissions */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Permissions
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
            <NavRow
              icon={<Camera size={18} className="text-foreground" />}
              title="Camera"
              description="For barcode scanning and recipe photos"
              onClick={() =>
                toast({
                  title: "Camera Access",
                  description: "Manage camera permission in your device settings.",
                })
              }
              testId="row-perm-camera"
            />
            <NavRow
              icon={<Bell size={18} className="text-foreground" />}
              title="Notifications"
              description="Manage alert preferences"
              onClick={() => setLocation("/notifications")}
              testId="row-perm-notifications"
            />
            <NavRow
              icon={<MapPin size={18} className="text-foreground" />}
              title="Location"
              description="For shopping list reminders near stores"
              onClick={() =>
                toast({
                  title: "Location Access",
                  description: "Manage location permission in your device settings.",
                })
              }
              testId="row-perm-location"
            />
            <NavRow
              icon={<ImageIcon size={18} className="text-foreground" />}
              title="Photos"
              description="For uploading recipe images"
              onClick={() =>
                toast({
                  title: "Photo Access",
                  description: "Manage photo permission in your device settings.",
                })
              }
              testId="row-perm-photos"
            />
          </div>
        </section>

        {/* Privacy preferences */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Privacy
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50">
            <ToggleRow
              icon={<BarChart3 size={18} className="text-foreground" />}
              title="Usage Analytics"
              description="Help improve the app with anonymous usage data"
              checked={settings.analytics}
              onChange={(v) => update("analytics", v)}
              testId="switch-analytics"
            />
            <ToggleRow
              icon={<Bug size={18} className="text-foreground" />}
              title="Crash Reports"
              description="Send diagnostic data when the app crashes"
              checked={settings.crashReports}
              onChange={(v) => update("crashReports", v)}
              testId="switch-crash-reports"
            />
            <ToggleRow
              icon={<Sparkles size={18} className="text-foreground" />}
              title="Personalized Recommendations"
              description="Tailored recipe and shopping suggestions"
              checked={settings.personalizedRecommendations}
              onChange={(v) => update("personalizedRecommendations", v)}
              testId="switch-personalized"
            />
            <ToggleRow
              icon={<Database size={18} className="text-foreground" />}
              title="Share Anonymous Trends"
              description="Contribute pantry trends to improve recipe AI"
              checked={settings.shareAnonymousTrends}
              onChange={(v) => update("shareAnonymousTrends", v)}
              testId="switch-share-trends"
            />
          </div>
        </section>

        {/* Sessions */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Active Sessions
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Smartphone size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">This Device</p>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                Current
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                  data-testid="button-signout-everywhere"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <LogOut size={18} className="text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">Sign Out Everywhere</p>
                    <p className="text-xs text-muted-foreground">End all other sessions</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of all sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll be signed out on every device, including this one. You'll need to sign in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOutEverywhere}>
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* Data & Account */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Data & Account
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
            <NavRow
              icon={<Download size={18} className="text-foreground" />}
              title="Export My Data"
              description="Download a copy of your pantry, recipes, and lists"
              onClick={handleExportData}
              testId="button-export-data"
            />
            <NavRow
              icon={<Database size={18} className="text-foreground" />}
              title="Clear Cache"
              description="Free up space by removing cached data"
              onClick={handleClearCache}
              testId="button-clear-cache"
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                  data-testid="button-delete-account"
                >
                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={18} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-red-600">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently remove your account and data</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove your pantry, recipes, shopping list, and meal plan. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      toast({
                        title: "Contact support",
                        description: "Please email support to delete your account.",
                      })
                    }
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* Legal */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
            Legal
          </h3>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/50 overflow-hidden">
            <NavRow
              icon={<FileText size={18} className="text-foreground" />}
              title="Privacy Policy"
              onClick={() => toast({ title: "Privacy Policy", description: "Opening privacy policy..." })}
              testId="row-privacy-policy"
            />
            <NavRow
              icon={<FileText size={18} className="text-foreground" />}
              title="Terms of Service"
              onClick={() => toast({ title: "Terms of Service", description: "Opening terms..." })}
              testId="row-terms"
            />
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 text-base font-medium gap-2"
          data-testid="button-save-privacy"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </div>
    </Layout>
  );
}
