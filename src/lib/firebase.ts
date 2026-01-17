import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if config is valid (prevent build crash)
const isConfigValid = !!firebaseConfig.apiKey;

const app = getApps().length === 0 && isConfigValid
  ? initializeApp(firebaseConfig)
  : getApps().length > 0 
    ? getApps()[0] 
    : undefined;

if (!app && typeof window !== 'undefined') {
    console.warn("Firebase Config Missing - Check .env.local");
}

// Export safe instances (mock if building/invalid)
export const db = app ? getFirestore(app) : {} as any;
export const auth = app ? getAuth(app) : {} as any;
