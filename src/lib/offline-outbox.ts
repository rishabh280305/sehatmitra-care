"use client";

export type AppointmentPayload = { patientAlias: string; careType: string; scheduledFor: string };
export type OutboxItem = { id: string; payload: AppointmentPayload; createdAt: string; attempts: number; lastError?: string };

const DATABASE = "sehatmitra-offline-v1";
const STORE = "appointment-outbox";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDatabase().then(database => new Promise<T>((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  }));
}

export function enqueueAppointment(item: OutboxItem) {
  return transaction("readwrite", store => store.put(item));
}

export function listQueuedAppointments() {
  return transaction<OutboxItem[]>("readonly", store => store.getAll());
}

export function removeQueuedAppointment(id: string) {
  return transaction("readwrite", store => store.delete(id));
}

export function markQueuedAttempt(item: OutboxItem, error: string) {
  return enqueueAppointment({ ...item, attempts: item.attempts + 1, lastError: error.slice(0, 160) });
}
