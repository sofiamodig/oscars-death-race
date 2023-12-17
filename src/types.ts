export type MovieType = {
  id: string;
  title: string;
  imdbId: string;
  cast: string;
  director: string;
  categories?: string[];
  wonCategories?: string[];
  posterUrl: string;
  duration?: number;
};

export type SeenType = {
  imdbId: string;
  date?: string;
};

export type SeenMoviesType = {
  year: string;
  seenMovies: SeenType[];
  completed?: string | null;
};

export type UserSettingsType = {
  username: string;
  showInLeaderboard?: boolean;
  hideSeenDates?: boolean;
};

export type SiteInfoType = {
  predictions?: boolean;
  moviesBeingAdded?: boolean;
  construction?: boolean;
};

export type MoviesYearsListType = {
  year: string;
  movies: MovieType[];
}[];
