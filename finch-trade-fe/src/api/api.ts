import {
  ChosenItem,
  Color,
  Item,
  ItemData,
  ListType,
  LoginCredentials,
  PastTrades,
  SignUpData,
  Trader,
  User,
  UserItem,
} from '../shared/types';
import { apiFetch } from './apiFetch';

// auth
export const signUp = async (userData: SignUpData) => {
  const data = await apiFetch('/api/users/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return (data as { token: string }).token;
};

export const logIn = async (credentials: LoginCredentials) => {
  const data = await apiFetch('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return (data as { token: string }).token;
};

// users
export const fetchUser = async (userId: number): Promise<User> => {
  return (await apiFetch(`/api/users/${userId}`)) as User;
};

export const editUser = async (
  userId: number,
  params: { email?: string; password?: string; passwordAgain?: string },
): Promise<{ message: string }> => {
  return (await apiFetch(`/api/users/${userId}`, {
    method: 'POST',
    body: JSON.stringify(params),
  })) as { message: string };
};

// colors
export const fetchColors = async (): Promise<Color[]> => {
  return (await apiFetch('/api/items/colors')) as Color[];
};

// items
export const addItem = async (
  itemData: Omit<ItemData, 'userId'>,
): Promise<{ message: string; itemId: number }> => {
  return (await apiFetch('/api/items/add', {
    method: 'POST',
    body: JSON.stringify(itemData),
  })) as { message: string; itemId: number };
};

export const fetchAllItems = async (): Promise<Item[]> => {
  return (await apiFetch('/api/items')) as Item[];
};

// userId is now implicit (taken from the auth token server-side), so it's
// no longer a parameter here.
export const fetchUserItems = async (
  itemType: ListType,
): Promise<UserItem[]> => {
  return (await apiFetch(`/api/items/${itemType}`)) as UserItem[];
};

export const deleteItem = async (
  itemId: number,
  colorId: number,
  listType: string,
): Promise<{ message: string }> => {
  return (await apiFetch('/api/items/remove', {
    method: 'DELETE',
    body: JSON.stringify({ itemId, colorId, listType }),
  })) as { message: string };
};

export const fetchItemById = async (itemId: number) => {
  return apiFetch(`/api/items/item/${itemId}`);
};

// trades
// userId is implicit from the token now.
export const fetchTrades = async (): Promise<Trader[]> => {
  return (await apiFetch('/api/trades')) as Trader[];
};

export const fetchPastTrades = async (): Promise<PastTrades> => {
  return (await apiFetch('/api/trades/past')) as PastTrades;
};

// userId1 ("me") is implicit from the token; userId2 is the other party.
export const requestTrade = async (
  userId2: number,
  chosenItems: { my: ChosenItem | null; their: ChosenItem | null },
) => {
  return apiFetch(`/api/trades/requestTrade?userId2=${userId2}`, {
    method: 'POST',
    body: JSON.stringify({ chosenItems }),
  });
};

export const finishTrade = async (tradeId: number) => {
  return apiFetch(`/api/trades/finishTrade/${tradeId}`, {
    method: 'POST',
  });
};

export const finishGifting = async (
  giftedBy: number,
  giftedTo: number,
  itemId: number,
  colorId: number,
) => {
  return apiFetch('/api/trades/finishGifting', {
    method: 'POST',
    body: JSON.stringify({ giftedBy, giftedTo, itemId, colorId }),
  });
};
