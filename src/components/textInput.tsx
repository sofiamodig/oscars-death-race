import React, { CSSProperties } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "number";
  value: string;
  setValue: (value: string) => void;
  errorMessage?: string;
  width?: string;
  style?: CSSProperties;
  disabled?: boolean;
  onBlur?: () => void;
}

export const TextInput: React.FC<InputProps> = ({
  label,
  placeholder,
  type = "text",
  value,
  setValue,
  errorMessage,
  width,
  style,
  disabled,
  onBlur,
}) => {
  return (
    <div className="flex w-full flex-col" style={{ ...style, width: width ?? style?.width }}>
      {label && <label className="mb-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</label>}
      <input
        className={`h-12 rounded border border-neutral-200 bg-white px-4 py-2 text-base text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-neutral-400 autofill:shadow-[inset_0_0_0_30px_white] dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:autofill:shadow-[inset_0_0_0_30px_#262626] ${errorMessage ? "border-red-600 dark:border-red-500" : ""}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
      />
      {errorMessage && <div className="mt-1 text-xs text-red-600">{errorMessage}</div>}
    </div>
  );
};
