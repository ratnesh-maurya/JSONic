"use client";

/**
 * Draft persistence.
 *
 * localStorage caps at roughly 5 MB per origin and stores strings synchronously
 * on the main thread, so it is the wrong place for a JSON document. IndexedDB
 * gets tens of megabytes to gigabytes depending on the browser and free disk,
 * and writes asynchronously. Preferences stay in localStorage (see lib/prefs).
 */

const DB_NAME = "jsonic";
const DB_VERSION = 1;
const STORE = "documents";
const DRAFT_PREFIX = "draft:";
const HISTORY_LIMIT = 20;

/** Refuse to persist beyond this — writing a 200 MB draft on every pause is not worth it. */
const MAX_PERSIST_BYTES = 20_000_000;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === "undefined") return Promise.resolve(null);
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve) => {
        let request: IDBOpenDBRequest;
        try {
            request = indexedDB.open(DB_NAME, DB_VERSION);
        } catch {
            resolve(null); // Firefox private browsing throws here
            return;
        }
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
    });

    return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
    return openDb().then(
        (db) =>
            new Promise<T | null>((resolve) => {
                if (!db) return resolve(null);
                let request: IDBRequest<T>;
                try {
                    request = work(db.transaction(STORE, mode).objectStore(STORE));
                } catch {
                    return resolve(null);
                }
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null); // includes QuotaExceededError
            }),
    );
}

export interface StoredDocument {
    id: string;
    text: string;
    savedAt: number;
    bytes: number;
}

/** Skips the write when the document would not fit, rather than throwing mid-typing. */
export async function saveDraft(text: string, tool = "default"): Promise<boolean> {
    if (text.length > MAX_PERSIST_BYTES) return false;

    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
        try {
            const { quota, usage } = await navigator.storage.estimate();
            if (quota && usage && quota - usage < text.length * 2) return false;
        } catch {
            // estimate is advisory; fall through and let the write decide
        }
    }

    const record: StoredDocument = { id: `${DRAFT_PREFIX}${tool}`, text, savedAt: Date.now(), bytes: text.length };
    const result = await tx("readwrite", (store) => store.put(record) as IDBRequest<IDBValidKey>);
    return result !== null;
}

export async function loadDraft(tool = "default"): Promise<string | null> {
    const record = await tx<StoredDocument | undefined>("readonly", (store) => store.get(`${DRAFT_PREFIX}${tool}`) as IDBRequest<StoredDocument | undefined>);
    const text = record?.text ?? null;
    return text && text.length > 0 ? text : null;
}

export async function clearDraft(tool = "default"): Promise<void> {
    await tx("readwrite", (store) => store.delete(`${DRAFT_PREFIX}${tool}`) as unknown as IDBRequest<undefined>);
}

/** Named snapshots, newest first, trimmed to HISTORY_LIMIT. */
export async function saveSnapshot(name: string, text: string): Promise<boolean> {
    if (text.length > MAX_PERSIST_BYTES) return false;
    const record: StoredDocument = { id: `snap:${Date.now()}:${name}`, text, savedAt: Date.now(), bytes: text.length };
    const written = await tx("readwrite", (store) => store.put(record) as IDBRequest<IDBValidKey>);
    if (written === null) return false;

    const all = await listSnapshots();
    const excess = all.slice(HISTORY_LIMIT);
    for (const stale of excess) await tx("readwrite", (store) => store.delete(stale.id) as unknown as IDBRequest<undefined>);
    return true;
}

export async function listSnapshots(): Promise<StoredDocument[]> {
    const all = await tx<StoredDocument[]>("readonly", (store) => store.getAll() as IDBRequest<StoredDocument[]>);
    return (all ?? []).filter((record) => record.id.startsWith("snap:")).sort((a, b) => b.savedAt - a.savedAt);
}
