
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
  AuthError,
  User,
  UserCredential
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    Timestamp,
    serverTimestamp,
    onSnapshot,
    Unsubscribe,
    writeBatch,
    setDoc
} from 'firebase/firestore';

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

// Helper function to create user profile document
const createUserProfileDocument = async (user: User, additionalData: object = {}) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { displayName, email, photoURL } = user;
        const createdAt = new Date();
        try {
            await setDoc(userRef, {
                displayName,
                email,
                photoURL,
                createdAt,
                ...additionalData,
            });
        } catch (error) {
            console.error('Error creating user profile', error);
        }
    }
    return userRef;
};

export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(result.user);
    return result;
  } catch (error) {
    const authError = error as AuthError;
    console.error("Error signing in with Google", authError);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<User | null> => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        if (result.user) {
          await updateProfile(result.user, { displayName: name });
          // We need to create a user profile document here as well
          await createUserProfileDocument(result.user, { displayName: name });
        }
        return result.user;
    } catch (error) {
        console.error("Error signing up with email", error);
        return null;
    }
}

export const signInWithEmail = async (email: string, pass: string): Promise<User | null> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return result.user;
    } catch (error) {
        console.error("Error signing in with email", error);
        return null;
    }
}

export const submitVehicleReport = async (reportData: object) => {
    if (!auth.currentUser) {
        console.error("No user is signed in to submit a report.");
        return null;
    }
    
    try {
        const docRef = await addDoc(collection(db, 'vehicleReports'), {
            ...reportData,
            reportedAt: serverTimestamp() // Use server-side timestamp
        });
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
    reportedAt: string;
    status: 'Active' | 'Recovered';
    reporterId: string;
    photos?: string[];
    lat?: number;
    lng?: number;
}

export interface Conversation {
    id: string;
    participants: string[]; // array of user IDs
    participantDetails: { [key: string]: { name: string; avatar: string; } };
    lastMessage: string;
    lastMessageAt: string;
    unread: { [key: string]: number }; // unread count for each user
    vehicleId: string;
    vehicleSummary: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
}

const toVehicleReport = (doc: any): VehicleReport => {
    const data = doc.data();
    
    const convertTimestampToString = (ts: Timestamp | null | undefined): string => {
        return ts ? ts.toDate().toISOString() : new Date().toISOString();
    };
    
    const formatDateString = (dateStr: string | null | undefined): string => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        // Handle cases where it might already be a string 'YYYY-MM-DD'
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };

    return {
        id: doc.id,
        make: data.make || '',
        model: data.model || '',
        year: data.year || 0,
        color: data.color || '',
        licensePlate: data.licensePlate || '',
        vin: data.vin,
        features: data.features,
        location: data.location || '',
        date: formatDateString(data.date), // Use the robust formatter
        reportedAt: convertTimestampToString(data.reportedAt),
        status: data.status || 'Active',
        reporterId: data.reporterId || '',
        photos: data.photos || [],
        lat: data.lat,
        lng: data.lng,
    };
};

const toConversation = (doc: any): Conversation => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        lastMessageAt: data.lastMessageAt ? data.lastMessageAt.toDate().toISOString() : new Date().toISOString(),
    } as Conversation;
}

const toMessage = (doc: any): Message => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    } as Message;
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

// --- Messaging Functions ---

// Listen to a user's conversations
export const listenToUserConversations = (userId: string, callback: (conversations: Conversation[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'conversations'), 
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(toConversation);
        callback(conversations);
    }, (error) => {
        console.error("Error listening to conversations:", error);
    });
};

// Listen to messages in a conversation
export const listenToMessages = (conversationId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(toMessage);
        callback(messages);
    }, (error) => {
        console.error("Error listening to messages:", error);
    });
};

// Send a message
export const sendMessage = async (conversationId: string, text: string, sender: User) => {
    const batch = writeBatch(db);
    
    // Add new message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    batch.set(messageRef, {
        conversationId,
        senderId: sender.uid,
        text,
        createdAt: serverTimestamp(),
    });

    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
        // Here you would also update the unread counts for other participants
    });

    await batch.commit();
}


// Start a new conversation
export const createOrGetConversation = async (vehicle: VehicleReport, initiator: User): Promise<string> => {
    if (vehicle.reporterId === initiator.uid) {
        throw new Error("You cannot start a conversation with yourself.");
    }
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, 
        where('vehicleId', '==', vehicle.id),
        where('participants', 'array-contains', initiator.uid)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        // Conversation already exists
        return snapshot.docs[0].id;
    }
    
    const ownerDoc = await getDoc(doc(db, 'users', vehicle.reporterId));
    const ownerData = ownerDoc.data();
    
    if (!ownerData) {
        throw new Error("Could not find the vehicle owner's data.");
    }

    // Create a new conversation
    const newConversationRef = doc(conversationsRef);
    const newConversationData = {
        vehicleId: vehicle.id,
        vehicleSummary: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        participants: [initiator.uid, vehicle.reporterId],
        participantDetails: {
            [initiator.uid]: { name: initiator.displayName || 'User', avatar: initiator.photoURL || '' },
            [vehicle.reporterId]: { name: ownerData.displayName || 'Owner', avatar: ownerData.photoURL || '' }
        },
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
    }
    
    await setDoc(newConversationRef, newConversationData);
    return newConversationRef.id;
}


export { auth, db };
export type { User };

    