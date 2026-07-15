import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BookingConfirmation } from '../types';

setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust multi-tab persistent offline cache (v10+ standard)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {}, // No direct Firebase auth context stored since we authenticate via pin pad
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity on start
export async function testConnection() {
  try {
    // Race the server connection check against a 3-second timeout to fail-fast to offline cache
    // Use a valid path we have read permissions for to avoid PERMISSION_DENIED false negatives
    const connectionPromise = getDocFromServer(doc(db, 'bookings', '_connection_test'));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Connection timeout")), 3000)
    );
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log("Firestore database connection verified successfully.");
  } catch (error) {
    // Graceful check for offline mode or network timeouts
    console.info("Firestore is operating in offline/hybrid cache mode.");
  }
}

// Run connectivity check after a brief deferral to not block main thread startup
setTimeout(() => {
  testConnection();
}, 100);

const BOOKINGS_COLPATH = 'bookings';

export async function getBookingsFromFirestore(): Promise<BookingConfirmation[]> {
  try {
    const q = query(collection(db, BOOKINGS_COLPATH));
    const snapshot = await getDocs(q);
    const bookings: BookingConfirmation[] = [];
    snapshot.forEach((docSnap) => {
      bookings.push(docSnap.data() as BookingConfirmation);
    });
    return bookings;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKINGS_COLPATH);
  }
}

export async function addBookingToFirestore(booking: BookingConfirmation): Promise<void> {
  const docPath = `${BOOKINGS_COLPATH}/${booking.id}`;
  try {
    await setDoc(doc(db, BOOKINGS_COLPATH, booking.id), booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateBookingInFirestore(bookingId: string, updates: Partial<BookingConfirmation>): Promise<void> {
  const docPath = `${BOOKINGS_COLPATH}/${bookingId}`;
  try {
    await updateDoc(doc(db, BOOKINGS_COLPATH, bookingId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteBookingFromFirestore(bookingId: string): Promise<void> {
  const docPath = `${BOOKINGS_COLPATH}/${bookingId}`;
  try {
    await deleteDoc(doc(db, BOOKINGS_COLPATH, bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function resetBookingsInFirestore(seeds: BookingConfirmation[]): Promise<void> {
  try {
    // 1. Fetch current bookings
    const current = await getBookingsFromFirestore();
    
    // 2. Delete all existing docs
    const batch = writeBatch(db);
    for (const b of current) {
      batch.delete(doc(db, BOOKINGS_COLPATH, b.id));
    }
    
    // 3. Set the new seeds
    for (const s of seeds) {
      batch.set(doc(db, BOOKINGS_COLPATH, s.id), s);
    }
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, BOOKINGS_COLPATH);
  }
}
