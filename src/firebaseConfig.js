import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBVF5aoTKk9unV8L35h4L1g03aFBETX-cM",
  authDomain: "petshare-10350.firebaseapp.com",
  databaseURL: "https://petshare-10350-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "petshare-10350",
  storageBucket: "petshare-10350.firebasestorage.app",
  messagingSenderId: "302207624405",
  appId: "1:302207624405:web:3dd8fe531bfcd0fadeee5c",
  measurementId: "G-8FPM24GWV7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
