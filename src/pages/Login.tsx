import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Lock, User, Stethoscope, Award } from "lucide-react";
import { toast } from "sonner";
import { getAppBaseUrl } from "@/lib/app-url";
import { PasswordInput } from "@/components/PasswordInput";

type Portal = "patient" | "doctor";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState<Portal | null>(null);

  const validatePortalAccess = async (userId: string, selectedPortal: Portal) => {
    // Fetch user roles
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((r) => r.role as string);

    // Admins can access either portal
    if (roles.includes("admin")) return { ok: true, redirect: "/admin" };

    if (selectedPortal === "doctor") {
      if (!roles.includes("doctor")) {
        await supabase.auth.signOut();
        toast.error("This account is not registered as a doctor. Please use the Patient Portal.");
        return { ok: false, redirect: null };
      }
      // Verify License ID matches the doctor profile
      const { data: docProfile } = await supabase
        .from("doctor_profiles")
        .select("license_number")
        .eq("user_id", userId)
        .maybeSingle();
      const expected = (docProfile?.license_number ?? "").trim();
      const provided = licenseNumber.trim();
      if (!expected || expected.toLowerCase() !== provided.toLowerCase()) {
        await supabase.auth.signOut();
        toast.error("Invalid License ID for this doctor account.");
        return { ok: false, redirect: null };
      }
      return { ok: true, redirect: "/doctor" };
    }

    // Patient portal selected
    if (roles.includes("doctor") && !roles.includes("patient")) {
      await supabase.auth.signOut();
      toast.error("This account is registered as a doctor. Please use the Doctor Portal.");
      return { ok: false, redirect: null };
    }

    // Ensure patient row + role exist (covers Google OAuth signups without metadata)
    if (!roles.includes("patient")) {
      await supabase.rpc("assign_role_to_user", { _role: "patient" });
    }
    // Make sure there's a patient record
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("patients").insert({ user_id: userId });
    }
    return { ok: true, redirect: "/patient" };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portal) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      const result = await validatePortalAccess(data.user.id, portal);
      if (result.ok && result.redirect) navigate(result.redirect);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!portal) return;
    const baseUrl = getAppBaseUrl();
    // Stash selected portal so we can validate after OAuth redirect lands on /dashboard
    sessionStorage.setItem("upmrs_selected_portal", portal);
    const isLovableHost = /\.lovable\.(app|dev|host)$|lovableproject\.com$/.test(
      new URL(baseUrl).hostname
    );

    if (isLovableHost) {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${baseUrl}/dashboard`,
      });
      if (result.error) toast.error("Google login failed");
      if (!result.redirected && !result.error) navigate("/dashboard");
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${baseUrl}/dashboard` },
      });
      if (error) toast.error(error.message);
    }
  };

  // Portal selection screen
  if (!portal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold">UPMRS</span>
            </Link>
            <h1 className="mt-6 font-display text-3xl font-bold">Choose your portal</h1>
            <p className="mt-2 text-muted-foreground">Select how you'd like to sign in</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setPortal("patient")}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border p-8 transition-all hover:border-primary hover:shadow-glow"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <User className="h-8 w-8" />
              </div>
              <span className="font-display text-lg font-bold">Patient Portal</span>
              <span className="text-sm text-muted-foreground text-center">Access your medical records & QR code</span>
            </button>

            <button
              onClick={() => setPortal("doctor")}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border p-8 transition-all hover:border-primary hover:shadow-glow"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Stethoscope className="h-8 w-8" />
              </div>
              <span className="font-display text-lg font-bold">Doctor Portal</span>
              <span className="text-sm text-muted-foreground text-center">Manage patients & medical records</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">UPMRS</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold">
            {portal === "patient" ? "Patient Sign In" : "Doctor Sign In"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {portal === "patient" ? "Access your medical records" : "Manage patients & records"}
          </p>
          <button onClick={() => setPortal(null)} className="mt-2 text-sm text-primary hover:underline">
            ← Switch portal
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        <Button variant="outline" onClick={handleGoogleLogin} className="w-full">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to={`/register?portal=${portal}`} className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
