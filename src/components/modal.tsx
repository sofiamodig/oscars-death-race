import React, { ReactNode, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  maxWidth?: string;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({
  children,
  isOpen,
  onClose,
  maxWidth = "none",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1] flex items-center justify-center bg-black/50">
      <div ref={modalRef} className="w-[95%] rounded-[5px] bg-neutral-100 p-6 text-neutral-900 shadow-[0_5px_15px_rgba(0,0,0,0.3)] dark:bg-neutral-800 dark:text-neutral-100 md:p-10" style={{ maxWidth }}>
        {children}
      </div>
    </div>,
    document.body
  );
};
