import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, Activity } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: 0, hospitals: 0, records: 0 });
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [patientsRes, hospitalsRes, recordsRes, recentRes] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("hospitals").select("*", { count: "exact", head: true }),
        supabase.from("medical_records").select("*", { count: "exact", head: true }),
        supabase.from("medical_records").select("*, patients(patient_uid)").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        patients: patientsRes.count || 0,
        hospitals: hospitalsRes.count || 0,
        records: recordsRes.count || 0,
      });
      setRecentRecords(recentRes.data || []);
    };
    fetchStats();
  }, [user]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.patients}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hospitals</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hospitals}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.records}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No records yet.</p>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{rec.record_type.replace("_", " ")}</p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">{rec.patients?.patient_uid || "N/A"}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
