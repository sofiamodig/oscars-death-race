import { FC, ChangeEvent } from "react";
import { CheckIcon } from "../assets/icons/CheckIcon";

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Checkbox: FC<Props> = ({ label, checked, onChange }) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <div className="flex cursor-pointer items-center">
      <input
        id={label}
        type="checkbox"
        checked={checked}
        onChange={handleInputChange}
        className="absolute z-[-1] opacity-0"
      />
      <div className="h-6 min-w-6 rounded border border-neutral-500 bg-neutral-0" onClick={() => onChange(!checked)}>
        {checked && <CheckIcon />}
      </div>
      <label className="ml-xs cursor-pointer text-sm" htmlFor={label}>{label}</label>
    </div>
  );
};
