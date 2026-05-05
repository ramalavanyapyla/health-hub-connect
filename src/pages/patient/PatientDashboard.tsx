import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, Calendar, QrCode, UserCheck, CheckCircle, XCircle, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type DoctorDirectoryEntry = {
  doctor_id: string;
  user_id: string;
  full_name: string | null;
  specialization: string | null;
  license_number: string | null;
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const loadPendingRequests = async (patientId: string) => {
    const { data } = await supabase
      .from("doctor_patient_access")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });
    if (data && data.length > 0) {
      const doctorIds = data.map((d: any) => d.doctor_id);
      const { data: docs } = await supabase.rpc("get_doctor_directory_entries", {
        _doctor_ids: doctorIds,
      });
      const doctorMap = new Map(
        ((docs as DoctorDirectoryEntry[] | null) || []).map((doctor) => [doctor.doctor_id, doctor])
      );

      setPendingRequests(
        data.map((r: any) => {
          const doc = doctorMap.get(r.doctor_id);
          return { ...r, doctor: doc, doctorName: doc?.full_name || "Doctor" };
        })
      );
    } else {
      setPendingRequests([]);
    }
  };

  const respondToRequest = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("doctor_patient_access")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Doctor access approved!" : "Request rejected");
    if (patient) loadPendingRequests(patient.id);
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const [profileRes, patientRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("patients").select("*").eq("user_id", user.id).maybeSingle(),
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
        loadPendingRequests(patientRes.data.id);
      }
    };
    fetchData();
  }, [user]);

  // Realtime subscription so doctor requests show up instantly
  useEffect(() => {
    if (!patient) return;
    const channel = supabase
      .channel(`access-patient-${patient.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_patient_access", filter: `patient_id=eq.${patient.id}` },
        () => loadPendingRequests(patient.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient]);

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

        {pendingRequests.length > 0 && (
          <Card className="shadow-card border-primary/40">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Doctor Access Requests
                <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following doctors have requested access to your full medical records. Approve to allow them to view records and chat with you.
              </p>
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Dr. {req.doctorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.doctor?.specialization || "General"}
                        {req.doctor?.license_number ? ` • License: ${req.doctor.license_number}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Requested {format(new Date(req.requested_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => respondToRequest(req.id, "approved")}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => respondToRequest(req.id, "rejected")}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
