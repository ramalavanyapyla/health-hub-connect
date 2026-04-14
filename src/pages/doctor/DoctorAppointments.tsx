import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  booked: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: dp } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setDoctorProfile(dp);

      if (dp) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("*, patients(user_id, patient_uid)")
          .eq("doctor_id", dp.id)
          .order("appointment_date", { ascending: true });
        setAppointments(appts || []);

        // Fetch patient profiles
        if (appts && appts.length > 0) {
          const userIds = appts.map((a: any) => a.patients?.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, full_name, phone")
              .in("user_id", userIds);
            const map: Record<string, any> = {};
            profiles?.forEach((p: any) => { map[p.user_id] = p; });
            setPatientProfiles(map);
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: status as any })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Appointment marked as ${status}`);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter((a) => a.appointment_date === todayStr && a.status === "booked");
  const upcomingCount = appointments.filter((a) => a.appointment_date >= todayStr && a.status === "booked").length;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Appointments</h1>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              No appointments found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((appt) => {
              const patientProfile = patientProfiles[appt.patients?.user_id];
              return (
                <Card key={appt.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{patientProfile?.full_name || "Patient"}</p>
                          <p className="text-xs font-mono text-muted-foreground">{appt.patients?.patient_uid}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appt.appointment_date), "MMM d, yyyy")} at {appt.appointment_time?.slice(0, 5)}
                          </p>
                          {appt.reason && <p className="text-xs text-muted-foreground italic mt-1">{appt.reason}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[appt.status] || ""}>
                          {appt.status.replace("_", " ")}
                        </Badge>
                        {appt.status === "booked" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => updateStatus(appt.id, "completed")}
                            >
                              <CheckCircle className="h-3 w-3" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => updateStatus(appt.id, "no_show")}
                            >
                              <XCircle className="h-3 w-3" /> No Show
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;