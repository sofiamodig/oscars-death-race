import { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  verifyBeforeUpdateEmail,
  deleteUser,
} from "@firebase/auth";
import { doc, setDoc } from "@firebase/firestore";

export const useAuth = () => {
  const fireUser = auth.currentUser;
  const [user, setUser] = useState(fireUser);
  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_ID;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      user ? setUser(user) : setUser(null);
    });
    return () => {
      unsubscribe();
    };
  });
  return {
    userId: user?.uid,
    isSignedIn: user ? true : false,
    isAdmin,
  };
};

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  return await createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const userDocRef = doc(db, "users", userCredential.user.uid);

      if (userCredential.user?.uid) {
        setDoc(userDocRef, { username: username, showInLeaderboard: true })
          .then(() => {
            console.log("Document written with ID: ", userCredential.user.uid);
          })
          .catch((error) => {
            throw new Error("Error adding document");
          });
      }

      return "success";
    })
    .catch((error) => {
      let errorMessage = "Something went wrong";
      const json: any = JSON.parse(JSON.stringify(error));
      if (json.code === "auth/email-already-in-use") {
        errorMessage = "The email address is already in use.";
      } else if (json.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid.";
      } else if (json.code === "auth/weak-password") {
        errorMessage = "The password is not strong enough.";
      }
      throw new Error(errorMessage);
    });
};

//sign out
export const signOutUser = () => {
  signOut(auth);
  localStorage.removeItem("authUser");
};

//password reset
export const passwordReset = async (email: string) => {
  return await sendPasswordResetEmail(auth, email)
    .then(() => {
      return "success";
    })
    .catch((error) => {
      let errorMessage = "Something went wrong";
      const json: any = JSON.parse(JSON.stringify(error));
      if (json.code === "auth/user-not-found") {
        errorMessage = "The email address is not registered.";
      } else if (json.code === "auth/too-many-requests") {
        errorMessage =
          "Too many unsuccessful login attempts. Please try again later.";
      } else if (json.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid.";
      }
      throw new Error(errorMessage);
    });
};

// Sign in
export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      localStorage.setItem("authUser", JSON.stringify(userCredential.user));
      return "success";
    })
    .catch((error) => {
      let errorMessage = "Something went wrong";
      const json: any = JSON.parse(JSON.stringify(error));
      if (json.code === "auth/user-not-found") {
        errorMessage = "The email address is not registered.";
      } else if (json.code === "auth/wrong-password") {
        errorMessage = "The password is invalid.";
      } else if (json.code === "auth/too-many-requests") {
        errorMessage =
          "Too many unsuccessful login attempts. Please try again later.";
      } else if (json.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid.";
      }
      throw new Error(errorMessage);
    });
};

export const emailChange = async (newEmail: string) => {
  if (auth.currentUser) {
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      await signOut(auth);
    } catch (error: any) {
      let errorMessage = "Something went wrong";
      const json: any = JSON.parse(JSON.stringify(error));
      if (json.code === "auth/email-already-in-use") {
        errorMessage = "The email address is already in use.";
      } else if (json.code === "auth/invalid-email") {
        errorMessage = "The email address is not valid.";
      } else if (json.code === "auth/requires-recent-login") {
        errorMessage = "Please sign in again to change your email address.";
      }
      throw new Error(errorMessage);
    }
  }
};

//delete user
export const userDeletion = async () => {
  if (auth.currentUser) {
    await deleteUser(auth.currentUser)
      .then(() => {
        return "success";
      })
      .catch((error) => {
        throw new Error("Something went wrong");
      });
  }
};
