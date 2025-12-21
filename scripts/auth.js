// auth.js
let auth;

function initializeAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error("[Auth] Firebase Auth non disponible.");
        return;
    }
    auth = firebase.auth();
    console.log("[Auth] Module d'authentification initialisé.");
}

// Inscription avec email/mot de passe
async function signUpWithEmail(email, password, displayName) {
    try {
        if (!window.DB || !window.DB.initializeFirestore) {
            throw new Error("DB non initialisé.");
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
        return { success: true, message: "Inscription réussie. Un email de vérification a été envoyé." };
    } catch (error) {
        console.error("[Auth] Erreur d'inscription:", error);
        let message = "Une erreur est survenue.";
        if (error.code === 'auth/email-already-in-use') message = "Un compte existe déjà avec cet email.";
        else if (error.code === 'auth/weak-password') message = "Le mot de passe doit contenir au moins 6 caractères.";
        else if (error.code === 'auth/invalid-email') message = "L'email saisi est invalide.";
        else if (error.code === 'permission-denied') message = "Permissions insuffisantes. Contactez l'administrateur.";
        return { success: false, message: message };
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
        let message = "Email ou mot de passe incorrect.";
        if (error.code === 'auth/user-not-found') message = "Aucun compte trouvé avec cet email.";
        else if (error.code === 'auth/wrong-password') message = "Mot de passe incorrect.";
        else if (error.code === 'auth/user-disabled') message = "Ce compte a été désactivé.";
        else if (error.code === 'permission-denied') message = "Permissions insuffisantes. Contactez l'administrateur.";
        return { success: false, message: message };
    }
}

// Connexion avec Google (avec popup et gestion des erreurs)
async function signInWithGoogle() {
    try {
        if (!auth) throw new Error("Auth non initialisé.");

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        // Configuration pour éviter les problèmes de COOP
        const popupWindow = window.open('', '_blank', 'width=600,height=600');
        try {
            const userCredential = await auth.signInWithPopup(provider);
            popupWindow.close(); // Fermer la popup après succès
            return await handleGoogleUser(userCredential.user);
        } catch (error) {
            popupWindow.close(); // Fermer la popup en cas d'erreur
            throw error;
        }
    } catch (error) {
        console.error("[Auth] Erreur connexion Google:", error);
        let message = "Une erreur est survenue.";
        if (error.code === 'auth/popup-closed-by-user') message = "La fenêtre a été fermée. Veuillez réessayer.";
        else if (error.code === 'auth/cancelled-popup-request') message = "Une autre fenêtre est déjà ouverte.";
        else if (error.code === 'auth/network-request-failed') message = "Erreur réseau. Vérifiez votre connexion.";
        else if (error.code === 'auth/internal-error') message = "Erreur interne. Activez les cookies tiers.";
        else if (error.code === 'permission-denied') message = "Permissions insuffisantes. Contactez l'administrateur.";
        return { success: false, message: message };
    }
}

async function handleGoogleUser(user) {
    try {
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
            return { success: false, message: "Compte Google créé. Validation requise par un administrateur." };
        } else if (!userDoc.data().validated) {
            await auth.signOut();
            return { success: false, message: "Compte Google non validé. Contactez un administrateur." };
        }

        return { success: true, user: { uid: user.uid, email: user.email, displayName: user.displayName } };
    } catch (error) {
        console.error("[Auth] Erreur traitement utilisateur Google:", error);
        return { success: false, message: "Erreur lors du traitement de l'utilisateur Google." };
    }
}

// Déconnexion
async function signOut() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error("[Auth] Erreur déconnexion:", error);
        return { success: false, message: error.message };
    }
}

// Valider un utilisateur (admin)
async function validateUser(uid) {
    try {
        const firestoreDb = window.DB.initializeFirestore();
        await firestoreDb.collection('users').doc(uid).update({ validated: true });
        return { success: true };
    } catch (error) {
        console.error("[Auth] Erreur validation:", error);
        return { success: false, message: error.message };
    }
}

// Lister les utilisateurs non validés (admin)
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
            try {
                const userDoc = await firestoreDb.collection('users').doc(user.uid).get();
                callback(userDoc.exists && userDoc.data().validated ?
                    { loggedIn: true, user: { uid: user.uid, ...userDoc.data() } } :
                    { loggedIn: false });
            } catch (error) {
                console.error("[Auth] Erreur vérification utilisateur:", error);
                callback({ loggedIn: false });
            }
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
