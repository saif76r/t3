import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  getDocFromServer,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Connection test helper
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    return true;
  } catch (err: unknown) {
    // Permission or not-found errors still indicate reachability
    const message = err instanceof Error ? err.message : '';
    if (message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline');
      return false;
    }
    return true;
  }
}

export interface FirebaseDiagnosis {
  id?: string;
  farmerId?: string;
  cropName: string;
  cropScientific?: string;
  diseaseName: string;
  diseaseScientific?: string;
  severity: string;
  confidenceScore: number;
  symptomsObserved?: string;
  cause?: string;
  treatments?: string;
  expertNote?: string;
  imageUrl?: string;
  modelProvider?: string;
  createdAt?: any;
}

// Save diagnosis to Firestore
export async function saveDiagnosisToFirestore(diagnosis: Omit<FirebaseDiagnosis, 'id' | 'createdAt'>) {
  try {
    const colRef = collection(db, 'diagnoses');
    const docRef = await addDoc(colRef, {
      ...diagnosis,
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving diagnosis to Firestore:', error);
    return null;
  }
}

// Fetch recent diagnoses from Firestore
export async function getRecentFirestoreDiagnoses(maxCount: number = 10): Promise<FirebaseDiagnosis[]> {
  try {
    const colRef = collection(db, 'diagnoses');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FirebaseDiagnosis, 'id'>)
    }));
  } catch (error) {
    console.warn('Fallback fetching without index or offline:', error);
    try {
      const colRef = collection(db, 'diagnoses');
      const qSimple = query(colRef, limit(maxCount));
      const snapshot = await getDocs(qSimple);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirebaseDiagnosis, 'id'>)
      }));
    } catch (fallbackError) {
      console.error('Failed to get Firestore diagnoses:', fallbackError);
      return [];
    }
  }
}

// Listen to real-time diagnoses
export function subscribeToDiagnoses(callback: (diagnoses: FirebaseDiagnosis[]) => void) {
  const colRef = collection(db, 'diagnoses');
  const q = query(colRef, limit(15));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirebaseDiagnosis, 'id'>)
      }));
      callback(items);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
    }
  );
}

