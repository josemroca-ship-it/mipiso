import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlfH-3aWjCoDZ2qp0OBEJ8IbVDtN-o__8",
  authDomain: "mipiso-5100d.firebaseapp.com",
  databaseURL: "https://mipiso-5100d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mipiso-5100d",
  storageBucket: "mipiso-5100d.firebasestorage.app",
  messagingSenderId: "405663604160",
  appId: "1:405663604160:web:f471516aebab1b828a7c25"
};

const app = initializeApp(firebaseConfig);

// Exportar la base de datos
export const db = getDatabase(app);
