import { useLocation, useNavigate } from "react-router-dom";

const BottomButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const buttonText = (() => {
    switch (location.pathname) {
      case "/":
        return "Let's trade!";
      case "/trades":
        return "Back to my lists";
      default:
        return "";
    }
  })();

  const buttonFn = () => {
    switch (location.pathname) {
      case "/":
        return navigate("/trades");
      case "/trades":
        return navigate("/");
      default:
        return navigate("/");
    }
  };

  if (location.pathname === "/" || location.pathname === "/trades") {
    return (
      <div className="w-full fixed bottom-0 z-50">
        <div className="w-full h-4 bg-gradient-to-t from-white to-transparent"></div>
        <div className="h-16 flex items-center justify-center bg-white">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={buttonFn}
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default BottomButton;
