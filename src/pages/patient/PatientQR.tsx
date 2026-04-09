import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, AlertTriangle } from "lucide-react";

const PatientQR = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("patients").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]).then(([p, pr]) => {
      setPatient(p.data);
      setProfile(pr.data);
    });
  }, [user]);

  const qrData = patient ? JSON.stringify({
    id: patient.patient_uid,
    name: profile?.full_name,
    blood: profile?.blood_group,
    emergency: profile?.emergency_contact_phone,
  }) : "";

  // Simple QR using external API
  const qrUrl = patient
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`
    : "";

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Emergency QR Code</h1>
        <p className="text-muted-foreground">
          Show this QR code in emergencies for instant access to your critical medical information.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Your QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {patient ? (
                <>
                  <img src={qrUrl} alt="Emergency QR Code" className="rounded-lg border border-border" />
                  <p className="font-mono text-lg font-bold text-primary">{patient.patient_uid}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Emergency Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile?.full_name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Group</p>
                  <p className="font-medium text-destructive">{profile?.blood_group || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{profile?.date_of_birth || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{profile?.gender || "Not set"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">
                    {profile?.emergency_contact_name || "Not set"}
                    {profile?.emergency_contact_phone && ` — ${profile.emergency_contact_phone}`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure your profile is up to date so emergency responders have accurate information.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientQR;
