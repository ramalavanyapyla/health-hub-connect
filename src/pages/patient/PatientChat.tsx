import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import DoctorPatientChat from "@/components/DoctorPatientChat";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

type DoctorDirectoryEntry = {
  doctor_id: string;
  user_id: string;
  full_name: string | null;
  specialization: string | null;
  department: string | null;
  license_number: string | null;
  phone: string | null;
};

const PatientChat = () => {
  const { user } = useAuth();
  const [approvedDoctors, setApprovedDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).maybeSingle();
      if (!patient) return;

      const { data: access } = await supabase
        .from("doctor_patient_access")
        .select("id, doctor_id, status")
        .eq("patient_id", patient.id)
        .eq("status", "approved");

      if (access && access.length > 0) {
        const doctorIds = access.map((a: any) => a.doctor_id);
        const { data: doctors } = await supabase.rpc("get_doctor_directory_entries", {
          _doctor_ids: doctorIds,
        });

        const doctorMap = new Map(
          ((doctors as DoctorDirectoryEntry[] | null) || []).map((doctor) => [doctor.doctor_id, doctor])
        );

        setApprovedDoctors(
          access
            .map((entry: any) => {
              const doctor = doctorMap.get(entry.doctor_id);
              if (!doctor) return null;

              return {
                ...entry,
                doctor_profiles: doctor,
                doctorName: doctor.full_name || "Doctor",
                doctorUserId: doctor.user_id,
              };
            })
            .filter(Boolean)
        );
      } else {
        setApprovedDoctors([]);
      }
    };
    load();
  }, [user]);

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with your approved doctors.</p>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {approvedDoctors.length === 0 && (
              <p className="text-sm text-muted-foreground">No approved doctors to chat with yet.</p>
            )}
            {approvedDoctors.map((d) => (
              <Card
                key={d.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedDoctor?.id === d.id ? "border-primary" : ""}`}
                onClick={() => setSelectedDoctor(d)}
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{d.doctorName}</p>
                    <p className="text-xs text-muted-foreground">{d.doctor_profiles?.specialization || "General"}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            {selectedDoctor ? (
              <DoctorPatientChat otherUserId={selectedDoctor.doctorUserId} otherUserName={selectedDoctor.doctorName} />
            ) : (
              <Card className="shadow-card flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground text-sm">Select a doctor to start chatting</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientChat;
