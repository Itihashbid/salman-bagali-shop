// ===================== FIREBASE INIT (Auth + Firestore realtime sync, per-shop data, staff accounts) =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs
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
// আলাদা "secondary" app instance — নতুন স্টাফ account তৈরি করার সময় এটা ব্যবহার হবে,
// যাতে বর্তমান Admin-এর লগইন সেশন প্রভাবিত না হয় (Firebase account তৈরি করলে normally auto-login হয়ে যায়)
const secondaryApp = initializeApp(firebaseConfig, "StaffCreator");
const secondaryAuth = getAuth(secondaryApp);
const db = getFirestore(app);

function stateDocFor(shopId){
  return doc(db, "posData", shopId);
}
function normEmail(email){
  return (email || '').trim().toLowerCase();
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
  // প্রতি দোকানের ডেটা — shopId অনুযায়ী আলাদা ডকুমেন্ট (মালিকের uid = shopId)
  async loadState(shopId){
    const snap = await getDoc(stateDocFor(shopId));
    return snap.exists() ? snap.data().data : null;
  },
  async saveState(shopId, stateObj){
    if(!shopId) return;
    try{
      await setDoc(stateDocFor(shopId), { data: stateObj, updatedAt: Date.now() });
    }catch(e){
      console.warn('Firestore save failed', e);
    }
  },
  watchState(shopId, cb){
    if(!shopId) return null;
    return onSnapshot(stateDocFor(shopId), (snap)=>{
      if(snap.exists()) cb(snap.data().data);
    });
  },

  // ===== স্টাফ ইনভাইট (মালিক স্টাফের ইমেইল দিয়ে আমন্ত্রণ পাঠায়, স্টাফ প্রথমবার লগইন করলে লিংক হয়ে যায়) =====
  // ===== নতুন স্টাফের জন্য সরাসরি Firebase account তৈরি (Console লাগবে না) =====
  async createStaffAccount(email){
    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'Aa1!';
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normEmail(email), tempPassword);
    const newUid = cred.user.uid;
    await sendPasswordResetEmail(auth, normEmail(email)); // স্টাফ নিজেই পাসওয়ার্ড সেট করবে
    await signOut(secondaryAuth); // secondary session সাথে সাথে সাইন-আউট, primary (Admin) session অক্ষত থাকবে
    return newUid;
  },
  async createInvite(email, ownerUid, role, name){
    await setDoc(doc(db, "staffInvites", normEmail(email)), { ownerUid, role, name, createdAt: Date.now() });
  },
  async getInvite(email){
    const snap = await getDoc(doc(db, "staffInvites", normEmail(email)));
    return snap.exists() ? snap.data() : null;
  },
  async deleteInvite(email){
    try{ await deleteDoc(doc(db, "staffInvites", normEmail(email))); }catch(e){}
  },
  async listInvitesForOwner(ownerUid){
    const q = query(collection(db, "staffInvites"), where("ownerUid", "==", ownerUid));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ email: d.id, ...d.data() }));
    return list;
  },

  // ===== স্টাফ লিংক (স্টাফ একবার লগইন করার পর স্থায়ী রেকর্ড) =====
  async getStaffLink(uid){
    const snap = await getDoc(doc(db, "staffLinks", uid));
    return snap.exists() ? snap.data() : null;
  },
  async linkStaff(uid, ownerUid, role, name, email){
    await setDoc(doc(db, "staffLinks", uid), { ownerUid, role, name: name || email, email, linkedAt: Date.now() });
  },
  async unlinkStaff(uid){
    try{ await deleteDoc(doc(db, "staffLinks", uid)); }catch(e){}
  },
  async listStaffForOwner(ownerUid){
    const q = query(collection(db, "staffLinks"), where("ownerUid", "==", ownerUid));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ uid: d.id, ...d.data() }));
    return list;
  }
};

window.dispatchEvent(new Event('firebase-ready'));