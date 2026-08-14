import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

// NOTA DE SEGURANÇA: A validação abaixo é crítica para evitar que a aplicação
// rode com credenciais de placeholder ou ausentes. Esta é uma contramedida
// direta a um risco de segurança onde chaves foram expostas no passado.
// Validação aprimorada para quebrar o build com uma mensagem clara
const requiredVars = [
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
      import.meta.env[key].includes('AIzaSy...') ||
      import.meta.env[key].includes('seu-projeto')
  );

if (missingVars.length > 0 || placeholderVars.length > 0) {
  let errorMessage = 'VITE: Erro de configuração do Firebase. ';
  if (missingVars.length > 0) {
    errorMessage += `Variáveis de ambiente faltando: ${missingVars.join(', ')}. `;
  }
  if (placeholderVars.length > 0) {
    errorMessage += `Variáveis com valores de placeholder (não preenchidos): ${placeholderVars.join(', ')}. `;
  }
  errorMessage += `Verifique as configurações do projeto na Vercel (Settings -> Environment Variables).`;

  throw new Error(errorMessage);
}

// Inicializa os serviços do Firebase
const app = initializeApp(firebaseConfig);
// Inicialização condicional do Analytics
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

// Exporta os serviços prontos para uso
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
