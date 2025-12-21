// auth.js
// Module d'authentification Firebase pour CrabGest
// Gère : inscription, connexion, validation admin, écoute d'état


let auth; // Ne pas redéclarer firestoreDb, on utilisera celle de DB

function initializeAuth(firestoreInstance) {
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyC1ZP89QSoWubkcnMJJ6cinIAlFXXnTefU",
            authDomain: "crabbrewgest.firebaseapp.com",
            projectId: "crabbrewgest",
            storageBucket: "crabbrewgest.firebasestorage.app",
            messagingSenderId: "156226949050",
            appId: "1:156226949050:web:52b3e666cc31e7963d5783",
            measurementId: "G-MY8FH7L6K1"
        };
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    console.log("[Auth] Module d'authentification initialisé.");
}

// Inscription avec email/mot de passe
async function signUpWithEmail(email, password, displayName) {
    try {
        console.log(`[Auth] Tentative d'inscription pour ${email}`);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Utiliser firestoreDb passé en paramètre via initializeAuth
        await firestoreInstance.collection('users').doc(user.uid).set({
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

// ... (le reste du fichier reste inchangé, mais remplacez toutes les occurrences de firestoreDb par firestoreInstance)


// Connexion avec email/mot de passe
async function signInWithEmail(email, password) {
    try {
        console.log(`[Auth] Tentative de connexion pour ${email}`);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Vérifier la validation
        const userDoc = await firestoreDBAuth.collection('users').doc(user.uid).get();
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
        console.log("[Auth] Connexion via Google...");
        const provider = new firebase.auth.GoogleAuthProvider();
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;

        // Vérifier/Créer le document utilisateur
        const userDoc = await firestoreDBAuth.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await firestoreDBAuth.collection('users').doc(user.uid).set({
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
        await firestoreDBAuth.collection('users').doc(uid).update({ validated: true });
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
        const snapshot = await firestoreDBAuth.collection('users').where('validated', '==', false).get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        return { success: true, users };
    } catch (error) {
        console.error("[Auth] Erreur liste utilisateurs:", error);
        return { success: false, message: error.message };
    }
}

// Écouteur d'état d'authentification
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await firestoreDBAuth.collection('users').doc(user.uid).get();
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