export interface FarmerAccount {
  name: string;
  phone: string;
  password?: string;
  district: string;
  upazila?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Register farmer account directly into Firebase Auth & Cloud Firestore (/farmers/{phone})
export async function registerFarmerToFirestore(account: {
  name: string;
  phone: string;
  password: string;
  district: string;
}): Promise<{ success: boolean; message?: string; user?: FarmerAccount }> {
  const cleanPhone = account.phone.trim();
  const cleanName = account.name.trim();
  const cleanPass = account.password.trim();
  const authEmail = `${cleanPhone.replace(/[^0-9]/g, '')}@krishiguide.com`;

  let authCreated = false;

  // 1. First, create user in Firebase Authentication (shows in Firebase Console > Authentication > Users)
  try {
    const cred = await createUserWithEmailAndPassword(auth, authEmail, cleanPass);
    if (cred.user) {
      authCreated = true;
      await updateProfile(cred.user, { displayName: cleanName });
    }
  } catch (authErr: any) {
    if (authErr?.code === 'auth/email-already-in-use') {
      return {
        success: false,
        message: 'এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে একাউন্ট খোলা হয়েছে। দয়া করে লগইন করুন।',
      };
    }
    console.log('Firebase Auth signup note:', authErr?.code || authErr?.message);
  }

  // 2. Save profile in Firestore Database (/farmers/{phone})
  const newUserData = {
    name: cleanName,
    phone: cleanPhone,
    password: cleanPass,
    district: account.district || 'ঢাকা',
    createdAt: new Date().toISOString(),
  };

  try {
    const farmerDocRef = doc(db, 'farmers', cleanPhone);
    await setDoc(farmerDocRef, newUserData, { merge: true });
  } catch (firestoreErr: any) {
    console.warn('Firestore database write warning:', firestoreErr);
    // If Firestore rules are locked, but Auth succeeded or client is ready
    if (!authCreated && firestoreErr?.message?.includes('permission')) {
      return {
        success: false,
        message: 'Firebase Rules অনুমতি দিচ্ছে না। ফায়ারবেস কনসোলের "Rules" ট্যাবে গিয়ে allow read, write চালু করুন।',
      };
    }
  }

  return {
    success: true,
    user: {
      name: newUserData.name,
      phone: newUserData.phone,
      district: newUserData.district,
    },
  };
}

// Login farmer by verifying credentials against Firebase Auth or Firestore
export async function loginFarmerWithFirestore(
  phone: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: FarmerAccount }> {
  const cleanPhone = phone.trim();
  const cleanPass = password.trim();
  const authEmail = `${cleanPhone.replace(/[^0-9]/g, '')}@krishiguide.com`;

  // 1. Try Firebase Authentication first
  try {
    const cred = await signInWithEmailAndPassword(auth, authEmail, cleanPass);
    if (cred.user) {
      // Try to read district from Firestore if permissions allow
      let userDistrict = 'ঢাকা';
      let displayName = cred.user.displayName || cleanPhone;
      try {
        const farmerDocRef = doc(db, 'farmers', cleanPhone);
        const docSnap = await getDoc(farmerDocRef);
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (d.name) displayName = d.name;
          if (d.district) userDistrict = d.district;
        }
      } catch (err) {
        // Firestore read fallback
      }

      return {
        success: true,
        user: {
          name: displayName,
          phone: cleanPhone,
          district: userDistrict,
        },
      };
    }
  } catch (authErr: any) {
    if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
      return {
        success: false,
        message: 'পাসওয়ার্ড সঠিক নয়। দয়া করে আবার চেষ্টা করুন।',
      };
    }
    // Continue to Firestore check below
  }

  // 2. Fallback to Firestore check
  try {
    const farmerDocRef = doc(db, 'farmers', cleanPhone);
    const docSnap = await getDoc(farmerDocRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        message: 'এই মোবাইল নাম্বারে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন একাউন্ট খুলুন।',
      };
    }

    const data = docSnap.data();
    if (data.password !== cleanPass) {
      return {
        success: false,
        message: 'পাসওয়ার্ড সঠিক নয়। দয়া করে আবার চেষ্টা করুন।',
      };
    }

    return {
      success: true,
      user: {
        name: data.name || 'কৃষক',
        phone: data.phone || cleanPhone,
        district: data.district || 'ঢাকা',
        upazila: data.upazila || '',
        photoUrl: data.photoUrl || '',
      },
    };
  } catch (error: any) {
    console.warn('Firestore farmer login error:', error);
    return {
      success: false,
      message: 'লগইন করতে সমস্যা হয়েছে। দয়া করে মোবাইল নাম্বার ও পাসওয়ার্ড পরীক্ষা করুন।',
    };
  }
}

// Update farmer profile in Firestore
export async function updateFarmerProfileInFirestore(
  phone: string,
  updates: Partial<FarmerAccount>
): Promise<boolean> {
  try {
    const cleanPhone = phone.trim();
    const farmerDocRef = doc(db, 'farmers', cleanPhone);
    await setDoc(
      farmerDocRef,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('Error updating farmer profile in Firestore:', error);
    return false;
  }
}

// Fetch registered farmers list from Firestore for database explorer
export async function getFirestoreFarmers(maxCount: number = 20): Promise<FarmerAccount[]> {
  try {
    const colRef = collection(db, 'farmers');
    const q = query(colRef, limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        name: data.name || '',
        phone: data.phone || docSnap.id,
        district: data.district || '',
        password: data.password ? '••••••••' : undefined,
        createdAt: data.createdAt,
      };
    });
  } catch (err) {
    console.warn('Could not fetch farmers from Firestore:', err);
    return [];
  }
}

export interface FirebaseChatInquiry {
  id?: string;
  farmerId?: string;
  farmerName?: string;
  question: string;
  answer: string;
  detectedCrop?: string;
  model?: string;
  createdAt?: any;
  clientTimestamp?: string;
}

