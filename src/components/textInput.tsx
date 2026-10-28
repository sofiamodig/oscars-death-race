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
      {label && <label className="mb-1 text-sm font-medium text-neutral-700">{label}</label>}
      <input
        className={`h-12 rounded border px-4 py-2 text-base outline-none focus:border-neutral-400 autofill:shadow-[inset_0_0_0_30px_white] ${errorMessage ? "border-red-600" : "border-neutral-200"}`}
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
