
import { createClient } from "@supabase/supabase-js";

// These values are bundled for the browser by next.config.js.
const supabaseUrl = process.env.NEXT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_SUPABASE_URL or NEXT_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
