import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './index';
import { logIn, signUp } from '../../api/api';

vi.mock('../../api/api', () => ({
  logIn: vi.fn(),
  signUp: vi.fn(),
}));

const loginMock = vi.fn();

vi.mock('../../shared/context/UserProvider', () => ({
  useUserData: () => ({ user: null, login: loginMock }),
}));

// Give each login test an isolated cache while providing useMutation's client.
const renderLogin = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps login disabled until email and password are entered', () => {
    renderLogin();
    const submit = screen.getByRole('button', { name: 'Log in' });

    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });

    expect(submit).toBeEnabled();
  });

  it('shows an email format hint and disables login for an invalid address', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });

    const hint = screen.getByRole('status');
    expect(hint).toHaveTextContent('Enter a valid email address.');
    expect(hint).toHaveClass('absolute', 'top-[calc(100%+2px)]');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
    expect(logIn).not.toHaveBeenCalled();
  });

  it('logs in and passes the returned token to the user provider', async () => {
    vi.mocked(logIn).mockResolvedValue('jwt-token');
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(logIn).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret',
      });
      expect(loginMock).toHaveBeenCalledWith('jwt-token');
    });
  });

  it('shows a login error returned by the API', async () => {
    vi.mocked(logIn).mockRejectedValue(new Error('Invalid email or password'));
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    );
  });

  it('requires matching passwords in sign-up mode', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      screen.getByRole('heading', { name: 'Sign Up' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('User name'), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByLabelText('Birb name'), {
      target: { value: 'Birb' },
    });
    fireEvent.change(screen.getByLabelText('Friend code'), {
      target: { value: '1234' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret12' },
    });
    fireEvent.change(screen.getByLabelText('Password again'), {
      target: { value: 'different' },
    });

    expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Passwords do not match.',
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it('explains that signup passwords must be at least eight characters', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short' },
    });

    const hint = screen.getByRole('status');
    expect(hint).toHaveTextContent('Password must be at least 8 characters.');
    expect(hint).toHaveClass('absolute', 'top-[calc(100%+2px)]');
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled();
  });

  it('trims signup profile fields before sending the request', async () => {
    vi.mocked(signUp).mockResolvedValue('jwt-token');
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('User name'), {
      target: { value: ' user ' },
    });
    fireEvent.change(screen.getByLabelText('Birb name'), {
      target: { value: ' Birb ' },
    });
    fireEvent.change(screen.getByLabelText('Friend code'), {
      target: { value: ' 1234 ' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Password again'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        username: 'user',
        birbName: 'Birb',
        friendCode: '1234',
        password: 'password123',
      });
      expect(loginMock).toHaveBeenCalledWith('jwt-token');
    });
  });
});
