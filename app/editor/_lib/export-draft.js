const DATABASE_NAME = "notivy-local";
const DATABASE_VERSION = 1;
const STORE_NAME = "drafts";
const EXPORT_DRAFT_KEY = "pending-export";

function openDraftDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runDraftRequest(mode, operation) {
  return openDraftDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
    transaction.onabort = () => database.close();
  }));
}

export function saveExportDraft(draft) {
  return runDraftRequest("readwrite", (store) => store.put({ ...draft, savedAt: Date.now() }, EXPORT_DRAFT_KEY));
}

export function loadExportDraft() {
  return runDraftRequest("readonly", (store) => store.get(EXPORT_DRAFT_KEY));
}

export function removeExportDraft() {
  return runDraftRequest("readwrite", (store) => store.delete(EXPORT_DRAFT_KEY));
}
