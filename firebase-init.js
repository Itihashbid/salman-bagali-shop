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
    return snap.exists() ? snap.data().data : null;
  },
  // ===== [সংশোধিত] এখন true/false রিটার্ন করে, যাতে script.js বুঝতে পারে সেভ সফল হলো কি না =====
  async saveState(shopId, stateObj){
    if(!shopId) return false;
    try{
      const user = auth.currentUser;
      const payload = {
        data: stateObj,
        updatedAt: Date.now()
      };
      if(user && user.uid === shopId){
        payload.ownerUid = user.uid;
        payload.ownerEmail = user.email;
      }
      await setDoc(stateDocFor(shopId), payload, { merge: true });
      return true;
    }catch(e){
      console.warn('Firestore save failed', e);
      return false;
    }
  },
  watchState(shopId, cb){
    if(!shopId) return null;
    return onSnapshot(stateDocFor(shopId), (snap)=>{
      if(snap.exists()) cb(snap.data().data);
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