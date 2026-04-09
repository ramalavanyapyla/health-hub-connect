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

  if (roles.includes("doctor") || roles.includes("admin")) {
    return <Navigate to="/doctor" replace />;
  }

  return <Navigate to="/patient" replace />;
};

export default Dashboard;
