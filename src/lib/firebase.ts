
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserSessionPersistence,
  AuthError
} from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "vigilante-garage",
  "appId": "1:109449796594:web:9cdb5b50aed0dfa46ce96b",
  "storageBucket": "vigilante-garage.firebasestorage.app",
  "apiKey": "AIzaSyBdqrM1jTSCT3Iv4alBwpt1I48f4v4qZOg",
  "authDomain": "vigilante-garage.firebaseapp.com",
  "messagingSenderId": "109449796594",
  "measurementId": ""
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


setPersistence(auth, browserSessionPersistence);

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    const authError = error as AuthError;
    console.error("Error signing in with Google", authError);
    // More detailed error logging
    console.error("Error Code:", authError.code);
    console.error("Error Message:", authError.message);
    // This will help us see the full error object
    console.error("Full Error Object:", error);
    alert(`Google Sign-In Error: ${authError.message}`);
    return null;
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
}

const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        if (result.user) {
          await updateProfile(result.user, { displayName: name });
        }
        return result.user;
    } catch (error) {
        console.error("Error signing up with email", error);
        return null;
    }
}

const signInWithEmail = async (email: string, pass: string) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error) {
        console.error("Error signing in with email", error);
        return null;
    }
}

const submitVehicleReport = async (reportData: object) => {
    if (!auth.currentUser) {
        console.error("No user is signed in to submit a report.");
        return null;
    }
    
    try {
        const docRef = await addDoc(collection(db, 'vehicleReports'), reportData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
}

// Types
export interface VehicleReport {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    vin?: string;
    features?: string;
    location: string;
    date: string;
    reportedAt: string; // Changed to string
    status: 'Active' | 'Recovered';
    reporterId: string;
    photos?: string[];
    details?: string;
    lastSeen?: string;
    owner?: { name: string };
    lat?: number;
    lng?: number;
}

const toVehicleReport = (doc: any): VehicleReport => {
    const data = doc.data();
    
    const convertDate = (dateField: any): string => {
        if (!dateField) return '';
        if (dateField instanceof Timestamp) {
            return dateField.toDate().toISOString();
        }
        return dateField;
    };
    
    const convertTheftDate = (dateField: any): string => {
        if (!dateField) return '';
        if (dateField instanceof Timestamp) {
            return dateField.toDate().toISOString().split('T')[0];
        }
        // Handle case where it might already be a 'YYYY-MM-DD' string
        if (typeof dateField === 'string') {
            return dateField.split('T')[0];
        }
        return '';
    };

    return {
        id: doc.id,
        ...data,
        reportedAt: convertDate(data.reportedAt),
        date: convertTheftDate(data.date),
    } as VehicleReport;
};


// Fetch all vehicle reports
export const getVehicleReports = async (): Promise<VehicleReport[]> => {
    try {
        const q = query(collection(db, "vehicleReports"), orderBy("reportedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(toVehicleReport);
    } catch (error) {
        console.error("Error fetching vehicle reports: ", error);
        return [];
    }
};

// Fetch a single vehicle report by ID
export const getVehicleReportById = async (id: string): Promise<VehicleReport | null> => {
    try {
        const docRef = doc(db, "vehicleReports", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return toVehicleReport(docSnap);
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching vehicle report by ID: ", error);
        return null;
    }
}

// Fetch reports for a specific user
export const getUserVehicleReports = async (userId: string): Promise<VehicleReport[]> => {
    try {
        const q = query(collection(db, "vehicleReports"), where("reporterId", "==", userId), orderBy("reportedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(toVehicleReport);
    } catch (error) {
        console.error("Error fetching user vehicle reports: ", error);
        return [];
    }
};

export { auth, db, signInWithGoogle, logout, signUpWithEmail, signInWithEmail, submitVehicleReport };
