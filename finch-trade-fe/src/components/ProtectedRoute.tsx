import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import UserHeader from "./UserHeader";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="pt-32">
      <UserHeader />
      {children}
    </div>
  );
};

export default ProtectedRoute;
