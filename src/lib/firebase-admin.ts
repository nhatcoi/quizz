import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // For development, we'll use the Firebase emulator or skip verification
  // In production, you should use a service account key
};

// Initialize Firebase Admin
if (getApps().length === 0) {
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production: use service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseAdminConfig.projectId,
    });
  } else {
    // Development: initialize without credentials (will work with emulator)
    initializeApp(firebaseAdminConfig);
  }
}

export const auth = getAuth(); 