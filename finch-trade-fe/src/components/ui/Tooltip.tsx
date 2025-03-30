import { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  text: string;
}

const Tooltip: FC<Props> = ({ children, text }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div
        className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2
                   w-max px-3 py-1 text-white bg-black rounded-lg shadow-lg
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   z-50 pointer-events-none whitespace-nowrap"
      >
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
