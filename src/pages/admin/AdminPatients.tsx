import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";

const AdminPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      // Fetch patients and profiles separately, join client-side
      const [patientsRes, profilesRes] = await Promise.all([
        supabase.from("patients").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const merged = (patientsRes.data || []).map(p => ({
        ...p,
        profile: profilesMap.get(p.user_id) || null,
      }));
      setPatients(merged);
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) => {
    const name = p.profile?.full_name?.toLowerCase() || "";
    const uid = p.patient_uid?.toLowerCase() || "";
    const q = search.toLowerCase();
    return name.includes(q) || uid.includes(q);
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Patient Management</h1>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or Patient ID..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              All Patients ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm">No patients found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{p.profile?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.profile?.gender || "N/A"} • Blood: {p.profile?.blood_group || "N/A"}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-primary">{p.patient_uid}</span>
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

export default AdminPatients;
