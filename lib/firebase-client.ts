import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBrH8gANiXN6XX59_jN1o4LXCx7tS0XaQE",
    authDomain: "jewelry-catelogue.firebaseapp.com",
    projectId: "jewelry-catelogue",
    storageBucket: "jewelry-catelogue.firebasestorage.app",
    messagingSenderId: "731426342838",
    appId: "1:731426342838:web:f022fbdd241471a5d2a317",
    measurementId: "G-J8RPB08EZR"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

let analytics: any = null;
if (typeof window !== "undefined") {
    isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

export { app, storage, analytics };
