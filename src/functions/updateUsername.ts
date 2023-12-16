import { db } from "@/firebaseConfig";
import { collection, doc, getDocs, updateDoc } from "@firebase/firestore";

export const updateUsername = async (
  userId: string,
  oldUserName: string,
  newUserName: string
) => {};
