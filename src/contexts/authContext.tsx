import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/supabase";

type AuthContextType = {
  user: User | null;
  userId?: string;
  isSignedIn: boolean;
  isAdmin: boolean;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isSignedIn: false,
  isAdmin: false,
  isReady: false,
});

export const useAuth = () => useContext(AuthContext);

const updateAdminStatus = async (
  accessToken: string | undefined,
  setIsAdmin: (value: boolean) => void
) => {
  if (!accessToken) {
    setIsAdmin(false);
    return;
  }
  try {
    const response = await fetch("/api/auth/admin-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const result = response.ok ? await response.json() : null;
    setIsAdmin(Boolean(result?.isAdmin));
  } catch {
    setIsAdmin(false);
  }
};

const firebaseConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    let firebaseResolved = false;
    let supabaseResolved = false;
    let migrationStarted = false;
    let firebaseAuth: import("firebase/auth").Auth | undefined;
    let firebaseSignOut: typeof import("firebase/auth").signOut | undefined;
    let unsubscribeFirebase = () => {};
    let supabaseSession: Session | null = null;
    let pendingFirebaseUser: import("firebase/auth").User | null | undefined;

    const setReadyIfResolved = () => {
      if (active && firebaseResolved) setIsReady(true);
    };

    const finishFirebaseMigration = async (
      firebaseUser: import("firebase/auth").User
    ) => {
      if (!active || migrationStarted) return;
      migrationStarted = true;
      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch("/api/auth/migrate-firebase-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        const result = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || !result.tokenHash) {
          console.error("Could not migrate the Firebase session:", result.error);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.tokenHash,
          type: "magiclink",
        });
        if (error) {
          console.error("Could not establish the Supabase session:", error.message);
          return;
        }
      } catch (error) {
        console.error("Could not migrate the Firebase session:", error);
      } finally {
        firebaseResolved = true;
        setReadyIfResolved();
      }
    };

    const handleFirebaseState = (
      firebaseUser: import("firebase/auth").User | null
    ) => {
      pendingFirebaseUser = firebaseUser;
      if (!supabaseResolved) return;
      if (!firebaseUser) {
        firebaseResolved = true;
        setReadyIfResolved();
        return;
      }
      if (supabaseSession) {
        firebaseResolved = true;
        setReadyIfResolved();
        if (firebaseAuth && firebaseSignOut) void firebaseSignOut(firebaseAuth);
        return;
      }
      void finishFirebaseMigration(firebaseUser);
    };

    const {
      data: { subscription: supabaseSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      supabaseSession = session;
      setUser(session?.user ?? null);
      void updateAdminStatus(session?.access_token, setIsAdmin);
      if (session) {
        firebaseResolved = true;
        setReadyIfResolved();
        if (firebaseAuth && firebaseSignOut) void firebaseSignOut(firebaseAuth);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      supabaseResolved = true;
      if (!error) {
        supabaseSession = data.session;
        setUser(data.session?.user ?? null);
        void updateAdminStatus(data.session?.access_token, setIsAdmin);
      }
      if (data.session) {
        firebaseResolved = true;
        setReadyIfResolved();
        if (pendingFirebaseUser && firebaseAuth && firebaseSignOut) {
          void firebaseSignOut(firebaseAuth);
        }
      } else if (pendingFirebaseUser !== undefined) {
        handleFirebaseState(pendingFirebaseUser);
      }
    }).catch((error) => {
      console.error("Could not read the Supabase session:", error);
      supabaseResolved = true;
      if (pendingFirebaseUser !== undefined) {
        handleFirebaseState(pendingFirebaseUser);
      }
    });

    void (async () => {
      try {
        const [{ getApps, initializeApp }, { getAuth, onAuthStateChanged, signOut }] =
          await Promise.all([import("firebase/app"), import("firebase/auth")]);
        if (!active) return;
        const firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig());
        firebaseAuth = getAuth(firebaseApp);
        firebaseSignOut = signOut;

        unsubscribeFirebase = onAuthStateChanged(firebaseAuth, handleFirebaseState, (error) => {
          console.error("Could not check the Firebase session:", error);
          firebaseResolved = true;
          setReadyIfResolved();
        });
      } catch (error) {
        console.error("Could not initialize Firebase session migration:", error);
        firebaseResolved = true;
        setReadyIfResolved();
      }
    })();

    return () => {
      active = false;
      supabaseSubscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userId: user?.id, isSignedIn: Boolean(user), isAdmin, isReady }}
    >
      {children}
    </AuthContext.Provider>
  );
};
