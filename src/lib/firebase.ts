
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
  UserCredential,
  deleteUser,
  sendPasswordResetEmail
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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from '@/hooks/use-toast';
import _ from 'lodash';

const firebaseConfig = {
  "projectId": "vigilante-garage",
  "appId": "1:109449796594:web:9cdb5b50aed0dfa46ce96b",
  "storageBucket": "vigilante-garage.appspot.com",
  "apiKey": "AIzaSyBdqrM1jTSCT3Iv4alBwpt1I48f4v4qZOg",
  "authDomain": "vigilante-garage.firebaseapp.com",
  "messagingSenderId": "109449796594",
  "measurementId": ""
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
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
                    email: user.email || '',
                    notificationChannels: {
                        email: true,
                        sms: false,
                        whatsapp: false,
                    },
                    phoneNumber: ''
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

export const sendPasswordReset = async (email: string): Promise<{ success: boolean; error: AuthError | null }> => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: error as AuthError };
    }
};

export const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user is currently signed in.');
    }

    try {
        // First, delete the user's Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);

        // Then, delete the user from Firebase Authentication
        await deleteUser(user);

    } catch (error) {
        console.error("Error deleting user account:", error);
        // Re-authentication might be required for security-sensitive operations.
        // The calling function should handle this error and prompt the user if needed.
        throw error;
    }
};

export const uploadImageAndGetURL = (
  file: File,
  userId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}-${timestamp}-${randomSuffix}.jpg`;
    const storageRef = ref(storage, `vehicle-photos/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
};


export const submitVehicleReport = async (reportData: Omit<VehicleReport, 'id' | 'reportedAt' | 'status' | 'sightingsCount'> & { reporterId: string }) => {
    if (!auth.currentUser || auth.currentUser.uid !== reportData.reporterId) {
        console.error("User is not authenticated or does not match reporter ID.");
        return null;
    }

    try {
        // Image URLs are already in reportData.photos, no upload needed here.
        const reportPayload: any = {
            ...reportData,
            reportedAt: serverTimestamp(),
            status: 'Active',
            sightingsCount: 0,
        };

        // Ensure optional fields are not sent if they are empty or just whitespace
        if (!reportPayload.vin?.trim()) {
            delete reportPayload.vin;
        }
        if (!reportPayload.features?.trim()) {
            delete reportPayload.features;
        }

        const docRef = await addDoc(collection(db, 'vehicleReports'), reportPayload);
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
};

export const updateVehicleReport = async (reportId: string, dataToUpdate: Partial<VehicleReport>) => {
    const reportRef = doc(db, 'vehicleReports', reportId);
    return updateDoc(reportRef, dataToUpdate);
}

export const deleteVehicleReport = async (reportId: string): Promise<void> => {
    const reportRef = doc(db, 'vehicleReports', reportId);
    
    // Deleting subcollections in the client is complex. 
    // A better approach is using a Firebase Cloud Function to handle cascading deletes.
    // For this client-side implementation, we will delete the main document.
    // Be aware that sightings subcollection will be orphaned.
    
    // First, delete all sightings in the subcollection
    const sightingsRef = collection(reportRef, "sightings");
    const sightingsSnapshot = await getDocs(sightingsRef);
    const batch = writeBatch(db);
    sightingsSnapshot.docs.forEach((sightingDoc) => {
        batch.delete(sightingDoc.ref);
    });
    await batch.commit();
    
    // Then delete the main report document
    await deleteDoc(reportRef);
}

export const updateVehicleStatus = async (reportId: string, status: 'Active' | 'Recovered'): Promise<void> => {
    const reportRef = doc(db, 'vehicleReports', reportId);
    await updateDoc(reportRef, { status });
}


// Types
export interface LocationInfo {
    street: string;
    city: string;
    postcode: string;
    country: string;
    fullAddress: string;
}

export interface VehicleReport {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    vin?: string;
    features?: string;
    location: LocationInfo;
    date: string;
    reportedAt: string;
    status: 'Active' | 'Recovered';
    reporterId: string;
    photos?: string[];
    lat: number;
    lng: number;
    sightingsCount: number;
    rewardAmount?: number;
    rewardDetails?: string;
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
    messageType?: 'Sighting' | 'Vehicle Found' | 'Question';
    sightingLocation?: {
        address: string;
        lat: number;
        lng: number;
    }
}

export interface Sighting {
    id: string;
    vehicleId: string;
    sighterId: string;
    sighterName: string;
    sighterAvatar: string;
    message: string;
    location: LocationInfo;
    lat: number;
    lng: number;
    sightedAt: string;
}


export interface GeofenceLocation {
    name: string;
    address: string;
    lat: number;
    lng: number;
    type: 'radius' | 'polygon';
    radius?: number; // in meters
    path?: { lat: number, lng: number }[];
}

export interface UserNotificationSettings {
  nationalAlerts: boolean;
  localAlerts: boolean;
  email: string;
  notificationChannels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  phoneNumber: string;
}

const toVehicleReport = (docSnap: any): VehicleReport => {
    const data = docSnap.data();

    const convertTimestampToString = (ts: Timestamp | null | undefined): string => {
        return ts ? ts.toDate().toISOString() : new Date().toISOString();
    };

    const formatDateString = (dateInput: any): string => {
        if (!dateInput) return new Date().toISOString().split('T')[0];
        // Handle Firestore Timestamps or string dates
        const d = (dateInput.toDate && typeof dateInput.toDate === 'function') ? dateInput.toDate() : new Date(dateInput);
        if (isNaN(d.getTime())) {
            // Check if it's already in YYYY-MM-DD format
            if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }
            return new Date().toISOString().split('T')[0];
        }
        // Return in 'YYYY-MM-DD' format
        return d.toISOString().split('T')[0];
    };
    
    const defaultLocation: LocationInfo = {
        fullAddress: 'Unknown Location',
        street: '',
        city: 'Unknown',
        postcode: '',
        country: '',
    };
    
    let location: LocationInfo;
    // Defensively check if location is a well-formed object.
    if (data.location && typeof data.location === 'object' && data.location.fullAddress) {
        location = {
            fullAddress: data.location.fullAddress || 'Unknown Address',
            street: data.location.street || '',
            city: data.location.city || 'Unknown City',
            postcode: data.location.postcode || '',
            country: data.location.country || '',
        };
    } else {
        location = defaultLocation;
    }


    return {
        id: docSnap.id,
        make: data.make || '',
        model: data.model || '',
        year: data.year || 0,
        color: data.color || '',
        licensePlate: data.licensePlate || '',
        vin: data.vin,
        features: data.features,
        location, // Use the safely parsed location object
        date: formatDateString(data.date),
        reportedAt: convertTimestampToString(data.reportedAt),
        status: data.status || 'Active',
        reporterId: data.reporterId || '',
        photos: data.photos || [],
        lat: data.lat || 0,
        lng: data.lng || 0,
        sightingsCount: data.sightingsCount || 0,
        rewardAmount: data.rewardAmount,
        rewardDetails: data.rewardDetails,
    };
};

