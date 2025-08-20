
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
const createUserProfileDocument = async (user: User, additionalData: { displayName?: string } = {}) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, photoURL } = user;
        const displayName = additionalData.displayName || user.displayName;
        const createdAt = serverTimestamp();
        try {
            await setDoc(userRef, {
                displayName,
                email,
                photoURL,
                createdAt,
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

export const signUpWithEmail = async (name: string, email: string, pass: string): Promise<{user: User | null, error: AuthError | null}> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });

        // Pass the name explicitly to ensure it's saved on first creation.
        await createUserProfileDocument(user, { displayName: name });
        
        return { user: auth.currentUser, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}

export const signInWithEmail = async (email: string, pass: string): Promise<{user: User | null, error: AuthError | null}> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        return { user: result.user, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
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
    
    const formatDateString = (dateInput: string | Date | Timestamp | null | undefined): string => {
        if (!dateInput) return new Date().toISOString().split('T')[0];
        if (dateInput instanceof Timestamp) return dateInput.toDate().toISOString().split('T')[0];
        if (dateInput instanceof Date) return dateInput.toISOString().split('T')[0];
        if (typeof dateInput === 'string') {
            return dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
        }
        return new Date().toISOString().split('T')[0];
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
        date: formatDateString(data.date),
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
    return onSnapshot(q, async (snapshot) => {
        const conversationsPromises = snapshot.docs.map(async (doc) => {
            const convo = toConversation(doc);
            // Fetch latest participant details on every snapshot
            for (const pId of convo.participants) {
                if (!convo.participantDetails[pId]) {
                    const userDoc = await getDoc(doc(db, 'users', pId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        convo.participantDetails[pId] = {
                            name: userData.displayName || 'Unknown User',
                            avatar: userData.photoURL || ''
                        };
                    } else {
                         convo.participantDetails[pId] = { name: 'Unknown User', avatar: '' };
                    }
                }
            }
            return convo;
        });
        const conversations = await Promise.all(conversationsPromises);
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
    // A query to find a conversation involving BOTH the initiator and the vehicle owner FOR THIS SPECIFIC vehicle
    const q = query(conversationsRef, 
        where('vehicleId', '==', vehicle.id),
        where('participants', 'array-contains', initiator.uid)
    );

    const snapshot = await getDocs(q);
    
    // Since the query only checks for the initiator and vehicle, we need to check if the other participant is the owner
    const existingConversation = snapshot.docs.find(doc => doc.data().participants.includes(vehicle.reporterId));

    if (existingConversation) {
        return existingConversation.id;
    }
    
    const ownerDoc = await getDoc(doc(db, 'users', vehicle.reporterId));
    let ownerData: { displayName: string, photoURL: string } | null = null;

    if (ownerDoc.exists()) {
        const data = ownerDoc.data();
        ownerData = {
            displayName: data.displayName || 'Vehicle Owner',
            photoURL: data.photoURL || ''
        };
    }

    if (!ownerData) {
        // Fallback for users created before profile creation was implemented.
        // In a real app, you might fetch from Firebase Auth, but that's a server-side/admin-sdk only operation.
        // For client-side, we can't fetch other user profiles, so we have to handle this gracefully.
        // For this app, we'll create a placeholder.
        console.warn(`Could not find user profile for owner ${vehicle.reporterId}. Using placeholder data.`);
        ownerData = { displayName: 'Vehicle Owner', photoURL: '' };
    }
    
    
    // Use the initiator's current profile info
    const initiatorName = initiator.displayName || 'Anonymous User';
    const initiatorAvatar = initiator.photoURL || '';

    // Create a new conversation
    const newConversationRef = doc(conversationsRef);
    const newConversationData = {
        vehicleId: vehicle.id,
        vehicleSummary: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        participants: [initiator.uid, vehicle.reporterId],
        participantDetails: {
            [initiator.uid]: { name: initiatorName, avatar: initiatorAvatar },
            [vehicle.reporterId]: { name: ownerData.displayName, avatar: ownerData.photoURL }
        },
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
    }
    
    await setDoc(newConversationRef, newConversationData);
    return newConversationRef.id;
}


export { auth, db };
export type { User, AuthError };

    