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
import { removeMovieFromSeenFunc } from "@/functions/removeMovieFromSeen";
import { supabase } from "@/supabase";

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
  togglePercentageByWatchTime: () => void;
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
  togglePercentageByWatchTime: () => {},
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
  const [percentageByWatchTime, setPercentageByWatchTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const { predictions } = useContext(SiteInfoContext);
  const { showSnackbar } = useSnackbarContext();

  useEffect(() => {
    if (!userId) {
      setSeenMovies([]);
      setUserSettings({} as UserSettingsType);
      setLoading(false);
    } else {
      let active = true;
      setLoading(true);
      setSeenMovies([]);
      fetchSeenMovies(userId)
        .then((data) => {
          if (!active) return;
          setSeenMovies(data.years);
          setUserSettings((prev) => ({
            ...data.settings,
            hideSeenDates: prev.hideSeenDates,
          }));
          setShowInLeaderboard(data.settings.showInLeaderboard ?? true);
          setPercentageByWatchTime(
            data.settings.percentageByWatchTime ?? false
          );
          setLoading(false);
        })
        .catch((error) => {
          if (!active) return;
          showSnackbar(error.message ?? "Could not load your data", "error");
          setLoading(false);
        });
      return () => {
        active = false;
      };
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

    const oldSeenMovies = seenMovies;
    setSeenMovies((prev) =>
      prev.map((entry) => ({
        ...entry,
        seenMovies: entry.seenMovies?.map((movie) =>
          entry.year === year && movie.imdbId === imdbId
            ? { ...movie, date }
            : movie
        ),
      }))
    );
    supabase
      .from("seen_movies")
      .update({ seen_at: date })
      .eq("user_id", userId)
      .eq("year", Number(year))
      .eq("imdb_id", imdbId)
      .then(({ error }) => {
        if (!error) return;
        setSeenMovies(oldSeenMovies);
        showSnackbar("An error occurred", "error");
      });
  };

  const changeUserName = (name: string) => {
    setUserSettings((prev) => ({ ...prev, username: name }));
  };

  const changeShowInLeaderboard = () => {
    if (!userId) return;
    const nextValue = !showInLeaderboard;
    setShowInLeaderboard(nextValue);
    setUserSettings((prev) => ({ ...prev, showInLeaderboard: nextValue }));
    supabase
      .from("profiles")
      .update({ show_in_leaderboard: nextValue })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) {
          setShowInLeaderboard(!nextValue);
          setUserSettings((prev) => ({ ...prev, showInLeaderboard: !nextValue }));
          showSnackbar(error.message, "error");
        }
      });
  };

  const togglePercentageByWatchTime = () => {
    if (!userId) return;
    const nextValue = !userSettings.percentageByWatchTime;
    setPercentageByWatchTime(nextValue);
    setUserSettings((prev) => ({ ...prev, percentageByWatchTime: nextValue }));
    supabase
      .from("profiles")
      .update({ percentage_by_watch_time: nextValue })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) {
          setPercentageByWatchTime(!nextValue);
          setUserSettings((prev) => ({ ...prev, percentageByWatchTime: !nextValue }));
          showSnackbar(error.message, "error");
        }
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
        togglePercentageByWatchTime,
        userSettings,
        loading,
      }}
    >
      {children}
    </SeenContext.Provider>
  );
};
