import { useState, useEffect } from "react";
import { editUser, fetchUser } from "../api/api";
import { User } from "../types";

// todo caching
export const useUserById = (userId: number) => {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetchUser(userId);
        setUser(response);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    if (userId) getUser();
  }, [userId]);

  return user;
};

export const useEditUser = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const edit = async (
    userId: number,
    data: { email?: string; password?: string; passwordAgain?: string },
  ) => {
    try {
      const response = await editUser(userId, data);
      setSuccess(response.message);
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        setSuccess("");
      } else {
        setError("Failed to edit the user.");
      }
      console.error("Error editing user:", err);
    }
  };

  return { edit, error, success };
};
