import { FC } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useUserData } from "../../context/UserProvider";

const UserHeader: FC = () => {
  const { user, logout } = useUserData();
  const { birbName, username } = user || {};

  if (!user) return null;
  return (
    <div className="mx-2 mt-2">
      <Card>
        <div className="w-full flex gap-4 justify-between items-center">
          {/* // todo <Button label="About" onClick={() => null} /> */}
          <div />
          <div className="flex flex-col gap-2 items-center">
            <img
              src="/finch.png"
              alt={birbName}
              className="w-14 h-14 rounded-full object-cover"
            />
            <span className="text-lg font-semibold text-center">
              {`${birbName} & ${username}`}
            </span>
          </div>
          {/* // todo <Button label="User Details" onClick={() => null} /> */}
          <Button label="Logout" onClick={logout} />
        </div>
      </Card>
    </div>
  );
};

export default UserHeader;
