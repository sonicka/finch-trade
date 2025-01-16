import { FC } from "react";

// todo

const Card: FC = () => {
  return (
    <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
      <img
        className="w-full h-48 object-cover"
        src="https://via.placeholder.com/150"
        alt="Card image"
      />
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-900">Card Title</h2>
        <p className="text-gray-600 mt-2">
          This is a simple description of the card content. It could be anything
          you want to display in this space.
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">$29.99</span>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
