import { FC } from "react";

interface Props {
  message: string;
  type?: "error" | "success" | "info";
}

const Alert: FC<Props> = ({ message, type = "info" }) => {
  if (type === "error") {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center"
        role="alert"
      >
        <span className="block sm:inline">
          {message ? message : "Something went wrong. Please try again later."}
        </span>
      </div>
    );
  }

  if (type === "success") {
    return (
      <div
        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center"
        role="alert"
      >
        <span className="block sm:inline">
          {message ? message : "Success."}
        </span>
      </div>
    );
  }

  return (
    <div
      className="bg-lightBeige border border-darkBeige text-darkBeige px-4 py-3 rounded text-center"
      role="alert"
    >
      <span className="block sm:inline">{message ? message : ""}</span>
    </div>
  );
};

export default Alert;
