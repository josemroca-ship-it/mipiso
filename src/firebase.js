import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TUS CLAVES DE FIREBASE (NO LAS BORRES, DEJA LAS QUE YA PUSISTE)
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  // ... el resto de tus claves
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// --- ESTA ES LA LÍNEA IMPORTANTE QUE ARREGLA EL ERROR ---
// Tienes que poner "export" delante de "const db"
export const db = getDatabase(app);
