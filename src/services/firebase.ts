// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration (copy từ bạn)
const firebaseConfig = {
  apiKey: "AIzaSyAv3G9WTC-bgFW050xPZMhqQSExGRh1uOo",
  authDomain: "burger-builder-2026.firebaseapp.com",
  projectId: "burger-builder-2026",
  storageBucket: "burger-builder-2026.firebasestorage.app",
  messagingSenderId: "171255737828",
  appId: "1:171255737828:web:35ce56a13ec6ee0138ebf1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export các service cần dùng
export const auth = getAuth(app);
export const db = getFirestore(app);