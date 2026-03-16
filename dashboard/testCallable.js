import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey:
    process.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAOB97HJHHsAbO5OQQ-kJtw3jyXU22A0bs',
  authDomain:
    process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'waautomation-13fa6.firebaseapp.com',
  projectId:
    process.env.VITE_FIREBASE_PROJECT_ID ||
    'waautomation-13fa6',
  storageBucket:
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'waautomation-13fa6.firebasestorage.app',
  messagingSenderId:
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '160576032895',
  appId:
    process.env.VITE_FIREBASE_APP_ID ||
    '1:160576032895:web:d584b96ed32b5998612f4a',
  measurementId:
    process.env.VITE_FIREBASE_MEASUREMENT_ID ||
    'G-S3D64C11FP'
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

const testCallable = async () => {
  const fn = httpsCallable(functions, 'getLeadFinderConfig');
  try {
    const result = await fn({});
    console.log('Callable result:', result.data);
  } catch (error) {
    console.error('Callable error:', error);
    process.exitCode = 1;
  }
};

testCallable();
