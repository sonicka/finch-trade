import { FC } from "react";
import Tooltip from "../ui/Tooltip";
import { Color } from "../../types";
import Card from "../ui/Card";
import IconButton from "../ui/IconButton";

interface Props {
  color: Color;
  text: string;
  itemId: number;
  handleRemove: Function;
}

const Item: FC<Props> = ({ color, text, itemId, handleRemove }) => {
  return (
    <Card simple>
      <div className="w-full flex justify-between p-4 rounded-lg">
        <div className="flex gap-4">
          <Tooltip text={color.color}>
            {color.id === 1 ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
            ) : (
              <div
                className={`w-6 h-6 rounded-full ${
                  color.color === "white" ? "border border-darkBeige" : ""
                }`}
                style={{
                  backgroundColor: color.color,
                }}
              />
            )}
          </Tooltip>
          <p className="w-auto">{text}</p>
        </div>
        <IconButton
          icon={
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
              clipRule="evenodd"
            />
          }
          onClick={() => handleRemove(itemId, color.id)}
          buttonProps={{ "aria-label": "Remove" }}
          className="border-none"
        />
      </div>
    </Card>
  );
};

export default Item;
