import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxRzH6983Ibohvz6EXwhhz6s0q4zdZU7o",
  authDomain: "budgetdost-1f63c.firebaseapp.com",
  projectId: "budgetdost-1f63c",
  storageBucket: "budgetdost-1f63c.firebasestorage.app",
  messagingSenderId: "879013128524",
  appId: "1:879013128524:android:d307d440da5210414d87e9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
