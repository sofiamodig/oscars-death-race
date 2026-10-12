import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateAdmin } from "@/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { user, error } = await authenticateAdmin(req);
  if (!user) return res.status(403).json({ error });

  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) return res.status(500).json({ error: "Deploy hook is not configured." });
  try {
    const response = await fetch(hookUrl, { method: "POST" });
    if (!response.ok) return res.status(502).json({ error: "Vercel did not accept the deploy request." });
    return res.status(200).json({ success: true });
  } catch {
    return res.status(502).json({ error: "Could not start the Vercel deployment." });
  }
}
