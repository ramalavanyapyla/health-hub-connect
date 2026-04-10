import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const AdminHospitals = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .order("created_at", { ascending: false });
      setHospitals(data || []);
    };
    fetchHospitals();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Hospital Management</h1>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              All Hospitals ({hospitals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hospitals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hospitals registered yet.</p>
            ) : (
              <div className="space-y-3">
                {hospitals.map((h) => (
                  <div key={h.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{h.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {h.address || "No address"} • {h.phone || "No phone"}
                    </p>
                    {h.license_number && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">License: {h.license_number}</p>
                    )}
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

export default AdminHospitals;
