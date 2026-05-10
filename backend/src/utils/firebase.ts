import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath) {
      // Resolve path to make sure it works regardless of where the command is run from
      const fullPath = path.isAbsolute(serviceAccountPath) 
        ? serviceAccountPath 
        : path.join(process.cwd(), serviceAccountPath);

      if (fs.existsSync(fullPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(fullPath),
        });
        console.log('✅ Firebase Admin: Initialized successfully using:', fullPath);
      } else {
        console.error('❌ Firebase Admin Error: Service account file NOT found at:', fullPath);
        console.error('Please check GOOGLE_APPLICATION_CREDENTIALS in your .env file');
      }
    } else {
      console.error('❌ Firebase Admin Error: GOOGLE_APPLICATION_CREDENTIALS is not set in .env');
    }
  } catch (error) {
    console.error('💥 Firebase Admin initialization error:', error);
  }
}

export default admin;
