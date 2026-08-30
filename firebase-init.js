// ===================== FIREBASE INIT (Auth + Firestore realtime sync, per-user data) =====================
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

function stateDocFor(uid){
  return doc(db, "posData", uid);
}

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
  // প্রতি ইউজারের নিজের ডেটা — uid অনুযায়ী আলাদা ডকুমেন্ট
  async loadState(uid){
    const snap = await getDoc(stateDocFor(uid));
    return snap.exists() ? snap.data().data : null;
  },
  async saveState(uid, stateObj){
    if(!uid) return;
    try{
      await setDoc(stateDocFor(uid), { data: stateObj, updatedAt: Date.now() });
    }catch(e){
      console.warn('Firestore save failed', e);
    }
  },
  watchState(uid, cb){
    if(!uid) return null;
    return onSnapshot(stateDocFor(uid), (snap)=>{
      if(snap.exists()) cb(snap.data().data);
    });
  }
};

window.dispatchEvent(new Event('firebase-ready'));