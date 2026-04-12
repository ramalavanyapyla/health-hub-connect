import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Heart, Phone, User, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface EmergencyData {
  access_level: string;
  patient_uid: string;
  name: string;
  blood_group: string;
  gender: string;
  date_of_birth: string;
  emergency_contact: { name: string; phone: string };
  phone?: string;
  address?: string;
  medical_records?: any[];
}

const QRViewer = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<EmergencyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("No access token provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qr-access?token=${encodeURIComponent(token)}`,
          { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load patient data");
        } else {
          setData(await res.json());
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-card">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">UPMRS Patient Record</h1>
            <Badge variant={data.access_level === "emergency" ? "destructive" : "default"}>
              {data.access_level === "emergency" ? "🚨 Emergency Access" : "Full Access"}
            </Badge>
          </div>
        </div>

        {/* Patient Info */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Name</p><p className="font-medium">{data.name || "N/A"}</p></div>
              <div><p className="text-muted-foreground">Patient ID</p><p className="font-mono font-semibold text-primary">{data.patient_uid}</p></div>
              <div>
                <p className="text-muted-foreground">Blood Group</p>
                <p className="font-bold text-destructive text-lg">{data.blood_group || "N/A"}</p>
              </div>
              <div><p className="text-muted-foreground">Gender</p><p className="font-medium">{data.gender || "N/A"}</p></div>
              <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{data.date_of_birth || "N/A"}</p></div>
              {data.phone && <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{data.phone}</p></div>}
            </div>
            {data.address && (
              <div className="mt-4 text-sm">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{data.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="shadow-card border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Phone className="h-5 w-5" /> Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium text-lg">{data.emergency_contact?.name || "Not set"}</p>
            {data.emergency_contact?.phone && (
              <a href={`tel:${data.emergency_contact.phone}`} className="text-primary font-semibold text-lg underline">
                {data.emergency_contact.phone}
              </a>
            )}
          </CardContent>
        </Card>

        {/* Medical Records (full access only) */}
        {data.access_level === "full" && data.medical_records && data.medical_records.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.medical_records.map((rec: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{rec.title}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(rec.record_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs mb-2">{rec.record_type.replace("_", " ")}</Badge>
                  {rec.diagnosis && <p className="text-sm"><strong>Diagnosis:</strong> {rec.diagnosis}</p>}
                  {rec.prescription && <p className="text-sm"><strong>Rx:</strong> {rec.prescription}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by UPMRS — Unified Patient Medical Record System
        </p>
      </div>
    </div>
  );
};

export default QRViewer;
