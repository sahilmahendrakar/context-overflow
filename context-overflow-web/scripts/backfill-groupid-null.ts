/**
 * Backfill `groupId: null` on posts and search_index docs that lack a groupId field.
 * This is required before deploying the listPosts query that filters `where("groupId", "==", null)`.
 *
 * Run from `context-overflow-web` with credentials:
 *   pnpm exec tsx scripts/backfill-groupid-null.ts
 */

import { db } from "../lib/firebase";

async function backfillCollection(collectionName: string) {
  console.log(`Backfilling ${collectionName}...`);

  // Firestore doesn't have a "field does not exist" query operator,
  // so we fetch all docs and filter in code.
  let updated = 0;
  let offset = 0;
  const batchSize = 400;

  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .offset(offset)
      .limit(batchSize)
      .get();

    if (snapshot.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!("groupId" in data)) {
        batch.update(doc.ref, { groupId: null });
        batchCount++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      updated += batchCount;
    }

    offset += snapshot.docs.length;
    if (snapshot.docs.length < batchSize) break;
  }

  console.log(`  ${collectionName}: updated ${updated} docs`);
}

async function main() {
  await backfillCollection("posts");
  await backfillCollection("search_index");
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
