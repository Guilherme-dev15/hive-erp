"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.storage = exports.auth = void 0;
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
var storage_1 = require("firebase/storage");
var firestore_1 = require("firebase/firestore");
var analytics_1 = require("firebase/analytics");
// As chaves agora são lidas de forma segura do ambiente (.env local ou Vercel)
var firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
// Validação aprimorada para quebrar o build com uma mensagem clara
var requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
];
var missingVars = requiredVars.filter(function (key) { return !import.meta.env[key]; });
var placeholderVars = requiredVars
    .filter(function (key) { return import.meta.env[key]; }) // Apenas as que existem
    .filter(function (key) {
    return import.meta.env[key].includes('AIzaSy...') ||
        import.meta.env[key].includes('seu-projeto');
});
if (missingVars.length > 0 || placeholderVars.length > 0) {
    var errorMessage = 'VITE: Erro de configuração do Firebase. ';
    if (missingVars.length > 0) {
        errorMessage += "Vari\u00E1veis de ambiente faltando: ".concat(missingVars.join(', '), ". ");
    }
    if (placeholderVars.length > 0) {
        errorMessage += "Vari\u00E1veis com valores de placeholder (n\u00E3o preenchidos): ".concat(placeholderVars.join(', '), ". ");
    }
    errorMessage += "Verifique as configura\u00E7\u00F5es do projeto na Vercel (Settings -> Environment Variables).";
    throw new Error(errorMessage);
}
// Inicializa os serviços do Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var analytics = (0, analytics_1.getAnalytics)(app);
// Exporta os serviços prontos para uso
exports.auth = (0, auth_1.getAuth)(app);
exports.storage = (0, storage_1.getStorage)(app);
exports.db = (0, firestore_1.getFirestore)(app);
