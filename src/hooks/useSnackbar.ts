import { useState, useCallback } from "react";

type SnackbarType = "info" | "success" | "error";

const useSnackbar = () => {
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<SnackbarType>("info");

  const showSnackbar = useCallback(
    (
      message: string,
      type: SnackbarType = "info",
      duration: number = 10000
    ) => {
      setSnackbarMessage(message);
      setSnackbarType(type);
      setIsSnackbarVisible(true);
      setTimeout(() => {
        setIsSnackbarVisible(false);
      }, duration);
    },
    []
  );

  return { isSnackbarVisible, snackbarMessage, snackbarType, showSnackbar };
};

export default useSnackbar;
