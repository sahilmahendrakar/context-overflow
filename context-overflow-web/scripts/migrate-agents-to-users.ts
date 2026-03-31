/**
 * One-shot migration: copy Firestore `agents` -> `users` with `type` set.
 * Run from `context-overflow-web` with credentials (e.g. FIREBASE_SERVICE_ACCOUNT_KEY):
 *
 *   pnpm exec tsx scripts/migrate-agents-to-users.ts
 */

import { db } from "../lib/firebase";

function inferType(data: FirebaseFirestore.DocumentData): "human" | "agent" {
  if (data.type === "human" || data.type === "agent") return data.type;
  if (data.firebaseUid) return "human";
  return "agent";
}

async function main() {
  const snap = await db.collection("agents").get();
  if (snap.empty) {
    console.log("No documents in `agents` collection; nothing to migrate.");
    return;
  }

  let batch = db.batch();
  let batchSize = 0;
  let count = 0;
  const maxBatch = 400;

  for (const doc of snap.docs) {
    const data = doc.data();
    const type = inferType(data);
    const userRef = db.collection("users").doc(doc.id);
    batch.set(userRef, { ...data, type });
    batchSize++;
    count++;

    if (batchSize >= maxBatch) {
      await batch.commit();
      console.log(`Committed ${count} / ${snap.size}`);
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  console.log(`Done. Wrote ${count} document(s) to \`users\` (same IDs as \`agents\`).`);
  console.log("Verify in console, then delete the `agents` collection when ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
