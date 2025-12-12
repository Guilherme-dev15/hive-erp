import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <--- Importante

// Suas chaves reais (Hardcoded para eliminar erro de .env por enquanto)
const firebaseConfig = {
  apiKey: "AIzaSyCDgt0KP6PkcKHDvob3p3DLJcGZU9mKWhE",
  authDomain: "hive-1874c.firebaseapp.com",
  databaseURL: "https://hive-1874c-default-rtdb.firebaseio.com",
  projectId: "hive-1874c",
  storageBucket: "hive-1874c.firebasestorage.app", // <--- O BUCKET ESTÁ AQUI
  messagingSenderId: "1092448042253",
  appId: "1:1092448042253:web:cfc51806019f3430074444",
  measurementId: "G-MV7P0ZWK8R"
};

// 1. Inicializa o App
const app = initializeApp(firebaseConfig);

// 2. Exporta Auth e Storage prontos para uso
export const auth = getAuth(app);
export const storage = getStorage(app); // <--- Exportação Crucial