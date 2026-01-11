import * as admin from 'firebase-admin';

// Verify all environment variables are present to avoid runtime errors
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!admin.apps.length) {
    if (projectId && clientEmail && privateKey && storageBucket) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket: storageBucket,
        });
    } else {
        console.warn("Firebase Admin SDK not initialized: Missing environment variables.");
    }
}

// Export storage bucket
// We return null if not initialized so we can handle fallback (e.g. local storage or error)
let bucket: any = null;
if (admin.apps.length) {
    bucket = admin.storage().bucket();
}

export { bucket };
