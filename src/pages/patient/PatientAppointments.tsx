import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CalendarIcon, Clock, Plus, Stethoscope, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

const statusColors: Record<string, string> = {
  booked: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

const PatientAppointments = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Booking form
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from("patients").select("id").eq("user_id", user.id).single();
      setPatient(p);

      if (p) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", p.id)
          .order("appointment_date", { ascending: false });
        setAppointments(appts || []);
      }

      // Load doctors with profiles for booking
      const { data: dps } = await supabase
        .from("doctor_profiles")
        .select("id, specialization, department, user_id");
      if (dps) {
        const userIds = dps.map((d: any) => d.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        setDoctors(dps.map((d: any) => ({
          ...d,
          name: profiles?.find((p: any) => p.user_id === d.user_id)?.full_name || "Doctor",
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const filteredDoctors = specFilter
    ? doctors.filter((d) => d.specialization?.toLowerCase().includes(specFilter.toLowerCase()))
    : doctors;

  const handleBook = async () => {
    if (!patient || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    const { error } = await supabase.from("appointments").insert({
      patient_id: patient.id,
      doctor_id: selectedDoctor,
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      appointment_time: selectedTime,
      specialization: doctor?.specialization || null,
      reason: reason || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Appointment booked successfully!");
      setDialogOpen(false);
      setSelectedDoctor("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setReason("");
      // Reload
      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false });
      setAppointments(appts || []);
    }
    setSubmitting(false);
  };

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" as any })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appointment cancelled");
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  };

  const getDoctorName = (doctorId: string) => {
    return doctors.find((d) => d.id === doctorId)?.name || "Doctor";
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Book and manage your appointments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary border-0 text-primary-foreground">
                <Plus className="h-4 w-4" /> Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Book an Appointment</DialogTitle>
                <DialogDescription>Select a doctor, date, and time for your appointment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Specialization filter */}
                <div className="space-y-2">
                  <Label>Filter by Specialization</Label>
                  <Input
                    placeholder="e.g. Cardiology, Dermatology..."
                    value={specFilter}
                    onChange={(e) => setSpecFilter(e.target.value)}
                  />
                </div>

                {/* Doctor selection */}
                <div className="space-y-2">
                  <Label>Select Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No doctors found</div>
                      ) : (
                        filteredDoctors.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            Dr. {d.name} — {d.specialization || "General"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date picker */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time selection */}
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {timeSlots.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={selectedTime === t ? "default" : "outline"}
                        size="sm"
                        className={cn("text-xs", selectedTime === t && "gradient-primary border-0 text-primary-foreground")}
                        onClick={() => setSelectedTime(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label>Reason for Visit</Label>
                  <Textarea
                    placeholder="Describe your reason for the appointment..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleBook} className="gradient-primary border-0 text-primary-foreground" disabled={submitting}>
                  {submitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Stethoscope className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p>No appointments yet. Book your first appointment!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <Card key={appt.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Dr. {getDoctorName(appt.doctor_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appt.appointment_date), "MMMM d, yyyy")} at {appt.appointment_time?.slice(0, 5)}
                      </p>
                      {appt.specialization && (
                        <p className="text-xs text-muted-foreground">{appt.specialization}</p>
                      )}
                      {appt.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{appt.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[appt.status] || ""}>
                      {appt.status.replace("_", " ")}
                    </Badge>
                    {appt.status === "booked" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => cancelAppointment(appt.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointments;