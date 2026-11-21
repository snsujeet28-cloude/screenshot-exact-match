import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserRound, LogOut, MapPin, ShoppingBag, ShieldCheck } from "lucide-react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "./auth-provider";
import { ShopShell, Empty } from "./shop-shared";
import { Button } from "@/components/ui/button";
import { money, shortId } from "@/lib/commerce";
export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setMessage("Check your email for a password reset link.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account before signing in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome to Brothers Kart");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/account",
    });
    if (result.error) toast.error(result.error.message);
  }
  return (
    <>
      <div className="auth-heading">
        <UserRound />
        <h2>
          {mode === "signup"
            ? "Welcome to the neighbourhood"
            : mode === "forgot"
              ? "Reset your password"
              : "Your neighbourhood awaits"}
        </h2>
        <p>
          {mode === "forgot"
            ? "We’ll send a secure reset link to your email."
            : "Fresh essentials. Local love. All in one place."}
        </p>
      </div>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && (
          <label className="field">
            Your name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </label>
        )}
        <label className="field">
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {mode !== "forgot" && (
          <label className="field">
            Password
            <input
              required
              type="password"
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
        )}
        {message && (
          <p role="status" className="text-sm text-primary py-2">
            {message}
          </p>
        )}
        <Button size="lg" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
        </Button>
        {mode === "login" && (
          <Button type="button" variant="link" size="sm" onClick={() => setMode("forgot")}>
            Forgot password?
          </Button>
        )}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </Button>
      </form>
      {mode !== "forgot" && (
        <>
          <div className="auth-divider">or continue with</div>
          <div className="auth-form">
            <Button variant="outline" onClick={() => social("google")}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Continue with Google
            </Button>
            <Button variant="outline" onClick={() => social("lovable")}>
              <LovableMark />
              Continue with Lovable
            </Button>
          </div>
        </>
      )}
    </>
  );
}
export function AccountPage() {
  const { user, ready } = useAuth();
  const query = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id ?? "")
        .single();
      if (error) throw error;
      return data;
    },
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: String(form.get("name")),
        phone: String(form.get("phone")),
        address: String(form.get("address")),
        landmark: String(form.get("landmark")),
      })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Your details are saved");
      void query.invalidateQueries({ queryKey: ["profile"] });
    }
  }
  return (
    <ShopShell title="My account">
      <div className="store-content">
        {!ready ? (
          <p className="py-10 text-center text-sm">Loading account…</p>
        ) : !user ? (
          <AuthForm />
        ) : (
          <>
            <div className="auth-heading">
              <UserRound />
              <h2>Hello, {profile?.display_name || "neighbour"}!</h2>
              <p>{user.email}</p>
            </div>
            <form className="panel" onSubmit={save} key={profile?.id}>
              <h2 className="flex items-center gap-2">
                <MapPin size={16} />
                Delivery details
              </h2>
              <label className="field">
                Name
                <input name="name" required defaultValue={profile?.display_name} />
              </label>
              <label className="field">
                Mobile number
                <input
                  name="phone"
                  pattern="[0-9]{10}"
                  required
                  defaultValue={profile?.phone}
                  placeholder="10-digit mobile"
                />
              </label>
              <label className="field">
                Address in Hata
                <textarea name="address" required defaultValue={profile?.address} />
              </label>
              <label className="field">
                Landmark
                <input name="landmark" defaultValue={profile?.landmark} />
              </label>
              <Button type="submit" className="w-full">
                Save details
              </Button>
            </form>
            <div className="section-heading">
              <h2>Your orders</h2>
              <ShoppingBag size={17} />
            </div>
            {orders.length === 0 ? (
              <Empty title="Your first order awaits">
                <Button asChild>
                  <Link to="/">Shop groceries</Link>
                </Button>
              </Empty>
            ) : (
              orders.map((o) => (
                <Link
                  key={o.id}
                  to="/track/$orderId"
                  params={{ orderId: o.id }}
                  className="order-card"
                >
                  <div className="order-card-header">
                    <h3>{shortId(o.id)}</h3>
                    <span className={`status ${o.status}`}>{o.status}</span>
                  </div>
                  <p>
                    {new Date(o.created_at).toLocaleDateString("en-IN")} · {money(o.total)}
                  </p>
                </Link>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
              <LogOut />
              Sign out
            </Button>
          </>
        )}
        <div className="account-links">
          <Link to="/rider">
            <ShieldCheck size={12} className="inline mr-1" />
            Delivery partner
          </Link>
          <Link to="/admin">Admin portal →</Link>
        </div>
      </div>
    </ShopShell>
  );
}
export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setRecovery(window.location.hash.includes("type=recovery"));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated. You can now sign in.");
    setBusy(false);
  }
  return (
    <ShopShell title="Reset password">
      <div className="store-content">
        <div className="auth-heading">
          <h2>Choose a new password</h2>
        </div>
        {recovery ? (
          <form onSubmit={submit}>
            <label className="field">
              New password
              <input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="field">
              Confirm new password
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <Button disabled={busy}>Update password</Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open the password reset link from your email to continue.
          </p>
        )}
        <p role="status" className="py-4 text-sm">
          {message}
        </p>
        <Button asChild variant="link">
          <Link to="/account">Back to account</Link>
        </Button>
      </div>
    </ShopShell>
  );
}
