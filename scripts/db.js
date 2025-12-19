// Configuration pour IndexedDB
let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 2;

// Stores disponibles pour IndexedDB
const stores = [
    { name: 'stocks', keyPath: 'id', autoIncrement: true },
    { name: 'bieres', keyPath: 'id', autoIncrement: true },
    { name: 'fermentations', keyPath: 'id', autoIncrement: true },
    { name: 'conditionnements', keyPath: 'id', autoIncrement: true },
    { name: 'ventes', keyPath: 'id', autoIncrement: true },
    { name: 'historique_stocks', keyPath: 'id', autoIncrement: true },
    { name: 'clients', keyPath: 'id', autoIncrement: true },
    { name: 'declarations_douanes', keyPath: 'id', autoIncrement: true }
];

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

// Initialiser la base de données IndexedDB au chargement
openDB().catch(error => {
    console.error("[IndexedDB] Erreur initiale lors de l'ouverture de la base de données:", error);
    if (error.name === 'InvalidStateError') {
        closeDB();
        setTimeout(openDB, 1000);
    }
});

// Configuration pour Firestore
let firestoreDb;

function initializeFirestore() {
    console.log("[Firestore] Initialisation de Firebase...");
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
    console.log("[Firestore] Firebase initialisé avec succès.");
}

// Charger des données depuis Firestore
async function loadDataFromFirestore(collectionName) {
    if (!firestoreDb) {
        console.log("[Firestore] Initialisation de Firestore avant chargement...");
        initializeFirestore();
    }
    try {
        console.log(`[Firestore] Chargement des données depuis la collection '${collectionName}'...`);
        const querySnapshot = await firestoreDb.collection(collectionName).get();
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        console.log(`[Firestore] Données chargées depuis '${collectionName}':`, data);
        return data;
    } catch (error) {
        console.error(`[Firestore] Erreur lors du chargement des données pour '${collectionName}':`, error);
        return [];
    }
}

// Sauvegarder des données dans Firestore
async function saveDataToFirestore(collectionName, data) {
    if (!firestoreDb) {
        console.log("[Firestore] Initialisation de Firestore avant sauvegarde...");
        initializeFirestore();
    }
    try {
        console.log(`[Firestore] Sauvegarde des données dans '${collectionName}':`, data);
        const docRef = await firestoreDb.collection(collectionName).add(data);
        console.log(`[Firestore] Document écrit avec l'ID: ${docRef.id} dans '${collectionName}'.`);
        return docRef.id;
    } catch (error) {
        console.error(`[Firestore] Erreur lors de la sauvegarde dans '${collectionName}':`, error);
        throw error;
    }
}

// Fonctions combinées pour charger les données
async function loadData(storeName) {
    console.log(`[DB] Chargement des données depuis '${storeName}' (Firestore puis IndexedDB si vide)...`);
    let data = await loadDataFromFirestore(storeName);
    if (data.length === 0) {
        console.log(`[DB] Aucune donnée dans Firestore pour '${storeName}', chargement depuis IndexedDB...`);
        data = await loadDataFromIndexedDB(storeName);
    } else {
        console.log(`[DB] Données chargées depuis Firestore pour '${storeName}'.`);
    }
    return data;
}

// Fonctions combinées pour sauvegarder les données
async function saveData(storeName, data) {
    try {
        console.log(`[DB] Sauvegarde des données dans '${storeName}' (Firestore + IndexedDB)...`);
        const firestoreId = await saveDataToFirestore(storeName, data);
        await saveDataToIndexedDB(storeName, { ...data, id: firestoreId });
        console.log(`[DB] Données sauvegardées avec succès dans '${storeName}' (ID Firestore: ${firestoreId}).`);
        return firestoreId;
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
window.loadData = loadData;
window.saveData = saveData;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
