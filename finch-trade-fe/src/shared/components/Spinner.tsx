import { CSSProperties, FC } from 'react';

interface Props {
  size?: number | string;
  label?: string;
  className?: string;
}

const Spinner: FC<Props> = ({
  size = '100%',
  label = 'Loading',
  className = 'border-mediumBeige border-t-darkBeige',
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const style: CSSProperties = {
    width: dimension,
    height: dimension,
    aspectRatio: '1 / 1',
    flex: 'none',
  };

  return (
    <div
      className={`box-border animate-spin rounded-full border-3 ${className}`}
      style={style}
      role="status"
      aria-label={label}
    />
  );
};

export default Spinner;
