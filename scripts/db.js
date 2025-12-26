// Variables globales
let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 2;
let firestoreDb;
const appDataCache = {};

// Stores disponibles pour IndexedDB
const stores = [
    { name: 'stocks', keyPath: 'id', autoIncrement: false }, // Changé pour accepter les IDs Firestore
    { name: 'bieres', keyPath: 'id', autoIncrement: false },
    { name: 'fermentations', keyPath: 'id', autoIncrement: false },
    { name: 'conditionnements', keyPath: 'id', autoIncrement: false },
    { name: 'ventes', keyPath: 'id', autoIncrement: false },
    { name: 'historique_stocks', keyPath: 'id', autoIncrement: false },
    { name: 'clients', keyPath: 'id', autoIncrement: false },
    { name: 'declarations_douanes', keyPath: 'id', autoIncrement: false },
    { name: 'users', keyPath: 'uid' }
];

// Initialiser Firestore
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

// Ouvrir IndexedDB
async function openDB() {
    return new Promise((resolve, reject) => {
        if (dbReady) {
            console.log("[IndexedDB] Base de données déjà ouverte.");
            resolve(db);
            return;
        }

        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error("[IndexedDB] Erreur d'ouverture:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            dbReady = true;
            console.log("[IndexedDB] Base ouverte avec succès.");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath, autoIncrement: store.autoIncrement });
                }
            });
        };
    });
}

// Charger des données depuis Firestore avec cache
async function loadDataFromFirestore(collectionName) {
    if (!firestoreDbInstance) {
        console.error("[Firestore] Non initialisé.");
        return [];
    }
    try {
        console.log(`[Firestore] Chargement de '${collectionName}'...`);
        const snapshot = await firestoreDbInstance.collection(collectionName).get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appDataCache[collectionName] = data; // Mise en cache
        return data;
    } catch (error) {
        console.error(`[Firestore] Erreur pour '${collectionName}':`, error);
        return [];
    }
}

