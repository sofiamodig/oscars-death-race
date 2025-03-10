import { MoviesYearsListType } from "./types";

export const CATEGORIES = [
  "Best Picture",
  "Best Director",
  "Best Actor",
  "Best Actress",
  "Best Supporting Actor",
  "Best Supporting Actress",
  "Best Original Screenplay",
  "Best Adapted Screenplay",
  "Best Animated Feature",
  "Best Animated Short",
  "Best Live Action Short",
  "Best International Feature",
  "Best Documentary Feature",
  "Best Documentary Short",
  "Best Original Score",
  "Best Original Song",
  "Best Sound",
  "Best Production Design",
  "Best Cinematography",
  "Best Makeup and Hairstyling",
  "Best Costume Design",
  "Best Film Editing",
  "Best Visual Effects",
];

export const sortCategories = (categories: string[]) => {
  return categories.sort((a, b) => {
    const prettyA = prettifyCategory(a);
    const prettyB = prettifyCategory(b);

    const aIndex = CATEGORIES.indexOf(prettyA);
    const bIndex = CATEGORIES.indexOf(prettyB);

    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
};

const normalizeCategory = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    "Best Animated Feature Film": "Best Animated Feature",
    "Best Animated Short Film": "Best Animated Short",
    "Best Live Action Short Film": "Best Live Action Short",
    "Best International Feature Film": "Best International Feature",
    "Best Documentary Short Subject": "Best Documentary Short",
  };

  return categoryMap[category] ?? category;
};

export const cleanupCategory = (category: string) => {
  const normalizedCategory = normalizeCategory(category);
  return normalizedCategory.toLowerCase().replace(/ /g, "-");
};

export const prettifyCategory = (category: string) => {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatCategory = (category: string) => {
  if (category === "Best Picture") {
    return category;
  }
  if (category.indexOf("Best ") === 0) {
    category = category.substring(5);
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
};

export const modifyCategories = (categories: string[]) => {
  const sortedCategories = sortCategories(categories);
  return sortedCategories.map((category) => {
    return formatCategory(category);
  });
};

export const checkLatestYear = (year: string, movies: MoviesYearsListType) => {
  if (!movies.length) return false;
  const latestYear = movies[movies.length - 1].year;
  return year === latestYear;
};

export type SpacingSize =
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl"
  | "xxxl";

export const spacingToPixels = (size?: SpacingSize) => {
  switch (size) {
    case "xxs":
      return "4px";
    case "xs":
      return "8px";
    case "sm":
      return "16px";
    case "md":
      return "24px";
    case "lg":
      return "32px";
    case "xl":
      return "40px";
    case "xxl":
      return "48px";
    case "xxxl":
      return "64px";
    default:
      return "0px";
  }
};

export const getYearsList = (movies: MoviesYearsListType) => {
  const list = Object.values(movies)
    .map((doc) => {
      return { value: doc.year, label: doc.year };
    })
    .reverse();

  return { yearsList: list, latestYear: list[0] };
};

export const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const passwordRegex = /(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*/;

export const validatePassword = (password: string) => {
  if (!password) {
    return "Password is required";
  } else if (password.length < 6) {
    return "Password must be at least 6 characters long";
  } else if (!passwordRegex.test(password)) {
    return "Password must contain at least one uppercase letter, one lowercase letter and one number";
  }
};

export const validateEmail = (email: string) => {
  if (!email) {
    return "Email is required";
  } else if (!emailRegex.test(email)) {
    return "Email is invalid";
  }
};

export const validateUsername = (username: string) => {
  if (!username) {
    return "Username is required";
  } else if (username.length < 3) {
    return "Username must be at least 3 characters long";
  } else if (username.length > 20) {
    return "Username must be less than 20 characters long";
  } else if (username.includes(" ")) {
    return "Username can not contain space";
  } else if (emailRegex.test(username)) {
    return "Username can not be an email";
  }
};

export const minutesToHours = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (Math.round(remainingMinutes) === 60) {
    return `${hours + 1}h 0min`;
  } else if (hours < 1) {
    return `${remainingMinutes}min`;
  } else {
    return `${hours}h ${Math.round(remainingMinutes)}min`;
  }
};

export const BLOCKED_USERS = ["testaccount"];
