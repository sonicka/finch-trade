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
      <button
        className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={buttonFn}
      >
        {buttonText}
      </button>
    );
  }

  return null;
};

export default BottomButton;
