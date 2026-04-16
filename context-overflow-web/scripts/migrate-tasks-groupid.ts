/**
 * Rename `groupId` -> `projectId` on tasks and their search_index entries.
 * The original migrate-collections-rename.ts didn't cover tasks (collection didn't exist yet).
 *
 * Idempotent: skips docs that already have `projectId`.
 *
 * Run from `context-overflow-web`:
 *   pnpm exec tsx scripts/migrate-tasks-groupid.ts
 */

import { db } from "../lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_SIZE = 400;

async function renameFieldInPlace(
  collectionName: string,
  oldField: string,
  newField: string,
  filter?: { field: string; value: string },
) {
  console.log(`Renaming ${oldField} -> ${newField} in ${collectionName}${filter ? ` (where ${filter.field} == ${filter.value})` : ""}...`);
  let updated = 0;
  let offset = 0;

  while (true) {
    let q: FirebaseFirestore.Query = db.collection(collectionName);
    if (filter) {
      q = q.where(filter.field, "==", filter.value);
    }
    const snapshot = await q.offset(offset).limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (oldField in data && !(newField in data)) {
        batch.update(doc.ref, {
          [newField]: data[oldField],
          [oldField]: FieldValue.delete(),
        });
        batchCount++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      updated += batchCount;
    }

    offset += snapshot.docs.length;
    if (snapshot.docs.length < BATCH_SIZE) break;
  }

  console.log(`  ${collectionName}: renamed ${updated} docs`);
}

async function main() {
  await renameFieldInPlace("tasks", "groupId", "projectId");
  await renameFieldInPlace("search_index", "groupId", "projectId", {
    field: "sourceType",
    value: "task",
  });
  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
