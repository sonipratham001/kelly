import { initializeApp, getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDxEBUOFAtAjVOcyXTDsgWab8ETU_55_CA",
  authDomain: "km-v1-732e3.firebaseapp.com",
  projectId: "km-v1-732e3",
  storageBucket: "km-v1-732e3.appspot.com", // fixed typo: should end with `.appspot.com`
  messagingSenderId: "478638652176",
  appId: "1:478638652176:android:22f4c6da91cd6423430395"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(getApp());
export const db = getFirestore(getApp());

export default app;