const toSighting = (docSnap: any): Sighting => {
    const data = docSnap.data();
    
    const location: LocationInfo = data.location || { fullAddress: 'Unknown Location', street: '', city: 'Unknown', postcode: '', country: '' };

    return {
        id: docSnap.id,
        ...data,
        location,
        sightedAt: data.sightedAt ? data.sightedAt.toDate().toISOString() : new Date().toISOString(),
    } as Sighting;
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

// Listen to all vehicle reports in real-time
export const listenToVehicleReports = (callback: (reports: VehicleReport[]) => void): Unsubscribe => {
    const q = query(collection(db, "vehicleReports"), orderBy("reportedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reports = querySnapshot.docs.map(toVehicleReport);
        callback(reports);
    }, (error) => {
        console.error("Error listening to vehicle reports: ", error);
        toast({
            variant: "destructive",
            title: "Map Error",
            description: "Could not load live vehicle data. Please refresh the page.",
        });
    });

    return unsubscribe;
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

// --- Sighting Functions ---

export const getVehicleSightings = async (vehicleId: string): Promise<Sighting[]> => {
    try {
        const q = query(collection(db, `vehicleReports/${vehicleId}/sightings`), orderBy("sightedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(toSighting);
    } catch (error) {
        console.error("Error fetching vehicle sightings: ", error);
        return [];
    }
};

export const submitSighting = async (
    vehicleId: string, 
    sighter: User, 
    sightingData: { message: string, location: LocationInfo, lat: number, lng: number }
): Promise<string> => {
    
    const vehicleRef = doc(db, 'vehicleReports', vehicleId);
    const sightingRef = doc(collection(db, 'vehicleReports', vehicleId, 'sightings'));

    await runTransaction(db, async (transaction) => {
        // 1. Increment sightings count on the main vehicle report
        transaction.update(vehicleRef, {
            sightingsCount: increment(1)
        });

        // 2. Create the new sighting document
        transaction.set(sightingRef, {
            vehicleId,
            sighterId: sighter.uid,
            sighterName: sighter.displayName,
            sighterAvatar: sighter.photoURL,
            message: sightingData.message,
            location: sightingData.location,
            lat: sightingData.lat,
            lng: sightingData.lng,
            sightedAt: serverTimestamp(),
        });
    });

    return sightingRef.id;
}


// --- Messaging Functions ---

// Unified conversation listener
const participantDetailsCache = new Map<string, { name: string; avatar: string; }>();

export const listenToConversations = (userId: string, callback: (conversations: Conversation[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'conversations'), 
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
        const conversationsPromises = snapshot.docs.map(async (conversationDoc) => {
            const convo = toConversation(conversationDoc);
            
            // Filter out conversations marked as deleted for the current user
            if (convo.deletedFor?.includes(userId)) {
                return null;
            }

            if (!convo.participantDetails) {
              convo.participantDetails = {};
            }

            for (const pId of convo.participants) {
                if (!convo.participantDetails[pId] && !participantDetailsCache.has(pId)) {
                    const userDoc = await getDoc(doc(db, 'users', pId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const details = {
                            name: userData.displayName || 'Unknown User',
                            avatar: userData.photoURL || ''
                        };
                        participantDetailsCache.set(pId, details);
                        convo.participantDetails[pId] = details;
                    } else {
                         const details = { name: 'Unknown User', avatar: '' };
                         participantDetailsCache.set(pId, details);
                         convo.participantDetails[pId] = details;
                    }
                } else if(participantDetailsCache.has(pId)) {
                     convo.participantDetails[pId] = participantDetailsCache.get(pId)!;
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
export const sendMessage = async (
    conversationId: string, 
    text: string, 
    sender: User,
    messageType: Message['messageType'],
    sightingLocation?: Message['sightingLocation']
) => {
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

        // Add the message
        const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
        const messagePayload: Omit<Message, 'id' | 'createdAt'> & { createdAt: FieldValue } = {
            conversationId,
            senderId: sender.uid,
            text,
            messageType,
            createdAt: serverTimestamp(),
        };

        if (messageType === 'Sighting' && sightingLocation) {
            messagePayload.sightingLocation = sightingLocation;
        }

        transaction.set(messageRef, messagePayload);
        
        // Update the conversation
        const updateData: any = {
            lastMessage: text,
            lastMessageAt: serverTimestamp(),
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

    // Fallback logic to create a user document if one doesn't exist for the owner.
    if (!ownerDoc.exists()) {
       try {
           console.warn(`User document for owner ${vehicle.reporterId} not found. Attempting to create one.`);
           await ensureUserDocExists(vehicle.reporterId);
           ownerDoc = await getDoc(ownerRef); // Re-fetch the doc
           if (!ownerDoc.exists()) throw new Error("Could not create owner document.");
           
           const data = ownerDoc.data();
           ownerData = {
               displayName: data?.displayName || 'Vehicle Owner',
               photoURL: data?.photoURL || ''
           };
       } catch (e) {
         console.error("Auth lookup and creation failed for owner", e);
         throw new Error("Could not find the vehicle owner's data.");
       }
    } else {
        const data = ownerDoc.data();
        ownerData = {
            displayName: data.displayName || 'Vehicle Owner',
            photoURL: data.photoURL || ''
        };
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
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        try {
            // This is a fallback and may not have all user details if the user isn't the current user.
            const authUser = auth.currentUser;
            const details = (authUser && authUser.uid === userId) 
                ? { displayName: authUser.displayName, email: authUser.email, photoURL: authUser.photoURL } 
                : { displayName: 'User', email: 'N/A', photoURL: '' };

            await createUserProfileDocument({ uid: userId, ...details } as User, { displayName: details.displayName });
        } catch (error) {
             console.error(`Failed to create doc for user ${userId}`, error);
             // Create a minimal doc to prevent future failures
             await setDoc(userRef, {
                uid: userId,
                displayName: 'User',
                email: 'N/A',
                photoURL: '',
                createdAt: serverTimestamp(),
                blockedUsers: [],
                geofences: [],
                notificationSettings: {
                    nationalAlerts: false,
                    localAlerts: true,
                    notificationChannels: { email: true, sms: false, whatsapp: false },
                    phoneNumber: ''
                }
            });
        }
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

const defaultSettings: UserNotificationSettings = {
    nationalAlerts: false,
    localAlerts: true,
    email: '',
    notificationChannels: { email: true, sms: false, whatsapp: false },
    phoneNumber: ''
};

export const getNotificationSettings = async (userId: string): Promise<UserNotificationSettings> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().notificationSettings) {
        // Deep merge with defaults to ensure all keys are present
        return _.merge({}, defaultSettings, userSnap.data().notificationSettings);
    }
    return defaultSettings;
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
