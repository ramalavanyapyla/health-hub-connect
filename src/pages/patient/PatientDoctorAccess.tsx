import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";

const PatientDoctorAccess = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user) return;
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (!patient) return;

    const { data } = await supabase
      .from("doctor_patient_access")
      .select("*")
      .eq("patient_id", patient.id)
      .order("requested_at", { ascending: false });

    if (data) {
      // Fetch doctor profiles and user profiles
      const doctorIds = data.map((d: any) => d.doctor_id);
      const { data: doctors } = await supabase
        .from("doctor_profiles")
        .select("*, profiles:user_id(full_name)")
        .in("id", doctorIds);

      setRequests(data.map((req: any) => ({
        ...req,
        doctor: doctors?.find((d: any) => d.id === req.doctor_id),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [user]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("doctor_patient_access")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Doctor access approved!" : "Access request rejected");
    loadRequests();
  };

  const revokeAccess = async (id: string) => {
    const { error } = await supabase
      .from("doctor_patient_access")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Doctor access revoked");
    loadRequests();
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Doctor Access</h1>
        <p className="text-muted-foreground">
          Manage which doctors can access your medical records. You can approve, reject, or revoke access at any time.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              <UserCheck className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>No access requests yet. Doctors can request access using your Patient ID.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      Dr. {req.doctor?.profiles?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {req.doctor?.specialization || "General"} • {req.doctor?.department || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50" onClick={() => updateStatus(req.id, "approved")}>
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10" onClick={() => updateStatus(req.id, "rejected")}>
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {req.status === "approved" && (
                      <>
                        <Badge className="bg-green-600 gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>
                        <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => revokeAccess(req.id)}>
                          <Trash2 className="h-4 w-4" /> Revoke
                        </Button>
                      </>
                    )}
                    {req.status === "rejected" && (
                      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDoctorAccess;
