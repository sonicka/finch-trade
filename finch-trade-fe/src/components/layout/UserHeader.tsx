import { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useUserData } from '../../context/UserProvider';

const UserHeader: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserData();
  const { birbName, username } = user || {};

  if (!user) return null;
  return (
    <div className="mx-2 mt-2">
      <Card>
        <div className="grid grid-cols-3 w-full items-center">
          <div className="flex justify-start">
            {/* <Button label="About" onClick={() => null} /> */}
          </div>
          <div className="flex flex-col gap-2 items-center">
            <img
              src="/finch.png"
              alt={birbName}
              className="w-14 h-14 rounded-full object-cover border-2 border-mediumBeige"
            />
            <Button
              label={`${birbName} & ${username}`}
              className="text-lg font-semibold hover:underline cursor-pointer hover:text-medium-beige transition-colors"
              onClick={() =>
                location.pathname !== '/profile' && navigate('/profile')
              }
            />
          </div>
          <div className="flex justify-end">
            <Button label="Logout" onClick={logout} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserHeader;
