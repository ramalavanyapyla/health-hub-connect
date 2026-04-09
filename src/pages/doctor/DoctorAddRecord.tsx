import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";

const recordTypes = Constants.public.Enums.record_type;

const DoctorAddRecord = () => {
  const { user } = useAuth();
  const [patientUid, setPatientUid] = useState("");
  const [form, setForm] = useState({
    title: "",
    record_type: "diagnosis" as string,
    diagnosis: "",
    prescription: "",
    description: "",
    notes: "",
    record_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    // Find patient
    const { data: patient } = await supabase.from("patients").select("id").eq("patient_uid", patientUid.trim()).single();
    if (!patient) {
      toast.error("Patient not found. Please check the Patient ID.");
      setLoading(false);
      return;
    }

    // Find doctor profile
    const { data: doctor } = await supabase.from("doctor_profiles").select("id").eq("user_id", user.id).single();

    const { error } = await supabase.from("medical_records").insert({
      patient_id: patient.id,
      doctor_id: doctor?.id || null,
      title: form.title,
      record_type: form.record_type as any,
      diagnosis: form.diagnosis || null,
      prescription: form.prescription || null,
      description: form.description || null,
      notes: form.notes || null,
      record_date: form.record_date,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Medical record added successfully!");
      setPatientUid("");
      setForm({
        title: "",
        record_type: "diagnosis",
        diagnosis: "",
        prescription: "",
        description: "",
        notes: "",
        record_date: new Date().toISOString().split("T")[0],
      });
    }
    setLoading(false);
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Add Medical Record</h1>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-card">
            <CardHeader><CardTitle>Patient & Record Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient ID *</Label>
                  <Input placeholder="UPMRS-XXXXXXXX" value={patientUid} onChange={(e) => setPatientUid(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Record Date *</Label>
                  <Input type="date" value={form.record_date} onChange={(e) => update("record_date", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input placeholder="e.g., Annual Checkup" value={form.title} onChange={(e) => update("title", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Record Type</Label>
                  <Select value={form.record_type} onValueChange={(v) => update("record_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {recordTypes.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Textarea placeholder="Enter diagnosis..." value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prescription</Label>
                <Textarea placeholder="Enter prescription..." value={form.prescription} onChange={(e) => update("prescription", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Additional details..." value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Internal notes..." value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
              <Button type="submit" className="gradient-primary border-0 text-primary-foreground" disabled={loading}>
                {loading ? "Saving..." : "Add Record"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAddRecord;
