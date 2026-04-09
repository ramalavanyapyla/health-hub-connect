import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, Calendar, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const [profileRes, patientRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("patients").select("*").eq("user_id", user.id).single(),
      ]);
      
      setProfile(profileRes.data);
      setPatient(patientRes.data);

      if (patientRes.data) {
        const { data: recs, count } = await supabase
          .from("medical_records")
          .select("*", { count: "exact" })
          .eq("patient_id", patientRes.data.id)
          .order("record_date", { ascending: false })
          .limit(5);
        setRecords(recs || []);
        setRecordCount(count || 0);
      }
    };
    fetchData();
  }, [user]);

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Welcome, {profile?.full_name || "Patient"}
          </h1>
          {patient && (
            <p className="mt-1 text-muted-foreground">
              Patient ID: <span className="font-mono font-semibold text-primary">{patient.patient_uid}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blood Group</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.blood_group || "N/A"}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Visit</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {records[0] ? format(new Date(records[0].record_date), "MMM d") : "N/A"}
              </div>
            </CardContent>
          </Card>
          <Link to="/patient/qr">
            <Card className="shadow-card cursor-pointer transition-shadow hover:shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Emergency QR</CardTitle>
                <QrCode className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-primary">View QR Code →</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Recent Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">No medical records yet.</p>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground capitalize">{rec.record_type.replace("_", " ")}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{format(new Date(rec.record_date), "MMM d, yyyy")}</span>
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

export default PatientDashboard;
