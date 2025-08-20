
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
    setDoc,
    increment,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    runTransaction,
    collectionGroup,
    FieldValue
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

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
const createUserProfileDocument = async (user: User, details: { displayName?: string } = {}) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, photoURL } = user;
        const displayName = details.displayName || user.displayName;
        const createdAt = serverTimestamp();
        try {
            await setDoc(userRef, {
                uid: user.uid,
                displayName,
                email,
                photoURL,
                createdAt,
                blockedUsers: [],
                geofences: [],
                notificationSettings: {
                    nationalAlerts: false,
                    localAlerts: true,
                }
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
        const existingUser = await fetch(`/api/user-exists?email=${encodeURIComponent(email)}`).then(res => res.json());
        if(existingUser.exists) {
            return { user: null, error: { code: 'auth/email-already-in-use' } as AuthError };
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await createUserProfileDocument(user, { displayName: name });
        
        return { user: auth.currentUser, error: null };
    } catch (error) {
        return { user: null, error: error as AuthError };
    }
}

export const signInWithEmail = async (email: string, pass: string): Promise<{user: User | null, error: AuthError | null}> => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        // Ensure user profile exists on sign-in as well, for older accounts
        await createUserProfileDocument(result.user);
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
            reporterId: auth.currentUser.uid,
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
    unread?: { [key: string]: number }; // unread count for each user
    vehicleId: string;
    vehicleSummary: string;
    deletedFor?: string[];
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
}

export interface GeofenceLocation {
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export interface UserNotificationSettings {
  nationalAlerts: boolean;
  localAlerts: boolean;
}

const toVehicleReport = (docSnap: any): VehicleReport => {
    const data = docSnap.data();
    
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
        id: docSnap.id,
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

const toConversation = (docSnap: any): Conversation => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        lastMessageAt: data.lastMessageAt ? data.lastMessageAt.toDate().toISOString() : new Date().toISOString(),
    } as Conversation;
}

const toMessage = (docSnap: any): Message => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
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

export const listenToUnreadCount = (userId: string, callback: (count: number) => void): Unsubscribe => {
    const q = query(
        collection(db, 'conversations'), 
        where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.forEach(docSnap => {
            const convo = toConversation(docSnap);
            // Only count if the convo hasn't been deleted by the user
            if (!(convo.deletedFor?.includes(userId))) {
                if (convo.unread && convo.unread[userId]) {
                    totalUnread += convo.unread[userId];
                }
            }
        });
        callback(totalUnread);
    }, (error) => {
        console.error("Error listening to unread count:", error);
    });
};

// Listen to a user's conversations
export const listenToUserConversations = (userId: string, callback: (conversations: Conversation[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'conversations'), 
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, async (snapshot) => {
        const conversationsPromises = snapshot.docs.map(async (conversationDoc) => {
            let convo = toConversation(conversationDoc);
            
            // Filter out conversations marked as deleted for the current user
            if (convo.deletedFor?.includes(userId)) {
                return null;
            }

            if (!convo.participantDetails) {
              convo.participantDetails = {};
            }

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

        const conversations = (await Promise.all(conversationsPromises)).filter(Boolean) as Conversation[];
        callback(conversations);
    }, (error) => {
        console.error("Error listening to conversations:", error);
    });
};

// Listen to messages in a conversation
export const listenToMessages = (
    conversationId: string, 
    callback: (messages: Message[]) => void,
    currentUserId: string,
    isPageActive: boolean
): Unsubscribe => {
    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const messages = snapshot.docs.map(toMessage);
        callback(messages);

        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.senderId !== currentUserId) {
            // If the user is actively viewing the conversation, reset their unread count.
            if(isPageActive) {
                const conversationRef = doc(db, 'conversations', conversationId);
                const convoDoc = await getDoc(conversationRef);
                if (convoDoc.exists() && convoDoc.data().unread?.[currentUserId] > 0) {
                    await updateDoc(conversationRef, {
                        [`unread.${currentUserId}`]: 0
                    });
                }
            } else {
                // If the user is not viewing, show a toast.
                const senderDoc = await getDoc(doc(db, 'users', lastMessage.senderId));
                const senderName = senderDoc.exists() ? senderDoc.data().displayName : 'Someone';
                toast({
                    title: `New Message from ${senderName}`,
                    description: lastMessage.text,
                });
            }
        }
    }, (error) => {
        console.error("Error listening to messages:", error);
        toast({
            variant: "destructive",
            title: "Could not load messages",
            description: "There was a problem fetching the conversation. Please try again."
        });
    });
    
    return unsubscribe;
};

