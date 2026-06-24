import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ChefHat, ScanLine, Bell, ArrowRight, ArrowLeft, Package } from "lucide-react";
import { saveNativeSession, resolveUrl } from "@/lib/queryClient";
import { isNativePlatform } from "@/lib/capacitor";
import logo from "@/assets/logo.png";

function isStandalone(): boolean {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function showGoogleAuth(): boolean {
  return showGoogleAuth() && !isStandalone();
}

const FEATURES = [
  {
    icon: Package,
    title: "Smart pantry tracking",
    desc: "Scan barcodes or add items manually in seconds",
  },
  {
    icon: ChefHat,
    title: "AI-powered recipes",
    desc: "Cook delicious meals with what you already have",
  },
  {
    icon: Bell,
    title: "Expiry & low-stock alerts",
    desc: "Never waste food or make an unnecessary grocery run",
  },
];

type View = "marketing" | "login" | "register";

function GoogleButton({ label }: { label: string }) {
  const googleUrl = resolveUrl("/api/auth/google");
  return (
    <a
      href={googleUrl}
      className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-border text-foreground text-sm font-medium py-3 px-4 rounded-2xl hover:bg-muted/50 active:scale-[0.98] transition-all shadow-sm"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {label}
    </a>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function Landing() {
  const [view, setView] = useState<View>("marketing");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const busy = isLoggingIn || isRegistering;

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("_sid");
    const authError = params.get("_auth_error");

    if (sid) {
      saveNativeSession(sid);
      window.history.replaceState({}, "", "/");
    }
    if (authError) {
      const messages: Record<string, string> = {
        invalid_state: "Sign-in session expired. Please try again.",
        token_exchange_failed: "Could not connect to Google. Please try again.",
        no_email: "Your Google account has no email address.",
        unexpected: "Something went wrong. Please try again.",
      };
      setError(messages[authError] ?? "Google sign-in failed. Please try again.");
      setView("login");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (view === "login") {
        await login({ email, password });
      } else {
        await register({ email, password, firstName });
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    }
  }

  if (view === "marketing") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-primary px-6 pt-14 pb-10 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-7">
            <img src={logo} alt="The Cubby" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-primary-foreground/90 font-serif text-xl">The Cubby</span>
          </div>
          <h1 className="text-[2rem] font-serif text-primary-foreground leading-snug mb-3">
            Your kitchen,<br />always under control.
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
            Track food, reduce waste, and cook smarter — every day.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Barcode scan", "AI recipes", "Expiry alerts", "Meal planning"].map(pill => (
              <span
                key={pill}
                className="bg-primary-foreground/15 border border-primary-foreground/25 text-primary-foreground/90 text-xs px-3 py-1 rounded-full"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 px-6 pt-6 pb-2 space-y-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 bg-card border border-border rounded-2xl">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-serif font-medium text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-10 pt-4 space-y-3">
          {showGoogleAuth() && <GoogleButton label="Continue with Google" />}
          {showGoogleAuth() && <Divider />}
          <Button
            size="lg"
            className="w-full text-base py-6 rounded-2xl gap-2"
            onClick={() => setView("register")}
          >
            Get started with email <ArrowRight size={18} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full text-base py-6 rounded-2xl"
            onClick={() => setView("login")}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-6 pb-10">
      <button
        type="button"
        onClick={() => { setView("marketing"); setError(""); }}
        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-8 self-start"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex flex-col items-center mb-8">
        <img src={logo} alt="The Cubby" className="w-16 h-16 rounded-2xl object-contain mb-4" />
        <h2 className="text-2xl font-serif text-foreground">
          {view === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {view === "login" ? "Sign in to your kitchen" : "Start tracking your pantry today"}
        </p>
      </div>

      <div className="space-y-4 w-full max-w-sm mx-auto">
        {showGoogleAuth() && (
          <GoogleButton label={view === "login" ? "Sign in with Google" : "Sign up with Google"} />
        )}
        {showGoogleAuth() && <Divider />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "register" && (
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full text-base py-6 rounded-2xl" disabled={busy}>
            {busy ? "Please wait…" : view === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6 max-w-sm mx-auto w-full">
        {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="text-primary font-medium underline-offset-2 hover:underline"
          onClick={() => { setView(view === "login" ? "register" : "login"); setError(""); }}
        >
          {view === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
