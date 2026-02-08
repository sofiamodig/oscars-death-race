import { db } from "@/firebaseConfig";
import { SeenMoviesType, UserSettingsType } from "@/types";
import { doc, getDoc } from "@firebase/firestore";

export const fetchSeenMovies = async (userId: string) => {
  const docRef = doc(db, "users", userId);

  function assignIfValidKey(
    settings: UserSettingsType,
    key: string,
    value: any
  ) {
    if (key in settings) {
      (settings as any)[key] = value;
    }
  }

  return getDoc(docRef)
    .then((doc) => {
      if (doc.exists()) {
        const currentYear = new Date().getFullYear() + 1;
        const years: SeenMoviesType[] = [];
        const settings: UserSettingsType = {
          showInLeaderboard: false,
          username: "",
          percentageByWatchTime: false,
        };

        const obj = doc.data();

        for (const key in obj) {
          const year = parseInt(key, 10);

          if (!isNaN(year) && year >= 1890 && year <= currentYear) {
            years.push({ year: key, seenMovies: obj[key].seenMovies });
          } else {
            assignIfValidKey(settings, key, obj[key]);
          }
        }

        return { years, settings };
      } else {
        throw new Error("An error occurred");
      }
    })
    .catch((error) => {
      throw new Error("An error occurred");
    });
};
