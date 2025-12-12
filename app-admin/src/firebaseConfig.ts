// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // <--- Importante

// Sua configuração (que você mandou)
const firebaseConfig = {
  apiKey: "AIzaSyCDgt0KP6PkcKHDvob3p3DLJcGZU9mKWhE",
  authDomain: "hive-1874c.firebaseapp.com",
  databaseURL: "https://hive-1874c-default-rtdb.firebaseio.com",
  projectId: "hive-1874c",
  storageBucket: "hive-1874c.firebasestorage.app", // <--- O bucket está aqui!
  messagingSenderId: "1092448042253",
  appId: "1:1092448042253:web:cfc51806019f3430074444",
  measurementId: "G-MV7P0ZWK8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportamos as instâncias prontas para usar no resto do app
export const auth = getAuth(app);
export const storage = getStorage(app); // <--- OBRIGATÓRIO EXPORTAR ISSO