import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, userHasAdminRole } from "@/server/supabaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { user, error } = await authenticateRequest(req);
  if (!user) return res.status(401).json({ error });

  try {
    return res.status(200).json({ isAdmin: await userHasAdminRole(user.id) });
  } catch (roleError) {
    console.error("Could not check administrator role:", roleError);
    return res.status(500).json({ error: "Could not verify administrator access." });
  }
}
