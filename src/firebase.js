import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// --- [중요] Firebase 설정 ---
const firebaseConfig = {
  apiKey: 'AIzaSyB1T4saWXiTKmTTTz42xMTllwjnVj_dL28',
  authDomain: 'myswitchgear-b0a30.firebaseapp.com',
  projectId: 'myswitchgear-b0a30',
  storageBucket: 'myswitchgear-b0a30.firebasestorage.app',
  messagingSenderId: '445093412286',
  appId: '1:445093412286:web:a64b5ebb951796c2958def',
  measurementId: 'G-ZX4E02W52E',
};

let db;
let auth;

try {
  const config =
    typeof __firebase_config !== 'undefined'
      ? JSON.parse(__firebase_config)
      : firebaseConfig;
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error('Firebase 초기화 오류', e);
}

const appId =
  typeof __app_id !== 'undefined' ? __app_id : 'switchgear-pro';

export { db, auth, appId };

