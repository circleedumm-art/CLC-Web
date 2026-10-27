/* Paste the values Firebase gives you (Project settings → Your apps → Web app).
   These are NOT secrets. Your data is protected by the rules in firestore.rules. */
const firebaseConfig = {
  apiKey: "AIzaSyDy2WCFoEG0a0lvtV-YavzVpR-8rRaQYhw",
  authDomain: "clc-website-eebe3.firebaseapp.com",
  projectId: "clc-website-eebe3",
  storageBucket: "clc-website-eebe3.firebasestorage.app",
  messagingSenderId: "333062137880",
  appId: "1:333062137880:web:e259cf43bb87c89c077b6d"
};

const ADMIN_EMAIL = "your-admin-gmail@gmail.com";  // the one Google account that is admin
const ID_DOMAIN = "clc-portal.app";                // hidden domain that turns "S001" into an email login
