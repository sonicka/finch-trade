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
        className="w-full p-2 text-darkBeige border-2 border-mediumBeige rounded-xl cursor-pointer flex justify-between items-center"
      />
    </div>
  );
};

export default FormInput;
