import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import DoctorPatientChat from "@/components/DoctorPatientChat";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const DoctorChat = () => {
  const { user } = useAuth();
  const [approvedPatients, setApprovedPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: dp } = await supabase.from("doctor_profiles").select("id").eq("user_id", user.id).single();
      if (!dp) return;

      const { data: access } = await supabase
        .from("doctor_patient_access")
        .select("*, patients(*)")
        .eq("doctor_id", dp.id)
        .eq("status", "approved");

      if (access) {
        const patientUserIds = access.map((a: any) => a.patients?.user_id).filter(Boolean);
        if (patientUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("user_id", patientUserIds);

          setApprovedPatients(
            access.map((a: any) => ({
              ...a,
              patientName: profiles?.find((p: any) => p.user_id === a.patients?.user_id)?.full_name || "Patient",
              patientUserId: a.patients?.user_id,
            }))
          );
        }
      }
    };
    load();
  }, [user]);

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with your approved patients.</p>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {approvedPatients.length === 0 && (
              <p className="text-sm text-muted-foreground">No approved patients to chat with yet.</p>
            )}
            {approvedPatients.map((p) => (
              <Card
                key={p.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedPatient?.id === p.id ? "border-primary" : ""}`}
                onClick={() => setSelectedPatient(p)}
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{p.patientName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.patients?.patient_uid}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <DoctorPatientChat otherUserId={selectedPatient.patientUserId} otherUserName={selectedPatient.patientName} />
            ) : (
              <Card className="shadow-card flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground text-sm">Select a patient to start chatting</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorChat;
