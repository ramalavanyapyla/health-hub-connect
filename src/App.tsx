import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import QRViewer from "./pages/QRViewer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientRecords from "./pages/patient/PatientRecords";
import PatientQR from "./pages/patient/PatientQR";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientDoctorAccess from "./pages/patient/PatientDoctorAccess";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAddRecord from "./pages/doctor/DoctorAddRecord";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminHospitals from "./pages/admin/AdminHospitals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/qr-view" element={<QRViewer />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/records" element={<ProtectedRoute><PatientRecords /></ProtectedRoute>} />
            <Route path="/patient/qr" element={<ProtectedRoute><PatientQR /></ProtectedRoute>} />
            <Route path="/patient/profile" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
            <Route path="/patient/doctors" element={<ProtectedRoute><PatientDoctorAccess /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><DoctorPatients /></ProtectedRoute>} />
            <Route path="/doctor/records" element={<ProtectedRoute requiredRole="doctor"><DoctorAddRecord /></ProtectedRoute>} />
            <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="doctor"><DoctorProfile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminPatients /></ProtectedRoute>} />
            <Route path="/admin/hospitals" element={<ProtectedRoute requiredRole="admin"><AdminHospitals /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
