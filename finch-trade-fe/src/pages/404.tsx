import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <p className="text-xl font-medium mb-6">Page Not Found</p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
