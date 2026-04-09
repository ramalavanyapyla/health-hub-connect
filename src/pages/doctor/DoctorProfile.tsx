import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DoctorProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personalForm, setPersonalForm] = useState({ full_name: "", phone: "" });
  const [doctorForm, setDoctorForm] = useState({ specialization: "", license_number: "", department: "" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single(),
      supabase.from("doctor_profiles").select("specialization, license_number, department").eq("user_id", user.id).single(),
    ]).then(([p, d]) => {
      if (p.data) setPersonalForm({ full_name: p.data.full_name || "", phone: p.data.phone || "" });
      if (d.data) setDoctorForm({
        specialization: d.data.specialization || "",
        license_number: d.data.license_number || "",
        department: d.data.department || "",
      });
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      supabase.from("profiles").update(personalForm).eq("user_id", user.id),
      supabase.from("doctor_profiles").update(doctorForm).eq("user_id", user.id),
    ]);
    toast.success("Profile updated!");
    setLoading(false);
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Doctor Profile</h1>
        <Card className="shadow-card">
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={personalForm.full_name} onChange={(e) => setPersonalForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={personalForm.phone} onChange={(e) => setPersonalForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>Professional Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={doctorForm.specialization} onChange={(e) => setDoctorForm((f) => ({ ...f, specialization: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={doctorForm.license_number} onChange={(e) => setDoctorForm((f) => ({ ...f, license_number: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={doctorForm.department} onChange={(e) => setDoctorForm((f) => ({ ...f, department: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
        <Button onClick={handleSave} className="gradient-primary border-0 text-primary-foreground" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
