// db.js - Gestion complète d'IndexedDB avec promesses et gestion d'erreurs
let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 1;

// Stores disponibles
const stores = [
    { name: 'stocks', keyPath: 'id', autoIncrement: true },
    { name: 'recettes', keyPath: 'id', autoIncrement: true },
    { name: 'fermentations', keyPath: 'id', autoIncrement: true },
    { name: 'conditionnements', keyPath: 'id', autoIncrement: true },
    { name: 'ventes', keyPath: 'id', autoIncrement: true },
    { name: 'historique_stocks', keyPath: 'id', autoIncrement: true },
    { name: 'clients', keyPath: 'id', autoIncrement: true },
    { name: 'declarations_douanes', keyPath: 'id', autoIncrement: true }
];

// Initialiser la base de données
function initDB() {
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
                    const objectStore = db.createObjectStore(store.name, {
                        keyPath: store.keyPath,
                        autoIncrement: store.autoIncrement
                    });
                    // Créer des index si nécessaire
                    if (store.name === 'stocks') {
                        objectStore.createIndex('type', 'type', { unique: false });
                        objectStore.createIndex('nom', 'nom', { unique: false });
                    }
                }
            });
        };
    });
}

// Sauvegarder des données dans un store
async function saveData(storeName, data) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            // Effacer les anciennes données
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                // Ajouter les nouvelles données
                data.forEach(item => {
                    // Supprimer l'ID si présent pour laisser IndexedDB le générer
                    if (item.id) delete item.id;
                    store.add(item);
                });
                resolve();
            };

            clearRequest.onerror = (event) => reject(event.target.error);

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde dans ${storeName}:`, error);
        throw error;
    }
}

// Charger des données depuis un store
async function loadData(storeName) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors du chargement depuis ${storeName}:`, error);
        throw error;
    }
}

// Ajouter un seul élément
async function addItem(storeName, item) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            // Supprimer l'ID si présent pour laisser IndexedDB le générer
            if (item.id) delete item.id;

            const request = store.add(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de l'ajout dans ${storeName}:`, error);
        throw error;
    }
}

// Mettre à jour un élément
async function updateItem(storeName, item) {
    try {
        const database = await initDB();
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

// Supprimer un élément
async function deleteItem(storeName, id) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la suppression dans ${storeName}:`, error);
        throw error;
    }
}

// Supprimer tous les éléments d'un store
async function clearStore(storeName) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors du vidage de ${storeName}:`, error);
        throw error;
    }
}

// Initialiser la base de données au chargement de la page
initDB().catch(console.error);

// Charger une recette par ID
async function loadRecetteById(id) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['recettes'], 'readonly');
            const store = transaction.objectStore('recettes');
            const request = store.get(parseInt(id));

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors du chargement de la recette ${id}:`, error);
        throw error;
    }
}

// Mettre à jour une recette
async function updateRecette(recette) {
    try {
        const database = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['recettes'], 'readwrite');
            const store = transaction.objectStore('recettes');

            const request = store.put(recette);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de la recette:`, error);
        throw error;
    }
}
