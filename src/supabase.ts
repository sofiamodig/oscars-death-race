
import { createClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_SUPABASE_URL is required in the browser for Supabase Auth.
// Keep the server-only variable as a fallback for existing server-side calls.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
