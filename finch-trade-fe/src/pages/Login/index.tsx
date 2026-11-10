import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import InlineAlert from '../../shared/components/InlineAlert';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import FormInput from '../../shared/components/FormInput';
import Spinner from '../../shared/components/Spinner';
import { logIn, signUp } from '../../api/api';
import { useUserData } from '../../shared/context/UserProvider';
import { LoginCredentials, SignUpData } from '../../shared/types';

type AuthRequest =
  | { mode: 'login'; data: LoginCredentials }
  | { mode: 'signup'; data: SignUpData };

const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ValidationHint: React.FC<{ message: string }> = ({ message }) => {
  return (
    <p
      className="absolute left-0 top-[calc(100%+2px)] z-10 flex items-center gap-1.5 text-xs leading-4 text-red-700"
      role="status"
    >
      <span
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[9px] font-semibold leading-none"
        aria-hidden="true"
      >
        !
      </span>
      {message}
    </p>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useUserData();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [birbName, setBirbName] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');

  const isEmailValid =
    email.trim().length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email.trim());

  const isFormValid = isLogin
    ? isEmailValid && !!password
    : isEmailValid &&
      !!username.trim() &&
      !!birbName.trim() &&
      !!friendCode.trim() &&
      password.length >= MIN_PASSWORD_LENGTH &&
      !!passwordAgain &&
      password === passwordAgain;

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: (request: AuthRequest) =>
      request.mode === 'login' ? logIn(request.data) : signUp(request.data),
    onSuccess: (token) => login(token),
  });

  const clearError = () => reset();

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  useEffect(() => {
    setEmail('');
    setUsername('');
    setBirbName('');
    setFriendCode('');
    setPassword('');
    setPasswordAgain('');
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || !isFormValid) return;

    mutate(
      isLogin
        ? { mode: 'login', data: { email: email.trim(), password } }
        : {
            mode: 'signup',
            data: {
              email: email.trim(),
              username: username.trim(),
              birbName: birbName.trim(),
              friendCode: friendCode.trim(),
              password,
            },
          },
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-10 min-h-screen">
      <Card>
        <p className="text-center">
          Join us on a fan-made Finch trading app! Simply log in, add the items
          you'd like to trade or receive, and let the app match you with a
          suitable trader!
        </p>
      </Card>
      <Card>
        <div className="flex flex-col gap-6 w-96">
          <h1 className="text-2xl font-semibold text-center pt-3">
            {isLogin ? 'Login' : 'Sign Up'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FormInput
                label="Email"
                value={email}
                setValue={(value) => {
                  clearError();
                  setEmail(value);
                }}
                type="email"
                id="email"
                required
                maxLength={MAX_EMAIL_LENGTH}
              />
              {email.trim() && !isEmailValid && (
                <ValidationHint message="Enter a valid email address." />
              )}
            </div>
            {!isLogin && (
              <>
                <FormInput
                  label="User name"
                  value={username}
                  setValue={(value) => {
                    clearError();
                    setUsername(value);
                  }}
                  id="username"
                  required
                  maxLength={64}
                />
                <FormInput
                  label="Birb name"
                  value={birbName}
                  setValue={(value) => {
                    clearError();
                    setBirbName(value);
                  }}
                  id="birbname"
                  required
                  maxLength={64}
                />
                <FormInput
                  label="Friend code"
                  value={friendCode}
                  setValue={(value) => {
                    clearError();
                    setFriendCode(value);
                  }}
                  id="friendCode"
                  required
                  maxLength={64}
                />
              </>
            )}
            <div className="relative">
              <FormInput
                label="Password"
                value={password}
                setValue={(value) => {
                  clearError();
                  setPassword(value);
                }}
                type="password"
                id="password"
                required
                minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
              />
              {!isLogin &&
                password.length > 0 &&
                password.length < MIN_PASSWORD_LENGTH && (
                  <ValidationHint
                    message={`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`}
                  />
                )}
            </div>
            {!isLogin && (
              <div className="relative">
                <FormInput
                  label="Password again"
                  value={passwordAgain}
                  setValue={(value) => {
                    clearError();
                    setPasswordAgain(value);
                  }}
                  type="password"
                  id="passwordAgain"
                  required
                />
                {passwordAgain && password !== passwordAgain && (
                  <ValidationHint message="Passwords do not match." />
                )}
              </div>
            )}
            <div className="py-4 gap-6 flex flex-col">
              <div className="self-center">
                <Button
                  label={
                    <span className="flex items-center justify-center gap-2">
                      {isLogin ? 'Log in' : 'Sign up'}
                      {isPending && (
                        <Spinner
                          size={18}
                          label={isLogin ? 'Logging in' : 'Signing up'}
                        />
                      )}
                    </span>
                  }
                  buttonProps={{ type: 'submit' }}
                  disabled={!isFormValid || isPending}
                />
              </div>
              {isError && (
                <InlineAlert
                  type="error"
                  message={
                    error instanceof Error
                      ? error.message
                      : 'Unable to authenticate. Try again.'
                  }
                />
              )}
              <div className="w-full text-center">
                {isLogin && (
                  <span className="mt-4">
                    Don't have an account yet?
                    <br />
                    <button
                      onClick={() => {
                        clearError();
                        setIsLogin(false);
                      }}
                      className="underline text-darkBeige hover:text-mediumBeige cursor-pointer"
                    >
                      Click here to sign in.
                    </button>
                  </span>
                )}
                {!isLogin && (
                  <span>
                    Already have an account?
                    <br />
                    <button
                      onClick={() => {
                        clearError();
                        setIsLogin(true);
                      }}
                      className="underline text-darkBeige hover:text-mediumBeige cursor-pointer"
                    >
                      Click here to login.
                    </button>
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Login;
