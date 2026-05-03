import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const [resolving, setResolving] = useState(true);
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    const resolve = async () => {
      const selectedPortal = sessionStorage.getItem("upmrs_selected_portal");
      sessionStorage.removeItem("upmrs_selected_portal");

      // Admin overrides everything
      if (roles.includes("admin")) {
        if (!cancelled) { setTarget("/admin"); setResolving(false); }
        return;
      }

      // Doctor portal selected via OAuth
      if (selectedPortal === "doctor") {
        if (!roles.includes("doctor")) {
          await supabase.auth.signOut();
          toast.error("This Google account is not registered as a doctor. Please sign up as a doctor first.");
          if (!cancelled) { setTarget("/login"); setResolving(false); }
          return;
        }
        if (!cancelled) { setTarget("/doctor"); setResolving(false); }
        return;
      }

      // Patient portal (default / OAuth patient flow)
      if (roles.includes("doctor") && !roles.includes("patient")) {
        if (!cancelled) { setTarget("/doctor"); setResolving(false); }
        return;
      }

      // Ensure patient role + patient row exist (covers Google OAuth first sign-in)
      if (!roles.includes("patient")) {
        await supabase.rpc("assign_role_to_user", { _role: "patient" });
      }
      const { data: existing } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) {
        await supabase.from("patients").insert({ user_id: user.id });
      }

      if (!cancelled) { setTarget("/patient"); setResolving(false); }
    };

    void resolve();
    return () => { cancelled = true; };
  }, [loading, user, roles]);

  if (loading || resolving || !target) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Navigate to={target} replace />;
};

export default Dashboard;
