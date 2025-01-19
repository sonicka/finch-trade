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

export interface Item {
  user_id: number;
  item_id: number;
  color: number;
  name: string;
}

export interface Color {
  id: number;
  color: string;
}

export type ListType = "wishlist" | "tradelist"; // todo make a usable constant out of this

export interface ItemData {
  userId: number;
  id?: number | null; // todo
  name: string;
  color: number;
  listType: ListType;
}
