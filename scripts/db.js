// db.js
let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 2;
let firestoreDb;

// Stores disponibles pour IndexedDB
const stores = [
    { name: 'stocks', keyPath: 'id', autoIncrement: true },
    { name: 'bieres', keyPath: 'id', autoIncrement: true },
    { name: 'fermentations', keyPath: 'id', autoIncrement: true },
    { name: 'conditionnements', keyPath: 'id', autoIncrement: true },
    { name: 'ventes', keyPath: 'id', autoIncrement: true },
    { name: 'historique_stocks', keyPath: 'id', autoIncrement: true },
    { name: 'clients', keyPath: 'id', autoIncrement: true },
    { name: 'declarations_douanes', keyPath: 'id', autoIncrement: true },
    { name: 'users', keyPath: 'uid' }
];

// Initialiser Firestore immédiatement
function initializeFirestore() {
    if (typeof firebase === 'undefined') {
        console.error("[DB] Firebase non chargé. Vérifiez l'ordre des scripts.");
        return null;
    }
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
        firestoreDb = firebase.firestore();
        console.log("[DB] Firestore initialisé avec succès.");
    } else {
        firestoreDb = firebase.firestore();
    }
    return firestoreDb;
}

// Initialiser Firestore dès que le script est chargé
const firestoreDbInstance = initializeFirestore();

// Initialiser la base de données IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        if (dbReady) {
            console.log("[IndexedDB] Base de données déjà ouverte et prête.");
            resolve(db);
            return;
        }

        console.log("[IndexedDB] Ouverture de la base de données...");
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error("[IndexedDB] Erreur lors de l'ouverture de la base de données:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            dbReady = true;
            console.log("[IndexedDB] Base de données ouverte avec succès.");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath, autoIncrement: store.autoIncrement });
                    console.log(`[IndexedDB] Store '${store.name}' créé.`);
                }
            });
        };
    });
}

// Charger des données depuis IndexedDB
async function loadDataFromIndexedDB(storeName) {
    try {
        console.log(`[IndexedDB] Chargement des données depuis le store '${storeName}'...`);
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                console.log(`[IndexedDB] Données chargées depuis '${storeName}':`, request.result);
                resolve(request.result || []);
            };
            request.onerror = (event) => {
                console.error(`[IndexedDB] Erreur lors du chargement depuis '${storeName}':`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error(`[IndexedDB] Erreur lors du chargement depuis '${storeName}':`, error);
        return [];
    }
}

// Sauvegarder des données dans IndexedDB
async function saveDataToIndexedDB(storeName, data) {
    try {
        console.log(`[IndexedDB] Sauvegarde des données dans '${storeName}':`, data);
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                console.log(`[IndexedDB] Données sauvegardées dans '${storeName}' avec l'ID:`, request.result);
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error(`[IndexedDB] Erreur lors de la sauvegarde dans '${storeName}':`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error(`[IndexedDB] Erreur lors de la sauvegarde dans '${storeName}':`, error);
        throw error;
    }
}

// Fermer la base de données IndexedDB
function closeDB() {
    if (db) {
        db.close();
        dbReady = false;
        db = null;
        console.log("[IndexedDB] Base de données fermée.");
    }
}

// Charger des données depuis Firestore (avec fallback silencieux)
async function loadDataFromFirestore(collectionName) {
    if (!firestoreDbInstance) {
        console.warn(`[Firestore] Firestore non initialisé, chargement depuis IndexedDB pour '${collectionName}'.`);
        return [];
    }
    try {
        console.log(`[Firestore] Chargement des données depuis la collection '${collectionName}'...`);
        const querySnapshot = await firestoreDbInstance.collection(collectionName).get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.warn(`[Firestore] Accès refusé à ${collectionName}, utilisation du fallback IndexedDB.`, error);
        return [];
    }
}

// Charger des données (combiner Firestore et IndexedDB)
async function loadData(storeName) {
    try {
        const firestoreData = await loadDataFromFirestore(storeName);
        if (firestoreData.length > 0) return firestoreData;
    } catch (error) {
        console.warn(`[DB] Erreur Firestore pour ${storeName}, fallback IndexedDB.`, error);
    }
    return await loadDataFromIndexedDB(storeName);
}

// Sauvegarder des données (Firestore + IndexedDB)
async function saveData(storeName, data) {
    try {
        if (!firestoreDbInstance) throw new Error("Firestore non disponible.");

        if (Array.isArray(data)) {
            // Si data est un tableau, sauvegarder chaque élément individuellement
            const ids = [];
            for (const item of data) {
                if (typeof item !== 'object' || Array.isArray(item)) {
                    console.error(`[DB] Chaque élément des données pour ${storeName} doit être un objet.`);
                    continue;
                }
                const docRef = await firestoreDbInstance.collection(storeName).add(item);
                await saveDataToIndexedDB(storeName, { ...item, id: docRef.id });
                ids.push(docRef.id);
                console.log(`[DB] Élément sauvegardé avec succès dans '${storeName}' (ID: ${docRef.id}).`);
            }
            return ids;
        } else {
            // Si data est un objet, le sauvegarder directement
            console.log(`[DB] Sauvegarde des données dans '${storeName}' (Firestore + IndexedDB)...`);
            const docRef = await firestoreDbInstance.collection(storeName).add(data);
            await saveDataToIndexedDB(storeName, { ...data, id: docRef.id });
            console.log(`[DB] Données sauvegardées avec succès dans '${storeName}'.`);
            return docRef.id;
        }
    } catch (error) {
        console.error(`[DB] Erreur lors de la sauvegarde dans '${storeName}':`, error);
        throw error;
    }
}


// Mettre à jour un élément dans IndexedDB
async function updateItem(storeName, item) {
    try {
        console.log(`[IndexedDB] Mise à jour de l'élément dans '${storeName}':`, item);
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => {
                console.log(`[IndexedDB] Élément mis à jour dans '${storeName}' avec l'ID:`, request.result);
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error(`[IndexedDB] Erreur lors de la mise à jour dans '${storeName}':`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error(`[IndexedDB] Erreur lors de la mise à jour dans '${storeName}':`, error);
        throw error;
    }
}

// Supprimer un élément dans IndexedDB
async function deleteItem(storeName, id) {
    try {
        console.log(`[IndexedDB] Suppression de l'élément avec l'ID ${id} dans '${storeName}'...`);
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(parseInt(id));

            request.onsuccess = () => {
                console.log(`[IndexedDB] Élément supprimé avec succès dans '${storeName}' (ID: ${id}).`);
                resolve();
            };
            request.onerror = (event) => {
                console.error(`[IndexedDB] Erreur lors de la suppression dans '${storeName}':`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error(`[IndexedDB] Erreur lors de la suppression dans '${storeName}':`, error);
        throw error;
    }
}

// Exporter les fonctions pour les rendre accessibles globalement
window.DB = {
    initializeFirestore: () => firestoreDbInstance,
    loadData: loadData,
    saveData: saveData,
    updateItem: updateItem,
    deleteItem: deleteItem
};
