import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserProvider";
import UserHeader from "./UserHeader";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useUser();

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
