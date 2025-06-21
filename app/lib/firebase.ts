import { initializeApp, FirebaseApp, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration (should be provided by the environment)
// For local development, you might need to replace these with your actual Firebase config
// Ensure these are available in the window scope if using __firebase_config, or use environment variables
const getFirebaseConfig = (): FirebaseOptions => {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__firebase_config) {
    return JSON.parse((window as unknown as Record<string, unknown>).__firebase_config as string);
  }
  // Fallback or local development config
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
  };
};

let app: FirebaseApp;

try {
  app = getApp(); // Check if already initialized
  console.log("Firebase app already initialized.");
} catch {
  const firebaseConfig = getFirebaseConfig();
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized.");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

export const getAppId = (): string => {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__app_id) {
    return (window as unknown as Record<string, unknown>).__app_id as string;
  }
  return process.env.NEXT_PUBLIC_APP_ID || 'default-prompt-animator';
};

export const getInitialAuthToken = (): string | null => {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__initial_auth_token) {
        return (window as unknown as Record<string, unknown>).__initial_auth_token as string;
    }
    return null;
}
