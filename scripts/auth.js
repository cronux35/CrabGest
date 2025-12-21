// auth.js
let auth;

function initializeAuth() {
    if (typeof firebase === 'undefined') {
        console.error("[Auth] Firebase non chargé.");
        return;
    }
    auth = firebase.auth();
    console.log("[Auth] Module d'authentification initialisé.");
}

// Inscription avec email/mot de passe
async function signUpWithEmail(email, password, displayName) {
    try {
        if (!window.DB || !window.DB.initializeFirestore) {
            throw new Error("DB non initialisé. Vérifiez que db.js est chargé.");
        }
        const firestoreDb = window.DB.initializeFirestore();
        if (!firestoreDb) throw new Error("Firestore non disponible.");

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await firestoreDb.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: displayName,
            validated: false,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await user.sendEmailVerification();
        await auth.signOut();
        return { success: true, message: "Inscription réussie. Votre compte sera validé par un administrateur." };
    } catch (error) {
        console.error("[Auth] Erreur d'inscription:", error);
        return { success: false, message: error.message };
    }
}

// Connexion avec email/mot de passe
async function signInWithEmail(email, password) {
    try {
        if (!auth) throw new Error("Auth non initialisé.");

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const firestoreDb = window.DB.initializeFirestore();
        const userDoc = await firestoreDb.collection('users').doc(user.uid).get();
        if (!userDoc.exists || !userDoc.data().validated) {
            await auth.signOut();
            return { success: false, message: "Compte non validé. Contactez un administrateur." };
        }

        return { success: true, user: { uid: user.uid, ...userDoc.data() } };
    } catch (error) {
        console.error("[Auth] Erreur de connexion:", error);
        return { success: false, message: error.message };
    }
}

// Connexion avec Google
async function signInWithGoogle() {
    try {
        if (!auth) throw new Error("Auth non initialisé.");

        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;

        const firestoreDb = window.DB.initializeFirestore();
        const userDoc = await firestoreDb.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await firestoreDb.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                validated: false,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await auth.signOut();
            return { success: false, message: "Compte créé. Validation requise par un administrateur." };
        } else if (!userDoc.data().validated) {
            await auth.signOut();
            return { success: false, message: "Compte non validé. Contactez un administrateur." };
        }

        return { success: true, user: { uid: user.uid, ...userDoc.data() } };
    } catch (error) {
        console.error("[Auth] Erreur connexion Google:", error);
        return { success: false, message: error.message };
    }
}

// Déconnexion
async function signOut() {
    try {
        if (!auth) throw new Error("Auth non initialisé.");
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error("[Auth] Erreur déconnexion:", error);
        return { success: false, message: error.message };
    }
}

// Valider un utilisateur (réservé admin)
async function validateUser(uid) {
    try {
        const firestoreDb = window.DB.initializeFirestore();
        await firestoreDb.collection('users').doc(uid).update({ validated: true });
        console.log(`[Auth] Utilisateur ${uid} validé.`);
        return { success: true };
    } catch (error) {
        console.error("[Auth] Erreur validation:", error);
        return { success: false, message: error.message };
    }
}

// Lister les utilisateurs non validés (réservé admin)
async function getUnvalidatedUsers() {
    try {
        const firestoreDb = window.DB.initializeFirestore();
        const snapshot = await firestoreDb.collection('users').where('validated', '==', false).get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        return { success: true, users };
    } catch (error) {
        console.error("[Auth] Erreur liste utilisateurs:", error);
        return { success: false, message: error.message };
    }
}

// Écouteur d'état d'authentification
function onAuthStateChanged(callback) {
    if (!auth) {
        console.error("[Auth] Auth non initialisé.");
        return;
    }
    return auth.onAuthStateChanged(async (user) => {
        if (user) {
            const firestoreDb = window.DB.initializeFirestore();
            const userDoc = await firestoreDb.collection('users').doc(user.uid).get();
            callback(userDoc.exists && userDoc.data().validated ? { loggedIn: true, user: { uid: user.uid, ...userDoc.data() } } : { loggedIn: false });
        } else {
            callback({ loggedIn: false });
        }
    });
}

// Exporter les fonctions
window.Auth = {
    initialize: initializeAuth,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    validateUser,
    getUnvalidatedUsers,
    onAuthStateChanged
};
