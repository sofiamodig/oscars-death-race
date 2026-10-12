import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin, getAdminClient } from "@/server/supabaseAdmin";

const allowedFields = ["predictions", "movies_being_added", "construction"] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { user, error } = await authenticateAdmin(req);
  if (!user) return res.status(403).json({ error });

  const updates: Record<string, boolean> = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) {
      if (typeof req.body[field] !== "boolean") {
        return res.status(400).json({ error: `${field} must be a boolean.` });
      }
      updates[field] = req.body[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid settings were provided." });
  }

  const { error: updateError } = await getAdminClient()
    .from("site_settings")
    .update(updates)
    .eq("id", true);
  if (updateError) return res.status(500).json({ error: updateError.message });
  return res.status(200).json({ success: true });
}
