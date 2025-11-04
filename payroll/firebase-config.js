import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);

const firebaseConfig = {
    apiKey: "AIzaSyBAKWDjpFiKdNlXE7QLZSULlcZoWnSt9eg",
    authDomain: "payroll-system-feaa9.firebaseapp.com",
    projectId:"payroll-system-feaa9",
    storageBucket: "payroll-system-feaa9.firebasestorage.app",
    messagingSenderId: "191802250029",
    appId: "1:191802250029:web:a5cc3fded11234e38db9a4"
};


// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" &&
                             firebaseConfig.authDomain !== "YOUR_AUTH_DOMAIN";

// Initialize Firebase only if configured
if (isFirebaseConfigured) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Initialize services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Export for use in other files
    window.auth = auth;
    window.db = db;
    window.storage = storage;
    
    console.log('Firebase initialized successfully');
} else {
    console.warn('Firebase not configured. Please update firebase-config.js with your credentials.');
    window.auth = null;
    window.db = null;
    window.storage = null;
}

