import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount;

if (serviceAccountJson) {
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log('Using JSON service account');
    } catch (e) {
        console.error('Failed to parse JSON service account');
        serviceAccount = {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
    }
} else {
    serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
}


try {
    console.log('Project ID:', serviceAccount.projectId);
    console.log('Client Email:', serviceAccount.clientEmail);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    });

    const db = admin.database();
    console.log('Attempting to read categories...');
    const snapshot = await db.ref('categories').once('value');
    console.log('Success! Count:', snapshot.numChildren());
    process.exit(0);
} catch (error) {
    console.error('Firebase Admin Error:', error);
    process.exit(1);
}
