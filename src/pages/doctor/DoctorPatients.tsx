import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { toast } from "sonner";

const DoctorPatients = () => {
  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setPatient(null);
    setProfile(null);
    setRecords([]);

    const { data: p } = await supabase.from("patients").select("*").eq("patient_uid", searchId.trim()).single();
    if (!p) {
      toast.error("Patient not found");
      setLoading(false);
      return;
    }
    setPatient(p);

    const [pr, recs] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", p.user_id).single(),
      supabase.from("medical_records").select("*").eq("patient_id", p.id).order("record_date", { ascending: false }),
    ]);
    setProfile(pr.data);
    setRecords(recs.data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Patient Lookup</h1>
        <p className="text-muted-foreground">Search for a patient using their Unique Patient ID (UPMRS-XXXXXXXX)</p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Patient ID (e.g., UPMRS-abc12345)"
              className="pl-10"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="gradient-primary border-0 text-primary-foreground" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {patient && profile && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {profile.full_name}
                <Badge variant="outline" className="ml-auto font-mono">{patient.patient_uid}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Blood Group:</span> <strong>{profile.blood_group || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">Gender:</span> <strong>{profile.gender || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">DOB:</span> <strong>{profile.date_of_birth || "N/A"}</strong></div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Medical History ({records.length} records)</h3>
                {records.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No records found.</p>
                ) : (
                  <div className="space-y-2">
                    {records.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{r.record_type.replace("_", " ")}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{r.record_date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatients;