// Save agricultural Q&A to Cloud Firestore (/chat_inquiries)
export async function saveChatInquiryToFirestore(
  inquiry: Omit<FirebaseChatInquiry, 'id' | 'createdAt'>
): Promise<string | null> {
  try {
    const colRef = collection(db, 'chat_inquiries');
    const docRef = await addDoc(colRef, {
      ...inquiry,
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('Error saving chat inquiry to Firestore:', error);
    return null;
  }
}

// Fetch recent chat inquiries from Cloud Firestore
export async function getRecentChatInquiries(
  farmerId?: string,
  maxCount: number = 30
): Promise<FirebaseChatInquiry[]> {
  try {
    const colRef = collection(db, 'chat_inquiries');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FirebaseChatInquiry, 'id'>),
    }));
    if (farmerId && farmerId !== 'guest') {
      return results.filter(
        (r) => !r.farmerId || r.farmerId === farmerId || r.farmerId === 'guest'
      );
    }
    return results;
  } catch (error) {
    console.warn('Fallback fetching chat inquiries without index or offline:', error);
    try {
      const colRef = collection(db, 'chat_inquiries');
      const qSimple = query(colRef, limit(maxCount));
      const snapshot = await getDocs(qSimple);
      const results = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FirebaseChatInquiry, 'id'>),
      }));
      if (farmerId && farmerId !== 'guest') {
        return results.filter(
          (r) => !r.farmerId || r.farmerId === farmerId || r.farmerId === 'guest'
        );
      }
      return results;
    } catch (fallbackError) {
      console.warn('Failed to get Firestore chat inquiries:', fallbackError);
      return [];
    }
  }
}

// ----------------------------------------------------
// FARM INPUT MANAGEMENT & EXPENSES PERSISTENCE
// ----------------------------------------------------

export interface SavedInputExpenseRecord {
  id: string;
  farmerPhone?: string;
  farmerName?: string;
  title: string;
  totalAmount: number;
  itemCount: number;
  items: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  categorySummary?: string;
  date: string;
  timestamp: number;
  createdAt?: any;
}

// Save input expenses calculation batch to Cloud Firestore (/input_expenses) + LocalStorage
export async function saveInputExpenseToFirestore(
  expenseData: Omit<SavedInputExpenseRecord, 'id'>
): Promise<{ success: boolean; id: string }> {
  const generatedId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let firestoreId = generatedId;

  // 1. Try persisting directly to Firestore
  try {
    const colRef = collection(db, 'input_expenses');
    const docRef = await addDoc(colRef, {
      ...expenseData,
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
    });
    firestoreId = docRef.id;
  } catch (err) {
    console.warn('Notice: Firestore save input expense offline fallback:', err);
  }

  // 2. Always persist to LocalStorage for instant offline availability & resilience
  const newRecord: SavedInputExpenseRecord = {
    ...expenseData,
    id: firestoreId,
    timestamp: expenseData.timestamp || Date.now(),
  };

  try {
    const existingStr = localStorage.getItem('krishi_saved_input_expenses');
    const existingList: SavedInputExpenseRecord[] = existingStr ? JSON.parse(existingStr) : [];
    const updatedList = [newRecord, ...existingList.filter((it) => it.id !== firestoreId)];
    localStorage.setItem('krishi_saved_input_expenses', JSON.stringify(updatedList));
  } catch (lsErr) {
    console.warn('LocalStorage save error:', lsErr);
  }

  return { success: true, id: firestoreId };
}

