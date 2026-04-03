import { useEffect, useState } from 'react';
import { useUserData } from '../context/UserProvider';
import Card from '../components/ui/Card';
import FormInput from '../components/ui/FormInput';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useEditUser } from '../hooks/users';

const Profile = () => {
  const { user } = useUserData();
  const { id, birbName, username, email, friendCode } = user || {};
  const [newEmail, setNewEmail] = useState(email);
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const { edit: editUser, error, success } = useEditUser();
  const edited =
    (!!newEmail && newEmail !== email) ||
    (!!password && password === passwordAgain);

  const handleEditField = (
    set: React.Dispatch<React.SetStateAction<string | undefined>>,
    value: string,
  ) => {
    if (showAlert) setShowAlert(false);
    set(value);
  };

  useEffect(() => {
    if (error || success) setShowAlert(true);
  }, [success, error, setShowAlert]);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      (!!newEmail && newEmail !== email) ||
      (!!password && !!passwordAgain && password === passwordAgain)
    ) {
      await editUser(id!, { email: newEmail, password, passwordAgain });
    }
  };

  return (
    <div className="size-fit m-auto pt-6">
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
          />
          <FormInput
            label="New Password"
            value={password}
            setValue={(value: string) => handleEditField(setPassword, value)}
            type="password"
            id="password"
          />
          <FormInput
            label="New password again"
            value={passwordAgain}
            setValue={(value: string) =>
              handleEditField(setPasswordAgain, value)
            }
            type="password"
            id="passwordAgain"
          />
          <div className="pt-4">
            <Button
              label="Save changes"
              disabled={!edited}
              onClick={() => {}}
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
