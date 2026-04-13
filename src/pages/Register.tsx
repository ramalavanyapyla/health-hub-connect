import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get("portal");
  const role: AppRole = portalParam === "doctor" ? "doctor" : "patient";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      toast.error(authError.message);
    } else {
      toast.success("Account created successfully! You can now sign in.");
      navigate("/login");
    }
    setLoading(false);
  };

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
            {role === "doctor" ? "Doctor Registration" : "Patient Registration"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {role === "doctor" ? "Create your doctor account" : "Create your patient account"}
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="name" placeholder={role === "doctor" ? "Dr. John Doe" : "John Doe"} className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          </div>
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
              <Input id="password" type="password" placeholder="Min 8 characters" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
