// ===================== FIREBASE INIT (Auth + Firestore realtime sync, per-shop data, staff accounts) =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, sendPasswordResetEmail,
  reauthenticateWithCredential, EmailAuthProvider, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, runTransaction
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
// এই ব্রাউজার ট্যাব/ডিভাইসের আইডি — নিজের দ্রুত পরপর সেভকে "অন্য ডিভাইসের কনফ্লিক্ট" ভাবা এড়াতে
const SESSION_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);
// [ফিক্স #25] এই ফাইলের নিজস্ব uid() — firebase-init.js-এর লোড অর্ডারের ওপর নির্ভর করে না
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// ===================== SAFE MERGE ENGINE (ফিক্স #2, #3) =====================
// সমস্যা: আগে saveState পুরো state দিয়ে সার্ভারের arrays (products, sales, cash...) overwrite করত,
// তাই দুই ডিভাইস একসাথে কাজ করলে শেষ সেভকারী অন্যজনের পরিবর্তন মুছে দিত।
// সমাধান: আমরা সবসময় মনে রাখি সার্ভারের "শেষ জানা অবস্থা" (base)। সেভ করার সময় সার্ভারে যদি
// অন্য কেউ নতুন কিছু লিখে থাকে, তাহলে base / local / remote — তিনটার 3-way merge করে লেখা হয়।
let baseData = null;     // শেষবার সার্ভারের সাথে sync হওয়া data (deep copy)
let baseVersion = 0;     // সেই data-র updatedAt
function setBase(data, version){
  baseData = data ? JSON.parse(JSON.stringify(data)) : null;
  baseVersion = version || 0;
}
// এই ফিল্ডগুলো দুই ডিভাইসে একসাথে বদলালে "মান" নয়, "পরিবর্তনের পরিমাণ (delta)" যোগ হবে
// (যেমন দুই ডিভাইসে একই পণ্য বিক্রি হলে stock দুইবারই কমবে)
const DELTA_FIELDS = new Set(['stock','due','totalPurchase','points']);
function isPlainObj(x){ return x && typeof x === 'object' && !Array.isArray(x); }
function jsonEq(a,b){ return JSON.stringify(a) === JSON.stringify(b); }
function itemIdentity(x){
  if(isPlainObj(x)){
    if(x.id != null) return 'id:' + x.id;
    if(x.invoice != null && Array.isArray(x.items)) return 'inv:' + x.invoice; // sale record
  }
  return 'j:' + JSON.stringify(x);
}
// একই identity-র একাধিক আইটেম থাকলে (যেমন হুবহু একই দুটো cash entry) occurrence নম্বর যোগ করে আলাদা করা
function keyedList(arr){
  const seen = {}; const list = [];
  (arr || []).forEach(x=>{
    const id = itemIdentity(x);
    seen[id] = (seen[id] || 0) + 1;
    list.push({ key: id + '#' + seen[id], val: x });
  });
  return list;
}
function mergeArray(base, local, remote){
  const B = new Map(keyedList(base).map(e=>[e.key, e.val]));
  const L = new Map(keyedList(local).map(e=>[e.key, e.val]));
  const R = keyedList(remote);
  const rKeys = new Set(R.map(e=>e.key));
  const out = [];
  R.forEach(e=>{
    if(B.has(e.key)){
      if(!L.has(e.key)) return;                    // local এটা মুছেছে → বাদ
      out.push(mergeVal(B.get(e.key), L.get(e.key), e.val));
    } else {
      out.push(e.val);                              // remote নতুন যোগ করেছে → রাখা
    }
  });
  L.forEach((val,key)=>{
    if(!rKeys.has(key) && !B.has(key)) out.push(val); // local নতুন যোগ করেছে → যোগ
  });
  return out;
}
function mergeVal(b, l, r, fieldName){
  if(jsonEq(l, b)) return r;                        // local কিছু বদলায়নি → remote নাও
  if(jsonEq(r, b)) return l;                        // remote কিছু বদলায়নি → local নাও
  if(jsonEq(l, r)) return l;
  if(Array.isArray(l) && Array.isArray(r)) return mergeArray(Array.isArray(b)?b:[], l, r);
  if(isPlainObj(l) && isPlainObj(r)){
    const bb = isPlainObj(b) ? b : {};
    const out = {};
    new Set([...Object.keys(bb), ...Object.keys(l), ...Object.keys(r)]).forEach(k=>{
      const v = mergeVal(bb[k], l[k], r[k], k);
      if(v !== undefined) out[k] = v;
    });
    return out;
  }
  if(DELTA_FIELDS.has(fieldName) && typeof l === 'number' && typeof r === 'number' && typeof b === 'number'){
    return Math.max(0, r + (l - b));
  }
  return l;                                          // দুইজনেই একই ফিল্ড বদলালে local (সাম্প্রতিক ব্যবহারকারী) জেতে
}
function mergeState(base, local, remote){
  const merged = mergeVal(base || {}, local, remote);
  // Invoice counter কখনো পিছনে যাবে না (ফিক্স #2)
  const counters = [base && base.invoiceCounter, local && local.invoiceCounter, remote && remote.invoiceCounter].filter(n=>typeof n==='number');
  if(counters.length) merged.invoiceCounter = Math.max(...counters);
  const pc = [base && base.purchaseCounter, local && local.purchaseCounter, remote && remote.purchaseCounter].filter(n=>typeof n==='number');
  if(pc.length) merged.purchaseCounter = Math.max(...pc);
  return merged;
}
// সেভগুলো একটার পর একটা চলবে — দুটো save একসাথে চললে delta merge ভুল হিসাব করত
let saveChain = Promise.resolve();

