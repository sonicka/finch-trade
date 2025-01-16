import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { useAuth } from "../components/AuthProvider";
import { logIn, signUp } from "../api";
import Alert from "../components/Alert";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
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
    <div className="grid place-items-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-10 w-96">
        <Alert message="Join us on a fan-made Finch trading app! Simply log in, add the items you'd like to trade or receive, and let the app match you with a suitable trader!" />
        <div className="max-w-sm mx-auto p-2 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-semibold text-center mt-3 mb-6">
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
            <div className="pt-4 pb-3">
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {isLogin ? "Log in" : "Sign up"}
              </button>
              {error && (
                <div className="mt-4">
                  <Alert type="error" message={error} />
                </div>
              )}
              <div className="mt-4 w-full text-center">
                {isLogin && (
                  <span className="mt-4">
                    Don't have an account yet?{" "}
                    <a
                      onClick={() => setIsLogin(false)}
                      className="underline text-blue-500 hover:text-blue-700"
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
                      className="underline text-blue-500 hover:text-blue-700"
                    >
                      Click here to login.
                    </a>
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
