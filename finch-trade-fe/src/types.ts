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
  id: number;
  name: string;
}

export interface UserItem {
  user_id: number;
  item_id: number;
  color: number;
  name: string;
}

export interface Color {
  id: number;
  color: string;
}

export enum ListTypeEnum {
  Wishlist = "wishlist",
  Tradelist = "tradelist",
}

export type ListType = `${ListTypeEnum}`;

export interface ItemData {
  userId: number;
  name: string;
  color: number;
  listType: ListType;
}
