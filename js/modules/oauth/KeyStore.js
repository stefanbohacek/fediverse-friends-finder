const DB_NAME    = "fff-oauth";
const DB_VERSION = 1;
const STORE_NAME = "dpopKey";
const KEY_ID     = "current";

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
            ev.target.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = (ev) => resolve(ev.target.result);
        req.onerror   = (ev) => reject(ev.target.error);
    });
}

export async function storeKey(cryptoKey, jwk) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ cryptoKey, jwk }, KEY_ID);
        tx.oncomplete = () => resolve();
        tx.onerror    = (ev) => reject(ev.target.error);
    });
}

export async function loadKey() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(KEY_ID);
        req.onsuccess = (ev) => resolve(ev.target.result || null);
        req.onerror   = (ev) => reject(ev.target.error);
    });
}

export async function clearKey() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(KEY_ID);
        tx.oncomplete = () => resolve();
        tx.onerror    = (ev) => reject(ev.target.error);
    });
}
