import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, getAdminClient } from "@/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });

  try {
    const { error: deleteError } = await getAdminClient().auth.admin.deleteUser(user.id);
    if (deleteError) return res.status(500).json({ error: deleteError.message });
    return res.status(200).json({ success: true });
  } catch (deleteError: any) {
    return res.status(500).json({ error: deleteError.message ?? "Could not delete account." });
  }
}
