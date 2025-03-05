import { useState, useEffect } from "react";
import { fetchUser } from "../api/api";
import { User } from "../types";

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
