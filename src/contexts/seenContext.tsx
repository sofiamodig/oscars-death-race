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
import { arrayUnion, doc, getDoc, updateDoc } from "@firebase/firestore";
import { db } from "@/firebaseConfig";
import { removeMovieFromSeenFunc } from "@/functions/removeMovieFromSeen";

type SeenContextType = {
  seenMovies: SeenMoviesType[];
  userSettings: UserSettingsType;
  addMovieToSeen: (
    imdbId: string,
    year: string,
    movies: MoviesYearsListType
  ) => void;
  removeMovieFromSeen: (imdbId: string, year: string) => void;
  changeSeenDate: (imdbId: string, date: string, year: string) => void;
  changeUserName: (name: string) => void;
  changeShowInLeaderboard: () => void;
  toggleShowSeenDates: () => void;
  loading: boolean;
};

export const SeenContext = createContext<SeenContextType>({
  seenMovies: [],
  userSettings: {} as UserSettingsType,
  addMovieToSeen: () => {},
  removeMovieFromSeen: () => {},
  changeSeenDate: () => {},
  changeUserName: () => {},
  changeShowInLeaderboard: () => {},
  toggleShowSeenDates: () => {},
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
      setTimeout(() => {
        setLoading(false);
      }, 400);
      return;
    } else {
      setLoading(true);

      fetchSeenMovies(userId)
        .then((data) => {
          setSeenMovies(data.years);
          setUserSettings((prev) => {
            return {
              username: data.settings.username,
              showInLeaderboard: data.settings.showInLeaderboard,
              hideSeenDates: prev.hideSeenDates,
            };
          });
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
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
        seenMovies: entry.seenMovies?.map((movie) =>
          movie.imdbId === imdbId ? { ...movie, date } : movie
        ),
      }))
    );

    const docRef = doc(db, "users", userId);

    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          // Copy the seenMovies array and make modifications
          const userData = docSnap.data();
          const userSeenMovies = userData[year].seenMovies;
          const movieIndex = [...userSeenMovies].findIndex(
            (m: any) => m.imdbId === imdbId
          );

          if (movieIndex !== -1) {
            // Update the date of the specific movie
            userSeenMovies[movieIndex].date = date;

            // Update the document with the new seenMovies array
            return updateDoc(docRef, {
              [`${year}.seenMovies`]: userSeenMovies,
            });
          } else {
            console.log("Movie not found");
          }
        } else {
          console.log("Document does not exist");
        }
      })
      .then(() => {
        console.log("Document successfully updated");
      })
      .catch((error) => {
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

  useEffect(() => {
    if (localStorage.getItem("hideSeenDates")) {
      setUserSettings((prev) => ({
        ...prev,
        hideSeenDates: localStorage.getItem("hideSeenDates") === "true",
      }));
    }
  }, []);

  const toggleShowSeenDates = () => {
    setUserSettings((prev) => ({
      ...prev,
      hideSeenDates: !prev.hideSeenDates,
    }));

    localStorage.setItem(
      "hideSeenDates",
      JSON.stringify(!userSettings.hideSeenDates)
    );
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
        toggleShowSeenDates,
        userSettings,
        loading,
      }}
    >
      {children}
    </SeenContext.Provider>
  );
};
