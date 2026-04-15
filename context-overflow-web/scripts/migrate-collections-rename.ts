/**
 * Migrate Firestore collections from legacy names to new names:
 *   groups         -> projects
 *   group_members  -> project_members
 *   group_invites  -> project_invites
 *
 * Also renames `groupId` -> `projectId` on:
 *   - project_members docs
 *   - project_invites docs
 *   - posts docs
 *   - search_index docs
 *
 * Idempotent: skips documents that already exist in the destination.
 *
 * Run from `context-overflow-web`:
 *   pnpm exec tsx scripts/migrate-collections-rename.ts
 */

import { db } from "../lib/firebase";

const BATCH_SIZE = 400;

async function copyCollection(
  srcName: string,
  destName: string,
  fieldRenames?: Record<string, string>,
) {
  console.log(`Migrating ${srcName} -> ${destName}...`);
  let copied = 0;
  let skipped = 0;
  let offset = 0;

  while (true) {
    const snapshot = await db.collection(srcName).offset(offset).limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const destRef = db.collection(destName).doc(doc.id);
      const destDoc = await destRef.get();
      if (destDoc.exists) {
        skipped++;
        continue;
      }

      let data = { ...doc.data() };
      if (fieldRenames) {
        for (const [oldKey, newKey] of Object.entries(fieldRenames)) {
          if (oldKey in data) {
            data[newKey] = data[oldKey];
            delete data[oldKey];
          }
        }
      }

      batch.set(destRef, data);
      batchCount++;
    }

    if (batchCount > 0) {
      await batch.commit();
      copied += batchCount;
    }

    offset += snapshot.docs.length;
    if (snapshot.docs.length < BATCH_SIZE) break;
  }

  console.log(`  ${srcName}: copied ${copied}, skipped ${skipped} (already exist)`);
}

async function renameFieldInPlace(
  collectionName: string,
  oldField: string,
  newField: string,
) {
  console.log(`Renaming field ${oldField} -> ${newField} in ${collectionName}...`);
  let updated = 0;
  let offset = 0;

  while (true) {
    const snapshot = await db.collection(collectionName).offset(offset).limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (oldField in data && !(newField in data)) {
        batch.update(doc.ref, {
          [newField]: data[oldField],
          [oldField]: (await import("firebase-admin/firestore")).FieldValue.delete(),
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
  await copyCollection("groups", "projects");
  await copyCollection("group_members", "project_members", { groupId: "projectId" });
  await copyCollection("group_invites", "project_invites", { groupId: "projectId" });

  await renameFieldInPlace("posts", "groupId", "projectId");
  await renameFieldInPlace("search_index", "groupId", "projectId");

  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
