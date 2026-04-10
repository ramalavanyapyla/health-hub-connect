import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role: AppRole) => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.rpc("assign_role_to_user", { _role: role });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Role assigned successfully!");
    // Force reload to refresh roles
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2">
            <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">UPMRS</span>
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">Choose your role</h1>
          <p className="mt-2 text-muted-foreground">How will you use the platform?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-glow"
            onClick={() => !loading && handleRoleSelect("patient")}
          >
            <CardHeader className="text-center">
              <User className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="font-display">Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Access your medical records, emergency QR code, and manage your health profile.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-glow"
            onClick={() => !loading && handleRoleSelect("doctor")}
          >
            <CardHeader className="text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="font-display">Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Manage patients, upload medical records, and access patient histories.
              </p>
            </CardContent>
          </Card>
        </div>

        {loading && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;
