import { supabase } from "@/supabase";

export const adminRequest = async (
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>
) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in as an administrator.");

  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Admin request failed.");
  return result;
};
