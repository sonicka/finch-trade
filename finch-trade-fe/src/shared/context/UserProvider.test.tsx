import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUserData, UserProvider, userDataQueryKeys } from './UserProvider';

const user = {
  id: 1,
  email: 'user@example.com',
  username: 'Finch',
  birbName: 'Pip',
  friendCode: 'PIP123',
};

const createToken = (payload: typeof user) =>
  `e30.${btoa(JSON.stringify(payload))}.signature`;

const UserControls = () => {
  const { user: currentUser, login, logout } = useUserData();

  return (
    <>
      <span data-testid="user">{currentUser?.username ?? 'signed out'}</span>
      <button onClick={() => login(createToken(user))}>Log in</button>
      <button onClick={logout}>Log out</button>
    </>
  );
};

const renderUserProvider = (queryClient: QueryClient) =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <UserControls />
        </UserProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe('UserProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores the user from the stored token into the query cache', () => {
    localStorage.setItem('authToken', createToken(user));
    const queryClient = new QueryClient();

    renderUserProvider(queryClient);

    expect(screen.getByTestId('user')).toHaveTextContent('Finch');
    expect(queryClient.getQueryData(userDataQueryKeys.authUser)).toEqual(user);
  });

  it('updates and clears the query-backed user on login and logout', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(userDataQueryKeys.trades(user.id), []);

    renderUserProvider(queryClient);

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('Finch'),
    );
    expect(queryClient.getQueryData(userDataQueryKeys.authUser)).toEqual(user);
    expect(localStorage.getItem('authToken')).toBe(createToken(user));

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('signed out'),
    );
    expect(queryClient.getQueryData(userDataQueryKeys.authUser)).toBeNull();
    expect(queryClient.getQueryState(userDataQueryKeys.trades(user.id))).toBe(
      undefined,
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
