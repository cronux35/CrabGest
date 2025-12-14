let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 2; // Version actuelle

// Stores disponibles
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

// Initialiser la base de données
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

            // Vérifier si le store 'recettes' existe et doit être migré vers 'bieres'
            if (event.oldVersion < 2 && db.objectStoreNames.contains('recettes')) {
                try {
                    const recettes = [];
                    const transaction = event.target.transaction;
                    const oldStore = transaction.objectStore('recettes');
                    const cursorRequest = oldStore.openCursor();

                    cursorRequest.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            recettes.push(cursor.value);
                            cursor.continue();
                        } else {
                            // Créer le nouveau store 'bieres' s'il n'existe pas
                            if (!db.objectStoreNames.contains('bieres')) {
                                const newStore = db.createObjectStore('bieres', { keyPath: 'id', autoIncrement: true });
                                newStore.createIndex('nom', 'nom', { unique: false });

                                // Copier les données
                                recettes.forEach(recette => newStore.add(recette));
                            }
                            db.deleteObjectStore('recettes');
                        }
                    };
                } catch (error) {
                    console.error("Erreur lors de la migration des recettes:", error);
                }
            }

            // Créer les stores s'ils n'existent pas
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
                    } else if (store.name === 'bieres') {
                        objectStore.createIndex('nom', 'nom', { unique: false });
                    }
                }
            });
        };

        request.onblocked = (event) => {
            console.warn("La base de données est bloquée par une autre connexion. Fermer les autres onglets utilisant cette application.");
            reject(new Error("Base de données bloquée"));
        };
    });
}

// Sauvegarder des données
async function saveData(storeName, data) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            // Vérifie que `data` est un tableau
            if (!Array.isArray(data)) {
                data = [data]; // Convertit en tableau si ce n'est pas déjà le cas
            }

            // Efface les anciennes données
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                // Ajoute les nouvelles données
                data.forEach(item => {
                    if (item.id) delete item.id; // Laisser IndexedDB générer l'ID
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


// Charger des données
async function loadData(storeName) {
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
        throw error;
    }
}


// Sauvegarder ou mettre à jour un élément
async function saveData(storeName, item) {
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
        console.error(`Erreur lors de la sauvegarde dans ${storeName}:`, error);
        throw error;
    }
}

// Mettre à jour un élément (alias pour saveData)
const updateData = saveData;


// Charger un élément par ID
async function loadItemById(storeName, id) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(parseInt(id));

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error(`Erreur lors du chargement de l'élément ${id} depuis ${storeName}:`, error);
        throw error;
    }
}

// Ajouter un seul élément
async function addItem(storeName, item) {
    try {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const itemToAdd = {...item};
            if (itemToAdd.id) delete itemToAdd.id; // Laisser IndexedDB générer l'ID
            const request = store.add(itemToAdd);

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

// Supprimer un élément
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

// Fermer la base de données
function closeDB() {
    if (db) {
        db.close();
        dbReady = false;
        db = null;
    }
}

// Initialiser la base de données au chargement
openDB().catch(error => {
    console.error("Erreur initiale lors de l'ouverture de la base de données:", error);
    // En cas d'erreur initiale, on peut essayer de fermer les connexions existantes
    if (error.name === 'InvalidStateError') {
        closeDB();
        // Réessayer après un court délai
        setTimeout(openDB, 1000);
    }
});
