let db;
let dbReady = false;
const dbName = 'CrabGestDB';
const dbVersion = 2;

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

            if (event.oldVersion < 2 && db.objectStoreNames.contains('recettes')) {
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
                        const newStore = db.createObjectStore('bieres', { keyPath: 'id', autoIncrement: true });
                        recettes.forEach(recette => newStore.add(recette));
                        db.deleteObjectStore('recettes');
                    }
                };
            }

            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    const objectStore = db.createObjectStore(store.name, {
                        keyPath: store.keyPath,
                        autoIncrement: store.autoIncrement
                    });

                    if (store.name === 'stocks') {
                        objectStore.createIndex('type', 'type', { unique: false });
                        objectStore.createIndex('nom', 'nom', { unique: false });
                    } else if (store.name === 'bieres') {
                        objectStore.createIndex('nom', 'nom', { unique: false });
                    }
                }
            });
        };
    });
}

async function saveData(storeName, data) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => {
            data.forEach(item => {
                if (item.id) delete item.id;
                store.add(item);
            });
            resolve();
        };

        clearRequest.onerror = (event) => reject(event.target.error);
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
}

async function loadData(storeName) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function loadItemById(storeName, id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(parseInt(id));

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function addItem(storeName, item) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        if (item.id) delete item.id;
        const request = store.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function updateItem(storeName, item) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const request = store.put(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function deleteItem(storeName, id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const request = store.delete(parseInt(id));

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

openDB().catch(console.error);
