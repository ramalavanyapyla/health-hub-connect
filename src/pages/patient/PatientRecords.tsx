import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const typeColors: Record<string, string> = {
  diagnosis: "bg-primary/10 text-primary",
  prescription: "bg-accent/10 text-accent",
  lab_report: "bg-destructive/10 text-destructive",
  imaging: "bg-secondary text-secondary-foreground",
  discharge_summary: "bg-muted text-muted-foreground",
  vaccination: "bg-primary/20 text-primary",
  surgery: "bg-destructive/20 text-destructive",
  other: "bg-muted text-muted-foreground",
};

const PatientRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
      if (patient) {
        const { data } = await supabase.from("medical_records").select("*").eq("patient_id", patient.id).order("record_date", { ascending: false });
        setRecords(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Medical Records</h1>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No medical records found. Your records will appear here when a healthcare provider adds them.
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
            {records.map((rec) => (
              <div key={rec.id} className="relative flex gap-4 pb-6">
                <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background" />
                <Card className="flex-1 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <Badge variant="secondary" className={typeColors[rec.record_type] || ""}>
                        {rec.record_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(rec.record_date), "MMMM d, yyyy")}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {rec.diagnosis && <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>}
                    {rec.prescription && <p><strong>Prescription:</strong> {rec.prescription}</p>}
                    {rec.description && <p>{rec.description}</p>}
                    {rec.notes && <p className="text-muted-foreground italic">{rec.notes}</p>}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientRecords;
