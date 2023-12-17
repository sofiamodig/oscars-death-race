import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { useSnackbarContext } from "./snackbarContext";
import { MoviesYearsListType, SeenMoviesType, UserSettingsType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { fetchSeenMovies } from "@/functions/fetchSeenMovies";
import { addMovieToSeenFunc } from "@/functions/addMovieToSeen";
import { SiteInfoContext } from "./siteInfoContext";
import { arrayUnion, doc, updateDoc } from "@firebase/firestore";
import { db } from "@/firebaseConfig";
import { removeMovieFromSeenFunc } from "@/functions/removeMovieFromSeen";

type SeenContextType = {
  seenMovies: SeenMoviesType[];
  userSettings: UserSettingsType;
  showInLeaderboard: boolean;
  addMovieToSeen: (
    imdbId: string,
    year: string,
    movies: MoviesYearsListType
  ) => void;
  removeMovieFromSeen: (imdbId: string, year: string) => void;
  changeSeenDate: (imdbId: string, date: string, year: string) => void;
  changeUserName: (name: string) => void;
  changeShowInLeaderboard: () => void;
  loading: boolean;
};

export const SeenContext = createContext<SeenContextType>({
  seenMovies: [],
  userSettings: {} as UserSettingsType,
  showInLeaderboard: true,
  addMovieToSeen: () => {},
  removeMovieFromSeen: () => {},
  changeSeenDate: () => {},
  changeUserName: () => {},
  changeShowInLeaderboard: () => {},
  loading: true,
});

export const useSeenContext = () => useContext(SeenContext);

interface SeenProviderProps {
  children: ReactNode;
}

export const SeenProvider: React.FC<SeenProviderProps> = ({ children }) => {
  const { userId } = useAuth();
  const [seenMovies, setSeenMovies] = useState<SeenMoviesType[]>([]);
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [userSettings, setUserSettings] = useState({} as UserSettingsType);
  const [loading, setLoading] = useState(true);
  const { predictions } = useContext(SiteInfoContext);
  const { showSnackbar } = useSnackbarContext();

  useEffect(() => {
    if (!userId) {
      setSeenMovies([]);
      setUserSettings({} as UserSettingsType);
      setLoading(false);
      return;
    } else {
      setLoading(true);

      fetchSeenMovies(userId)
        .then((data) => {
          setSeenMovies(data.years);
          setUserSettings(data.settings);
          setLoading(false);
        })
        .catch((error) => {
          showSnackbar("Error fetching seen movies", "error");
        });
    }
  }, [userId, showSnackbar]);

  const addMovieToSeen = async (
    imdbId: string,
    year: string,
    movies: MoviesYearsListType
  ) => {
    if (!userId || predictions == undefined) return;

    addMovieToSeenFunc({
      imdbId,
      year,
      userId,
      seenMovies,
      movies,
      predictions,
    })
      .then((data) => {
        setSeenMovies(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log("ERROR", error);
        showSnackbar("Error adding movie", "error");
      });
  };

  const removeMovieFromSeen = async (imdbId: string, year: string) => {
    if (!userId) return;

    removeMovieFromSeenFunc({ imdbId, year, userId, seenMovies })
      .then((data) => {
        setSeenMovies(data);
        setLoading(false);
      })
      .catch((error) => {
        showSnackbar("Error removing", "error");
      });
  };

  const changeSeenDate = (imdbId: string, date: string, year: string) => {
    if (!userId) return;

    setSeenMovies((prev) =>
      prev.map((entry) => ({
        ...entry,
        seenMovies: entry.seenMovies.map((movie) =>
          movie.imdbId === imdbId ? { ...movie, date } : movie
        ),
      }))
    );

    const docRef = doc(db, "users", userId);
    updateDoc(docRef, {
      [`${year}.seenMovies`]: arrayUnion({ imdbId, date }),
      [`${year}.completed`]: null, // Reset completed date in the document
    }).catch((error) => {
      showSnackbar("An error occurred", "error");
    });
  };

  const changeUserName = (name: string) => {
    setUserSettings((prev) => ({ ...prev, username: name }));
  };

  const changeShowInLeaderboard = () => {
    if (!userId) return;
    updateDoc(doc(db, "users", userId), {
      showInLeaderboard: !showInLeaderboard,
    })
      .then(() => {
        setShowInLeaderboard(!showInLeaderboard);
      })
      .catch((error) => {
        showSnackbar(error.message, "error");
      });
  };

  return (
    <SeenContext.Provider
      value={{
        seenMovies,
        addMovieToSeen,
        removeMovieFromSeen,
        changeSeenDate,
        changeUserName,
        changeShowInLeaderboard,
        userSettings,
        showInLeaderboard,
        loading,
      }}
    >
      {children}
    </SeenContext.Provider>
  );
};
