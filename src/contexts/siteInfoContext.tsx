import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { doc, getDoc, updateDoc } from "@firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { useSnackbarContext } from "./snackbarContext";

type SiteInfoContextType = {
  predictions?: boolean;
  moviesBeingAdded?: boolean;
  construction?: boolean;
  togglePredictions: () => void;
  toggleMoviesBeingAdded: () => void;
  toggleConstruction: () => void;
};

export const SiteInfoContext = createContext<SiteInfoContextType>({
  predictions: undefined,
  moviesBeingAdded: undefined,
  construction: undefined,
  togglePredictions: () => {},
  toggleMoviesBeingAdded: () => {},
  toggleConstruction: () => {},
});

export const useSiteInfoContext = () => useContext(SiteInfoContext);

interface SiteInfoProviderProps {
  children: ReactNode;
}

export const SiteInfoProvider: React.FC<SiteInfoProviderProps> = ({
  children,
}) => {
  const [predictions, setPredictions] = useState(false);
  const [moviesBeingAdded, setMoviesBeingAdded] = useState(false);
  const [construction, setConstruction] = useState(false);
  const { showSnackbar } = useSnackbarContext();

  useEffect(() => {
    const docRef = doc(db, "site-status", "info");
    getDoc(docRef)
      .then((doc: any) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data) {
            setPredictions(data.predictions);
            setMoviesBeingAdded(data.moviesBeingAdded);
            setConstruction(data.construction);
          }
        } else {
          showSnackbar("An error occurred", "error");
        }
      })
      .catch(() => {
        showSnackbar("An error occurred", "error");
      });
  }, [showSnackbar]);

  const togglePredictions = () => {
    setPredictions(!predictions);
    updateDoc(doc(db, "site-status", "info"), {
      predictions: !predictions,
    });
  };

  const toggleMoviesBeingAdded = () => {
    setMoviesBeingAdded(!moviesBeingAdded);
    updateDoc(doc(db, "site-status", "info"), {
      moviesBeingAdded: !moviesBeingAdded,
    });
  };

  const toggleConstruction = () => {
    setConstruction(!construction);
    updateDoc(doc(db, "site-status", "info"), {
      construction: !construction,
    });
  };

  return (
    <SiteInfoContext.Provider
      value={{
        predictions,
        moviesBeingAdded,
        construction,
        togglePredictions,
        toggleMoviesBeingAdded,
        toggleConstruction,
      }}
    >
      {children}
    </SiteInfoContext.Provider>
  );
};
