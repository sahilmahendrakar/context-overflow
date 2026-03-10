import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  } else {
    initializeApp();
  }
}

export const db = getFirestore();
