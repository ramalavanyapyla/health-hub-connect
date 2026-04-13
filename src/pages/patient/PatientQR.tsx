import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, AlertTriangle, Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PatientQR = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [p, pr] = await Promise.all([
        supabase.from("patients").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      setPatient(p.data);
      setProfile(pr.data);

      if (p.data) {
        const { data: tokens } = await supabase
          .from("qr_access_tokens")
          .select("*")
          .eq("patient_id", p.data.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);
        if (tokens && tokens.length > 0) {
          setToken(tokens[0]);
        }
      }
    };
    load();
  }, [user]);

  const qrLink = token
    ? `${window.location.origin}/qr-view?token=${token.token}`
    : "";

  const qrUrl = token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrLink)}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(qrLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Emergency QR Code</h1>
        <p className="text-muted-foreground">
          Your permanent QR code for emergency access to your medical information.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Your QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {token ? (
                <>
                  <img src={qrUrl} alt="Emergency QR Code" className="rounded-lg border border-border" />
                  <p className="font-mono text-lg font-bold text-primary">{patient?.patient_uid}</p>
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" /> Permanent • Emergency Access
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    Scanned {token.use_count} time(s)
                  </div>
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <QrCode className="mx-auto h-16 w-16 mb-4 opacity-30" />
                  <p>QR code is being generated...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Emergency Info Preview
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
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  ⚠️ Make sure your profile is up to date so emergency responders have accurate information.
                  This QR code is permanent and linked to your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientQR;
