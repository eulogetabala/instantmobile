// Configuration Firebase pour le projet Firecars
// Configuration complète iOS + Android

export const firebaseConfig = {
  // Configuration iOS (priorité)
  apiKey: "AIzaSyDn-vou88F1KRf6USn_F2Ne6yfcpswEd2M", // iOS API Key
  authDomain: "firecars-b2ed4.firebaseapp.com",
  projectId: "firecars-b2ed4",
  storageBucket: "firecars-b2ed4.appspot.com",
  messagingSenderId: "83910631762",
  appId: "1:83910631762:ios:4cb067016e347bd0dada8b", // iOS App ID
  measurementId: "G-XXXXXXXXXX" // À récupérer si nécessaire
};

// Configuration Android (alternative)
export const firebaseConfigAndroid = {
  apiKey: "AIzaSyC4cbEtJCYwXtM-HzB1AhJzOEqcxseaxvU", // Android API Key
  authDomain: "firecars-b2ed4.firebaseapp.com",
  projectId: "firecars-b2ed4",
  storageBucket: "firecars-b2ed4.appspot.com",
  messagingSenderId: "83910631762",
  appId: "1:83910631762:android:aa77afe2de73e1d1dada8b", // Android App ID
  measurementId: "G-XXXXXXXXXX"
};

export const expoConfig = {
  projectId: "your-expo-project-id" // À remplacer par votre ID Expo
};

export const vapidKey = "your-vapid-key-here"; // À remplacer par votre clé VAPID
