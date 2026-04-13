import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const DoctorPatients = () => {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [approvedPatients, setApprovedPatients] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadDoctor = async () => {
      const { data: dp } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setDoctorProfile(dp);

      if (dp) {
        // Load approved patients
        const { data: accessList } = await supabase
          .from("doctor_patient_access")
          .select("*, patients(*)")
          .eq("doctor_id", dp.id)
          .eq("status", "approved");
        
        if (accessList) {
          const patientIds = accessList.map((a: any) => a.patient_id);
          if (patientIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("*")
              .in("user_id", accessList.map((a: any) => a.patients?.user_id).filter(Boolean));
            
            setApprovedPatients(accessList.map((a: any) => ({
              ...a,
              patientProfile: profiles?.find((p: any) => p.user_id === a.patients?.user_id),
            })));
          }
        }
      }
    };
    loadDoctor();
  }, [user]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setPatient(null);
    setProfile(null);
    setRecords([]);
    setAccessStatus(null);

    const { data: p } = await supabase.from("patients").select("*").eq("patient_uid", searchId.trim()).single();
    if (!p) {
      toast.error("Patient not found");
      setLoading(false);
      return;
    }
    setPatient(p);

    // Get basic profile (name, blood group, gender, dob)
    const { data: pr } = await supabase.from("profiles").select("*").eq("user_id", p.user_id).single();
    setProfile(pr);

    // Check access status
    if (doctorProfile) {
      const { data: access } = await supabase
        .from("doctor_patient_access")
        .select("status")
        .eq("doctor_id", doctorProfile.id)
        .eq("patient_id", p.id)
        .single();
      
      if (access) {
        setAccessStatus(access.status);
        if (access.status === "approved") {
          const { data: recs } = await supabase
            .from("medical_records")
            .select("*")
            .eq("patient_id", p.id)
            .order("record_date", { ascending: false });
          setRecords(recs || []);
        }
      }
    }
    setLoading(false);
  };

  const requestAccess = async () => {
    if (!doctorProfile || !patient) return;
    const { error } = await supabase.from("doctor_patient_access").insert({
      doctor_id: doctorProfile.id,
      patient_id: patient.id,
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Access request already sent");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setAccessStatus("pending");
    toast.success("Access request sent to patient!");
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Patient Lookup</h1>
        <p className="text-muted-foreground">Search for a patient using their Patient ID. You can only view full records after the patient approves your access request.</p>

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

              {/* Access status */}
              <div className="mt-4">
                {!accessStatus && (
                  <Button onClick={requestAccess} className="gap-2">
                    <Send className="h-4 w-4" /> Request Access to Records
                  </Button>
                )}
                {accessStatus === "pending" && (
                  <Badge variant="secondary" className="gap-1 text-sm py-1.5 px-3">
                    <Clock className="h-4 w-4" /> Access request pending — waiting for patient approval
                  </Badge>
                )}
                {accessStatus === "rejected" && (
                  <Badge variant="destructive" className="gap-1 text-sm py-1.5 px-3">
                    <XCircle className="h-4 w-4" /> Access request was rejected by patient
                  </Badge>
                )}
                {accessStatus === "approved" && (
                  <>
                    <Badge className="gap-1 text-sm py-1.5 px-3 mb-4 bg-green-600">
                      <CheckCircle className="h-4 w-4" /> Access granted
                    </Badge>
                    <div className="mt-4">
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved patients list */}
        {approvedPatients.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" /> Your Approved Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvedPatients.map((ap) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSearchId(ap.patients?.patient_uid || "");
                      setTimeout(() => handleSearch(), 100);
                    }}
                  >
                    <div>
                      <p className="font-medium">{ap.patientProfile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{ap.patients?.patient_uid}</p>
                    </div>
                    <Badge className="bg-green-600">Approved</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPatients;
