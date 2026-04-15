import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Mail, Lock, User, Phone, Award, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
  "Gynecology",
  "ENT",
  "Dentistry",
  "Other",
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get("portal");
  const role: AppRole = portalParam === "doctor" ? "doctor" : "patient";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (role === "doctor") {
      if (!specialization) {
        toast.error("Please select a specialization");
        return;
      }
      if (!licenseNumber.trim()) {
        toast.error("License ID is required for doctors");
        return;
      }
      if (!phone.trim()) {
        toast.error("Phone number is required for doctors");
        return;
      }
    }
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          ...(role === "doctor" && { specialization, license_number: licenseNumber, phone }),
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      toast.error(authError.message);
    } else {
      // If doctor, update doctor_profiles after signup
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

          {role === "doctor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="+91 9876543210" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Select value={specialization} onValueChange={setSpecialization}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select specialization" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License ID</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="license" placeholder="e.g., MCI-12345" className="pl-10" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                </div>
              </div>
            </>
          )}

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
