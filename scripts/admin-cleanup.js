// Admin Cleanup Utility
// Run this in browser console on admin page to clean up specific user

class AdminCleanup {
    constructor() {
        console.log('Admin Cleanup Utility loaded');
    }

    // Delete user from Firestore (keep auth for now)
    async deleteUserFromFirestore(email) {
        if (!window.FirebaseAuth) {
            console.error('Firebase not available');
            return false;
        }

        try {
            // Get all users from Firestore
            const result = await window.FirebaseAuth.getCollection('users');
            
            if (result.success) {
                const userDoc = result.docs.find(doc => doc.data().email === email);
                
                if (userDoc) {
                    console.log('Found user document:', userDoc.id);
                    
                    // Delete from Firestore
                    const deleteResult = await window.FirebaseAuth.deleteDocument('users', userDoc.id);
                    
                    if (deleteResult.success) {
                        console.log(`Successfully deleted user ${email} from Firestore`);
                        return true;
                    } else {
                        console.error('Failed to delete from Firestore:', deleteResult.error);
                        return false;
                    }
                } else {
                    console.log(`User ${email} not found in Firestore`);
                    return false;
                }
            } else {
                console.error('Failed to get users collection:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error in deleteUserFromFirestore:', error);
            return false;
        }
    }

    // Clean localStorage
    cleanLocalStorage() {
        const keysToRemove = [];
        
        // Find all keys related to the specific user
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('raiyansarwar022') || key.includes('firebase') || key.includes('user'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`Removed localStorage key: ${key}`);
        });
        
        console.log('LocalStorage cleaned');
    }

    // Full cleanup
    async fullCleanup(email = 'raiyansarwar022@gmail.com') {
        console.log(`Starting full cleanup for ${email}`);
        
        // 1. Delete from Firestore
        const firestoreDeleted = await this.deleteUserFromFirestore(email);
        
        // 2. Clean localStorage
        this.cleanLocalStorage();
        
        // 3. Sign out if currently signed in
        if (window.FirebaseAuth) {
            try {
                await window.FirebaseAuth.signOutUser();
                console.log('Signed out current user');
            } catch (error) {
                console.log('No user to sign out or error:', error);
            }
        }
        
        console.log('Cleanup completed!');
        console.log('Now you can:');
        console.log('1. Go to Firebase Console → Authentication → Users');
        console.log('2. Delete the user from Authentication');
        console.log('3. Re-create the account with new password');
        
        return {
            firestoreDeleted,
            localStorageCleaned: true
        };
    }
}

// Create global instance
window.AdminCleanup = new AdminCleanup();

// Usage instructions
console.log('=== ADMIN CLEANUP UTILITY ===');
console.log('To clean up raiyansarwar022@gmail.com:');
console.log('Run: AdminCleanup.fullCleanup()');
console.log('Or for specific email: AdminCleanup.fullCleanup("other@email.com")');
