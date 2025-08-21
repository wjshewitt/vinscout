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

// Define the structure of the user's notification settings.
const NotificationSettingsSchema = z.object({
    nationalAlerts: z.boolean().optional(),
    localAlerts: z.boolean().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    notificationChannels: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
    }).optional(),
}).optional();


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

    const notificationJobs: Promise<void>[] = [];

    usersSnapshot.forEach(doc => {
        const user = doc.data();
        const settings = NotificationSettingsSchema.parse(user.notificationSettings);
        
        let shouldNotify = false;

        // Case 1: User wants national alerts
        if (settings?.nationalAlerts) {
            shouldNotify = true;
            console.log(`User ${user.uid} qualifies for notification due to national alert preference.`);
        }
        // Case 2: User wants local alerts
        else if (settings?.localAlerts && user.geofences?.length > 0) {
            // In a real application, you would check if the new vehicle's location
            // falls within any of the user's geofenced areas.
            // This requires geospatial queries which are complex.
            // For this example, we will just log that we would perform this check.
            console.log(`User ${user.uid} qualifies for notification due to local alert preference. Geospatial check would be performed here.`);
            shouldNotify = true; // Simulating a match for demonstration purposes.
        }

        if (shouldNotify && settings?.notificationChannels) {
            const vehicleInfo = `${reportData.year} ${reportData.make} ${reportData.model}`;
            
            // Check which channels are enabled and log the action.
            if (settings.notificationChannels.email && settings.email) {
                console.log(`ACTION: Send EMAIL to ${settings.email} for new report on ${vehicleInfo} (${reportData.licensePlate}).`);
            }
            if (settings.notificationChannels.sms && settings.phoneNumber) {
                console.log(`ACTION: Send SMS to ${settings.phoneNumber} for new report on ${vehicleInfo} (${reportData.licensePlate}).`);
            }
            if (settings.notificationChannels.whatsapp && settings.phoneNumber) {
                 console.log(`ACTION: Send WHATSAPP message to ${settings.phoneNumber} for new report on ${vehicleInfo} (${reportData.licensePlate}).`);
            }
        }
    });
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
