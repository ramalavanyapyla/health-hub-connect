import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import NotificationsPanel from "@/components/NotificationsPanel";
import {
  ShieldCheck, LayoutDashboard, FileText, User, LogOut,
  Menu, X, Stethoscope, Users, Building2, QrCode, CalendarDays, MessageCircle
} from "lucide-react";
import AIChatBot from "@/components/AIChatBot";

interface Props {
  children: ReactNode;
  role: "patient" | "doctor" | "admin";
}

const patientLinks = [
  { to: "/patient", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patient/records", icon: FileText, label: "Medical Records" },
  { to: "/patient/appointments", icon: CalendarDays, label: "Appointments" },
  { to: "/patient/qr", icon: QrCode, label: "Emergency QR" },
  { to: "/patient/doctors", icon: Stethoscope, label: "Doctor Access" },
  { to: "/patient/chat", icon: MessageCircle, label: "Messages" },
  { to: "/patient/profile", icon: User, label: "Profile" },
];

const doctorLinks = [
  { to: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/doctor/patients", icon: Users, label: "Patients" },
  { to: "/doctor/appointments", icon: CalendarDays, label: "Appointments" },
  { to: "/doctor/records", icon: FileText, label: "Add Record" },
  { to: "/doctor/chat", icon: MessageCircle, label: "Messages" },
  { to: "/doctor/profile", icon: User, label: "Profile" },
];

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/patients", icon: Users, label: "Patients" },
  { to: "/admin/hospitals", icon: Building2, label: "Hospitals" },
];

const DashboardLayout = ({ children, role }: Props) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = role === "patient" ? patientLinks : role === "admin" ? adminLinks : doctorLinks;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">UPMRS</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="flex h-16 items-center gap-4 border-b border-border px-4 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold capitalize">
            {role === "patient" ? "Patient Portal" : role === "admin" ? "Admin Portal" : "Hospital Portal"}
          </h2>
          <div className="ml-auto">
            <NotificationsPanel />
          </div>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>
      {role === "patient" && <AIChatBot />}
    </div>
  );
};

export default DashboardLayout;
