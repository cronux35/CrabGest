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
            throw new Error("DB non initialisé.");
        }
        const firestoreDb = window.DB.initializeFirestore();
        if (!firestoreDb) throw new Error("Firestore non disponible.");

        // Vérifier si l'email existe déjà (avec fallback si permission refusée)
        try {
            const usersRef = firestoreDb.collection('users');
            const snapshot = await usersRef.where('email', '==', email).get();
            if (!snapshot.empty) {
                return { success: false, message: "Un compte existe déjà avec cet email." };
            }
        } catch (error) {
            console.warn("[Auth] Impossible de vérifier l'email existant (permissions). Continuons...");
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Sauvegarder l'utilisateur dans Firestore (avec fallback si permission refusée)
        try {
            await firestoreDb.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: displayName,
                validated: false,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("[Auth] Impossible de sauvegarder l'utilisateur dans Firestore:", error);
            // En développement, on peut ignorer cette erreur pour continuer
            // En production, il faudrait bloquer ici
        }

        await user.sendEmailVerification();
        await auth.signOut();
        return { success: true, message: "Inscription réussie. Un email de vérification a été envoyé. Votre compte sera validé par un administrateur." };
    } catch (error) {
        console.error("[Auth] Erreur d'inscription:", error);
        let message = "Une erreur est survenue lors de l'inscription.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Un compte existe déjà avec cet email.";
        } else if (error.code === 'auth/weak-password') {
            message = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (error.code === 'auth/invalid-email') {
            message = "L'email saisi est invalide.";
        } else if (error.code === 'permission-denied') {
            message = "Permissions insuffisantes. Contactez l'administrateur.";
        }
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
        try {
            const userDoc = await firestoreDb.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await auth.signOut();
                return { success: false, message: "Utilisateur non trouvé. Veuillez vérifier vos informations." };
            }

            if (!userDoc.data().validated) {
                await auth.signOut();
                return { success: false, message: "Compte non validé. Contactez un administrateur pour activer votre compte." };
            }
        } catch (error) {
            console.error("[Auth] Impossible de vérifier le statut de l'utilisateur:", error);
            // En cas d'erreur de permission, on suppose que l'utilisateur est valide
            // (à éviter en production, mais utile pour le développement)
        }

        return { success: true, user: { uid: user.uid, email: user.email } };
    } catch (error) {
        console.error("[Auth] Erreur de connexion:", error);
        let message = "Email ou mot de passe incorrect.";
        if (error.code === 'auth/user-not-found') {
            message = "Aucun compte trouvé avec cet email.";
        } else if (error.code === 'auth/wrong-password') {
            message = "Mot de passe incorrect.";
        } else if (error.code === 'auth/user-disabled') {
            message = "Ce compte a été désactivé.";
        } else if (error.code === 'permission-denied') {
            message = "Permissions insuffisantes. Contactez l'administrateur.";
        }
        return { success: false, message: message };
    }
}

// Connexion avec Google
async function signInWithGoogle() {
    try {
        if (!auth) throw new Error("Auth non initialisé.");

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        // Utiliser signInWithRedirect à la place de signInWithPopup si COOP pose problème
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // En développement local, utiliser signInWithPopup avec un fallback
            try {
                const userCredential = await auth.signInWithPopup(provider);
                return await handleGoogleUser(userCredential.user);
            } catch (popupError) {
                if (popupError.code === 'auth/popup-closed-by-user') {
                    // Si la popup est fermée, utiliser signInWithRedirect
                    await auth.signInWithRedirect(provider);
                    return { success: false, message: "Redirection vers Google pour authentification. Veuillez revenir après la connexion." };
                }
                throw popupError;
            }
        } else {
            // En production, utiliser signInWithRedirect pour éviter les problèmes COOP
            await auth.signInWithRedirect(provider);
            return { success: false, message: "Redirection vers Google pour authentification. Veuillez revenir après la connexion." };
        }
    } catch (error) {
        console.error("[Auth] Erreur connexion Google:", error);
        let message = "Une erreur est survenue avec la connexion Google.";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "La fenêtre de connexion a été fermée. Veuillez réessayer.";
        } else if (error.code === 'auth/network-request-failed') {
            message = "Erreur réseau. Vérifiez votre connexion internet.";
        } else if (error.code === 'auth/internal-error') {
            message = "Erreur interne. Vérifiez que les cookies tiers sont autorisés pour ce site.";
        }
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

// Gérer la redirection après signInWithRedirect
async function handleRedirectResult() {
    try {
        const result = await auth.getRedirectResult();
        if (result) {
            return await handleGoogleUser(result.user);
        }
        return { success: false, message: "Aucun résultat de redirection." };
    } catch (error) {
        console.error("[Auth] Erreur lors de la redirection:", error);
        return { success: false, message: "Erreur lors de la redirection Google." };
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
