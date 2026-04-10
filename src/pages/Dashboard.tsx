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

  // No role assigned yet — redirect to role selection (OAuth users)
  if (roles.length === 0) {
    return <Navigate to="/select-role" replace />;
  }

  if (roles.includes("admin")) {
    return <Navigate to="/admin" replace />;
  }

  if (roles.includes("doctor")) {
    return <Navigate to="/doctor" replace />;
  }

  return <Navigate to="/patient" replace />;
};

export default Dashboard;
