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
            resolve(db);
            return;
        }

        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            dbReady = true;
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

// Charger des données depuis IndexedDB
async function loadDataFromIndexedDB(storeName) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors du chargement depuis ${storeName}:`, error);
        return [];
    }
}

// Sauvegarder des données dans IndexedDB
async function saveDataToIndexedDB(storeName, data) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans ${storeName}:`, error);
        throw error;
    }
}

// Fermer la base de données IndexedDB
function closeDB() {
    if (db) {
        db.close();
        dbReady = false;
        db = null;
    }
}

// Initialiser la base de données IndexedDB au chargement
openDB().catch(error => {
    console.error("Erreur initiale lors de l'ouverture de la base de données:", error);
    if (error.name === 'InvalidStateError') {
        closeDB();
        setTimeout(openDB, 1000);
    }
});

// Configuration pour Firestore
let firestoreDb;

function initializeFirestore() {
    const firebaseConfig = {
        apiKey: "VOTRE_API_KEY",
        authDomain: "VOTRE_AUTH_DOMAIN",
        projectId: "VOTRE_PROJECT_ID",
        storageBucket: "VOTRE_STORAGE_BUCKET",
        messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
        appId: "VOTRE_APP_ID"
    };

    firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
}

// Charger des données depuis Firestore
async function loadDataFromFirestore(collectionName) {
    if (!firestoreDb) initializeFirestore();
    try {
        const querySnapshot = await firestoreDb.collection(collectionName).get();
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Erreur lors du chargement des données pour ${collectionName}:`, error);
        return [];
    }
}

// Sauvegarder des données dans Firestore
async function saveDataToFirestore(collectionName, data) {
    if (!firestoreDb) initializeFirestore();
    try {
        const docRef = await firestoreDb.collection(collectionName).add(data);
        console.log("Document écrit avec l'ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans ${collectionName}:`, error);
        throw error;
    }
}

// Fonctions combinées pour charger les données
async function loadData(storeName) {
    let data = await loadDataFromFirestore(storeName);
    if (data.length === 0) {
        data = await loadDataFromIndexedDB(storeName);
    }
    return data;
}

// Fonctions combinées pour sauvegarder les données
async function saveData(storeName, data) {
    try {
        await saveDataToFirestore(storeName, data);
        await saveDataToIndexedDB(storeName, data);
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans ${storeName}:`, error);
        throw error;
    }
}

// Mettre à jour un élément dans IndexedDB
async function updateItem(storeName, item) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.put(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la mise à jour dans ${storeName}:`, error);
        throw error;
    }
}

// Supprimer un élément dans IndexedDB
async function deleteItem(storeName, id) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.delete(parseInt(id));

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la suppression dans ${storeName}:`, error);
        throw error;
    }
}

// Exporter les fonctions pour les rendre accessibles globalement
window.loadData = loadData;
window.saveData = saveData;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