// Charger des données depuis IndexedDB
async function loadDataFromIndexedDB(storeName) {
    try {
        const database = await openDB();
        return new Promise((resolve) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    } catch (error) {
        console.error(`[IndexedDB] Erreur pour '${storeName}':`, error);
        return [];
    }
}

// Sauvegarder dans IndexedDB
async function saveToIndexedDB(storeName, data) {
    try {
        const database = await openDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        // Si data est un tableau, sauvegarder chaque élément
        if (Array.isArray(data)) {
            await store.clear(); // Effacer les anciennes données
            data.forEach(item => store.put(item));
        } else {
            // Si data est un objet, le sauvegarder directement
            await store.put(data);
        }

        await transaction.done;
        console.log(`[IndexedDB] Données sauvegardées dans '${storeName}'.`);
    } catch (error) {
        console.error(`[IndexedDB] Erreur pour '${storeName}':`, error);
        throw error;
    }
}

// Charger des données (avec cache et synchronisation)
async function loadData(storeName) {
    // Vérifier le cache d'abord
    if (appDataCache[storeName] && appDataCache[storeName].length > 0) {
        console.log(`[Cache] Données chargées depuis le cache pour '${storeName}'.`);
        return appDataCache[storeName];
    }

    // Charger depuis Firestore
    const firestoreData = await loadDataFromFirestore(storeName);
    if (firestoreData.length > 0) {
        await saveToIndexedDB(storeName, firestoreData);
        return firestoreData;
    }

    // Fallback sur IndexedDB si Firestore échoue
    const indexedDBData = await loadDataFromIndexedDB(storeName);
    if (indexedDBData.length > 0) {
        appDataCache[storeName] = indexedDBData;
    }
    return indexedDBData;
}

// Ajouter un élément
async function addItem(storeName, item) {
    try {
        if (!firestoreDbInstance) throw new Error("Firestore non disponible.");

        // Ajouter à Firestore
        const docRef = await firestoreDbInstance.collection(storeName).add(item);
        const newItem = { id: docRef.id, ...item };

        // Mettre à jour le cache
        if (!appDataCache[storeName]) appDataCache[storeName] = [];
        appDataCache[storeName].push(newItem);

        // Sauvegarder dans IndexedDB
        await saveToIndexedDB(storeName, newItem);

        console.log(`[DB] Élément ajouté à '${storeName}' (ID: ${newItem.id}).`);
        return newItem.id;
    } catch (error) {
        console.error(`[DB] Erreur lors de l'ajout dans '${storeName}':`, error);
        throw error;
    }
}

// Mettre à jour un élément
async function updateItem(storeName, item) {
    try {
        if (!firestoreDbInstance) throw new Error("Firestore non disponible.");
        if (!item.id) throw new Error("L'élément doit avoir un ID.");

        // Mettre à jour Firestore
        await firestoreDbInstance.collection(storeName).doc(item.id).set(item);

        // Mettre à jour le cache
        if (!appDataCache[storeName]) appDataCache[storeName] = [];
        const index = appDataCache[storeName].findIndex(i => i.id === item.id);
        if (index !== -1) {
            appDataCache[storeName][index] = item;
        } else {
            appDataCache[storeName].push(item);
        }

        // Mettre à jour IndexedDB
        await saveToIndexedDB(storeName, item);

        console.log(`[DB] Élément mis à jour dans '${storeName}' (ID: ${item.id}).`);
        return item.id;
    } catch (error) {
        console.error(`[DB] Erreur lors de la mise à jour dans '${storeName}':`, error);
        throw error;
    }
}

// Supprimer un élément
async function deleteItem(storeName, id) {
    try {
        if (!firestoreDbInstance) throw new Error("Firestore non disponible.");

        // Supprimer de Firestore
        await firestoreDbInstance.collection(storeName).doc(id).delete();

        // Mettre à jour le cache
        if (appDataCache[storeName]) {
            appDataCache[storeName] = appDataCache[storeName].filter(item => item.id !== id);
        }

        // Supprimer d'IndexedDB
        const database = await openDB();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.delete(id);
        await transaction.done;

        console.log(`[DB] Élément supprimé de '${storeName}' (ID: ${id}).`);
    } catch (error) {
        console.error(`[DB] Erreur lors de la suppression dans '${storeName}':`, error);
        throw error;
    }
}

// Charger un élément par ID
async function loadItemById(storeName, id) {
    try {
        if (!firestoreDbInstance) throw new Error("Firestore non disponible.");

        // Vérifier le cache d'abord
        if (appDataCache[storeName]) {
            const cachedItem = appDataCache[storeName].find(item => item.id === id);
            if (cachedItem) return cachedItem;
        }

        // Charger depuis Firestore
        const doc = await firestoreDbInstance.collection(storeName).doc(id).get();
        if (!doc.exists) return null;

        const item = { id: doc.id, ...doc.data() };

        // Mettre à jour le cache
        if (!appDataCache[storeName]) appDataCache[storeName] = [];
        const index = appDataCache[storeName].findIndex(i => i.id === id);
        if (index !== -1) {
            appDataCache[storeName][index] = item;
        } else {
            appDataCache[storeName].push(item);
        }

        // Sauvegarder dans IndexedDB
        await saveToIndexedDB(storeName, item);

        return item;
    } catch (error) {
        console.error(`[DB] Erreur lors du chargement de l'élément depuis '${storeName}':`, error);
        throw error;
    }
}

// Synchroniser les données
async function syncData(storeName) {
    try {
        const firestoreData = await loadDataFromFirestore(storeName);
        if (firestoreData.length > 0) {
            await saveToIndexedDB(storeName, firestoreData);
            appDataCache[storeName] = firestoreData;
            console.log(`[DB] Synchronisation réussie pour '${storeName}'.`);
        }
    } catch (error) {
        console.error(`[DB] Erreur de synchronisation pour '${storeName}':`, error);
    }
}

// Exporter les fonctions
window.DB = {
    initializeFirestore: () => firestoreDbInstance,
    loadData: loadData,
    addItem: addItem,
    updateItem: updateItem,
    deleteItem: deleteItem,
    loadItemById: loadItemById,
    syncData: syncData,
    saveData: saveToIndexedDB,
    loadDataFromFirestore: loadDataFromFirestore,
    loadDataFromIndexedDB: loadDataFromIndexedDB
};
