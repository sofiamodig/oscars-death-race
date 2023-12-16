import React, { ReactNode, createContext, useContext } from "react";
import Snackbar from "@/components/snackbar";
import useSnackbar from "@/hooks/useSnackbar";

// Create a context for the snackbar state and showSnackbar function
const SnackbarContext = createContext({
  showSnackbar: (message: string, type: "info" | "success" | "error") => {},
});

export const useSnackbarContext = () => useContext(SnackbarContext);

interface Props {
  children: ReactNode;
}

export const SnackbarProvider: React.FC<Props> = ({ children }) => {
  const { isSnackbarVisible, snackbarMessage, snackbarType, showSnackbar } =
    useSnackbar();

  // Provide the snackbar state and showSnackbar function to the rest of the app
  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {isSnackbarVisible && (
        <Snackbar message={snackbarMessage} type={snackbarType} />
      )}
    </SnackbarContext.Provider>
  );
};
