import { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  simple?: boolean;
}

const Card: FC<Props> = ({ children, simple = false }) => {
  if (simple) {
    return (
      <div className="flex justify-center items-center relative bg-white border-beige rounded-2xl shadow">
        {children}
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center relative bg-lightBeige border-2 border-b-[5px] border-mediumBeige rounded-2xl p-6">
      {children}
    </div>
  );
};

export default Card;
