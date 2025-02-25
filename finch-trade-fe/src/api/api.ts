import {
  Color,
  Item,
  ItemData,
  ListType,
  LoginCredentials,
  SignUpData,
  User,
  UserItem,
} from "../types";
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

// users
export const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {});
  if (!response.ok) {
    throw new Error("Failed to fetch the user");
  }
  const data = await response.json();
  return data;
};

// colors
export const fetchColors = async (): Promise<Color[]> => {
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

export const fetchAllItems = async (): Promise<Item[]> => {
  const response = await fetch(`${BASE_URL}/api/items`);
  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }
  const data = await response.json();
  return data;
};

export const fetchUserItems = async (
  itemType: ListType,
  userId: number
): Promise<UserItem[]> => {
  const response = await fetch(
    `${BASE_URL}/api/items/${itemType}?userId=${userId}`,
    {}
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user items");
  }
  const data = await response.json();
  return data as UserItem[];
};

export const removeItem = async (
  itemId: number,
  colorId: number,
  listType: string,
  userId: number
) => {
  const response = await fetch(`${BASE_URL}/api/items/remove`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId,
      colorId,
      listType,
      userId,
    }),
  });
  if (!response.ok) {
    throw new Error("Failed to remove the item");
  }
  const data = await response.json();
  return data;
};

export const fetchItemById = async (itemId: number) => {
  const response = await fetch(`${BASE_URL}/api/items/item/${itemId}}`, {});
  if (!response.ok) {
    throw new Error("Failed to fetch item");
  }
  const data = await response.json();
  return data;
};

// trades
export const fetchTrades = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/api/trades?userId=${userId}`, {});
  if (!response.ok) {
    throw new Error("Failed to fetch trades");
  }
  const data = await response.json();
  return data;
};

export const requestTrade = async (
  userId1: number,
  userId2: number,
  chosenItems: {
    my: { id: number; colorId: number } | null;
    their: { id: number; colorId: number } | null;
  }
) => {
  const response = await fetch(
    `${BASE_URL}/api/trades/requestTrade?userId1=${userId1}&userId2=${userId2}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chosenItems }),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to request trade");
  }
  const data = await response.json();
  return data;
};

export const finishTrade = async (tradeId: number, userId: number) => {
  const response = await fetch(
    `${BASE_URL}/api/trades/finishTrade/${tradeId}?userId=${userId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to finish trade");
  }
  const data = await response.json();
  return data;
};
