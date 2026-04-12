import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, AlertTriangle, RefreshCw, Shield, Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PatientQR = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeToken, setActiveToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessLevel, setAccessLevel] = useState<"emergency" | "full">("emergency");

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
        // Load active token
        const { data: tokens } = await supabase
          .from("qr_access_tokens")
          .select("*")
          .eq("patient_id", p.data.id)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (tokens && tokens.length > 0) {
          setActiveToken(tokens[0]);
          setAccessLevel(tokens[0].access_level as "emergency" | "full");
        }
      }
    };
    load();
  }, [user]);

  const generateToken = async () => {
    if (!patient || !user) return;
    setLoading(true);
    try {
      // Deactivate old tokens
      await supabase
        .from("qr_access_tokens")
        .update({ is_active: false })
        .eq("patient_id", patient.id)
        .eq("created_by", user.id);

      // Create new token
      const { data, error } = await supabase
        .from("qr_access_tokens")
        .insert({
          patient_id: patient.id,
          access_level: accessLevel,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveToken(data);
      toast.success("New QR code generated!");
    } catch (e: any) {
      toast.error("Failed to generate QR code: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const qrLink = activeToken
    ? `${window.location.origin}/qr-view?token=${activeToken.token}`
    : "";

  const qrUrl = activeToken
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
          Generate a secure, time-limited QR code for emergency access to your medical information.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* QR Code Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> Your Secure QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {activeToken ? (
                <>
                  <img src={qrUrl} alt="Emergency QR Code" className="rounded-lg border border-border" />
                  <p className="font-mono text-lg font-bold text-primary">{patient?.patient_uid}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Expires: {format(new Date(activeToken.expires_at), "MMM d, yyyy h:mm a")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    Scanned {activeToken.use_count} time(s)
                  </div>
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <QrCode className="mx-auto h-16 w-16 mb-4 opacity-30" />
                  <p>No active QR code. Generate one below.</p>
                </div>
              )}

              {/* Access Level Toggle */}
              <div className="flex gap-2 w-full">
                <Button
                  variant={accessLevel === "emergency" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => setAccessLevel("emergency")}
                >
                  <AlertTriangle className="h-3 w-3" /> Emergency
                </Button>
                <Button
                  variant={accessLevel === "full" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => setAccessLevel("full")}
                >
                  <Shield className="h-3 w-3" /> Full Access
                </Button>
              </div>

              <Button onClick={generateToken} disabled={loading || !patient} className="w-full gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {activeToken ? "Regenerate QR Code" : "Generate QR Code"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {accessLevel === "emergency"
                  ? "Emergency mode: Shows only name, blood group, and emergency contacts."
                  : "Full access: Shows complete profile and medical records."}
              </p>
            </CardContent>
          </Card>

          {/* Emergency Info Card */}
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
                  QR codes expire after 24 hours for security.
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
