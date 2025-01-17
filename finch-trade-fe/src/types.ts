// login
export interface SignUpData {
  email: string;
  username: string;
  birbName: string;
  friendCode: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// items
export interface Color {
  id: number;
  color: string;
}

export type ListType = "wishlist" | "tradelist";

export interface ItemData {
  userId: number;
  id?: number | null; // todo
  name: string;
  color: number;
  listType: ListType;
}
