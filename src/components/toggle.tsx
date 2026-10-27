import { FC } from "react";
import { Paragraph } from "./paragraph";

interface Props {
  label: string;
  value: boolean;
  onToggle: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
}

export const Toggle: FC<Props> = ({ label, value, onToggle, size = "xs" }) => {
  return (
    <div onClick={onToggle} className="flex cursor-pointer items-center gap-xs font-medium [-webkit-tap-highlight-color:transparent]">
      <Paragraph as="span" size={size}>
        {label}
      </Paragraph>
      <span className={`inline-block h-6 w-11 rounded-full transition-colors duration-200 ${value ? "bg-ui-green" : "bg-neutral-300"}`}>
        <span className={`relative top-[3px] left-[3px] block h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </div>
  );
};
