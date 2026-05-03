import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, AlertTriangle, Shield, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAppBaseUrl } from "@/lib/app-url";

const appBaseUrl = getAppBaseUrl();

const PatientQR = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const ensurePatient = async () => {
      // Fetch patient; if missing (e.g. older OAuth user), create it.
      let { data: p } = await supabase.from("patients").select("*").eq("user_id", user.id).maybeSingle();
      if (!p) {
        const { data: created } = await supabase
          .from("patients")
          .insert({ user_id: user.id })
          .select()
          .single();
        p = created;
      }
      const { data: pr } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      setPatient(p);
      setProfile(pr);
    };

    void ensurePatient();
    return () => { cancelled = true; };
  }, [user]);

  const qrLink = useMemo(
    () => (patient?.id ? `${appBaseUrl}/emergency/${patient.id}` : ""),
    [patient?.id]
  );

  useEffect(() => {
    if (!qrLink) return;
    QRCode.toDataURL(qrLink, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [qrLink]);

  const copyLink = () => {
    navigator.clipboard.writeText(qrLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${patient?.patient_uid || "emergency"}-qr.png`;
    a.click();
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
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Emergency QR Code" className="rounded-lg border border-border" width={280} height={280} />
              ) : (
                <div className="h-[280px] w-[280px] rounded-lg border border-border bg-muted/40" />
              )}
              <p className="font-mono text-lg font-bold text-primary">{patient?.patient_uid || "—"}</p>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" /> Permanent • Emergency Access
              </Badge>
              {qrLink && (
                <p className="break-all text-center text-xs text-muted-foreground">{qrLink}</p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink} disabled={!qrLink} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadQr} disabled={!qrDataUrl} className="gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
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
                  <p className="text-muted-foreground">Allergies</p>
                  <p className="font-medium">{profile?.allergies || "Not set"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conditions</p>
                  <p className="font-medium">{profile?.medical_conditions || "Not set"}</p>
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
