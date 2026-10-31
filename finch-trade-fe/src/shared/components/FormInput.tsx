import { FC } from 'react';

interface Props {
  label: string;
  value: string;
  type?: string;
  id: string;
  setValue?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

const FormInput: FC<Props> = ({
  label,
  value,
  type = 'text',
  id,
  setValue = () => {},
  required = false,
  disabled = false,
  minLength,
  maxLength,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-darkBeige mb-2"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        className={`w-full p-2 border-2 rounded-xl flex justify-between items-center
                   ${disabled && 'text-greyBeige border-greyBeige'}
                   ${!disabled && 'cursor-pointer text-darkBeige border-darkBeige'}`}
      />
    </div>
  );
};

export default FormInput;
