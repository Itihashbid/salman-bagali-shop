/* ===================== SALMAN BANGALI SHOP POS — APP LOGIC ===================== */

const STORAGE_KEY = 'sara_pos_state_v1';

function todayStr(){
  const d = new Date();
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function nowTime(){
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function fmt(n){
  n = Math.round(n||0);
  return '৳' + n.toLocaleString('en-IN');
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* ===================== PREMIUM DIALOG SYSTEM (replaces alert/confirm/prompt) ===================== */
function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ensureDialogRoot(){
  if(document.getElementById('customDialogRoot')) return;
  const style = document.createElement('style');
  style.textContent = `
  #customDialogRoot{position:fixed;inset:0;background:#28251f6e;display:none;align-items:center;justify-content:center;z-index:999;padding:20px;backdrop-filter:blur(2px)}
  #customDialogRoot.show{display:flex}
  .cd-box{background:var(--card,#fffdf9);border-radius:18px;box-shadow:0 20px 55px #3a30224d;width:380px;max-width:100%;padding:24px 24px 20px;font-family:Inter,Segoe UI,"Noto Sans Bengali",sans-serif;animation:cdPop .16s ease-out}
  @keyframes cdPop{from{transform:translateY(10px) scale(.98);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
  .cd-icon{width:46px;height:46px;border-radius:13px;background:#edf3ef;color:var(--green,#174d42);display:grid;place-items:center;font-size:21px;margin-bottom:14px}
  .cd-icon.warn{background:#fbeceb;color:var(--red,#b34d45)}
  .cd-title{font-size:16px;font-weight:800;margin-bottom:6px;color:var(--ink,#292823)}
  .cd-msg{font-size:13.5px;color:var(--ink,#292823);line-height:1.6;margin-bottom:16px;white-space:pre-line}
  .cd-input{width:100%;padding:12px 13px;border:1.5px solid var(--line,#e7e1d6);border-radius:10px;background:#fff;font-size:14.5px;margin-bottom:18px;outline:none;font-family:inherit}
  .cd-input:focus{border-color:var(--green,#174d42)}
  .cd-hint{font-size:11px;color:var(--muted,#8b877e);margin:-13px 0 16px}
  .cd-btns{display:flex;gap:8px}
  .cd-btns button{flex:1;border:0;border-radius:11px;padding:12px;font-size:13.5px;cursor:pointer;font-weight:700;font-family:inherit;transition:transform .05s}
  .cd-btns button:active{transform:scale(.97)}
  .cd-btn-primary{background:var(--green,#174d42);color:#fff}
  .cd-btn-danger{background:var(--red,#b34d45);color:#fff}
  .cd-btn-soft{background:#eee9df;color:var(--ink,#292823)}
  `;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'customDialogRoot';
  root.innerHTML = `<div class="cd-box" id="cdBox"></div>`;
  document.body.appendChild(root);
}
function showAlertDialog(message, opts={}){
  ensureDialogRoot();
  return new Promise(resolve=>{
    const root = document.getElementById('customDialogRoot');
    const box = document.getElementById('cdBox');
    box.innerHTML = `
      <div class="cd-icon">${opts.icon||'ℹ️'}</div>
      ${opts.title?`<div class="cd-title">${escapeHtml(opts.title)}</div>`:''}
      <div class="cd-msg">${escapeHtml(message)}</div>
      <div class="cd-btns"><button class="cd-btn-primary" id="cdOk">${opts.okLabel||'ঠিক আছে'}</button></div>
    `;
    root.classList.add('show');
    const finish = ()=>{ root.classList.remove('show'); root.onclick=null; document.removeEventListener('keydown', onKey); resolve(); };
    document.getElementById('cdOk').onclick = finish;
    root.onclick = (e)=>{ if(e.target===root) finish(); };
    function onKey(e){ if(e.key==='Enter'||e.key==='Escape') finish(); }
    document.addEventListener('keydown', onKey);
    setTimeout(()=>document.getElementById('cdOk')?.focus(), 30);
  });
}
function showConfirmDialog(message, opts={}){
  ensureDialogRoot();
  return new Promise(resolve=>{
    const root = document.getElementById('customDialogRoot');
    const box = document.getElementById('cdBox');
    const danger = !!opts.danger;
    box.innerHTML = `
      <div class="cd-icon ${danger?'warn':''}">${opts.icon || (danger?'⚠️':'❓')}</div>
      ${opts.title?`<div class="cd-title">${escapeHtml(opts.title)}</div>`:''}
      <div class="cd-msg">${escapeHtml(message)}</div>
      <div class="cd-btns"><button class="cd-btn-soft" id="cdCancel">${opts.cancelLabel||'বাতিল'}</button><button class="${danger?'cd-btn-danger':'cd-btn-primary'}" id="cdOk">${opts.okLabel||'হ্যাঁ'}</button></div>
    `;
    root.classList.add('show');
    const finish = (val)=>{ root.classList.remove('show'); root.onclick=null; document.removeEventListener('keydown', onKey); resolve(val); };
    document.getElementById('cdOk').onclick = ()=>finish(true);
    document.getElementById('cdCancel').onclick = ()=>finish(false);
    root.onclick = (e)=>{ if(e.target===root) finish(false); };
    function onKey(e){ if(e.key==='Escape') finish(false); if(e.key==='Enter') finish(true); }
    document.addEventListener('keydown', onKey);
    setTimeout(()=>document.getElementById('cdOk')?.focus(), 30);
  });
}
function showPromptDialog(message, defaultValue='', opts={}){
  ensureDialogRoot();
  return new Promise(resolve=>{
    const root = document.getElementById('customDialogRoot');
    const box = document.getElementById('cdBox');
    box.innerHTML = `
      <div class="cd-icon">${opts.icon||'✏️'}</div>
      ${opts.title?`<div class="cd-title">${escapeHtml(opts.title)}</div>`:''}
      <div class="cd-msg">${escapeHtml(message)}</div>
      <input type="${opts.type||'text'}" class="cd-input" id="cdInput" value="${escapeHtml(defaultValue)}" ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.max!==undefined?`max="${opts.max}"`:''}>
      ${opts.hint?`<div class="cd-hint">${escapeHtml(opts.hint)}</div>`:''}
      <div class="cd-btns"><button class="cd-btn-soft" id="cdCancel">বাতিল</button><button class="cd-btn-primary" id="cdOk">${opts.okLabel||'নিশ্চিত করুন'}</button></div>
    `;
    root.classList.add('show');
    const input = document.getElementById('cdInput');
    setTimeout(()=>{ input.focus(); input.select(); }, 30);
    const finish = (val)=>{ root.classList.remove('show'); root.onclick=null; document.removeEventListener('keydown', onKey); resolve(val); };
    document.getElementById('cdOk').onclick = ()=>finish(input.value);
    document.getElementById('cdCancel').onclick = ()=>finish(null);
    root.onclick = (e)=>{ if(e.target===root) finish(null); };
    function onKey(e){ if(e.key==='Enter') finish(input.value); if(e.key==='Escape') finish(null); }
    document.addEventListener('keydown', onKey);
  });
}

function defaultState(){
  const products = [
    {id:uid(), emoji:'🍚', name:'Miniket Rice 5kg', sku:'RC-5001', purchase:320, sell:350, stock:24},
    {id:uid(), emoji:'🧴', name:'Soybean Oil 2L',   sku:'OL-2002', purchase:165, sell:180, stock:18},
    {id:uid(), emoji:'🧼', name:'Lux Soap',          sku:'SP-0065', purchase:55,  sell:65,  stock:12},
    {id:uid(), emoji:'🍪', name:'Family Biscuit',    sku:'BS-0080', purchase:65,  sell:80,  stock:31},
    {id:uid(), emoji:'🥤', name:'Coca Cola 1L',      sku:'CC-0120', purchase:100, sell:120, stock:20},
    {id:uid(), emoji:'🧴', name:'Shampoo',           sku:'SH-0250', purchase:210, sell:250, stock:9},
  ];
  return {
    invoiceCounter: 1026,
    products,
    customers: [
      {id:uid(), name:'Rahim Uddin', mobile:'01712345678', totalPurchase:18450, due:1250, lastPurchase:'Today'},
      {id:uid(), name:'Karim Mia',   mobile:'01819345678', totalPurchase:12200, due:950,  lastPurchase:'Today'},
      {id:uid(), name:'Nila Begum',  mobile:'01911345678', totalPurchase:9880,  due:1000, lastPurchase:'Yesterday'},
    ],
    ledger: [
      {date:todayStr(), customer:'Rahim Uddin', invoice:'#1025', debit:1450, credit:1000, balance:1250},
      {date:todayStr(), customer:'Karim Mia',   invoice:'#1019', debit:950,  credit:0,    balance:950},
      {date:todayStr(), customer:'Nila Begum',  invoice:'#1023', debit:1000, credit:0,    balance:1000},
    ],
    cash: [
      {time: nowTime(), desc:'Opening Cash', type:'in', amount:5000},
      {time: nowTime(), desc:'Sale #1025', type:'in', amount:1450},
      {time: nowTime(), desc:'Transport', type:'out', amount:500},
      {time: nowTime(), desc:'Due Collection · Rahim', type:'in', amount:1000},
    ],
    purchases: [
      {id:uid(), date:'28 Aug', supplier:'ABC Traders', invoice:'P-3021', productId:products[0].id, productName:products[0].name, items:12, total:18500, status:'Received'},
      {id:uid(), date:'26 Aug', supplier:'Rahman Enterprise', invoice:'P-3018', productId:products[1].id, productName:products[1].name, items:8, total:9200, status:'Received'},
    ],
    returns: [],
    purchaseReturns: [],
    sales: [
      {invoice:'#1025', customer:'Rahim Uddin', time:'8:42 PM', date:todayStr(), items:[{name:'Miniket Rice 5kg',price:350,qty:2},{name:'Lux Soap',price:65,qty:2}], total:1450, payment:'Due'},
      {invoice:'#1024', customer:'Walk-in Customer', time:'8:18 PM', date:todayStr(), items:[{name:'Coca Cola 1L',price:120,qty:1},{name:'Family Biscuit',price:80,qty:1}], total:820, payment:'Cash'},
      {invoice:'#1023', customer:'Nila Begum', time:'7:55 PM', date:todayStr(), items:[{name:'Shampoo',price:250,qty:2},{name:'Soybean Oil 2L',price:180,qty:1},{name:'Lux Soap',price:65,qty:2}], total:2180, payment:'Due'},
    ],
    users: [
      {id:uid(), name:'Admin User', role:'Admin'},
      {id:uid(), name:'Store Cashier', role:'Cashier'},
    ],
    settings: {storeName:'SALMAN BANGALI SHOP', phone:'017XXXXXXXX', address:'Your shop address', receiptSize:'80mm Thermal', vatPercent:0},
  };
}

let state = defaultState(); // placeholder — real data loads from Firestore after login
let unsubscribeState = null;
let isRemoteUpdate = false;
function save(){
  if(isRemoteUpdate) return; // avoid re-saving data we just received from Firestore
  if(window.Firebase) window.Firebase.saveState(state);
}
async function resetDemoData(){
  const ok = await showConfirmDialog('সব ডেটা মুছে ডেমো ডেটা দিয়ে আবার শুরু করতে চাও?', {danger:true, icon:'⚠️', okLabel:'হ্যাঁ, রিসেট করো', title:'ডেমো ডেটা রিসেট'});
  if(!ok) return;
  state = defaultState();
  save();
  renderAll();
}

/* ===================== NAVIGATION ===================== */
let cart = [];

function show(id, el){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.mobile button').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active');
  else {
    document.querySelectorAll('nav button, .mobile button').forEach(b=>{
      if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${id}'`)) b.classList.add('active');
    });
  }
  const titles = {dashboard:'Good Evening 👋', pos:'New Sale · POS Billing', products:'Products & Inventory', customers:'Customers', ledger:'Due / Customer Ledger', cash:'Daily Cash Flow', purchases:'Purchases / Stock In', returns:'Sales Return / Exchange', reports:'Reports', settings:'Settings'};
  document.getElementById('pageTitle').textContent = titles[id] || id;
  if(id==='dashboard') renderDashboard();
  if(id==='pos') resetPOSExtras();
  window.scrollTo(0,0);
}
function resetPOSExtras(){
  const dv = document.getElementById('discountValue');
  const dt = document.getElementById('discountType');
  const vp = document.getElementById('vatPercent');
  const pc = document.getElementById('payCash');
  const pb = document.getElementById('payBkash');
  if(dv) dv.value = 0;
  if(dt) dt.value = 'amount';
  if(vp) vp.value = state.settings.vatPercent || 0;
  if(pc) pc.value = 0;
  if(pb) pb.value = 0;
  renderCart();
}

/* ===================== GENERIC MODAL FORM ===================== */
let _modalSubmitFn = null;

function openFormModal(title, fields, onSubmit){
  document.getElementById('formModalTitle').textContent = title;
  const box = document.getElementById('formModalFields');
  box.innerHTML = fields.map(f=>{
    if(f.type==='select'){
      const opts = f.options.map(o=>`<option value="${o.value}" ${o.value===f.value?'selected':''}>${o.label}</option>`).join('');
      return `<div class="field"><label>${f.label}</label><select id="fm_${f.id}">${opts}</select></div>`;
    }
    return `<div class="field"><label>${f.label}</label><input id="fm_${f.id}" type="${f.type||'text'}" value="${f.value!==undefined?f.value:''}" placeholder="${f.placeholder||''}"></div>`;
  }).join('');
  _modalSubmitFn = onSubmit;
  document.getElementById('formModal').classList.add('show');
}
function closeFormModal(){
  document.getElementById('formModal').classList.remove('show');
  _modalSubmitFn = null;
}
function submitFormModal(){
  if(!_modalSubmitFn) return;
  const inputs = document.querySelectorAll('#formModalFields [id^="fm_"]');
  const values = {};
  inputs.forEach(inp=>{ values[inp.id.replace('fm_','')] = inp.value; });
  const ok = _modalSubmitFn(values);
  if(ok !== false){ closeFormModal(); }
}

/* ===================== DASHBOARD ===================== */
function renderDashboard(){
  const today = todayStr();
  const todaySales = state.sales.filter(s=>s.date===today).reduce((a,s)=>a+s.total,0);
  const todayDueAdded = state.ledger.filter(l=>l.date===today).reduce((a,l)=>a+(l.debit||0),0);
  const todayExpense = state.cash.filter(c=>c.type==='out').reduce((a,c)=>a+c.amount,0);
  const cashIn = state.cash.filter(c=>c.type==='in').reduce((a,c)=>a+c.amount,0);
  const cashOut = state.cash.filter(c=>c.type==='out').reduce((a,c)=>a+c.amount,0);
  const cashBalance = cashIn - cashOut;
  const dueCustomers = state.customers.filter(c=>c.due>0);

  setText('statTodaySales', fmt(todaySales));
  setText('statTodayDue', fmt(todayDueAdded));
  setText('statTodayDueSub', dueCustomers.length + ' customers');
  setText('statTodayExpense', fmt(todayExpense));
  setText('statTodayExpenseSub', state.cash.filter(c=>c.type==='out').length + ' transactions');
  setText('statCashBalance', fmt(cashBalance));

  const lowStock = [...state.products].filter(p=>p.stock<=8).sort((a,b)=>a.stock-b.stock).slice(0,5);
  document.getElementById('lowStockRows').innerHTML = lowStock.length ? lowStock.map(p=>
    `<div class="row"><div class="rowleft"><div class="ico">${p.emoji}</div><div><b>${p.name}</b><div class="sub">Only ${p.stock} pcs</div></div></div><span class="danger">${p.stock}</span></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">কোনো লো-স্টক প্রোডাক্ট নেই</div>`;

  const recent = [...state.sales].slice(-3).reverse();
  document.getElementById('recentSalesRows').innerHTML = recent.length ? recent.map(s=>
    `<div class="row"><div><b>${s.invoice} · ${s.customer}</b><div class="sub">${s.time} · ${s.items.reduce((a,i)=>a+i.qty,0)} items</div></div><b>${fmt(s.total)}</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">এখনো কোনো বিক্রি হয়নি</div>`;

  const dueList = [...dueCustomers].sort((a,b)=>b.due-a.due).slice(0,5);
  document.getElementById('dueCustomersRows').innerHTML = dueList.length ? dueList.map(c=>
    `<div class="row"><b>${c.name}</b><b class="danger">${fmt(c.due)}</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">কোনো বাকি নেই</div>`;
}
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }

/* ===================== POS ===================== */
function renderPOSGrid(){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = state.products.map(p=>
    `<button class="product" data-id="${p.id}" data-name="${p.name}" data-sku="${p.sku}" onclick="addToCart('${p.id}')">
      <span class="emoji">${p.emoji}</span><b>${p.name}</b><small>${fmt(p.sell)} · Stock ${p.stock}</small>
    </button>`
  ).join('');
}
function renderPOSCustomers(){
  const sel = document.getElementById('posCustomer');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option>Walk-in Customer</option>' + state.customers.map(c=>`<option>${c.name}</option>`).join('');
  if([...sel.options].some(o=>o.value===current)) sel.value = current;
}
function addToCart(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  if(p.stock<=0){ showAlertDialog('স্টক শেষ: ' + p.name, {icon:'📦'}); return; }
  let x = cart.find(i=>i.id===id);
  if(x){
    if(x.qty>=p.stock){ showAlertDialog('স্টকে যতটুকু আছে তার বেশি যোগ করা যাবে না।', {icon:'📦'}); return; }
    x.qty++;
  } else cart.push({id:p.id, name:p.name, price:p.sell, qty:1, emoji:p.emoji});
  renderCart();
}
function computeTotals(){
  const subtotal = cart.reduce((a,x)=>a+x.price*x.qty,0);
  const discType = (document.getElementById('discountType')||{}).value || 'amount';
  let discVal = +((document.getElementById('discountValue')||{}).value) || 0;
  if(discVal<0) discVal = 0;
  let discountAmt = discType==='percent' ? subtotal*discVal/100 : discVal;
  discountAmt = Math.max(0, Math.min(discountAmt, subtotal));
  const afterDiscount = subtotal - discountAmt;
  let vatPercent = +((document.getElementById('vatPercent')||{}).value) || 0;
  if(vatPercent<0) vatPercent = 0;
  const vatAmt = afterDiscount * vatPercent / 100;
  const total = afterDiscount + vatAmt;
  return {subtotal, discountAmt, vatPercent, vatAmt, total};
}
function getPaymentSplit(total){
  let cashAmt = +((document.getElementById('payCash')||{}).value) || 0;
  let bkashAmt = +((document.getElementById('payBkash')||{}).value) || 0;
  if(cashAmt<0) cashAmt = 0;
  if(bkashAmt<0) bkashAmt = 0;
  const paid = cashAmt + bkashAmt;
  const due = Math.max(0, total - paid);
  const overpaid = Math.max(0, paid - total);
  return {cashAmt, bkashAmt, paid, due, overpaid};
}
function renderCart(){
  const box = document.getElementById('cart');
  if(!cart.length){
    box.innerHTML = '<div class="sub" style="padding:25px 0;text-align:center">Cart is empty<br>Product select করুন</div>';
  } else {
    box.innerHTML = cart.map((x,i)=>`<div class="cartline"><div><b>${x.emoji} ${x.name}</b><div class="sub">${fmt(x.price)} × ${x.qty}</div></div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${i},1)">+</button></div><b>${fmt(x.price*x.qty)}</b></div>`).join('');
  }
  const t = computeTotals();
  setText('subtotal', fmt(t.subtotal));
  setText('discountShow', '− ' + fmt(t.discountAmt));
  setText('vatPercentShow', t.vatPercent);
  setText('vatShow', fmt(t.vatAmt));
  setText('total', fmt(t.total));
  const p = getPaymentSplit(t.total);
  setText('paidShow', fmt(p.paid));
  const dueEl = document.getElementById('dueShow');
  if(dueEl){
    if(p.overpaid>0){ dueEl.textContent = 'বেশি: ' + fmt(p.overpaid); }
    else { dueEl.textContent = fmt(p.due); }
  }
}
function quickPay(mode){
  const t = computeTotals();
  const pc = document.getElementById('payCash');
  const pb = document.getElementById('payBkash');
  if(mode==='cash'){ pc.value = t.total; pb.value = 0; }
  else if(mode==='bkash'){ pc.value = 0; pb.value = t.total; }
  else if(mode==='due'){ pc.value = 0; pb.value = 0; }
  renderCart();
}
function changeQty(i,d){
  const p = state.products.find(x=>x.id===cart[i].id);
  if(d>0 && p && cart[i].qty>=p.stock){ showAlertDialog('স্টকে যতটুকু আছে তার বেশি যোগ করা যাবে না।', {icon:'📦'}); return; }
  cart[i].qty += d;
  if(cart[i].qty<=0) cart.splice(i,1);
  renderCart();
}
function filterProducts(){
  const q = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('#productGrid .product').forEach(x=>{
    const match = x.dataset.name.toLowerCase().includes(q) || (x.dataset.sku||'').toLowerCase().includes(q);
    x.style.display = match ? 'block' : 'none';
  });
}
function handleScanEnter(e){
  if(e.key !== 'Enter') return;
  e.preventDefault();
  const box = document.getElementById('search');
  const code = box.value.trim();
  if(!code) return;
  const p = state.products.find(x=>x.sku.toLowerCase() === code.toLowerCase());
  if(p){
    addToCart(p.id);
    box.value = '';
    filterProducts();
  } else {
    showAlertDialog('এই বারকোড/SKU-এর কোনো প্রোডাক্ট পাওয়া যায়নি: ' + code, {icon:'🔍'});
  }
}
function openReceipt(){
  if(!cart.length){ showAlertDialog('আগে একটি product cart-এ যোগ করুন।', {icon:'🛒'}); return; }
  const customer = document.getElementById('posCustomer').value || 'Walk-in Customer';
  const t = computeTotals(); // {subtotal, discountAmt, vatPercent, vatAmt, total}
  const p = getPaymentSplit(t.total); // {cashAmt, bkashAmt, paid, due, overpaid}
  if(p.overpaid>0){ showAlertDialog('পরিশোধিত পরিমাণ বিলের চেয়ে বেশি হয়ে গেছে। Cash/bKash এমাউন্ট ঠিক করুন।', {icon:'৳'}); return; }
  const invoice = '#' + (state.invoiceCounter++);

  // reduce stock
  cart.forEach(item=>{
    const prod = state.products.find(x=>x.id===item.id);
    if(prod) prod.stock = Math.max(0, prod.stock - item.qty);
  });

  let paymentLabel = 'Due';
  if(p.cashAmt>0 && p.bkashAmt>0) paymentLabel = 'Split (Cash+bKash)';
  else if(p.cashAmt>0 && p.due>0) paymentLabel = 'Split (Cash+Due)';
  else if(p.bkashAmt>0 && p.due>0) paymentLabel = 'Split (bKash+Due)';
  else if(p.cashAmt>0) paymentLabel = 'Cash';
  else if(p.bkashAmt>0) paymentLabel = 'bKash';

  const saleRecord = {
    invoice, customer, time: nowTime(), date: todayStr(),
    items: cart.map(c=>({name:c.name, price:c.price, qty:c.qty})),
    subtotal: t.subtotal, discount: t.discountAmt, vatPercent: t.vatPercent, vat: t.vatAmt,
    total: t.total, paidCash: p.cashAmt, paidBkash: p.bkashAmt, due: p.due, payment: paymentLabel
  };
  state.sales.push(saleRecord);

  if(customer !== 'Walk-in Customer'){
    let cust = state.customers.find(c=>c.name===customer);
    if(!cust){ cust = {id:uid(), name:customer, mobile:'-', totalPurchase:0, due:0, lastPurchase:'Today'}; state.customers.push(cust); }
    cust.totalPurchase += t.total;
    cust.due += p.due;
    cust.lastPurchase = 'Today';
  }
  if(p.due>0){
    const bal = customer!=='Walk-in Customer' ? (state.customers.find(c=>c.name===customer)||{due:p.due}).due : p.due;
    state.ledger.push({date: todayStr(), customer, invoice, debit:t.total, credit:0, balance:bal});
  }
  if(p.cashAmt>0){
    state.cash.push({time: nowTime(), desc:'Sale '+invoice+' (Cash)', type:'in', amount:p.cashAmt});
  }
  if(p.bkashAmt>0){
    state.cash.push({time: nowTime(), desc:'Sale '+invoice+' (bKash)', type:'in', amount:p.bkashAmt});
  }
  save();

  document.getElementById('receiptItems').innerHTML = cart.map(x=>`<div class="rline"><span>${x.name} ×${x.qty}</span><span>${fmt(x.price*x.qty)}</span></div>`).join('');
  const metaEl = document.getElementById('receiptMeta');
  if(metaEl) metaEl.innerHTML = `Invoice: ${invoice}<br>Date: ${todayStr()} ${nowTime()}<br>Customer: ${customer}`;
  setText('rsub', fmt(t.subtotal));
  setText('rdiscount', t.discountAmt>0 ? ('− ' + fmt(t.discountAmt)) : fmt(0));
  setText('rvatLabel', `VAT (${t.vatPercent}%)`);
  setText('rvat', fmt(t.vatAmt));
  setText('rtotal', fmt(t.total));
  const breakdownParts = [];
  if(p.cashAmt>0) breakdownParts.push(`<div class="rline"><span>Paid (Cash)</span><span>${fmt(p.cashAmt)}</span></div>`);
  if(p.bkashAmt>0) breakdownParts.push(`<div class="rline"><span>Paid (bKash)</span><span>${fmt(p.bkashAmt)}</span></div>`);
  if(!p.cashAmt && !p.bkashAmt) breakdownParts.push(`<div class="rline"><span>Paid</span><span>${fmt(0)}</span></div>`);
  document.getElementById('rpaidBreakdown').innerHTML = breakdownParts.join('');
  setText('rdue', fmt(p.due));
  document.getElementById('receiptModal').classList.add('show');

  cart = [];
  renderCart();
  resetPOSExtras();
  renderPOSGrid();
  renderPOSCustomers();
  renderProductsTable();
  renderCustomersTable();
  renderLedgerTable();
  renderCashTable();
  renderDashboard();
}
function closeReceipt(){ document.getElementById('receiptModal').classList.remove('show'); }

/* ===================== PRODUCTS & STOCK ===================== */
function renderProductsTable(){
  const body = document.getElementById('productsTableBody');
  if(!body) return;
  body.innerHTML = state.products.map(p=>{
    const statusHtml = p.stock<=8 ? `<span class="danger">Low stock</span>` : `<span class="pill">In stock</span>`;
    return `<tr>
      <td>${p.emoji} ${p.name}</td><td>${p.sku}</td><td>${fmt(p.purchase)}</td><td>${fmt(p.sell)}</td><td>${p.stock}</td><td>${statusHtml}</td>
      <td style="white-space:nowrap"><button class="link" onclick="openEditProduct('${p.id}')">Edit</button> <button class="link" onclick="printBarcodeLabel('${p.id}')">🏷️ Label</button> <button class="link danger" onclick="deleteProduct('${p.id}')">Delete</button></td>
    </tr>`;
  }).join('');
}
function filterProductsTable(){
  const q = document.getElementById('productSearch').value.toLowerCase();
  document.querySelectorAll('#productsTableBody tr').forEach(tr=>{
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function openAddProduct(){
  openFormModal('নতুন প্রোডাক্ট যোগ করুন', [
    {id:'emoji', label:'Emoji/Icon', value:'📦'},
    {id:'name', label:'Product Name', value:''},
    {id:'sku', label:'SKU / Barcode', value:''},
    {id:'purchase', label:'Purchase Price', type:'number', value:0},
    {id:'sell', label:'Sell Price', type:'number', value:0},
    {id:'stock', label:'Opening Stock', type:'number', value:0},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('প্রোডাক্টের নাম দিন।'); return false; }
    state.products.push({id:uid(), emoji:v.emoji||'📦', name:v.name, sku:v.sku||('SKU-'+Math.floor(Math.random()*9000+1000)), purchase:+v.purchase||0, sell:+v.sell||0, stock:+v.stock||0});
    save(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  });
}
function openEditProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  openFormModal('প্রোডাক্ট এডিট করুন', [
    {id:'emoji', label:'Emoji/Icon', value:p.emoji},
    {id:'name', label:'Product Name', value:p.name},
    {id:'sku', label:'SKU / Barcode', value:p.sku},
    {id:'purchase', label:'Purchase Price', type:'number', value:p.purchase},
    {id:'sell', label:'Sell Price', type:'number', value:p.sell},
    {id:'stock', label:'Stock', type:'number', value:p.stock},
  ], (v)=>{
    p.emoji=v.emoji; p.name=v.name; p.sku=v.sku; p.purchase=+v.purchase||0; p.sell=+v.sell||0; p.stock=+v.stock||0;
    save(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  });
}
async function deleteProduct(id){
  const ok = await showConfirmDialog('এই প্রোডাক্টটি ডিলিট করতে চাও?', {danger:true, title:'প্রোডাক্ট ডিলিট'});
  if(!ok) return;
  state.products = state.products.filter(x=>x.id!==id);
  save(); renderProductsTable(); renderPOSGrid(); renderDashboard();
}

/* ===================== CUSTOMERS ===================== */
function renderCustomersTable(){
  const body = document.getElementById('customersTableBody');
  if(!body) return;
  body.innerHTML = state.customers.map(c=>`<tr>
    <td>${c.name}</td><td>${c.mobile}</td><td>${fmt(c.totalPurchase)}</td><td class="danger">${fmt(c.due)}</td><td>${c.lastPurchase}</td>
    <td><button class="link danger" onclick="deleteCustomer('${c.id}')">Delete</button></td>
  </tr>`).join('');
}
function openAddCustomer(){
  openFormModal('নতুন কাস্টমার যোগ করুন', [
    {id:'name', label:'Customer Name', value:''},
    {id:'mobile', label:'Mobile Number', value:''},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('নাম দিন।'); return false; }
    state.customers.push({id:uid(), name:v.name, mobile:v.mobile||'-', totalPurchase:0, due:0, lastPurchase:'-'});
    save(); renderCustomersTable(); renderPOSCustomers(); renderDashboard();
  });
}
async function deleteCustomer(id){
  const ok = await showConfirmDialog('এই কাস্টমারকে ডিলিট করতে চাও?', {danger:true, title:'কাস্টমার ডিলিট'});
  if(!ok) return;
  state.customers = state.customers.filter(x=>x.id!==id);
  save(); renderCustomersTable(); renderPOSCustomers(); renderDashboard();
}

/* ===================== LEDGER / DUE ===================== */
function renderLedgerTable(){
  const body = document.getElementById('ledgerTableBody');
  if(!body) return;
  body.innerHTML = state.ledger.map(l=>`<tr>
    <td>${l.date}</td><td>${l.customer}</td><td>${l.invoice}</td><td>${l.debit?fmt(l.debit):'—'}</td><td>${l.credit?fmt(l.credit):'—'}</td><td class="danger">${fmt(l.balance)}</td>
  </tr>`).join('');
  const total = state.customers.reduce((a,c)=>a+c.due,0);
  setText('totalOutstanding', fmt(total));
  setText('outstandingCount', 'Across ' + state.customers.filter(c=>c.due>0).length + ' customers');
}
function openReceivePayment(){
  const dueCustomers = state.customers.filter(c=>c.due>0);
  if(!dueCustomers.length){ showAlertDialog('বর্তমানে কোনো কাস্টমারের বাকি নেই।', {icon:'👥'}); return; }
  openFormModal('পেমেন্ট গ্রহণ করুন', [
    {id:'customer', label:'Customer', type:'select', options: dueCustomers.map(c=>({value:c.name, label:`${c.name} (Due: ${fmt(c.due)})`})), value:dueCustomers[0].name},
    {id:'amount', label:'Amount Received', type:'number', value:0},
  ], (v)=>{
    const cust = state.customers.find(c=>c.name===v.customer);
    const amt = +v.amount || 0;
    if(amt<=0){ showAlertDialog('সঠিক পরিমাণ দিন।'); return false; }
    if(!cust) return false;
    cust.due = Math.max(0, cust.due - amt);
    state.ledger.push({date: todayStr(), customer: cust.name, invoice:'Payment', debit:0, credit:amt, balance:cust.due});
    state.cash.push({time: nowTime(), desc:'Due Collection · '+cust.name, type:'in', amount:amt});
    save(); renderLedgerTable(); renderCustomersTable(); renderCashTable(); renderDashboard();
  });
}

/* ===================== CASH FLOW ===================== */
function renderCashTable(){
  const body = document.getElementById('cashTableBody');
  if(!body) return;
  const opening = state.cash.filter(c=>c.desc==='Opening Cash').reduce((a,c)=>a+c.amount,0);
  const cashIn = state.cash.filter(c=>c.type==='in' && c.desc!=='Opening Cash').reduce((a,c)=>a+c.amount,0);
  const cashOut = state.cash.filter(c=>c.type==='out').reduce((a,c)=>a+c.amount,0);
  setText('statOpeningCash', fmt(opening));
  setText('statCashIn', fmt(cashIn));
  setText('statCashOut', fmt(cashOut));
  setText('statClosingCash', fmt(opening+cashIn-cashOut));
  body.innerHTML = state.cash.slice().reverse().map(c=>`<tr>
    <td>${c.time}</td><td>${c.desc}</td><td>${c.type==='in'?'Cash In':'Expense'}</td><td class="${c.type==='out'?'danger':''}">${c.type==='in'?'+':'−'}${fmt(c.amount)}</td>
  </tr>`).join('');
}
function openAddExpense(){
  openFormModal('নতুন খরচ যোগ করুন', [
    {id:'desc', label:'Description', value:''},
    {id:'amount', label:'Amount', type:'number', value:0},
  ], (v)=>{
    const amt = +v.amount || 0;
    if(!v.desc.trim() || amt<=0){ showAlertDialog('বিবরণ ও সঠিক পরিমাণ দিন।'); return false; }
    state.cash.push({time: nowTime(), desc:v.desc, type:'out', amount:amt});
    save(); renderCashTable(); renderDashboard();
  });
}

/* ===================== PURCHASES ===================== */
function renderPurchasesTable(){
  const body = document.getElementById('purchasesTableBody');
  if(!body) return;
  body.innerHTML = state.purchases.slice().reverse().map(p=>`<tr>
    <td>${p.date}</td><td>${p.supplier}</td><td>${p.invoice}</td><td>${p.items}</td><td>${fmt(p.total)}</td><td><span class="pill">${p.status}</span></td>
    <td>${p.id && p.items>0 ? `<button class="link danger" onclick="processPurchaseReturn('${p.id}')">↩ Return</button>` : '—'}</td>
  </tr>`).join('');
}
function openNewPurchase(){
  if(!state.products.length){ showAlertDialog('আগে অন্তত একটি প্রোডাক্ট যোগ করুন।', {icon:'📦'}); return; }
  openFormModal('নতুন পারচেজ / স্টক ইন', [
    {id:'supplier', label:'Supplier Name', value:''},
    {id:'invoice', label:'Purchase Invoice No', value:'P-' + Math.floor(Math.random()*9000+1000)},
    {id:'product', label:'Product', type:'select', options: state.products.map(p=>({value:p.id, label:p.name})), value:state.products[0].id},
    {id:'qty', label:'Quantity', type:'number', value:1},
  ], (v)=>{
    const p = state.products.find(x=>x.id===v.product);
    const qty = +v.qty || 0;
    if(!v.supplier.trim() || qty<=0 || !p){ showAlertDialog('সব ফিল্ড সঠিকভাবে পূরণ করুন।'); return false; }
    const total = qty * p.purchase;
    p.stock += qty;
    state.purchases.push({id:uid(), date: todayStr(), supplier:v.supplier, invoice:v.invoice, productId:p.id, productName:p.name, items:qty, total, status:'Received'});
    save(); renderPurchasesTable(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  });
}

function renderPurchaseReturnsTable(){
  const body = document.getElementById('purchaseReturnsTableBody');
  if(!body) return;
  body.innerHTML = state.purchaseReturns.length ? state.purchaseReturns.slice().reverse().map(r=>`<tr>
    <td>${r.date}</td><td>${r.purchaseInvoice}</td><td>${r.supplier}</td><td>${r.product}</td><td>${r.qty}</td><td>${fmt(r.amount)}</td>
  </tr>`).join('') : `<tr><td colspan="6" class="sub" style="text-align:center;padding:20px 0">এখনো কোনো পারচেজ রিটার্ন হয়নি</td></tr>`;
}
async function processPurchaseReturn(id){
  const pur = state.purchases.find(x=>x.id===id);
  if(!pur) return;
  const product = state.products.find(x=>x.id===pur.productId);
  const maxQty = product ? Math.min(pur.items, product.stock) : pur.items;
  if(maxQty<=0){ showAlertDialog('স্টকে পর্যাপ্ত পরিমাণ নেই, তাই রিটার্ন করা যাচ্ছে না।', {icon:'📦'}); return; }
  const qtyStr = await showPromptDialog(`"${pur.productName}" সাপ্লায়ারকে ফেরত দিতে চাও?`, maxQty, {icon:'↩️', title:'পারচেজ রিটার্ন', type:'number', min:0, max:maxQty, hint:`সর্বোচ্চ ${maxQty} পিস ফেরত দেওয়া যাবে`, okLabel:'রিটার্ন নিশ্চিত করো'});
  if(qtyStr===null) return;
  const qty = Math.min(maxQty, Math.max(0, parseInt(qtyStr)||0));
  if(qty<=0) return;
  const unitPrice = pur.items ? pur.total/pur.items : (product ? product.purchase : 0);
  const amount = Math.round(qty*unitPrice);
  if(product) product.stock = Math.max(0, product.stock - qty);
  state.purchaseReturns.push({date: todayStr(), purchaseInvoice:pur.invoice, supplier:pur.supplier, product:pur.productName, qty, amount});
  pur.items -= qty;
  pur.total -= amount;
  if(pur.items<=0) pur.status = 'Returned';
  save();
  renderPurchasesTable(); renderPurchaseReturnsTable(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  showAlertDialog('পারচেজ রিটার্ন সম্পন্ন হয়েছে। স্টক থেকে বাদ দেওয়া হয়েছে।', {icon:'✅'});
}

/* ===================== SALES RETURN ===================== */
function renderReturnsTable(){
  const body = document.getElementById('returnsTableBody');
  if(!body) return;
  body.innerHTML = state.returns.length ? state.returns.slice().reverse().map(r=>`<tr>
    <td>${r.date}</td><td>${r.invoice}</td><td>${r.product}</td><td>${r.qty}</td><td>${fmt(r.amount)}</td>
  </tr>`).join('') : `<tr><td colspan="5" class="sub" style="text-align:center;padding:20px 0">এখনো কোনো রিটার্ন হয়নি</td></tr>`;
}
function focusReturnSearch(){
  const el = document.getElementById('returnInvoiceSearch');
  if(el) el.focus();
}
function searchReturnInvoice(){
  const q = document.getElementById('returnInvoiceSearch').value.trim();
  const result = document.getElementById('returnResult');
  if(!q){ result.innerHTML = ''; return; }
  const invoice = q.startsWith('#') ? q : '#'+q;
  const sale = state.sales.find(s=>s.invoice.toLowerCase()===invoice.toLowerCase());
  if(!sale){ result.innerHTML = `<p class="sub" style="margin-top:10px">"${q}" — কোনো ইনভয়েস পাওয়া যায়নি।</p>`; return; }
  result.innerHTML = `<div class="panel" style="margin-top:12px;padding:15px">
    <b>${sale.invoice} · ${sale.customer}</b><div class="sub" style="margin-bottom:10px">${sale.date} · ${sale.time}</div>
    ${sale.items.map((it,i)=>`<div class="row"><div><b>${it.name}</b><div class="sub">${fmt(it.price)} × ${it.qty}</div></div><button class="btn soft" onclick="processReturn('${sale.invoice}', ${i})">↩ Return this</button></div>`).join('')}
  </div>`;
}
async function processReturn(invoice, itemIndex){
  const sale = state.sales.find(s=>s.invoice===invoice);
  if(!sale) return;
  const item = sale.items[itemIndex];
  if(!item) return;
  const qtyStr = await showPromptDialog(`"${item.name}" কত পিস ফেরত নিবে?`, item.qty, {icon:'↩️', title:'সেলস রিটার্ন', type:'number', min:0, max:item.qty, hint:`সর্বোচ্চ ${item.qty} পিস ফেরত নেওয়া যাবে`, okLabel:'রিটার্ন নিশ্চিত করো'});
  if(qtyStr===null) return;
  const qty = Math.min(item.qty, Math.max(0, parseInt(qtyStr)||0));
  if(qty<=0) return;
  const product = state.products.find(p=>p.name===item.name);
  if(product) product.stock += qty;
  const amount = qty*item.price;
  state.returns.push({date: todayStr(), invoice, product:item.name, qty, amount});
  item.qty -= qty;
  if(item.qty<=0) sale.items.splice(itemIndex,1);
  sale.total -= amount;
  save();
  renderReturnsTable(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  searchReturnInvoice();
  showAlertDialog('রিটার্ন সম্পন্ন হয়েছে। স্টক আপডেট হয়েছে।', {icon:'✅'});
}

/* ===================== REPORTS ===================== */
function renderReports(){
  const totalSales = state.sales.reduce((a,s)=>a+s.total,0);
  const itemsSold = state.sales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);
  const estProfit = state.sales.reduce((a,s)=>a+s.items.reduce((b,i)=>{
    const p = state.products.find(x=>x.name===i.name);
    const cost = p ? p.purchase : i.price*0.85;
    return b + (i.price-cost)*i.qty;
  },0),0);
  const dueOutstanding = state.customers.reduce((a,c)=>a+c.due,0);
  setText('statMonthlySales', fmt(totalSales));
  setText('statEstProfit', fmt(estProfit));
  setText('statItemsSold', itemsSold.toLocaleString());
  setText('statDueOutstanding', fmt(dueOutstanding));
}
function exportSalesCSV(){
  if(!state.sales.length){ showAlertDialog('এক্সপোর্ট করার মতো কোনো সেল ডেটা নেই।'); return; }
  let csv = 'Invoice,Date,Time,Customer,Subtotal,Discount,VAT%,VAT Amount,Payment,Total\n';
  state.sales.forEach(s=>{
    csv += `${s.invoice},${s.date},${s.time},"${s.customer}",${s.subtotal||s.total},${s.discount||0},${s.vatPercent||0},${s.vat||0},${s.payment},${s.total}\n`;
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sales_report.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ===================== SETTINGS ===================== */
function fillSettingsForm(){
  const s = state.settings;
  const map = {settingStoreName:'storeName', settingPhone:'phone', settingAddress:'address', settingReceiptSize:'receiptSize', settingVatPercent:'vatPercent'};
  Object.keys(map).forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = s[map[id]] !== undefined ? s[map[id]] : (id==='settingVatPercent' ? 0 : '');
  });
}
function saveSettings(){
  state.settings.storeName = document.getElementById('settingStoreName').value;
  state.settings.phone = document.getElementById('settingPhone').value;
  state.settings.address = document.getElementById('settingAddress').value;
  state.settings.receiptSize = document.getElementById('settingReceiptSize').value;
  state.settings.vatPercent = +document.getElementById('settingVatPercent').value || 0;
  save();
  showAlertDialog('সেটিংস সেভ হয়েছে।', {icon:'✅'});
}
function renderUsersList(){
  const box = document.getElementById('usersListRows');
  if(!box) return;
  box.innerHTML = state.users.map(u=>`<div class="row"><div><b>${u.name}</b><div class="sub">${u.role}</div></div><button class="link danger" onclick="deleteUser('${u.id}')">Remove</button></div>`).join('');
}
function openAddUser(){
  openFormModal('নতুন ইউজার যোগ করুন', [
    {id:'name', label:'User Name', value:''},
    {id:'role', label:'Role', type:'select', options:[{value:'Admin',label:'Admin'},{value:'Manager',label:'Manager'},{value:'Cashier',label:'Cashier'}], value:'Cashier'},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('নাম দিন।'); return false; }
    state.users.push({id:uid(), name:v.name, role:v.role});
    save(); renderUsersList();
  });
}
function deleteUser(id){
  state.users = state.users.filter(u=>u.id!==id);
  save(); renderUsersList();
}

/* ===================== INIT ===================== */
function renderAll(){
  renderDashboard();
  renderPOSGrid();
  renderPOSCustomers();
  resetPOSExtras();
  renderProductsTable();
  renderCustomersTable();
  renderLedgerTable();
  renderCashTable();
  renderPurchasesTable();
  renderPurchaseReturnsTable();
  renderReturnsTable();
  renderReports();
  fillSettingsForm();
  renderUsersList();
}
/* ===================== AUTH / FIREBASE BOOTSTRAP ===================== */
function showApp(){
  document.getElementById('loginModal').classList.remove('show');
  document.getElementById('appRoot').style.display = '';
}
function showLoginScreen(msg){
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('loginModal').classList.add('show');
  const err = document.getElementById('loginError');
  if(msg){ err.textContent = msg; err.style.display = 'block'; }
  else { err.style.display = 'none'; }
}
async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if(!email || !password){ showLoginScreen('ইমেইল ও পাসওয়ার্ড দিন।'); return; }
  try{
    await window.Firebase.login(email, password);
  }catch(e){
    showLoginScreen('লগইন ব্যর্থ — ইমেইল বা পাসওয়ার্ড ভুল।');
  }
}
function doLogout(){
  if(unsubscribeState){ unsubscribeState(); unsubscribeState = null; }
  window.Firebase.logout();
}
function initAfterAuth(user){
  showApp();
  const emailEl = document.getElementById('loggedInEmail');
  if(emailEl) emailEl.textContent = user.email;
  window.Firebase.loadState().then(async remote=>{
    if(remote){
      state = remote;
    } else {
      state = defaultState();
      await window.Firebase.saveState(state);
    }
    renderAll();
    if(unsubscribeState) unsubscribeState();
    unsubscribeState = window.Firebase.watchState(function(remoteState){
      isRemoteUpdate = true;
      state = remoteState;
      renderAll();
      isRemoteUpdate = false;
    });
  });
}
function startAuthFlow(){
  window.Firebase.onAuthChange(function(user){
    if(user){ initAfterAuth(user); }
    else { showLoginScreen(); }
  });
}
if(window.Firebase){
  startAuthFlow(); // firebase-init.js already finished loading before this ran
} else {
  window.addEventListener('firebase-ready', startAuthFlow); // wait for it
}

/* ===== Excel / CSV Bulk Import ===== */
function normalizeHeader(h){ return String(h||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
const IMPORT_HEADER_MAP = {
  name: ['name','productname','product','item','itemname'],
  sku: ['sku','barcode','skubarcode','code'],
  purchase: ['purchase','purchaseprice','cost','costprice','buyprice'],
  sell: ['sell','sellprice','price','saleprice','sellingprice'],
  stock: ['stock','qty','quantity','openingstock','stockqty'],
  emoji: ['emoji','icon'],
};
function mapImportRow(row){
  const entries = Object.keys(row).map(k=>[normalizeHeader(k), row[k]]);
  const result = {};
  Object.keys(IMPORT_HEADER_MAP).forEach(field=>{
    for(const alias of IMPORT_HEADER_MAP[field]){
      const found = entries.find(([k])=>k===alias);
      if(found !== undefined){ result[field] = found[1]; break; }
    }
  });
  return result;
}
async function handleExcelImport(event){
  const file = event.target.files[0];
  event.target.value = '';
  if(!file) return;
  if(typeof XLSX === 'undefined'){ showAlertDialog('ইমপোর্ট লাইব্রেরি লোড হচ্ছে, একটু পর আবার চেষ্টা করুন।', {icon:'⏳'}); return; }
  try{
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, {type:'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
    if(!rows.length){ showAlertDialog('ফাইলে কোনো ডেটা পাওয়া যায়নি।', {icon:'⚠️'}); return; }

    const ok = await showConfirmDialog(`ফাইলে ${rows.length} টি রো পাওয়া গেছে। SKU মিলে গেলে প্রোডাক্ট আপডেট হবে, না মিললে নতুন প্রোডাক্ট যোগ হবে। এগোতে চাও?`, {icon:'📥', title:'ইমপোর্ট নিশ্চিত করো', okLabel:'হ্যাঁ, ইমপোর্ট করো'});
    if(!ok) return;

    let added=0, updated=0, skipped=0;
    rows.forEach(row=>{
      const m = mapImportRow(row);
      const name = String(m.name||'').trim();
      if(!name){ skipped++; return; }
      const sku = String(m.sku||'').trim();
      const purchase = parseFloat(m.purchase)||0;
      const sell = parseFloat(m.sell)||0;
      const stock = parseFloat(m.stock)||0;
      const emoji = String(m.emoji||'').trim();
      const existing = sku ? state.products.find(p=>p.sku && p.sku.toLowerCase()===sku.toLowerCase()) : null;
      if(existing){
        existing.name = name;
        existing.purchase = purchase;
        existing.sell = sell;
        existing.stock = stock;
        if(emoji) existing.emoji = emoji;
        updated++;
      } else {
        state.products.push({
          id: uid(),
          emoji: emoji || '📦',
          name, purchase, sell, stock,
          sku: sku || ('SKU-'+Math.floor(Math.random()*9000+1000)),
        });
        added++;
      }
    });
    save();
    renderProductsTable(); renderPOSGrid(); renderDashboard();
    let msg = `${added} টি নতুন প্রোডাক্ট যোগ হয়েছে\n${updated} টি প্রোডাক্ট আপডেট হয়েছে`;
    if(skipped) msg += `\n${skipped} টি রো বাদ দেওয়া হয়েছে (নাম খালি ছিল)`;
    showAlertDialog(msg, {icon:'✅', title:'ইমপোর্ট সম্পন্ন হয়েছে'});
  }catch(e){
    console.error(e);
    showAlertDialog('ফাইলটি পড়া যায়নি। এটা সঠিক .xlsx/.xls/.csv ফাইল কিনা দেখো।', {icon:'❌', title:'ইমপোর্ট ব্যর্থ'});
  }
}
function downloadProductTemplate(){
  if(typeof XLSX === 'undefined'){ showAlertDialog('লাইব্রেরি লোড হচ্ছে, একটু পর আবার চেষ্টা করুন।', {icon:'⏳'}); return; }
  const sample = [
    {Name:'Miniket Rice 5kg', SKU:'RC-5001', Purchase:320, Sell:350, Stock:24, Emoji:'🍚'},
    {Name:'Example Product', SKU:'EX-0001', Purchase:100, Sell:150, Stock:10, Emoji:'📦'},
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'product_import_template.xlsx');
}

/* ===== Barcode Label Printing (JsBarcode) ===== */
function buildBarcodeLabelHTML(p, qty){
  let html = '';
  for(let i=0;i<qty;i++){
    html += `<div class="barcodeLabel">
      <div class="bl-name">${escapeHtml(p.name)}</div>
      <svg class="bl-svg" data-sku="${escapeHtml(p.sku)}"></svg>
      <div class="bl-price">${fmt(p.sell)}</div>
    </div>`;
  }
  return html;
}
function renderBarcodeLabelsAndPrint(items){
  const area = document.getElementById('barcodePrintArea');
  area.innerHTML = items.map(it=>buildBarcodeLabelHTML(it.product, it.qty)).join('');
  area.querySelectorAll('svg.bl-svg').forEach(svg=>{
    try{
      JsBarcode(svg, svg.dataset.sku, {format:'CODE128', displayValue:true, fontSize:10, height:32, width:1.5, margin:2});
    }catch(e){ /* skip invalid code */ }
  });
  document.body.classList.add('printing-labels');
  const cleanup = ()=>{ document.body.classList.remove('printing-labels'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(()=>{ window.print(); }, 150);
}
async function printBarcodeLabel(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  if(!p.sku){ showAlertDialog('এই প্রোডাক্টের কোনো SKU/বারকোড সেট করা নেই। প্রথমে Edit করে একটা SKU দিন।', {icon:'⚠️'}); return; }
  const qtyStr = await showPromptDialog(`"${p.name}" এর জন্য কয়টা লেবেল প্রিন্ট করবে?`, p.stock || 1, {icon:'🏷️', title:'বারকোড লেবেল প্রিন্ট', type:'number', min:1, max:300, okLabel:'প্রিন্ট করো'});
  if(qtyStr===null) return;
  const qty = Math.max(1, Math.min(300, parseInt(qtyStr)||1));
  renderBarcodeLabelsAndPrint([{product:p, qty}]);
}
async function printAllBarcodeLabels(){
  const withSku = state.products.filter(p=>p.sku);
  if(!withSku.length){ showAlertDialog('কোনো প্রোডাক্টে SKU/বারকোড সেট করা নেই।', {icon:'⚠️'}); return; }
  const ok = await showConfirmDialog('প্রতিটা প্রোডাক্টের জন্য তার বর্তমান স্টক পরিমাণ অনুযায়ী বারকোড লেবেল প্রিন্ট করবে?', {icon:'🏷️', title:'সব লেবেল প্রিন্ট', okLabel:'হ্যাঁ, প্রিন্ট করো'});
  if(!ok) return;
  renderBarcodeLabelsAndPrint(withSku.map(p=>({product:p, qty: Math.max(1, Math.min(50, p.stock||1))})));
}

/* ===== Camera Barcode Scanner (webcam-based, no physical scanner needed) ===== */
let cameraScanActive = false;
let lastCameraScanCode = '';
let lastCameraScanTime = 0;
function openCameraScanner(){
  if(typeof Quagga === 'undefined'){
    showAlertDialog('স্ক্যানার লোড হচ্ছে, একটু পর আবার চেষ্টা করুন।', {icon:'⏳'});
    return;
  }
  document.getElementById('scannerModal').classList.add('show');
  cameraScanActive = true;
  Quagga.init({
    inputStream:{ type:'LiveStream', target: document.getElementById('scannerViewport'), constraints:{ facingMode:'environment' } },
    decoder:{ readers:['ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_128_reader','code_39_reader'] },
    locate:true
  }, function(err){
    if(err){
      showAlertDialog('ক্যামেরা চালু করা যায়নি। ব্রাউজারকে ক্যামেরা পারমিশন দিন।', {icon:'🚫'});
      closeCameraScanner();
      return;
    }
    Quagga.start();
  });
  Quagga.onDetected(onCameraBarcodeDetected);
}
function onCameraBarcodeDetected(result){
  if(!cameraScanActive) return;
  const code = result.codeResult.code;
  const now = Date.now();
  if(code === lastCameraScanCode && now - lastCameraScanTime < 1500) return;
  lastCameraScanCode = code;
  lastCameraScanTime = now;
  const p = state.products.find(x=>x.sku.toLowerCase() === code.toLowerCase());
  if(p){
    addToCart(p.id);
    closeCameraScanner();
    showAlertDialog(p.name + ' কার্টে যোগ হয়েছে।', {icon:'✅', title:'স্ক্যান সফল'});
  }
  // no product found: keep camera open, let them try another barcode
}
function closeCameraScanner(){
  cameraScanActive = false;
  document.getElementById('scannerModal').classList.remove('show');
  try{
    if(typeof Quagga !== 'undefined'){ Quagga.offDetected(onCameraBarcodeDetected); Quagga.stop(); }
  }catch(e){}
}

/* ===== Global barcode scanner listener (POS screen active থাকলে কাজ করবে) ===== */
let scanBuffer = '';
let scanTimer = null;
document.addEventListener('keydown', function(e){
  const tag = (e.target.tagName || '').toLowerCase();
  if(tag==='input' || tag==='select' || tag==='textarea') return;
  const posScreen = document.getElementById('pos');
  if(!posScreen || !posScreen.classList.contains('active')) return;
  if(e.key === 'Enter'){
    clearTimeout(scanTimer);
    if(scanBuffer.length >= 3){
      const code = scanBuffer;
      scanBuffer = '';
      const p = state.products.find(x=>x.sku.toLowerCase() === code.toLowerCase());
      if(p) addToCart(p.id);
      else showAlertDialog('বারকোড মিলেনি: ' + code, {icon:'🔍'});
    }
    return;
  }
  if(e.key.length === 1){ scanBuffer += e.key; }
  clearTimeout(scanTimer);
  scanTimer = setTimeout(()=>{ scanBuffer = ''; }, 300);
});