import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountEnv)),
    });
  } else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
}

export { admin };
