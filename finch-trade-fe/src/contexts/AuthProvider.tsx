import { createContext, useContext, useState, useEffect, JSX } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface Props {
  children: JSX.Element;
}

const AuthContext = createContext({} as any);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  console.log("user", user);

  // Check if the user is logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        console.error("Token decoding failed:", error);
      }
    }
  }, []);

  const login = (token: string) => {
    const decoded = jwtDecode(token);
    setUser(decoded);
    localStorage.setItem("authToken", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
