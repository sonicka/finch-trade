import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FormInput from "../components/ui/FormInput";
import { logIn, signUp } from "../api/api";
import { useUserData } from "../context/UserProvider";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useUserData();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [birbName, setBirbName] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const clearForm = () => {
    setEmail("");
    setUsername("");
    setBirbName("");
    setFriendCode("");
    setPassword("");
    setError("");
  };

  useEffect(() => {
    if (user) navigate("/");
  }, [user]);

  useEffect(clearForm, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = isLogin
        ? await logIn({ email, password })
        : await signUp({ email, username, birbName, friendCode, password });

      login(token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="grid place-items-center min-h-screen">
      <Card>
        <div className="flex flex-col gap-6 w-96">
          <Alert message="Join us on a fan-made Finch trading app! Simply log in, add the items you'd like to trade or receive, and let the app match you with a suitable trader!" />
          <h1 className="text-2xl font-semibold text-center pt-3">
            {isLogin ? "Login" : "Sign Up"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email"
              value={email}
              setValue={setEmail}
              type="email"
              id="email"
              required
            />
            {!isLogin && (
              <>
                <FormInput
                  label="User name"
                  value={username}
                  setValue={setUsername}
                  id="username"
                  required
                />
                <FormInput
                  label="Birb name"
                  value={birbName}
                  setValue={setBirbName}
                  id="birbname"
                />
                <FormInput
                  label="Friend code"
                  value={friendCode}
                  setValue={setFriendCode}
                  id="friendCode"
                />
              </>
            )}
            <FormInput
              label="Password"
              value={password}
              setValue={setPassword}
              id="password"
              required
            />
            <div className="py-4 text-center">
              <Button
                label={isLogin ? "Log in" : "Sign up"}
                buttonProps={{ type: "submit" }}
              />
              {error && (
                <div className="mt-4">
                  <Alert type="error" message={error} />
                </div>
              )}
              <div className="mt-8 w-full text-center">
                {isLogin && (
                  <span className="mt-4">
                    Don't have an account yet?{" "}
                    <a
                      onClick={() => setIsLogin(false)}
                      className="underline text-darkBeige hover:text-mediumBeige cursor-pointer"
                    >
                      Click here to sign in.
                    </a>
                  </span>
                )}
                {!isLogin && (
                  <span>
                    Already have an account?{" "}
                    <a
                      onClick={() => setIsLogin(true)}
                      className="underline text-darkBeige hover:text-mediumBeige cursor-pointer"
                    >
                      Click here to login.
                    </a>
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
