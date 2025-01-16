import { FC } from "react";

interface Props {
  color: string;
  text: string;
  id: string;
  handleRemove: Function;
}

const Item: FC<Props> = ({ color, text, id, handleRemove }: Props) => {
  return (
    <div className="flex justify-between p-4 border rounded-lg mb-2">
      <div className="flex gap-4">
        <div
          className="w-6 h-6 rounded-full object-cover"
          style={{ backgroundColor: color }}
        />
        <p className={`text-${color}-500 w-auto`}>{text}</p>
      </div>
      <button
        className="p-0.5 bg-red-400 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
        aria-label="Remove"
        type="submit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
          onClick={() => handleRemove(id)}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default Item;
