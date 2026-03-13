import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBbOCsFlP6KQynJc-V4b8lJit3WxL9kFZQ",
    authDomain: "review-3acab.firebaseapp.com",
    projectId: "review-3acab",
    storageBucket: "review-3acab.firebasestorage.app",
    messagingSenderId: "932473722147",
    appId: "1:932473722147:web:8e4fe36ea7b0913c68a896",
    measurementId: "G-4TQTSL1SCS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
