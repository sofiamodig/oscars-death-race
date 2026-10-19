import type { NextApiRequest, NextApiResponse } from "next";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAdminClient } from "@/server/supabaseAdmin";

const firebaseAdminAuth = () => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project is not configured.");

  const appName = "firebase-session-migration";
  const app =
    getApps().find((candidate) => candidate.name === appName) ??
    initializeApp({ projectId }, appName);
  return getAuth(app);
};

const findSupabaseUserByEmail = async (email: string) => {
  const admin = getAdminClient();
  let page = 1;

  while (page <= 100) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
    );
    if (user) return user;
    if (!data.nextPage) return null;
    page = data.nextPage;
  }

  throw new Error("Could not locate the migrated Supabase account.");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const idToken = req.body?.idToken;
  if (typeof idToken !== "string" || idToken.length > 10_000) {
    return res.status(400).json({ error: "A valid Firebase session is required." });
  }

  try {
    const firebaseUser = await firebaseAdminAuth().verifyIdToken(idToken);
    if (!firebaseUser.email) {
      return res.status(403).json({
        error: "Your Firebase account needs an email to migrate automatically.",
      });
    }

    const user = await findSupabaseUserByEmail(firebaseUser.email);
    if (!user?.email) {
      return res.status(404).json({
        error: "No migrated Supabase account matched this Firebase account.",
      });
    }

    const { data, error } = await getAdminClient().auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
    });
    if (error || !data.properties.hashed_token) {
      console.error("Could not create a Supabase session link:", error?.message);
      return res.status(500).json({ error: "Could not create a Supabase session." });
    }

    return res.status(200).json({ tokenHash: data.properties.hashed_token });
  } catch (error) {
    console.error("Firebase session migration failed:", error);
    return res.status(401).json({ error: "Could not verify the Firebase session." });
  }
}