// Fetch saved input expense history from Cloud Firestore + LocalStorage
export async function getFarmerInputExpenses(
  farmerPhone?: string
): Promise<SavedInputExpenseRecord[]> {
  let firestoreRecords: SavedInputExpenseRecord[] = [];

  try {
    const colRef = collection(db, 'input_expenses');
    const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    firestoreRecords = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<SavedInputExpenseRecord, 'id'>),
    }));
  } catch (fsErr) {
    // Try simple query without orderBy in case of missing index
    try {
      const colRef = collection(db, 'input_expenses');
      const qSimple = query(colRef, limit(50));
      const snapshot = await getDocs(qSimple);
      firestoreRecords = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SavedInputExpenseRecord, 'id'>),
      }));
    } catch (_) {
      // offline
    }
  }

  // Also read from LocalStorage
  let localRecords: SavedInputExpenseRecord[] = [];
  try {
    const existingStr = localStorage.getItem('krishi_saved_input_expenses');
    if (existingStr) {
      localRecords = JSON.parse(existingStr);
    }
  } catch (_) {}

  // Merge and deduplicate by id
  const map = new Map<string, SavedInputExpenseRecord>();
  localRecords.forEach((r) => map.set(r.id, r));
  firestoreRecords.forEach((r) => map.set(r.id, r));

  let merged = Array.from(map.values())
    .filter((r) => {
      const hasTestItems = r.items?.some((it) => {
        const n = (it.name || '').trim().toLowerCase();
        return n === 'tpo' || n === 'gh';
      });
      return !hasTestItems;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // If user is specific, filter optionally, or keep all user's
  if (farmerPhone) {
    const userSpecific = merged.filter(
      (r) => !r.farmerPhone || r.farmerPhone === farmerPhone
    );
    if (userSpecific.length > 0) {
      merged = userSpecific;
    }
  }

  // Update localStorage with merged list
  try {
    localStorage.setItem('krishi_saved_input_expenses', JSON.stringify(merged));
  } catch (_) {}

  return merged;
}

// Delete saved input expense from Firestore and LocalStorage
export async function deleteInputExpenseFromFirestore(
  expenseId: string
): Promise<boolean> {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'input_expenses', expenseId));
  } catch (err) {
    console.warn('Firestore delete doc notice:', err);
  }

  // Delete from LocalStorage
  try {
    const existingStr = localStorage.getItem('krishi_saved_input_expenses');
    if (existingStr) {
      const existingList: SavedInputExpenseRecord[] = JSON.parse(existingStr);
      const filtered = existingList.filter((it) => it.id !== expenseId);
      localStorage.setItem('krishi_saved_input_expenses', JSON.stringify(filtered));
    }
  } catch (_) {}

  return true;
}

// Save customized input items inventory to LocalStorage and Firestore
export async function saveFarmerCustomInputItems(
  items: any[],
  farmerPhone?: string
): Promise<boolean> {
  // Purge any legacy demo items
  const realOnly = items.filter(
    (it) =>
      !['1', '2', '3', '4', '5', '6'].includes(it.id) &&
      it.name !== 'tricyclazole 76% WP' &&
      it.name !== 'Mancozeb 75 % WP' &&
      it.name !== 'Carbendazim 50% WP' &&
      it.name !== 'ইউরিয়া (Urea)' &&
      it.name !== 'টিএসপি (TSP)' &&
      it.name !== 'BRRI ধান ২৮ বীজ'
  );

  try {
    localStorage.setItem('krishi_farmer_input_items', JSON.stringify(realOnly));
  } catch (_) {}

  if (farmerPhone) {
    try {
      const farmerRef = doc(db, 'farmers', farmerPhone);
      await setDoc(farmerRef, { customInputs: realOnly }, { merge: true });
    } catch (_) {}
  }

  return true;
}

