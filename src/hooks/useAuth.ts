import { supabase } from "@/supabase";
import { useAuth } from "@/contexts/authContext";

export { useAuth };
export { AuthProvider } from "@/contexts/authContext";

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
