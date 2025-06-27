// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDwqJR1iCMbOy3rYkGMYdZ16EwmfDjpZM",
  authDomain: "trusttrack-c37ff.firebaseapp.com",
  projectId: "trusttrack-c37ff",
  storageBucket: "trusttrack-c37ff.firebasestorage.app",
  messagingSenderId: "797877336696",
  appId: "1:797877336696:web:b88de71cd0c985e76d0b8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other modules
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, GoogleAuthProvider, signInWithPopup };

// Auth state observer
export const initAuthObserver = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Sign up function
export const signUpUser = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, {
            displayName: displayName
        });

        // Determine role
        const role = (email === 'raiyansarwar022@gmail.com') ? 'admin' : 'user';

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            createdAt: new Date(),
            reviewsCount: 0,
            helpfulVotes: 0,
            isVerified: false,
            role: role
        });

        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign in function
export const signInUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign out function
export const signOutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Get user data from Firestore
export const getUserData = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        } else {
            return { success: false, error: 'User data not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Update user data in Firestore
export const updateUserData = async (uid, data) => {
    try {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
