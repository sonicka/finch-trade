import { JwtPayload } from "jwt-decode";

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

// users
export interface LoggedInUser extends JwtPayload, User {
  id: number;
  email: string;
}

export interface User {
  username: string;
  birbName: string;
  friendCode: string;
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
  name: string;
  color: number;
  listType: ListType;
  userId: number;
}

export interface ChosenItem {
  id: number;
  colorId: number;
}

export interface TradeItem {
  userId: number;
  itemId: number;
  colorId: number;
}

export interface Trader {
  tradeId: number;
  userId: number;
  wants: TradeItem[];
  has: TradeItem[];
  recentlyTraded: boolean;
  status?: string;
  requestedByMe?: boolean;
  finishedByMe?: boolean;
  requestedTrade?: RequestedTrade;
}

export interface RequestedTrade {
  userId1: number;
  itemId1: number;
  colorId1: number;
  userId2: number;
  itemId2: number;
  colorId2: number;
}

export interface PastGift {
  id: number;
  userId: number;
  itemId: number;
  colorId: number;
  archivedAt: string;
  type: "gift";
}

export interface PastTrade {
  id: number;
  tradeId: number;
  userId1: number;
  itemId1: number;
  colorId1: number;
  userId2: number;
  itemId2: number;
  colorId2: number;
  archivedAt: string;
  status: string;
  type: "trade";
}

export type PastTrades = (PastGift | PastTrade)[];