window.Firebase = {
  login(email, password){
    return signInWithEmailAndPassword(auth, email, password);
  },
  logout(){
    return signOut(auth);
  },
  // ===== পাসওয়ার্ড রিসেট ইমেইল পাঠানো (লগইন পেজের "Forgot Password?") =====
  forgotPassword(email){
    return sendPasswordResetEmail(auth, normEmail(email));
  },
  // ===== চলতি ইউজারের পাসওয়ার্ড পরিবর্তন (রি-অথেন্টিকেট করে তারপর আপডেট করে) =====
  async changePassword(currentPassword, newPassword){
    const user = auth.currentUser;
    if(!user || !user.email) throw {code:'auth/no-current-user', message:'No logged-in user found.'};
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  },
  onAuthChange(cb){
    onAuthStateChanged(auth, cb);
  },
  // প্রতি দোকানের ডেটা — shopId অনুযায়ী আলাদা ডকুমেন্ট (মালিকের uid = shopId)
  async loadState(shopId){
    const snap = await getDoc(stateDocFor(shopId));
    if(!snap.exists()){ setBase(null, 0); return null; }
    const d = snap.data();
    setBase(d.data, d.updatedAt || 0);
    return d.data || null;
  },
  // ===== সেভ: ডকুমেন্ট সাইজ চেক + অন্য ডিভাইসের পরিবর্তনের সাথে নিরাপদ merge =====
  // stateOrFn: state অবজেক্ট অথবা `()=>state` (ফাংশন দিলে সেভ চলার মুহূর্তের লাইভ state নেওয়া হয়)
  // রিটার্ন: { ok, conflict, merged, sizeWarning, sizeBytes }
  //   conflict/merged = অন্য ডিভাইসের পরিবর্তন পাওয়া গেছে এবং merge করা হয়েছে; merged হলো চূড়ান্ত data
  saveState(shopId, stateOrFn){
    const run = () => this._saveStateNow(shopId, stateOrFn);
    const p = saveChain.then(run, run);
    saveChain = p.catch(()=>{});
    return p;
  },
  async _saveStateNow(shopId, stateOrFn){
    if(!shopId) return { ok: false, conflict: false, sizeWarning: false };
    try{
      const user = auth.currentUser;
      const ref = stateDocFor(shopId);
      let conflict = false;
      let finalData = null;
      let finalTs = 0;

      await runTransaction(db, async (transaction) => {
        conflict = false; // transaction retry হলে আবার শূন্য থেকে
        const local = JSON.parse(JSON.stringify(typeof stateOrFn === 'function' ? stateOrFn() : stateOrFn));
        const snap = await transaction.get(ref);
        const existing = snap.exists() ? snap.data() : null;
        const remoteData = existing && existing.data ? existing.data : null;
        const remoteVersion = existing ? (existing.updatedAt || 0) : 0;

        let toWrite;
        if(remoteData && baseData && remoteVersion !== baseVersion){
          // সার্ভারে এমন পরিবর্তন আছে যা এই ডিভাইস এখনো দেখেনি → 3-way merge, overwrite নয়
          toWrite = mergeState(baseData, local, remoteData);
          conflict = true;
        } else {
          toWrite = local;
          // Invoice/purchase counter অন্য কোথাও এগিয়ে গেলে পিছনে নামানো যাবে না
          if(remoteData){
            ['invoiceCounter','purchaseCounter'].forEach(k=>{
              if(typeof remoteData[k] === 'number' && (typeof toWrite[k] !== 'number' || remoteData[k] > toWrite[k])) toWrite[k] = remoteData[k];
            });
          }
        }

        // timestamp সবসময় আগেরটার চেয়ে বড় (ঘড়ি ভিন্ন হলেও version কখনো পিছাবে না)
        const ts = Math.max(Date.now(), remoteVersion + 1);
        const payload = { data: toWrite, updatedAt: ts, updatedBy: SESSION_ID };
        if(user && user.uid === shopId){
          payload.ownerUid = user.uid;
          payload.ownerEmail = user.email;
        }
        transaction.set(ref, payload, { merge: true });
        finalData = toWrite;
        finalTs = ts;
      });

      // Firestore ডকুমেন্ট লিমিট ~1MB (1048576 bytes)
      const sizeBytes = new Blob([JSON.stringify(finalData)]).size;
      const sizeWarning = sizeBytes > 700000; // 700KB ছাড়ালেই সতর্ক
      // যদি এর মধ্যেই আরও নতুন কোনো ভার্সন (অন্য ডিভাইসের) এসে base এগিয়ে দিয়ে থাকে, তাহলে base পিছনে নামানো হবে না
      const applied = finalTs > baseVersion;
      if(applied) setBase(finalData, finalTs);
      return { ok: true, conflict, merged: (conflict && applied) ? finalData : null, sizeWarning, sizeBytes };
    }catch(e){
      console.warn('Firestore save failed', e);
      return { ok: false, conflict: false, sizeWarning: false, error: e.message };
    }
  },
  watchState(shopId, cb){
    if(!shopId) return null;
    return onSnapshot(stateDocFor(shopId), (snap)=>{
      if(!snap.exists()) return;
      const d = snap.data();
      const v = d.updatedAt || 0;
      if(d.updatedBy === SESSION_ID) return; // এই সেশনের নিজের লেখা — saveState নিজেই base আপডেট করে
      // নিজের লেখার echo বা পুরনো ভার্সন → উপেক্ষা (নইলে চলমান এডিট মুছে যেতে পারে)
      if(baseVersion && v <= baseVersion) return;
      setBase(d.data, v);
      cb(d.data);
    });
  },

  // ===== [নতুন] Invoice নম্বর atomic ভাবে বাড়ানো =====
  // একাধিক ডিভাইস/staff একই সময়ে বিক্রি করলেও Firestore transaction ব্যবহার করে
  // নিশ্চিত করা হচ্ছে যে দুইজন কখনোই একই Invoice নম্বর পাবে না।
  async getNextInvoiceNumber(shopId){
    const ref = stateDocFor(shopId);
    const assignedNumber = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const currentData = snap.exists() ? snap.data().data : null;
      const current = (currentData && typeof currentData.invoiceCounter === 'number') ? currentData.invoiceCounter : 1;
      // শুধু invoiceCounter ফিল্ডটাই আপডেট হবে, বাকি সব ডেটা (products, sales, ইত্যাদি) অক্ষত থাকবে (merge:true)
      transaction.set(ref, { data: { invoiceCounter: current + 1 } }, { merge: true });
      return current;
    });
    return assignedNumber;
  },

  // ===== [ফিক্স #11] Purchase invoice নম্বরও atomic counter দিয়ে (P-0001, P-0002 ...) =====
  async getNextPurchaseNumber(shopId){
    const ref = stateDocFor(shopId);
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const currentData = snap.exists() ? snap.data().data : null;
      const current = (currentData && typeof currentData.purchaseCounter === 'number') ? currentData.purchaseCounter : 1;
      transaction.set(ref, { data: { purchaseCounter: current + 1 } }, { merge: true });
      return current;
    });
  },

  // ===== স্টাফ ইনভাইট (মালিক স্টাফের ইমেইল দিয়ে আমন্ত্রণ পাঠায়, স্টাফ প্রথমবার লগইন করলে লিংক হয়ে যায়) =====
  // ===== নতুন স্টাফের জন্য সরাসরি Firebase account তৈরি (Console লাগবে না) =====
  async createStaffAccount(email){
    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + 'Aa1!';
    const cred = await createUserWithEmailAndPassword(secondaryAuth, normEmail(email), tempPassword);
    const newUid = cred.user.uid;
    try{
      await sendPasswordResetEmail(auth, normEmail(email)); // স্টাফ নিজেই পাসওয়ার্ড সেট করবে
    }catch(e){
      // অ্যাকাউন্ট তৈরি হয়ে গেছে; ইমেইল না গেলেও স্টাফ লগইন পেজের "Forgot Password?" দিয়ে পাসওয়ার্ড সেট করতে পারবে
      console.warn('Password setup email failed', e);
    } finally {
      try{ await signOut(secondaryAuth); }catch(e){} // secondary session সাথে সাথে সাইন-আউট, primary (Admin) session অক্ষত থাকবে
    }
    return newUid;
  },
  async createInvite(email, ownerUid, role, name, phone, address, permissions){
    await setDoc(doc(db, "staffInvites", normEmail(email)), { ownerUid, role, name, phone: phone || '', address: address || '', permissions: permissions || [], createdAt: Date.now() });
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
  async linkStaff(uid, ownerUid, role, name, email, phone, address, permissions){
    await setDoc(doc(db, "staffLinks", uid), { ownerUid, role, name: name || email, email, phone: phone || '', address: address || '', permissions: permissions || [], linkedAt: Date.now() });
  },
  async updateStaffPermissions(uid, role, name, phone, address, permissions){
    await setDoc(doc(db, "staffLinks", uid), { role, name, phone: phone || '', address: address || '', permissions: permissions || [] }, { merge: true });
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
  },

  // ===== সুপার অ্যাডমিনের জন্য এক্সট্রা ফাংশন =====
  async listAllShops(){
    const snapshot = await getDocs(collection(db, "posData"));
    const shops = [];
    snapshot.forEach(doc => {
      const raw = doc.data();
      // শুধুমাত্র সক্রিয় shop রাখুন: data খালি নয় এবং ownerEmail আছে
      if (raw.data && Object.keys(raw.data).length > 0 && raw.ownerEmail) {
        shops.push({
          id: doc.id,
          data: raw.data,
          ownerEmail: raw.ownerEmail,
          ownerUid: raw.ownerUid,
          updatedAt: raw.updatedAt,
          status: raw.status || 'active',
          // ধাপ ২ এর জন্য নতুন ফিল্ড
          planType: raw.planType || 'Free',
          expiryDate: raw.expiryDate || '',
          paymentStatus: raw.paymentStatus || 'Paid'
        });
      }
    });
    
    return shops;
  },
  // [ফিক্স #2.5] সব দোকানের staff সংখ্যা — staffLinks থেকে (posData.users-এ staff থাকে না, তাই আগে সবসময় 0 দেখাত)
  async countStaffForShops(shopIds){
    const counts = {};
    const snap = await getDocs(collection(db, "staffLinks"));
    snap.forEach(d => {
      const o = d.data().ownerUid;
      if(o) counts[o] = (counts[o] || 0) + 1;
    });
    return counts;
  },
  // [ফিক্স #4.2] Plan / Expiry / Payment আপডেট (Super Admin)
  async setShopPlan(shopId, planType, expiryDate, paymentStatus){
    await setDoc(doc(db, "posData", shopId), { planType, expiryDate: expiryDate || '', paymentStatus }, { merge: true });
  },
  // ===== শপ ব্লক/আনব্লক করা (Super Admin) =====
  async setShopStatus(shopId, status){
    await setDoc(doc(db, "posData", shopId), { status }, { merge: true });
  },
  async countInvites(){
    const snapshot = await getDocs(collection(db, "staffInvites"));
    return snapshot.size; // মোট ইনভাইট সংখ্যা
  },
  // ===== [সংশোধিত] দোকান ডিলিট করলে এখন এর সাথে যুক্ত staffLinks ও staffInvites-ও মুছে যাবে =====
  // (adminLogs ইচ্ছাকৃতভাবে রাখা হয়েছে — এটা audit trail হিসেবে থেকে যাওয়া উচিত)
  async deleteShop(shopId){
    try {
      // ১. এই দোকানের সাথে যুক্ত সব staffLinks মুছে ফেলা (orphaned staff link প্রতিরোধ)
      const staffQ = query(collection(db, "staffLinks"), where("ownerUid", "==", shopId));
      const staffSnap = await getDocs(staffQ);
      await Promise.all(staffSnap.docs.map(d => deleteDoc(d.ref)));

      // ২. এই দোকানের pending staffInvites মুছে ফেলা
      const inviteQ = query(collection(db, "staffInvites"), where("ownerUid", "==", shopId));
      const inviteSnap = await getDocs(inviteQ);
      await Promise.all(inviteSnap.docs.map(d => deleteDoc(d.ref)));

      // ৩. দোকানের মূল ডেটা মুছে ফেলা
      await deleteDoc(doc(db, "posData", shopId));
      return true;
    } catch(e) {
      console.error("Delete shop failed", e);
      throw e;
    }
  },

  // ===== সুপার অ্যাডমিনের জন্য: সব ইনভাইট দেখা =====
  async getAllInvites(){
    const snap = await getDocs(collection(db, "staffInvites"));
    const list = [];
    snap.forEach(d => list.push({ email: d.id, ...d.data() }));
    return list;
  },

  // ===== সুপার অ্যাডমিনের জন্য: অ্যাক্টিভিটি লগ করা =====
  async logAdminAction(action, shopId, shopName, details){
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "adminLogs", uid()), {
        action, // e.g. 'Blocked', 'Unblocked', 'Deleted', 'Reset Password'
        shopId,
        shopName,
        details: details || '',
        adminEmail: user ? user.email : 'Unknown',
        timestamp: Date.now()
      });
    } catch(e) { console.warn("Log failed", e); }
  },

  // ===== সুপার অ্যাডমিনের জন্য: অ্যাক্টিভিটি লগ পড়া =====
  async getAdminLogs(){
    const snap = await getDocs(collection(db, "adminLogs"));
    const logs = [];
    snap.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
    return logs.sort((a,b) => b.timestamp - a.timestamp); // নতুন লগ আগে দেখাবে
  },

  // ===== সুপার অ্যাডমিন নোটিফিকেশন সিস্টেম =====
  async createAdminNotification(title, message, type){
    try {
      await setDoc(doc(db, "adminNotifications", uid()), {
        title: title,
        message: message,
        type: type || 'info', // 'warning', 'danger', 'success'
        isRead: false,
        timestamp: Date.now()
      });
    } catch(e) { console.warn("Notification create failed", e); }
  },
  async listAdminNotifications(){
    const snap = await getDocs(collection(db, "adminNotifications"));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list.sort((a,b) => b.timestamp - a.timestamp);
  },
  async markAdminNotificationRead(id){
    try {
      await setDoc(doc(db, "adminNotifications", id), { isRead: true }, { merge: true });
    } catch(e) { console.warn("Notification read failed", e); }
  },

  // ===== Regular Admin Activity Log (ক্যাশিয়ার/স্টাফের অ্যাক্টিভিটি লগ) =====
  async logRegularAction(ownerUid, action, details){
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "adminLogs", uid()), {
        ownerUid: ownerUid, // এই দোকানের মালিক কে
        action: action, // e.g. 'Sale Completed', 'Login', 'Logout'
        details: details || '',
        adminEmail: user ? user.email : 'Unknown',
        timestamp: Date.now()
      });
    } catch(e) { console.warn("Regular log failed", e); }
  }
};

window.dispatchEvent(new Event('firebase-ready'));