// Send a message
export const sendMessage = async (conversationId: string, text: string, sender: User) => {
    const conversationRef = doc(db, 'conversations', conversationId);
    
    await runTransaction(db, async (transaction) => {
        const convoDoc = await transaction.get(conversationRef);
        if (!convoDoc.exists()) {
            throw "Conversation does not exist!";
        }

        const convoData = convoDoc.data();
        const otherParticipantId = convoData.participants.find((p: string) => p !== sender.uid);

        if (otherParticipantId) {
            const otherUserRef = doc(db, 'users', otherParticipantId);
            const otherUserDoc = await transaction.get(otherUserRef);
            if(otherUserDoc.exists() && otherUserDoc.data().blockedUsers?.includes(sender.uid)) {
                throw new Error("You have been blocked by this user.");
            }
        }

        const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
        transaction.set(messageRef, {
            conversationId,
            senderId: sender.uid,
            text,
            createdAt: serverTimestamp(),
        });

        const updateData: any = {
            lastMessage: text,
            lastMessageAt: serverTimestamp(),
            // The conversation is no longer deleted for the sender, since they sent a message.
            deletedFor: arrayRemove(sender.uid)
        };
        
        if (otherParticipantId) {
           updateData[`unread.${otherParticipantId}`] = increment(1);
        }

        transaction.update(conversationRef, updateData);
    });
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
    
    const existingConversation = snapshot.docs.find(doc => doc.data().participants.includes(vehicle.reporterId));

    if (existingConversation) {
        // If a user re-initiates a deleted conversation, un-delete it for them.
        await updateDoc(doc(db, 'conversations', existingConversation.id), {
            deletedFor: arrayRemove(initiator.uid)
        });
        return existingConversation.id;
    }
    
    const ownerRef = doc(db, 'users', vehicle.reporterId);
    let ownerDoc = await getDoc(ownerRef);
    let ownerData: { displayName: string, photoURL: string };

    if (!ownerDoc.exists()) {
       // Fallback: This should ideally not happen if createUserProfileDocument is robust.
       const authUser = (await getAuth().getUser(vehicle.reporterId)).providerData[0];
       if (authUser) {
           await createUserProfileDocument({ uid: vehicle.reporterId, ...authUser } as User);
           ownerDoc = await getDoc(ownerRef);
       } else {
           throw new Error("Could not find the vehicle owner's data.");
       }
    }
    
    if (ownerDoc.exists()) {
        const data = ownerDoc.data();
        ownerData = {
            displayName: data.displayName || 'Vehicle Owner',
            photoURL: data.photoURL || ''
        };
    } else {
        throw new Error("Could not find or create the vehicle owner's data.");
    }

    const initiatorName = initiator.displayName || 'Anonymous User';
    const initiatorAvatar = initiator.photoURL || '';

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
        unread: { [initiator.uid]: 0, [vehicle.reporterId]: 0 },
        deletedFor: [],
    }
    
    await setDoc(newConversationRef, newConversationData);
    return newConversationRef.id;
}


// --- Block and Delete Functions ---

export async function deleteConversation(conversationId: string, userId: string) {
    const convoRef = doc(db, 'conversations', conversationId);
    // Instead of deleting, we add the user's ID to a "deletedFor" array.
    // This hides it from their view but keeps it for the other user.
    return updateDoc(convoRef, {
        deletedFor: arrayUnion(userId)
    });
}


async function ensureUserDocExists(userId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        const authUser = auth.currentUser;
        const details = (authUser && authUser.uid === userId) 
            ? { displayName: authUser.displayName, email: authUser.email, photoURL: authUser.photoURL } 
            : { displayName: 'User', email: 'N/A', photoURL: ''};

        await setDoc(userRef, {
            uid: userId,
            displayName: details.displayName,
            email: details.email,
            photoURL: details.photoURL,
            createdAt: serverTimestamp(),
            blockedUsers: [],
            geofences: [],
            notificationSettings: {
                nationalAlerts: false,
                localAlerts: true,
            }
        });
    }
}


export async function blockUser(blockerId: string, blockedId: string) {
    await ensureUserDocExists(blockerId);
    const blockerRef = doc(db, 'users', blockerId);
    return updateDoc(blockerRef, {
        blockedUsers: arrayUnion(blockedId)
    });
}


export async function unblockUser(unblockerId: string, unblockedId: string) {
    await ensureUserDocExists(unblockerId);
    const unblockerRef = doc(db, 'users', unblockerId);
    return updateDoc(unblockerRef, {
        blockedUsers: arrayRemove(unblockedId)
    });
}


export async function checkIfUserIsBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    if (!blockerId || !blockedId) return false;
    const blockerRef = doc(db, 'users', blockerId);
    const docSnap = await getDoc(blockerRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return data.blockedUsers?.includes(blockedId) || false;
    }
    return false;
}

// --- Geofence and Notification Settings Functions ---

export const getNotificationSettings = async (userId: string): Promise<UserNotificationSettings> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().notificationSettings) {
        return userSnap.data().notificationSettings;
    }
    // Return default settings if none are found
    return { nationalAlerts: false, localAlerts: true };
};

export const saveNotificationSettings = async (userId: string, settings: UserNotificationSettings) => {
    await ensureUserDocExists(userId);
    const userRef = doc(db, 'users', userId);
    return updateDoc(userRef, {
        notificationSettings: settings
    });
};

export const getUserGeofences = async (userId: string): Promise<GeofenceLocation[]> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data().geofences || [];
    }
    return [];
};

export const saveUserGeofence = async (userId: string, location: GeofenceLocation) => {
    const userRef = doc(db, 'users', userId);
    await ensureUserDocExists(userId); // Ensure document exists before updating

    // We need to remove any old geofence with the same name before adding the new one
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const geofences = userDoc.data()?.geofences || [];
        const filteredGeofences = geofences.filter((g: GeofenceLocation) => g.name !== location.name);
        transaction.update(userRef, {
            geofences: [...filteredGeofences, location]
        });
    });
};


export const deleteUserGeofence = async (userId: string, locationName: string) => {
    const userRef = doc(db, 'users', userId);
    await ensureUserDocExists(userId);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const geofences = userDoc.data()?.geofences || [];
        const updatedGeofences = geofences.filter((g: GeofenceLocation) => g.name !== locationName);
        transaction.update(userRef, { geofences: updatedGeofences });
    });
};


export { auth, db };
export type { User, AuthError };

    