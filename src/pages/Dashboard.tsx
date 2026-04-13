import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (roles.includes("admin")) {
    return <Navigate to="/admin" replace />;
  }

  if (roles.includes("doctor")) {
    return <Navigate to="/doctor" replace />;
  }

  // Default to patient portal (all users with a role go here)
  return <Navigate to="/patient" replace />;
};

export default Dashboard;
