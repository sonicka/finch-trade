import { useEffect, useState } from 'react';
import { useUserData } from '../../shared/context/UserProvider';
import Card from '../../shared/components/Card';
import FormInput from '../../shared/components/FormInput';
import Button from '../../shared/components/Button';
import Alert from '../../shared/components/Alert';
import { useEditUser } from '../../shared/hooks/users';
import {
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_BYTES,
  MIN_PASSWORD_LENGTH,
} from '../../../../shared/src/constants/limits.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ValidationHint: React.FC<{ message: string }> = ({ message }) => (
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

const Profile = () => {
  const { user } = useUserData();
  const { id, birbName, username, email, friendCode } = user || {};
  const [newEmail, setNewEmail] = useState(email ?? '');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { edit: editUser, error, success } = useEditUser();
  const isEmailValid =
    newEmail.trim().length <= MAX_EMAIL_LENGTH &&
    EMAIL_PATTERN.test(newEmail.trim());
  const passwordWithinByteLimit =
    new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES;
  const hasValidPasswordChange =
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordWithinByteLimit &&
    !!passwordAgain &&
    password === passwordAgain;
  const hasPasswordInput = !!password || !!passwordAgain;
  const edited =
    isEmailValid &&
    ((!!newEmail && newEmail !== email) || hasValidPasswordChange) &&
    (!hasPasswordInput || hasValidPasswordChange);

  const handleEditField = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T,
  ) => {
    if (showAlert) setShowAlert(false);
    setter(value);
  };

  useEffect(() => {
    if (error || success) setShowAlert(true);
  }, [success, error]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowAlert(false);
    if (edited) {
      if (id) {
        await editUser(id, { email: newEmail, password, passwordAgain });
      }
    }
  };

  return (
    <div className="m-auto w-full max-w-md px-4 py-6">
      <Card simple>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col items-center gap-6 p-8"
        >
          <h1 className="text-2xl font-semibold">User Details</h1>
          <div className="w-full">
            <FormInput
              label="User Name"
              value={username ?? ''}
              id="username"
              disabled
            />
          </div>
          <div className="w-full">
            <FormInput
              label="Birb Name"
              value={birbName ?? ''}
              id="birbName"
              disabled
            />
          </div>
          <div className="w-full">
            <FormInput
              label="Friend Code"
              value={friendCode ?? ''}
              id="friendCode"
              disabled
            />
          </div>
          <div className="relative w-full">
            <FormInput
              label="Email"
              value={newEmail ?? ''}
              setValue={(value: string) => handleEditField(setNewEmail, value)}
              type="email"
              id="email"
              required
              maxLength={MAX_EMAIL_LENGTH}
            />
            {newEmail.trim() && !isEmailValid && (
              <ValidationHint message="Enter a valid email address." />
            )}
          </div>
          <div className="relative w-full">
            <FormInput
              label="New Password"
              value={password}
              setValue={(value: string) => handleEditField(setPassword, value)}
              type="password"
              id="password"
              minLength={MIN_PASSWORD_LENGTH}
            />
            {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
              <ValidationHint
                message={`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`}
              />
            )}
            {password && !passwordWithinByteLimit && (
              <ValidationHint
                message={`Password must be no more than ${MAX_PASSWORD_BYTES} bytes.`}
              />
            )}
          </div>
          <div className="relative w-full">
            <FormInput
              label="New password again"
              value={passwordAgain}
              setValue={(value: string) =>
                handleEditField(setPasswordAgain, value)
              }
              type="password"
              id="passwordAgain"
              minLength={MIN_PASSWORD_LENGTH}
            />
            {passwordAgain && password !== passwordAgain && (
              <ValidationHint message="Passwords do not match." />
            )}
          </div>
          <div className="pt-4">
            <Button
              label="Save changes"
              disabled={!edited}
              buttonProps={{ 'aria-label': 'Save', type: 'submit' }}
            />
          </div>
          {showAlert && (
            <>
              {error && <Alert type="error" message={error} />}
              {success && <Alert type="success" message={success} />}
            </>
          )}
        </form>
      </Card>
    </div>
  );
};

export default Profile;
