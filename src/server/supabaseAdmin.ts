import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextApiRequest } from "next";

let adminClient: SupabaseClient | undefined;

export const getAdminClient = () => {
  const url = process.env.NEXT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing server-side Supabase configuration.");
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
};

export const getBearerToken = (req: NextApiRequest) => {
  const authorization = req.headers.authorization;
  return authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
};

export const authenticateRequest = async (req: NextApiRequest) => {
  const token = getBearerToken(req);
  if (!token) return { user: null, error: "Authentication required." };

  const url = process.env.NEXT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { user: null, error: "Supabase is not configured." };

  const publicClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data.user) return { user: null, error: "Invalid session." };
  return { user: data.user, error: null };
};

export const authenticateAdmin = async (req: NextApiRequest) => {
  const result = await authenticateRequest(req);
  if (!result.user) return { user: null, error: result.error };
  const { data: role, error } = await getAdminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", result.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("Could not verify administrator role:", error.message);
    return { user: null, error: "Could not verify administrator access." };
  }
  if (!role) {
    return { user: null, error: "Administrator access required." };
  }
  return { user: result.user, error: null };
};

export const userHasAdminRole = async (userId: string) => {
  const { data, error } = await getAdminClient()
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};
