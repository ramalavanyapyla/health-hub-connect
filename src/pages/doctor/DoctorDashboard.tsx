import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Stethoscope, Building2 } from "lucide-react";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [pr, dp] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("doctor_profiles").select("*").eq("user_id", user.id).single(),
      ]);
      setProfile(pr.data);
      setDoctorProfile(dp.data);

      if (dp.data) {
        const { count } = await supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("doctor_id", dp.data.id);
        setRecordCount(count || 0);
      }
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Welcome, Dr. {profile?.full_name || "Doctor"}
          </h1>
          <p className="text-muted-foreground">
            {doctorProfile?.specialization || "Specialization not set"} • {doctorProfile?.department || "Department not set"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Records Created</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Specialization</CardTitle>
              <Stethoscope className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{doctorProfile?.specialization || "Not set"}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">License</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold font-mono">{doctorProfile?.license_number || "Not set"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
