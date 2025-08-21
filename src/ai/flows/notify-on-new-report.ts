'use server';
/**
 * @fileOverview A flow that triggers when a new vehicle report is created and notifies relevant users.
 */

import { ai } from '@/ai/genkit';
import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'genkit/zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { HttpsOptions } from 'firebase-functions/v2/https';

// Initialize Firebase Admin SDK if not already done.
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

// Define the structure of the data we expect from the Firestore trigger.
// This is what the `data()` of the DocumentSnapshot will contain.
const VehicleReportSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number(),
  licensePlate: z.string(),
  status: z.string(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    fullAddress: z.string().optional(),
  }).optional(),
});


// This is the core logic of our flow.
const newReportNotifierFlow = ai.defineFlow(
  {
    name: 'newReportNotifierFlow',
    inputSchema: z.any(),
    outputSchema: z.void(),
  },
  async (reportSnapshot) => {
    console.log('New vehicle report received. Processing for notifications.');

    const reportData = VehicleReportSchema.parse(reportSnapshot.data());

    if (reportData.status !== 'Active') {
        console.log(`Report for ${reportData.licensePlate} is not active. Skipping notification.`);
        return;
    }

    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    if (usersSnapshot.empty) {
        console.log("No users found to notify.");
        return;
    }

    const usersToNotify: string[] = [];

    usersSnapshot.forEach(doc => {
        const user = doc.data();
        const settings = user.notificationSettings;
        if (!settings) {
            return;
        }

        // Case 1: User wants national alerts
        if (settings.nationalAlerts) {
            usersToNotify.push(user.uid);
            console.log(`User ${user.uid} will be notified due to national alert preference.`);
            return; // Skip to next user
        }

        // Case 2: User wants local alerts and has geofences
        if (settings.localAlerts && user.geofences?.length > 0) {
            // In a real application, you would check if the new vehicle's location
            // falls within any of the user's geofenced areas.
            // This requires geospatial queries which are complex.
            // For this example, we will just log that we would perform this check.
            console.log(`User ${user.uid} has local alert preferences. Geospatial check would be performed here.`);
        }
    });

    if (usersToNotify.length > 0) {
        console.log("Preparing to send notifications to:", usersToNotify);
        // TODO: Implement actual notification sending logic (e.g., email, push).
    } else {
        console.log("No users matched notification criteria for this report.");
    }
  }
);


// This exports the flow as a Cloud Function triggered by Firestore.
export const newReportNotifier = onFlow(
  {
    name: 'newReportNotifier',
    flow: newReportNotifierFlow,
    trigger: {
      firestore: {
        document: 'vehicleReports/{reportId}',
        event: 'oncreate',
      },
    },
    httpsOptions: {} as HttpsOptions,
  },
  (data) => data
);
