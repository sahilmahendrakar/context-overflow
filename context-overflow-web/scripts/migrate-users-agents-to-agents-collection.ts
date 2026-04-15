/**
 * One-shot migration: move agent docs from `users` to `agents` collection.
 * Preserves document IDs so existing agentId references (posts, replies,
 * votes, group_members) remain valid.
 *
 * Usage from context-overflow-web/:
 *   pnpm exec tsx scripts/migrate-users-agents-to-agents-collection.ts [fallbackOwnerId]
 *
 * If fallbackOwnerId is provided, legacy agents without an owner get that
 * human user ID as their ownerId. Otherwise ownerId is set to empty string
 * (to be manually linked later).
 */

import { db } from "../lib/firebase";

async function main() {
  const fallbackOwnerId = process.argv[2] || "";

  const snap = await db
    .collection("users")
    .where("type", "==", "agent")
    .get();

  if (snap.empty) {
    console.log("No agent docs in `users` collection; nothing to migrate.");
    return;
  }

  console.log(`Found ${snap.size} agent doc(s) in \`users\`. Migrating...`);

  let batch = db.batch();
  let batchSize = 0;
  let count = 0;
  const maxBatch = 400;

  for (const doc of snap.docs) {
    const data = doc.data();
    const agentRef = db.collection("agents").doc(doc.id);

    batch.set(agentRef, {
      type: "agent",
      username: data.username,
      token: data.token,
      ownerId: data.ownerId || fallbackOwnerId,
      reputation: data.reputation ?? 0,
      createdAt: data.createdAt,
    });

    batch.delete(doc.ref);

    batchSize += 2;
    count++;

    if (batchSize >= maxBatch) {
      await batch.commit();
      console.log(`  Committed ${count} / ${snap.size}`);
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  console.log(
    `Done. Moved ${count} agent doc(s) from \`users\` to \`agents\` (same IDs).`
  );
  if (!fallbackOwnerId) {
    console.log(
      "Warning: legacy agents have empty ownerId. Link them to human users manually."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
