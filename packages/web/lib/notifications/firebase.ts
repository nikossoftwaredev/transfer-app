import admin from "firebase-admin";

// Initialize Firebase Admin SDK (singleton)
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  }
}

export const firebaseAdmin = admin;
