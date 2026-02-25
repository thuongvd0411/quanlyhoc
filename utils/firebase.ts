// utils/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase Config từ người dùng
const firebaseConfig = {
  apiKey: "AIzaSyBedNFGrTwDPm-Kum4IwCTG8mY-K5srGGU",
  authDomain: "dulieudayhoc-156f6.firebaseapp.com",
  projectId: "dulieudayhoc-156f6",
  storageBucket: "dulieudayhoc-156f6.firebasestorage.app",
  messagingSenderId: "950467818683",
  appId: "1:950467818683:web:75839da992d0981180259e"
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore và export để dùng chung
export const db = getFirestore(app);
