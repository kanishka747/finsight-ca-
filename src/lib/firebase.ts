import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBY8yl8c6-o2KIGlTLjFsbe0MTJLhdgiJE',
  authDomain: 'finsight-ca.firebaseapp.com',
  projectId: 'finsight-ca',
  storageBucket: 'finsight-ca.firebasestorage.app',
  messagingSenderId: '743127419741',
  appId: '1:743127419741:web:b557f7bc2da169634fb6b4',
  measurementId: 'G-3NLEFBHZVN',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
