// Authentication Module
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if Firebase auth is available
        if (!window.auth) {
            console.error('Firebase auth not initialized');
            return;
        }
        
        // Listen for auth state changes
        window.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.loadUserRole(user.uid);
            } else {
                this.currentUser = null;
                if (window.location.pathname.includes('index.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    async loadUserRole(uid) {
        if (!window.db) return;
        try {
            const userDoc = await window.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser.role = userData.role;
                this.currentUser.employeeId = userData.employeeId;
                window.currentUser = this.currentUser;
            }
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    }

    async login(email, password) {
        if (!window.auth) {
            return { success: false, error: 'Firebase auth not initialized' };
        }
        try {
            const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Load user role
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Update last login
                await window.db.collection('users').doc(user.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Log system action
                await this.logSystemAction(user.uid, 'LOGIN', `User logged in: ${email}`);
                
                return {
                    success: true,
                    user: {
                        uid: user.uid,
                        email: user.email,
                        role: userData.role,
                        employeeId: userData.employeeId
                    }
                };
            } else {
                throw new Error('User data not found');
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logout() {
        if (!window.auth) {
            return { success: false, error: 'Firebase auth not initialized' };
        }
        try {
            if (this.currentUser) {
                await this.logSystemAction(this.currentUser.uid, 'LOGOUT', 'User logged out');
            }
            await window.auth.signOut();
            window.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async resetPassword(email) {
        if (!window.auth) {
            return { success: false, error: 'Firebase auth not initialized' };
        }
        try {
            await window.auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async changePassword(currentPassword, newPassword) {
        if (!window.auth) {
            return { success: false, error: 'Firebase auth not initialized' };
        }
        try {
            const user = window.auth.currentUser;
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            
            await this.logSystemAction(user.uid, 'PASSWORD_CHANGE', 'User changed password');
            
            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async register(email, password, role, employeeId = null) {
        if (!window.auth || !window.db) {
            return { success: false, error: 'Firebase not initialized' };
        }
        try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            await window.db.collection('users').doc(user.uid).set({
                email: email,
                role: role,
                employeeId: employeeId || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            await this.logSystemAction(user.uid, 'REGISTER', `New user registered: ${email} as ${role}`);
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    role: role
                }
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logSystemAction(userId, action, details) {
        if (!window.db) return;
        try {
            await window.db.collection('systemLogs').add({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: userId,
                action: action,
                details: details
            });
        } catch (error) {
            console.error('Error logging system action:', error);
        }
    }
}

// Initialize auth instance
window.authInstance = new Auth();

