import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const updateAdminStatus = async (accessToken?: string) => {
      if (!accessToken) {
        if (active) setIsAdmin(false);
        return;
      }
      try {
        const response = await fetch("/api/auth/admin-status", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = response.ok ? await response.json() : null;
        if (active) setIsAdmin(Boolean(result?.isAdmin));
      } catch {
        if (active) setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      setUser(session?.user ?? null);
      void updateAdminStatus(session?.access_token);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void updateAdminStatus(session?.access_token);
      setIsReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    userId: user?.id,
    isSignedIn: Boolean(user),
    isAdmin,
    isReady,
  };
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const emailChange = async (newEmail: string) => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
};

export const userDeletion = async () => {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = data.session?.access_token;
  if (!token) throw new Error("You need to be signed in to delete your account.");

  const response = await fetch("/api/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not delete account.");
  await supabase.auth.signOut();
};
