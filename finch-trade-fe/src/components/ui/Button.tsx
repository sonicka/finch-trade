import { FC, MouseEventHandler, ReactNode } from "react";

interface Props {
  label: string | ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  buttonProps?: Object;
  className?: string;
}

const Button: FC<Props> = ({
  label,
  disabled = false,
  onClick,
  buttonProps,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={
        className
          ? className
          : "text-darkBeige bg-beige border-2 border-b-[4px] border-darkBeige px-3 py-1 rounded-xl hover:border-b-2 hover:mt-0.5 disabled:hover:border-b-[4px] disabled:hover:mt-0 disabled:bg-grey disabled:border-grey disabled:text-lightBeige disabled:cursor-not-allowed"
      }
      disabled={disabled}
      {...buttonProps}
    >
      {label}
    </button>
  );
};

export default Button;
