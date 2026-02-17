/* Global Firebase Init — SINGLE SOURCE OF TRUTH */

const firebaseConfig = {
  apiKey: "AIzaSyDGYp9sBwOWBdu9W46Q6XFp9zfLCrEsaO4",
  authDomain: "certquest-94959.firebaseapp.com",
  projectId: "certquest-94959",
  storageBucket: "certquest-94959.firebasestorage.app",
  messagingSenderId: "323956529033",
  appId: "1:323956529033:web:e9c9c6a3c7668b8a72f358",
  measurementId: "G-F5JHTGGN6K"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
