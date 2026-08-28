import { FC, MouseEventHandler, ReactNode } from 'react';

interface Props {
  icon: string | ReactNode;
  color?: 'beige' | 'red' | 'green';
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  buttonProps?: object;
  className?: string;
  size?: string;
}

const IconButton: FC<Props> = ({
  icon,
  color = 'beige',
  disabled = false,
  onClick,
  buttonProps,
  className,
  size = '',
}) => {
  const colorClasses = {
    beige: 'border-mediumBeige text-mediumBeige hover:bg-beige',
    red: 'border-red-400 text-red-700 hover:bg-red-200',
    green: 'border-green-400 text-green-700 hover:bg-green-200',
  };

  return (
    <button
      onClick={onClick}
      className={`${size} my-auto flex flex-none items-center justify-center rounded-full border-2
        ${colorClasses[color]} disabled:cursor-not-allowed disabled:border-grey disabled:text-grey disabled:hover:bg-inherit
        ${className}`}
      disabled={disabled}
      {...buttonProps}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-6"
      >
        {icon}
      </svg>
    </button>
  );
};

export default IconButton;
