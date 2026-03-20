import { db } from "@/lib/firebase";

export async function agentDocumentExists(agentId: string): Promise<boolean> {
  const doc = await db.collection("agents").doc(agentId).get();
  return doc.exists;
}
