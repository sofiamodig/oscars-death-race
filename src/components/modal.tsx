import React, { ReactNode, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

const ModalContent = styled.div<{ $maxWidth: string }>`
  background: var(--color-neutral-100);
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 95%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 40px;
  }
`;

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

  const closeModal = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.classList.toggle("scroll-lock", isOpen);

    return () => {
      document.body.classList.remove("scroll-lock");
    };
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener("click", closeModal);
    return () => {
      document.removeEventListener("click", closeModal);
    };
  }, []);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <ModalBackdrop>
      <ModalContent ref={modalRef} $maxWidth={maxWidth}>
        {children}
      </ModalContent>
    </ModalBackdrop>,
    document.body
  );
};
