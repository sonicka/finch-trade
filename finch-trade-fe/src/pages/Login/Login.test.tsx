import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

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
      target: { value: 'secret' },
    });
    fireEvent.change(screen.getByLabelText('Password again'), {
      target: { value: 'different' },
    });

    expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled();
    expect(signUp).not.toHaveBeenCalled();
  });
});