// Add a real farm input to Cloud Firestore (/farm_inputs)
export async function addFarmInputToFirestore(inputData: {
  farmerPhone?: string;
  farmerName?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  date: string;
  selected?: boolean;
}): Promise<{ id: string; success: boolean }> {
  let docId = `inp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    const colRef = collection(db, 'farm_inputs');
    const docRef = await addDoc(colRef, {
      ...inputData,
      createdAt: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
    });
    docId = docRef.id;
  } catch (err) {
    console.warn('Firestore add input notice:', err);
  }

  // Update local storage with new real input
  try {
    const existing = getFarmerRealInputsOnly();
    const newItem = { ...inputData, id: docId, selected: true };
    const updated = [newItem, ...existing.filter((it: any) => it.id !== docId)];
    localStorage.setItem('krishi_farmer_input_items', JSON.stringify(updated));
  } catch (_) {}

  return { id: docId, success: true };
}

// Fetch only real farm inputs from Firestore and LocalStorage (zero demo data)
export async function getFarmInputsFromFirestore(farmerPhone?: string): Promise<any[]> {
  let firestoreItems: any[] = [];
  try {
    const colRef = collection(db, 'farm_inputs');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    firestoreItems = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (fsErr) {
    try {
      const colRef = collection(db, 'farm_inputs');
      const qSimple = query(colRef, limit(100));
      const snapshot = await getDocs(qSimple);
      firestoreItems = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (_) {}
  }

  const localItems = getFarmerRealInputsOnly();

  // Deduplicate and filter out any demo items
  const map = new Map<string, any>();
  localItems.forEach((it) => map.set(it.id, it));
  firestoreItems.forEach((it) => map.set(it.id, it));

  const merged = Array.from(map.values()).filter((it) => {
    const nameLower = (it.name || '').trim().toLowerCase();
    return (
      !['1', '2', '3', '4', '5', '6'].includes(it.id) &&
      it.name !== 'tricyclazole 76% WP' &&
      it.name !== 'Mancozeb 75 % WP' &&
      it.name !== 'Carbendazim 50% WP' &&
      it.name !== 'ইউরিয়া (Urea)' &&
      it.name !== 'টিএসপি (TSP)' &&
      it.name !== 'BRRI ধান ২৮ বীজ' &&
      nameLower !== 'tpo' &&
      nameLower !== 'gh'
    );
  });

  if (farmerPhone) {
    const userSpecific = merged.filter(
      (it) => !it.farmerPhone || it.farmerPhone === farmerPhone
    );
    if (userSpecific.length > 0) {
      try {
        localStorage.setItem('krishi_farmer_input_items', JSON.stringify(userSpecific));
      } catch (_) {}
      return userSpecific;
    }
  }

  try {
    localStorage.setItem('krishi_farmer_input_items', JSON.stringify(merged));
  } catch (_) {}

  return merged;
}

// Delete real input from Firestore and LocalStorage
export async function deleteFarmInputFromFirestore(inputId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'farm_inputs', inputId));
  } catch (err) {
    console.warn('Firestore delete input error:', err);
  }

  try {
    const existing = getFarmerRealInputsOnly();
    const updated = existing.filter((it: any) => it.id !== inputId);
    localStorage.setItem('krishi_farmer_input_items', JSON.stringify(updated));
  } catch (_) {}

  return true;
}

// Helper to strictly get non-demo real inputs from LocalStorage
export function getFarmerRealInputsOnly(): any[] {
  try {
    const saved = localStorage.getItem('krishi_farmer_input_items');
    if (!saved) return [];
    const parsed: any[] = JSON.parse(saved);
    // Remove any legacy demo items
    const clean = parsed.filter(
      (it) => {
        const nameLower = (it.name || '').trim().toLowerCase();
        return (
          !['1', '2', '3', '4', '5', '6'].includes(it.id) &&
          it.name !== 'tricyclazole 76% WP' &&
          it.name !== 'Mancozeb 75 % WP' &&
          it.name !== 'Carbendazim 50% WP' &&
          it.name !== 'ইউরিয়া (Urea)' &&
          it.name !== 'টিএসপি (TSP)' &&
          it.name !== 'BRRI ধান ২৮ বীজ' &&
          nameLower !== 'tpo' &&
          nameLower !== 'gh'
        );
      }
    );
    return clean;
  } catch (_) {
    return [];
  }
}

// Load customized input items (ensures no demo items)
export function getFarmerCustomInputItems(): any[] | null {
  const real = getFarmerRealInputsOnly();
  return real;
}

// Completely clear all farm inputs and saved expense records (Fresh start)
export async function clearAllFarmInputsAndExpenses(farmerPhone?: string): Promise<boolean> {
  try {
    // 1. Clear LocalStorage
    localStorage.removeItem('krishi_farmer_input_items');
    localStorage.removeItem('krishi_saved_input_expenses');
  } catch (_) {}

  // 2. Clear farm_inputs in Firestore
  try {
    const inputsRef = collection(db, 'farm_inputs');
    const inputsSnap = await getDocs(inputsRef);
    const deletePromises = inputsSnap.docs.map((d) => {
      const data = d.data();
      if (!farmerPhone || !data.farmerPhone || data.farmerPhone === farmerPhone) {
        return deleteDoc(d.ref);
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Firestore clear inputs error:', err);
  }

  // 3. Clear input_expenses in Firestore
  try {
    const expensesRef = collection(db, 'input_expenses');
    const expensesSnap = await getDocs(expensesRef);
    const deletePromises = expensesSnap.docs.map((d) => {
      const data = d.data();
      if (!farmerPhone || !data.farmerPhone || data.farmerPhone === farmerPhone) {
        return deleteDoc(d.ref);
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Firestore clear expenses error:', err);
  }

  // 4. Also clear customInputs in farmers profile document if phone exists
  if (farmerPhone) {
    try {
      const farmerRef = doc(db, 'farmers', farmerPhone);
      await setDoc(farmerRef, { customInputs: [] }, { merge: true });
    } catch (_) {}
  }

  return true;
}

export { firebaseConfig };

