import { ItemData, SignUpData, LoginCredentials, ListType } from "./types";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// auth
export const signUp = async (userData: SignUpData) => {
  const response = await fetch(`${BASE_URL}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Sign-up failed");
  return data.token;
};

export const logIn = async (credentials: LoginCredentials) => {
  const response = await fetch(`${BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Login failed");
  return data.token;
};

// colors
export const fetchColors = async () => {
  const response = await fetch(`${BASE_URL}/api/items/colors`, {});
  if (!response.ok) {
    throw new Error("Failed to fetch colors");
  }
  const data = await response.json();
  return data;
};

// items
export const addItem = async (itemData: ItemData) => {
  const response = await fetch(`${BASE_URL}/api/items/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Adding item failed");
  return data;
};

export const fetchAllItems = async () => {
  const response = await fetch(`${BASE_URL}/api/items`);
  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }
  const data = await response.json();
  return data;
};

export const fetchUserItems = async (itemType: ListType, userId: number) => {
  const response = await fetch(
    `${BASE_URL}/api/items/${itemType}?userId=${userId}`,
    {}
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user items");
  }
  const data = await response.json();
  return data;
};

export const removeItem = async (
  itemId: number,
  colorId: number,
  listType: string
) => {
  const response = await fetch(`${BASE_URL}/api/items/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId,
      colorId,
      listType,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to remove the item");
  }
  const data = await response.json();
  return data;
};
