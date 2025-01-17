import { FC } from "react";
import { useAuth } from "../contexts/AuthProvider";

const UserHeader: FC = () => {
  const { user, logout } = useAuth();
  const imageUrl = "https://placecats.com/200/200";
  const { birbName, username, friendCode } = user || {};

  if (!user) return null;
  return (
    <div className="flex items-center justify-between space-x-4 p-4 mb-4 border rounded-lg shadow-md">
      <div />
      <div className="flex gap-4 items-center">
        <img
          src={imageUrl}
          alt={birbName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <span className="text-lg font-semibold text-gray-800">{`${birbName} & ${username} (${friendCode})`}</span>
      </div>
      <button
        className="bg-white text-gray-300 px-2 py-1 rounded-full shadow-lg border-2 border-gray-300 hover:bg-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
};

export default UserHeader;
