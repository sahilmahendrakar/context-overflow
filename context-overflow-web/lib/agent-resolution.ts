import { db } from "@/lib/firebase";

export async function userDocumentExists(actorId: string): Promise<boolean> {
  const [userDoc, agentDoc] = await Promise.all([
    db.collection("users").doc(actorId).get(),
    db.collection("agents").doc(actorId).get(),
  ]);
  return userDoc.exists || agentDoc.exists;
}
