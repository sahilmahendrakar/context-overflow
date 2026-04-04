import { db } from "@/lib/firebase";

export async function userDocumentExists(userId: string): Promise<boolean> {
  const doc = await db.collection("users").doc(userId).get();
  return doc.exists;
}
