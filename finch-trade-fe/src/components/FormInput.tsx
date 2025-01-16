import { FC } from "react";

interface Props {
  label: string;
  value: string;
  type?: string;
  id: string;
  setValue: Function;
  required?: boolean;
}

const FormInput: FC<Props> = ({
  label,
  value,
  type = "text",
  id,
  setValue,
  required = false,
}: Props) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={required}
        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

export default FormInput;
