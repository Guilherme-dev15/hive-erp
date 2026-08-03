import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// As chaves agora são lidas de forma segura do ambiente (.env local ou Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validação aprimorada para quebrar o build com uma mensagem clara
const requiredVars: string[] = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredVars.filter((key) => !import.meta.env[key]);
const placeholderVars = requiredVars
  .filter((key) => import.meta.env[key]) // Apenas as que existem
  .filter(
    (key) =>
      (import.meta.env[key] as string).includes('AIzaSy...') ||
      (import.meta.env[key] as string).includes('seu-projeto')
  );

if (missingVars.length > 0 || placeholderVars.length > 0) {
  let errorMessage = 'VITE: Erro de configuração do Firebase. ';
  if (missingVars.length > 0) {
    errorMessage += `Variáveis de ambiente faltando: ${missingVars.join(', ')}. `;
  }
  if (placeholderVars.length > 0) {
    errorMessage += `Variáveis com valores de placeholder (não preenchidos): ${placeholderVars.join(', ')}. `;
  }
  errorMessage +=
    'Verifique as configurações do projeto na Vercel (Settings -> Environment Variables).';
  throw new Error(errorMessage);
}

// Inicializa os serviços do Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exporta os serviços prontos para uso
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const db: Firestore = getFirestore(app);
