import { FC } from 'react';

interface Props {
  label: string;
  value: string;
  type?: string;
  id: string;
  setValue?: React.Dispatch<React.SetStateAction<string>>;
  required?: boolean;
  disabled?: boolean;
}

const FormInput: FC<Props> = ({
  label,
  value,
  type = 'text',
  id,
  setValue = () => {},
  required = false,
  disabled = false,
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
        className={`w-full p-2 border-2 rounded-xl flex justify-between items-center
                   ${disabled && 'text-greyBeige border-greyBeige'}
                   ${!disabled && 'cursor-pointer text-darkBeige border-darkBeige'}`}
      />
    </div>
  );
};

export default FormInput;
