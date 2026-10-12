import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import { supabase } from "@/supabase";
import { useSnackbarContext } from "./snackbarContext";
import { SiteInfoType } from "@/types";

type SiteInfoContextType = SiteInfoType & {
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

export const SiteInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteInfoType>({});
  const { showSnackbar } = useSnackbarContext();

  useEffect(() => {
    let active = true;
    supabase
      .from("site_settings")
      .select("predictions, movies_being_added, construction")
      .eq("id", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          showSnackbar("Could not load site settings", "error");
          setSettings({ predictions: false, moviesBeingAdded: false, construction: false });
          return;
        }
        setSettings({
          predictions: data.predictions,
          moviesBeingAdded: data.movies_being_added,
          construction: data.construction,
        });
      });
    return () => { active = false; };
  }, [showSnackbar]);

  const update = async (field: "predictions" | "movies_being_added" | "construction") => {
    const columnToProperty = {
      predictions: "predictions",
      movies_being_added: "moviesBeingAdded",
      construction: "construction",
    } as const;
    const property = columnToProperty[field];
    const next = !settings[property];
    setSettings((previous) => ({ ...previous, [property]: next }));

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSettings((previous) => ({ ...previous, [property]: !next }));
      showSnackbar("Sign in as an administrator to change site settings", "error");
      return;
    }
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: next }),
      });
      if (response.ok) return;
      const result = await response.json().catch(() => ({}));
      setSettings((previous) => ({ ...previous, [property]: !next }));
      showSnackbar(result.error ?? "Could not update site settings", "error");
    } catch {
      setSettings((previous) => ({ ...previous, [property]: !next }));
      showSnackbar("Could not update site settings", "error");
    }
  };

  return (
    <SiteInfoContext.Provider
      value={{
        ...settings,
        togglePredictions: () => void update("predictions"),
        toggleMoviesBeingAdded: () => void update("movies_being_added"),
        toggleConstruction: () => void update("construction"),
      }}
    >
      {children}
    </SiteInfoContext.Provider>
  );
};
