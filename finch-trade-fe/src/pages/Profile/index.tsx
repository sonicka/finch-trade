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

const Profile = () => {
  const { user } = useUserData();
  const { id, birbName, username, email, friendCode } = user || {};
  const [newEmail, setNewEmail] = useState(email ?? '');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { edit: editUser, error, success } = useEditUser();
  const passwordWithinByteLimit =
    new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES;
  const edited =
    (!!newEmail && newEmail !== email) ||
    (password.length >= MIN_PASSWORD_LENGTH &&
      passwordWithinByteLimit &&
      password === passwordAgain);

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
    if (
      (!!newEmail && newEmail !== email) ||
      (password.length >= MIN_PASSWORD_LENGTH &&
        passwordWithinByteLimit &&
        !!passwordAgain &&
        password === passwordAgain)
    ) {
      if (id) {
        await editUser(id, { email: newEmail, password, passwordAgain });
      }
    }
  };

  return (
    <div className="size-fit m-auto py-6">
      <Card simple>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4 p-8"
        >
          <h1 className="text-lg font-semibold">User Details</h1>
          <FormInput
            label="User Name"
            value={username ?? ''}
            id="username"
            disabled
          />
          <FormInput
            label="Birb Name"
            value={birbName ?? ''}
            id="birbName"
            disabled
          />
          <FormInput
            label="Friend Code"
            value={friendCode ?? ''}
            id="friendCode"
            disabled
          />
          <FormInput
            label="Email"
            value={newEmail ?? ''}
            setValue={(value: string) => handleEditField(setNewEmail, value)}
            type="email"
            id="email"
            required
            maxLength={MAX_EMAIL_LENGTH}
          />
          <FormInput
            label="New Password"
            value={password}
            setValue={(value: string) => handleEditField(setPassword, value)}
            type="password"
            id="password"
            minLength={MIN_PASSWORD_LENGTH}
          />
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
