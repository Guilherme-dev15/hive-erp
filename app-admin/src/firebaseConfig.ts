// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- IMPORTAÇÃO QUE FALTAVA
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// (Os seus dados estão corretos)
const firebaseConfig = {
  apiKey: "AIzaSyCDgt0KP6PkcKHDvob3p3DLJcGZU9mKWhE",
  authDomain: "hive-1874c.firebaseapp.com",
  databaseURL: "https://hive-1874c-default-rtdb.firebaseio.com",
  projectId: "hive-1874c",
  storageBucket: "hive-1874c.firebasestorage.app",
  messagingSenderId: "1092448042253",
  appId: "1:1092448042253:web:cfc51806019f3430074444",
  measurementId: "G-MV7P0ZWK8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// (Movido do topo para aqui e exportado apenas uma vez)
export const auth = getAuth(app);

export const storage = getStorage(app);