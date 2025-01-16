import { SignUpData, LoginCredentials } from "./types";

// auth
export const signUp = async (userData: SignUpData) => {
  const response = await fetch("http://localhost:5000/api/users/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Sign-up failed");
  return data.token;
};

export const logIn = async (credentials: LoginCredentials) => {
  const response = await fetch("http://localhost:5000/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Login failed");
  return data.token;
};
