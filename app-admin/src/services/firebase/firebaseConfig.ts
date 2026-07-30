import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Validação para quebrar o build se as variáveis não estiverem configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error("As variáveis de ambiente do Firebase não foram configuradas corretamente no VITE. Verifique seu arquivo .env ou as configurações da Vercel.");
}

// Inicializa os serviços do Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exporta os serviços prontos para uso
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
