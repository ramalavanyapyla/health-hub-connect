import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  User,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Droplets,
  AlertTriangle,
  HeartPulse,
  Phone,
  MessageCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const DoctorPatients = () => {
  const { user } = useAuth();
  const [searchId, setSearchId] = useState("");
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [emergency, setEmergency] = useState<any>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [approvedPatients, setApprovedPatients] = useState<any[]>([]);

  const loadApprovedPatients = async (doctorId: string) => {
    const { data: accessList } = await supabase
      .from("doctor_patient_access")
      .select("*")
      .eq("doctor_id", doctorId)
      .eq("status", "approved");

    if (!accessList || accessList.length === 0) {
      setApprovedPatients([]);
      return;
    }
    const patientIds = accessList.map((a: any) => a.patient_id);
    const { data: pts } = await supabase.from("patients").select("*").in("id", patientIds);
    const userIds = (pts || []).map((p: any) => p.user_id).filter(Boolean);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    setApprovedPatients(
      accessList.map((a: any) => {
        const pt = pts?.find((p: any) => p.id === a.patient_id);
        return {
          ...a,
          patients: pt,
          patientProfile: profiles?.find((p: any) => p.user_id === pt?.user_id),
        };
      })
    );
  };

  useEffect(() => {
    if (!user) return;
    const loadDoctor = async () => {
      const { data: dp, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load doctor profile: " + error.message);
        return;
      }
      if (!dp) {
        toast.error("No doctor profile found for your account.");
        return;
      }
      setDoctorProfile(dp);
      await loadApprovedPatients(dp.id);
    };
    loadDoctor();
  }, [user]);

  // Realtime: refresh when patient approves/rejects
  useEffect(() => {
    if (!doctorProfile) return;
    const channel = supabase
      .channel(`access-doctor-${doctorProfile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_patient_access", filter: `doctor_id=eq.${doctorProfile.id}` },
        async (payload) => {
          const row: any = payload.new || payload.old;
          if (patient && row?.patient_id === patient.id && payload.new) {
            setAccessStatus((payload.new as any).status);
            if ((payload.new as any).status === "approved") {
              await loadFullRecords(patient.id);
              toast.success("Patient approved your access request!");
            } else if ((payload.new as any).status === "rejected") {
              toast.error("Patient rejected your access request.");
            }
          }
          loadApprovedPatients(doctorProfile.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorProfile, patient]);

  const resetSearch = () => {
    setPatient(null);
    setProfile(null);
    setEmergency(null);
    setShowEmergency(false);
    setRecords([]);
    setAccessStatus(null);
  };

  const normalizePatientId = (raw: string) => {
    let v = raw.trim();
    if (!v) return v;
    const m = v.match(/^(upmrs)[-_ ]?(.+)$/i);
    if (m) v = `UPMRS-${m[2].toLowerCase()}`;
    return v;
  };

  const handleSearch = async (overrideId?: string) => {
    const id = normalizePatientId(overrideId ?? searchId);
    if (!id) {
      toast.error("Please enter a Patient ID");
      return;
    }
    setLoading(true);
    resetSearch();

    const { data: p, error: pErr } = await supabase
      .from("patients")
      .select("*")
      .eq("patient_uid", id)
      .maybeSingle();

    if (pErr) {
      toast.error("Search failed: " + pErr.message);
      setLoading(false);
      return;
    }
    if (!p) {
      toast.error(`Patient not found for ID "${id}"`);
      setLoading(false);
      return;
    }
    setPatient(p);

    const { data: pr } = await supabase
      .from("profiles")
      .select("full_name, blood_group, allergies, medical_conditions, gender, date_of_birth, phone")
      .eq("user_id", p.user_id)
      .maybeSingle();
    setProfile(pr);

    // Auto-load emergency snapshot up front
    const { data: em } = await supabase
      .from("public_emergency_profiles")
      .select("*")
      .eq("patient_id", p.id)
      .maybeSingle();
    setEmergency(em);
    setShowEmergency(true);

    if (doctorProfile) {
      const { data: access } = await supabase
        .from("doctor_patient_access")
        .select("status")
        .eq("doctor_id", doctorProfile.id)
        .eq("patient_id", p.id)
        .maybeSingle();

      if (access) {
        setAccessStatus(access.status);
        if (access.status === "approved") {
          await loadFullRecords(p.id, p.user_id);
        }
      }
    }
    setLoading(false);
  };

  const loadFullRecords = async (patientId: string, patientUserId?: string) => {
    const uid = patientUserId || patient?.user_id;
    if (uid) {
      const { data: pr } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (pr) setProfile(pr);
    }
    const { data: recs } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("record_date", { ascending: false });
    setRecords(recs || []);
  };

  const viewEmergencyInfo = async () => {
    if (!patient) return;
    const { data: em } = await supabase
      .from("public_emergency_profiles")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle();
    setEmergency(em);
    setShowEmergency(true);
  };

  const requestAccess = async () => {
    if (!doctorProfile || !patient) return;
    const { error } = await supabase.from("doctor_patient_access").insert({
      doctor_id: doctorProfile.id,
      patient_id: patient.id,
    });
    if (error) {
      if (error.code === "23505") toast.error("Access request already sent");
      else toast.error(error.message);
      return;
    }
    setAccessStatus("pending");
    toast.success("Access request sent to patient!");
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Patient Lookup</h1>
          <p className="text-muted-foreground">
            Search by Patient ID, view emergency info, then request access for full records and chat.
          </p>
        </div>

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

        {/* Step 1: Show patient name once found */}
        {patient && profile && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {profile.full_name || "Unnamed Patient"}
                <Badge variant="outline" className="ml-auto font-mono">
                  {patient.patient_uid}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {!showEmergency && (
                  <Button variant="outline" onClick={viewEmergencyInfo} className="gap-2">
                    <Eye className="h-4 w-4" /> View Emergency Info
                  </Button>
                )}

                {!accessStatus && (
                  <Button onClick={requestAccess} className="gap-2 gradient-primary border-0 text-primary-foreground">
                    <Send className="h-4 w-4" /> Request Full Access
                  </Button>
                )}
                {accessStatus === "pending" && (
                  <Badge variant="secondary" className="gap-1 text-sm py-1.5 px-3">
                    <Clock className="h-4 w-4" /> Waiting for patient approval
                  </Badge>
                )}
                {accessStatus === "rejected" && (
                  <Badge variant="destructive" className="gap-1 text-sm py-1.5 px-3">
                    <XCircle className="h-4 w-4" /> Request rejected
                  </Badge>
                )}
                {accessStatus === "approved" && (
                  <Badge className="gap-1 text-sm py-1.5 px-3 bg-green-600">
                    <CheckCircle className="h-4 w-4" /> Access approved
                  </Badge>
                )}
              </div>

              {/* Emergency info panel */}
              {showEmergency && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" /> Emergency Information
                    </h3>
                    {!emergency ? (
                      <p className="text-sm text-muted-foreground">No emergency info available.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-1">Blood Group</p>
                          <p className="flex items-center gap-2 text-lg font-bold text-destructive">
                            <Droplets className="h-4 w-4" /> {emergency.blood_group || "N/A"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-1">Emergency Contact</p>
                          <p className="font-semibold text-sm">{emergency.emergency_contact_name || "N/A"}</p>
                          {emergency.emergency_contact_phone && (
                            <a
                              href={`tel:${emergency.emergency_contact_phone}`}
                              className="text-xs text-primary inline-flex items-center gap-1 mt-1"
                            >
                              <Phone className="h-3 w-3" /> {emergency.emergency_contact_phone}
                            </a>
                          )}
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Allergies
                          </p>
                          <p className="text-sm">{emergency.allergies || "None listed"}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                            <HeartPulse className="h-3 w-3" /> Medical Conditions
                          </p>
                          <p className="text-sm">{emergency.medical_conditions || "None listed"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Full records (only after approval) */}
              {accessStatus === "approved" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Full Medical History ({records.length})
                      </h3>
                      <Button asChild size="sm" variant="outline" className="gap-1">
                        <Link to="/doctor/chat">
                          <MessageCircle className="h-4 w-4" /> Chat
                        </Link>
                      </Button>
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">Gender:</span>{" "}
                        <strong>{profile.gender || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">DOB:</span>{" "}
                        <strong>{profile.date_of_birth || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        <strong>{profile.phone || "N/A"}</strong>
                      </div>
                    </div>
                    {records.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {records.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-lg border border-border p-3 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{r.title}</p>
                              <span className="text-xs text-muted-foreground">{r.record_date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {r.record_type.replace("_", " ")}
                            </p>
                            {r.diagnosis && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Diagnosis:</span> {r.diagnosis}
                              </p>
                            )}
                            {r.prescription && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Prescription:</span> {r.prescription}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
