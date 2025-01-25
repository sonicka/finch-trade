import { FC } from "react";
import { useAuth } from "../contexts/AuthProvider";

const UserHeader: FC = () => {
  const { user, logout } = useAuth();
  const { birbName, username, friendCode } = user || {};

  if (!user) return null;
  return (
    <div className="fixed top-0 h-32 bg-white w-full flex items-center justify-between space-x-4 p-4 mb-4 border-b shadow-md shadow-gray-200">
      <div className="w-full flex flex-col gap-4 items-center">
        <img
          src="/finch.png"
          alt={birbName}
          className="w-14 h-14 rounded-full object-cover"
        />
        <span className="text-lg font-semibold text-gray-800 text-center">
          {`${birbName} & ${username} (${friendCode})`}
        </span>
      </div>
      <div className="absolute right-4">
        <button
          className="bg-white text-gray-300 px-2 py-1 rounded-full shadow-sm border-2 border-gray-300 hover:bg-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserHeader;
