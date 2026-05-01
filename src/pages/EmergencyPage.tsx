import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Droplets, HeartPulse, Phone, ShieldAlert, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type EmergencyProfile = {
  full_name: string | null;
  blood_group: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};

const EmergencyPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [data, setData] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmergencyProfile = async () => {
      if (!patientId) {
        setError("Missing patient reference.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("public_emergency_profiles")
        .select("full_name, blood_group, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (error) {
        setError("Unable to load emergency information.");
      } else if (!data) {
        setError("Emergency information was not found for this patient.");
      } else {
        setData(data);
      }

      setLoading(false);
    };

    void loadEmergencyProfile();
  }, [patientId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-lg shadow-card">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Emergency info unavailable</h1>
              <p className="text-muted-foreground">{error ?? "This emergency profile is currently unavailable."}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/">Go back home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="gradient-hero overflow-hidden rounded-lg p-6 text-primary-foreground shadow-card md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit bg-secondary/20 text-primary-foreground hover:bg-secondary/20">
                Emergency Medical Access
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold md:text-4xl">{data.full_name || "Unknown patient"}</h1>
                <p className="max-w-2xl text-sm text-primary-foreground/80 md:text-base">
                  Live emergency information for first responders. This page only shows the limited fields approved for urgent care access.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3">
              <ShieldAlert className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Status</p>
                <p className="text-sm font-semibold">Dynamic QR linked</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserRound className="h-5 w-5 text-primary" /> Critical patient details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Blood group</p>
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{data.blood_group || "Not provided"}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Emergency contact</p>
                  <p className="text-base font-semibold">{data.emergency_contact_name || "Not provided"}</p>
                  {data.emergency_contact_phone ? (
                    <a className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline" href={`tel:${data.emergency_contact_phone}`}>
                      <Phone className="h-4 w-4" />
                      {data.emergency_contact_phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Phone not provided</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">Allergies</h2>
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">{data.allergies || "No allergies listed."}</p>
                </div>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <h2 className="text-lg font-semibold">Medical conditions</h2>
                  </div>
                  <p className="text-sm leading-6 text-foreground/90">{data.medical_conditions || "No medical conditions listed."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">Responder notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                This emergency page is public by design, but it only exposes the minimum information needed for urgent care.
              </p>
              <p>
                Any patient profile changes update this page automatically, so the same QR code always shows the latest emergency details.
              </p>
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-foreground">
                <p className="font-medium">Need more information?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contact the listed emergency contact or access the patient portal with proper authorization.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default EmergencyPage;