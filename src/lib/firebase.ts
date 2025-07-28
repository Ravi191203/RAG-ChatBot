
'use client';

import {initializeApp, getApps, getApp} from 'firebase/app';
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  "projectId": "contextual-companion-vac8w",
  "appId": "1:904704963931:web:3a64ee1440c5b81555567e",
  "storageBucket": "contextual-companion-vac8w.firebasestorage.app",
  "apiKey": "AIzaSyBhpm6pp3-WxC8YFfiAxMMbYy7Z41YGU90",
  "authDomain": "contextual-companion-vac8w.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "904704963931"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleAuthProvider = new GoogleAuthProvider();


export { app, auth, googleAuthProvider };
