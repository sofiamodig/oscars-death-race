import { FC } from "react";

interface Props {
  label: string;
  value: boolean;
  onToggle: () => void;
}

export const Toggle: FC<Props> = ({ label, value, onToggle }) => {
  return (
    <div onClick={onToggle} className="flex cursor-pointer items-center gap-2 font-medium [-webkit-tap-highlight-color:transparent]">
      <span className="text-xs">
        {label}
      </span>
      <span className={`inline-block h-6 w-11 rounded-full transition-colors duration-200 ${value ? "bg-green-600" : "bg-neutral-300"}`}>
        <span className={`relative top-[3px] left-[3px] block h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </div>
  );
};
