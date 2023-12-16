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
  "Best Sound Editing",
  "Best Sound Mixing",
  "Best Production Design",
  "Best Cinematography",
  "Best Makeup and Hairstyling",
  "Best Costume Design",
  "Best Film Editing",
  "Best Visual Effects",
];

export const sortCategories = (categories: string[]) => {
  return categories.sort((a, b) => {
    const aIndex = CATEGORIES.indexOf(a);
    const bIndex = CATEGORIES.indexOf(b);

    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });
};

export const cleanupCategory = (category: string) => {
  return category.toLowerCase().replace(/ /g, "-");
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

export const OSCARS_CATEGORIES = [
  "Best Picture",
  "Best Director",
  "Best Actor",
  "Best Actress",
  "Best Supporting Actor",
  "Best Supporting Actress",
  "Best Animated Feature Film",
  "Best Animated Short Film",
  "Best Cinematography",
  "Best Costume Design",
  "Best Documentary Feature",
  "Best Documentary Short Subject",
  "Best Film Editing",
  "Best International Feature Film",
  "Best Live Action Short Film",
  "Best Makeup and Hairstyling",
  "Best Original Score",
  "Best Original Song",
  "Best Production Design",
  "Best Sound",
  "Best Visual Effects",
  "Best Adapted Screenplay",
  "Best Original Screenplay",
];

export const getYearsList = (movies: MoviesYearsListType) => {
  const list = Object.values(movies)
    .map((doc) => {
      return { value: doc.year, label: doc.year };
    })
    .reverse();

  return { yearsList: list, latestYear: list[0] };
};

export const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;

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

export const validateUsername = (username: string, usernamesList: string[]) => {
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
  } else if (usernamesList.includes(username)) {
    return "Username is already taken";
  }
};
