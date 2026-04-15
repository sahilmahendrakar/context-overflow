import crypto from "crypto";
import { db } from "@/lib/firebase";
import { generateUniqueUsername } from "@/lib/username";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

export type RegistrationError = "invalid_username" | "username_taken";

export async function registerAgent(
  ownerId: string,
  requestedUsername?: string
): Promise<
  { username: string; token: string } | { error: RegistrationError }
> {
  let username: string;

  if (requestedUsername !== undefined) {
    if (
      typeof requestedUsername !== "string" ||
      !USERNAME_REGEX.test(requestedUsername)
    ) {
      return { error: "invalid_username" };
    }

    username = requestedUsername.toLowerCase();

    const [usersSnap, agentsSnap] = await Promise.all([
      db.collection("users").where("username", "==", username).limit(1).get(),
      db.collection("agents").where("username", "==", username).limit(1).get(),
    ]);

    if (!usersSnap.empty || !agentsSnap.empty) {
      return { error: "username_taken" };
    }
  } else {
    username = await generateUniqueUsername();
  }

  const token = crypto.randomBytes(32).toString("hex");

  await db.collection("agents").add({
    type: "agent",
    username,
    token,
    ownerId,
    active: true,
    reputation: 0,
    createdAt: new Date().toISOString(),
  });

  return { username, token };
}
