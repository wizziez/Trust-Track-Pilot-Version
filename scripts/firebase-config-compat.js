// Firebase configuration using compat library (v8 syntax)
// This file provides compatibility with the older Firebase v8 API

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
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Make database available globally for admin panel
window.db = db;

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Firebase Auth wrapper for compatibility
window.FirebaseAuth = {
    // Auth state observer
    onAuthStateChanged: (callback) => {
        return auth.onAuthStateChanged(callback);
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return auth.currentUser !== null;
    },

    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },

    // Sign up function
    signUpUser: async (email, password, displayName) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            await user.updateProfile({
                displayName: displayName
            });

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                createdAt: new Date(),
                reviewsCount: 0,
                helpfulVotes: 0,
                isVerified: false
            });

            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign in function
    signInUser: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },    // Sign out function
    signOutUser: async () => {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Google Sign in function
    signInWithGoogle: async () => {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            // Check if this is a new user and create profile if needed
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL,
                    createdAt: new Date(),
                    reviewsCount: 0,
                    helpfulVotes: 0,
                    isVerified: true, // Google users are considered verified
                    provider: 'google'
                });
            }
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get user data from Firestore
    getUserData: async (uid) => {
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return { success: true, data: userDoc.data() };
            } else {
                return { success: false, error: 'User data not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Update user data in Firestore
    updateUserData: async (uid, data) => {
        try {
            await db.collection('users').doc(uid).set(data, { merge: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get any document from Firestore
    getDocument: async (collection, docId) => {
        try {
            const docRef = db.collection(collection).doc(docId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return { success: true, data: docSnap.data() };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Also expose individual functions for compatibility
window.initAuthObserver = window.FirebaseAuth.onAuthStateChanged;
window.signUpUser = window.FirebaseAuth.signUpUser;
window.signInUser = window.FirebaseAuth.signInUser;
window.signOutUser = window.FirebaseAuth.signOutUser;
window.getUserData = window.FirebaseAuth.getUserData;
window.updateUserData = window.FirebaseAuth.updateUserData;

// Firestore wrapper
window.FirebaseFirestore = {
    // Add a document to a collection
    addDoc: async (collectionName, data) => {
        try {
            const docRef = await db.collection(collectionName).add(data);
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get documents from a collection
    getDocs: async (collectionName, orderByField = null, limit = null) => {
        try {
            let query = db.collection(collectionName);
            
            if (orderByField) {
                query = query.orderBy(orderByField, 'desc');
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, docs: docs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Listen to collection changes
    onSnapshot: (collectionName, callback, orderByField = null) => {
        let query = db.collection(collectionName);
        
        if (orderByField) {
            query = query.orderBy(orderByField, 'desc');
        }
        
        return query.onSnapshot(callback);
    },

    // Delete document function
    deleteDocument: async (collectionName, docId) => {
        try {
            await db.collection(collectionName).doc(docId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

console.log('Firebase compat configuration loaded successfully');
