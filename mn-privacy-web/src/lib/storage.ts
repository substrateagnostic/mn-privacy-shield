import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TrackedRequest, UserInfo } from './types';

interface PrivacyDB extends DBSchema {
  requests: {
    key: string;
    value: TrackedRequest;
    indexes: {
      'by-status': string;
      'by-deadline': string;
      'by-broker': string;
    };
  };
  userInfo: {
    key: string;
    value: UserInfo;
  };
}

const DB_NAME = 'mn-privacy-tracker';
const DB_VERSION = 1;
const REMEMBER_USERINFO_KEY = 'mn-privacy-remember-user-info';

let dbPromise: Promise<IDBPDatabase<PrivacyDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PrivacyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PrivacyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Requests store
        const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
        requestStore.createIndex('by-status', 'status');
        requestStore.createIndex('by-deadline', 'deadline');
        requestStore.createIndex('by-broker', 'brokerId');

        // User info store (for remembering user's info)
        db.createObjectStore('userInfo', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getRememberUserInfoPreference(): boolean {
  if (!canUseLocalStorage()) return false;
  return window.localStorage.getItem(REMEMBER_USERINFO_KEY) === 'true';
}

export function setRememberUserInfoPreference(remember: boolean): void {
  if (!canUseLocalStorage()) return;
  if (remember) {
    window.localStorage.setItem(REMEMBER_USERINFO_KEY, 'true');
  } else {
    window.localStorage.removeItem(REMEMBER_USERINFO_KEY);
  }
}

// Request tracking
export async function saveRequest(request: TrackedRequest): Promise<void> {
  const db = await getDB();
  await db.put('requests', request);
}

export async function getRequest(id: string): Promise<TrackedRequest | undefined> {
  const db = await getDB();
  return db.get('requests', id);
}

export async function getAllRequests(): Promise<TrackedRequest[]> {
  const db = await getDB();
  return db.getAll('requests');
}

export async function getRequestsByStatus(status: string): Promise<TrackedRequest[]> {
  const db = await getDB();
  return db.getAllFromIndex('requests', 'by-status', status);
}

export async function deleteRequest(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('requests', id);
}

export async function updateRequestStatus(id: string, status: string, notes?: string): Promise<void> {
  const db = await getDB();
  const request = await db.get('requests', id);
  if (request) {
    request.status = status as TrackedRequest['status'];
    if (notes) request.notes = notes;
    if (status === 'completed' || status === 'denied') {
      request.responseDate = new Date().toISOString();
    }
    await db.put('requests', request);
  }
}

// User info (for remembering form data)
export async function saveUserInfo(userInfo: UserInfo): Promise<void> {
  const db = await getDB();
  await db.put('userInfo', { ...userInfo, id: 'default' } as UserInfo & { id: string });
}

export async function getUserInfo(): Promise<UserInfo | undefined> {
  const db = await getDB();
  const result = await db.get('userInfo', 'default');
  if (result) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...userInfo } = result as UserInfo & { id: string };
    return userInfo;
  }
  return undefined;
}

export async function clearUserInfo(): Promise<void> {
  const db = await getDB();
  await db.delete('userInfo', 'default');
}

// Export/Import for backup
export async function exportData(): Promise<string> {
  const db = await getDB();
  const requests = await db.getAll('requests');
  const userInfo = await db.get('userInfo', 'default');

  const data = {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    requests,
    userInfo,
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const data = JSON.parse(jsonString);
    const db = await getDB();

    if (data.requests && Array.isArray(data.requests)) {
      for (const request of data.requests) {
        try {
          await db.put('requests', request);
          imported++;
        } catch (e) {
          errors.push(`Failed to import request ${request.id}: ${e}`);
        }
      }
    }

    if (data.userInfo) {
      await db.put('userInfo', { ...data.userInfo, id: 'default' });
    }
  } catch (e) {
    errors.push(`Failed to parse import data: ${e}`);
  }

  return { imported, errors };
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('requests');
  await db.clear('userInfo');
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(REMEMBER_USERINFO_KEY);
  }
}

// Get requests with upcoming deadlines
export async function getUpcomingDeadlines(daysAhead: number = 7): Promise<TrackedRequest[]> {
  const requests = await getAllRequests();
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return requests
    .filter(r => {
      if (r.status !== 'pending' && r.status !== 'acknowledged') return false;
      const deadline = new Date(r.deadline);
      return deadline <= cutoff && deadline >= now;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
}

// Get overdue requests (past 45 days with no response)
export async function getOverdueRequests(): Promise<TrackedRequest[]> {
  const requests = await getAllRequests();
  const now = new Date();

  return requests
    .filter(r => {
      if (r.status !== 'pending' && r.status !== 'acknowledged') return false;
      const deadline = new Date(r.deadline);
      return deadline < now;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
}

// Generate unique ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
