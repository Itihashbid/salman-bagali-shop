// ===================== FIREBASE INIT (Auth + Firestore realtime sync) =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJbL9nFZreSLpqY20XGeSAwpn5tFUKqug",
  authDomain: "salman-bangali-shop.firebaseapp.com",
  projectId: "salman-bangali-shop",
  storageBucket: "salman-bangali-shop.firebasestorage.app",
  messagingSenderId: "42468552206",
  appId: "1:42468552206:web:ded4338472d5a3c5eed65f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STATE_DOC = doc(db, "posData", "main");

window.Firebase = {
  login(email, password){
    return signInWithEmailAndPassword(auth, email, password);
  },
  logout(){
    return signOut(auth);
  },
  onAuthChange(cb){
    onAuthStateChanged(auth, cb);
  },
  async loadState(){
    const snap = await getDoc(STATE_DOC);
    return snap.exists() ? snap.data().data : null;
  },
  async saveState(stateObj){
    try{
      await setDoc(STATE_DOC, { data: stateObj, updatedAt: Date.now() });
    }catch(e){
      console.warn('Firestore save failed', e);
    }
  },
  watchState(cb){
    return onSnapshot(STATE_DOC, (snap)=>{
      if(snap.exists()) cb(snap.data().data);
    });
  }
};

window.dispatchEvent(new Event('firebase-ready'));
