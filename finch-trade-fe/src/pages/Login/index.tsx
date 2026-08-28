import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../shared/components/Alert';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import FormInput from '../../shared/components/FormInput';
import { logIn, signUp } from '../../api/api';
import { useUserData } from '../../shared/context/UserProvider';

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
  const [error, setError] = useState('');

  // todo nicer validation
  const isFormValid = isLogin
    ? !!email && !!password
    : !!email &&
      !!username &&
      !!birbName &&
      !!friendCode &&
      !!password &&
      !!passwordAgain &&
      password === passwordAgain;

  const clearForm = () => {
    setEmail('');
    setUsername('');
    setBirbName('');
    setFriendCode('');
    setPassword('');
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  useEffect(clearForm, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const token = isLogin
        ? await logIn({ email, password })
        : await signUp({ email, username, birbName, friendCode, password });

      login(token);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            />
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
                />
              </>
            )}
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
            />
            {!isLogin && (
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
            )}
            <div className="py-4 text-center">
              <Button
                label={isLogin ? 'Log in' : 'Sign up'}
                buttonProps={{ type: 'submit' }}
                disabled={!isFormValid}
              />
              {error && <Alert type="error" message={error} />}
              <div className="mt-8 w-full text-center">
                {isLogin && (
                  <span className="mt-4">
                    Don't have an account yet?{' '}
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
                    Already have an account?{' '}
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
