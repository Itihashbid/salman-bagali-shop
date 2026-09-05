/* ===================== SALMAN BANGALI SHOP POS — APP LOGIC ===================== */

const STORAGE_KEY = 'sara_pos_state_v1';

function todayStr(){
  const d = new Date();
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function dateStrFor(d){
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function nowTime(){
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function fmt(n){
  n = Math.round(n||0);
  const sym = (state && state.settings && state.settings.currencySymbol) || '৳';
  const val = n.toLocaleString('en-IN');
  const placement = (state && state.settings && state.settings.currencyPlacement) || 'before';
  return placement === 'before' ? sym + val : val + sym;
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// ===== SUPER ADMIN UID (আপনার নিজের Firebase UID) =====
const SUPER_ADMIN_UID = 'xQn7OHwRa1eKl96IaSROwiv3P8E3';

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
      <div class="cd-btns"><button class="cd-btn-primary" id="cdOk">${opts.okLabel||'OK'}</button></div>
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
      <div class="cd-btns"><button class="cd-btn-soft" id="cdCancel">${opts.cancelLabel||'Cancel'}</button><button class="${danger?'cd-btn-danger':'cd-btn-primary'}" id="cdOk">${opts.okLabel||'Yes'}</button></div>
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
      <div class="cd-btns"><button class="cd-btn-soft" id="cdCancel">Cancel</button><button class="cd-btn-primary" id="cdOk">${opts.okLabel||'Confirm'}</button></div>
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

/* ===================== STAFF ROLES & PERMISSIONS ===================== */
const STAFF_ROLES = [
  {key:'Manager',    label:'Manager'},
  {key:'Cashier',    label:'Cashier'},
  {key:'Salesman',   label:'Salesman'},
  {key:'Accountant', label:'Accountant'},
  {key:'DeliveryMan',label:'Delivery Man'},
];
const PERMISSION_SCREENS = [
  {key:'dashboard',    label:'Dashboard'},
  {key:'pos',          label:'New Sale / POS'},
  {key:'products',     label:'Products & Stock'},
  {key:'barcodePrint', label:'Barcode Print'},
  {key:'customers',    label:'Customers'},
  {key:'ledger',       label:'Due / Ledger'},
  {key:'cash',         label:'Cash Flow'},
  {key:'purchases',    label:'Purchases'},
  {key:'returns',      label:'Sales Return'},
  {key:'reports',      label:'Reports'},
  {key:'settings',     label:'Settings'},
];
const ROLE_DEFAULT_PERMISSIONS = {
  Manager:     ['dashboard','pos','products','barcodePrint','customers','ledger','cash','purchases','returns','reports'],
  Cashier:     ['dashboard','pos','customers','ledger'],
  Salesman:    ['dashboard','pos','customers'],
  Accountant:  ['dashboard','ledger','cash','purchases','reports'],
  DeliveryMan: ['dashboard','customers','ledger'],
};

/* ===================== PAYMENT METHODS ===================== */
let PAYMENT_METHODS = [
  {key:'cash',  label:'Cash',  icon:'💵', inputId:'payCash'},
  {key:'bkash', label:'bKash', icon:'📱', inputId:'payBkash'},
  {key:'nagad', label:'Nagad', icon:'📲', inputId:'payNagad'},
  {key:'bank',  label:'Bank',  icon:'🏦', inputId:'payBank'},
  {key:'card',  label:'Card',  icon:'💳', inputId:'payCard'},
];
const BUILTIN_PAY_INPUT_IDS = {cash:'payCash', bkash:'payBkash', nagad:'payNagad', bank:'payBank', card:'payCard'};
function defaultPaymentMethods(){
  return [
    {id:uid(), key:'cash',  label:'Cash',  icon:'💵', enabled:true, builtin:true},
    {id:uid(), key:'bkash', label:'bKash', icon:'📱', enabled:true, builtin:true},
    {id:uid(), key:'nagad', label:'Nagad', icon:'📲', enabled:true, builtin:true},
    {id:uid(), key:'bank',  label:'Bank',  icon:'🏦', enabled:true, builtin:true},
    {id:uid(), key:'card',  label:'Card',  icon:'💳', enabled:true, builtin:true},
  ];
}
function defaultTaxRates(){
  return [
    {id:uid(), name:'VAT 0%', rate:0, isDefault:false},
    {id:uid(), name:'VAT 5%', rate:5, isDefault:false},
    {id:uid(), name:'VAT 10%', rate:10, isDefault:true},
    {id:uid(), name:'VAT 15%', rate:15, isDefault:false},
  ];
}
function syncPaymentMethods(){
  const list = (state.paymentMethods && state.paymentMethods.length) ? state.paymentMethods : [];
  PAYMENT_METHODS = list.filter(m=>m.enabled!==false).map(m=>({
    key:m.key, label:m.label, icon:m.icon,
    inputId: BUILTIN_PAY_INPUT_IDS[m.key] || ('payCustom_' + m.key)
  }));
  if(!PAYMENT_METHODS.length){
    // নিরাপত্তার জন্য — POS-এ কখনোই শূন্য পেমেন্ট ফিল্ড থাকা উচিত নয়
    PAYMENT_METHODS = [{key:'cash', label:'Cash', icon:'💵', inputId:'payCash'}];
  }
}

/* ===================== PRODUCT PHOTO / ICON HELPER ===================== */
function productIconHTML(p, size){
  size = size || 32;
  if(p && p.image){
    return `<img src="${p.image}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:${Math.round(size*0.28)}px;flex:none;vertical-align:middle">`;
  }
  return `<span style="font-size:${Math.round(size*0.62)}px;line-height:1;vertical-align:middle">${(p && p.emoji) || '📦'}</span>`;
}

let state = emptyState(); // এখন আর ডেমো ডেটা থাকবে না — real data loads from Firestore after login
let unsubscribeState = null;
let isRemoteUpdate = false;
let currentUid = null;
let currentShopId = null;
let currentRole = 'Admin';
let currentPermissions = null; // null = Admin/full access, or an array of allowed screen keys for staff
function save(){
  if(isRemoteUpdate || !currentShopId) return; // avoid re-saving remote data, or saving before login
  if(window.Firebase) window.Firebase.saveState(currentShopId, state);
}
function emptyState(){
  return {
    invoiceCounter: 1,
    products: [],
    categories: [],
    brands: [],
    units: [{id:uid(), name:'Pieces (Pcs)'}],
    customers: [],
    ledger: [],
    cash: [],
    purchases: [],
    suppliers: [],
    returns: [],
    purchaseReturns: [],
    sales: [],
    users: [{id:uid(), name:'Admin User', role:'Admin'}],
    settings: {storeName:'My Shop', phone:'', address:'', receiptSize:'80mm Thermal', vatPercent:0, logo:'', ownerName:'', footerNote:'Thank you • Visit Again', storeCode:'ST0001', storeEmail:'info@myshop.com', website:'', taxId:'', showSignature:true, invoicePrefix:'INV-', defaultDiscount:0, currencySymbol:'৳', currencyPlacement:'before', termsConditions:'যেকোনো পণ্য ফেরত নেওয়ার সময় অবশ্যই রিসিট দেখাতে হবে।', showChange:true},
    paymentMethods: defaultPaymentMethods(),
    taxRates: defaultTaxRates(),
  };
}
async function resetDemoData(){
  const ok = await showConfirmDialog('Delete all data and start fresh with an empty shop? This action cannot be undone.', {danger:true, icon:'⚠️', okLabel:'Yes, delete everything', title:'Delete All Data'});
  if(!ok) return;
  state = emptyState();
  save();
  renderAll();
}

/* ===================== NAVIGATION ===================== */
let cart = [];

function show(id, el){
  currentScreenId = id;
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
  const titles = {dashboard:'Dashboard', pos:'New Sale · POS Billing', products:'Products & Inventory', barcodePrint:'Barcode Print', customers:'Customers', ledger:'Due / Customer Ledger', cash:'Daily Cash Flow', purchases:'Purchases / Stock In', returns:'Sales Return / Exchange', reports:'Reports', settings:'Settings'};
  document.getElementById('pageTitle').textContent = titles[id] || id;
  if(id==='dashboard') renderDashboard();
  if(id==='pos') resetPOSExtras();
  if(id==='barcodePrint') renderBarcodePrintScreen();
  if(id==='settings'){ renderUsersList(); renderPaymentMethodsList(); renderTaxRatesList(); }
  if(id==='admin') renderAdminPanel();
  window.scrollTo(0,0);
}
function resetPOSExtras(){
  const dv = document.getElementById('discountValue');
  const dt = document.getElementById('discountType');
  const vp = document.getElementById('vatPercent');
  if(dv) dv.value = state.settings.defaultDiscount || 0;
  if(dt) dt.value = 'amount';
  if(vp) vp.value = state.settings.vatPercent || 0;
  PAYMENT_METHODS.forEach(m=>{
    const el = document.getElementById(m.inputId);
    if(el) el.value = 0;
  });
  renderCart();
}

/* ===================== PAYMENT METHODS MANAGEMENT ===================== */
function renderPaymentMethodsList(){
  const box = document.getElementById('paymentMethodsList');
  if(!box) return;
  const methods = state.paymentMethods || [];
  box.innerHTML = methods.length ? methods.map(m=>`
    <div class="row">
      <div class="rowleft">
        <span style="font-size:20px">${m.icon}</span>
        <div><b>${escapeHtml(m.label)}</b><div class="sub">${escapeHtml(m.key)}${m.builtin ? ' • built-in' : ''}</div></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="link" onclick="togglePaymentMethod('${m.id}')">${m.enabled!==false ? '✅' : '⛔'}</button>
        <button class="link danger" onclick="deletePaymentMethod('${m.id}')">✕</button>
      </div>
    </div>
  `).join('') : '<div class="sub" style="padding:10px 0">No payment methods added.</div>';
}
async function openAddPaymentMethod(){
  const data = await showPromptDialog('Payment method details (format: Label|Icon|Key)', 'Rocket|🚀|rocket', {
    title: 'Add Payment Method',
    hint: 'Example: Rocket|🚀|rocket'
  });
  if(!data) return;
  const parts = data.split('|').map(s=>s.trim());
  if(parts.length !== 3 || !parts[0] || !parts[2]){
    showAlertDialog('Please use the format: Label|Icon|Key (e.g. Rocket|🚀|rocket)');
    return;
  }
  const [label, icon, keyRaw] = parts;
  const key = keyRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if(!key){ showAlertDialog('Key must contain letters or numbers.'); return; }
  ensureMetaLists();
  if(state.paymentMethods.some(m=>m.key === key)){
    showAlertDialog('A method with this key already exists.');
    return;
  }
  state.paymentMethods.push({id: uid(), key, label, icon: icon || '💰', enabled: true, builtin:false});
  save();
  syncPaymentMethods();
  renderPaymentMethodsList();
  renderPaymentFields();
  resetPOSExtras();
  showAlertDialog('Payment method added successfully.', {icon:'✅'});
}
async function deletePaymentMethod(id){
  const method = (state.paymentMethods||[]).find(m=>m.id === id);
  if(!method) return;
  if(method.builtin){
    showAlertDialog('Built-in payment methods cannot be deleted — you can disable them instead.');
    return;
  }
  const ok = await showConfirmDialog(`Delete "${method.label}"?`, {danger:true, title:'Delete Payment Method'});
  if(!ok) return;
  state.paymentMethods = state.paymentMethods.filter(m=>m.id !== id);
  save();
  syncPaymentMethods();
  renderPaymentMethodsList();
  renderPaymentFields();
  resetPOSExtras();
}
function togglePaymentMethod(id){
  const method = (state.paymentMethods||[]).find(m=>m.id === id);
  if(!method) return;
  method.enabled = method.enabled===false ? true : false;
  save();
  syncPaymentMethods();
  renderPaymentMethodsList();
  renderPaymentFields();
  resetPOSExtras();
}

/* ===================== TAX RATES MANAGEMENT ===================== */
function renderTaxRatesList(){
  const box = document.getElementById('taxRatesList');
  if(!box) return;
  const rates = state.taxRates || [];
  box.innerHTML = rates.length ? rates.map(t=>`
    <div class="row">
      <div class="rowleft">
        <span style="font-size:16px">${t.isDefault ? '⭐' : '⬜'}</span>
        <div><b>${escapeHtml(t.name)}</b><div class="sub">${t.rate}%</div></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="link" onclick="setDefaultTaxRate('${t.id}')">${t.isDefault ? 'Default' : 'Set Default'}</button>
        <button class="link danger" onclick="deleteTaxRate('${t.id}')">✕</button>
      </div>
    </div>
  `).join('') : '<div class="sub" style="padding:10px 0">No tax rates added.</div>';
}
async function openAddTaxRate(){
  const name = await showPromptDialog('Tax rate name:', 'VAT 15%', {title:'Add Tax Rate'});
  if(!name || !name.trim()) return;
  const rateStr = await showPromptDialog('Tax rate percentage:', '15', {title:'Tax Rate %'});
  if(rateStr === null) return;
  const rate = Math.max(0, Math.min(100, parseFloat(rateStr) || 0));
  ensureMetaLists();
  if(state.taxRates.some(t=>t.name.toLowerCase() === name.trim().toLowerCase())){
    showAlertDialog('A tax with this name already exists.');
    return;
  }
  state.taxRates.push({id: uid(), name: name.trim(), rate: rate, isDefault: false});
  save();
  renderTaxRatesList();
  fillTaxSelect(document.getElementById('pf_tax') ? document.getElementById('pf_tax').value : '');
}
async function deleteTaxRate(id){
  const rate = (state.taxRates||[]).find(t=>t.id === id);
  if(!rate) return;
  if(rate.isDefault){
    showAlertDialog('Cannot delete the default tax rate. Set another as default first.');
    return;
  }
  const ok = await showConfirmDialog(`Delete "${rate.name}"?`, {danger:true, title:'Delete Tax Rate'});
  if(!ok) return;
  state.taxRates = state.taxRates.filter(t=>t.id !== id);
  save();
  renderTaxRatesList();
  fillTaxSelect(document.getElementById('pf_tax') ? document.getElementById('pf_tax').value : '');
}
function setDefaultTaxRate(id){
  state.taxRates.forEach(t=>t.isDefault = (t.id === id));
  save();
  renderTaxRatesList();
  const defaultTax = state.taxRates.find(t=>t.isDefault);
  if(defaultTax){
    const vp = document.getElementById('settingVatPercent');
    if(vp) vp.value = defaultTax.rate;
    state.settings.vatPercent = defaultTax.rate;
    save();
  }
  showAlertDialog('Default tax rate updated.', {icon:'✅'});
}
function fillTaxSelect(selectedId){
  const taxSel = document.getElementById('pf_tax');
  if(!taxSel) return;
  const rates = state.taxRates || [];
  taxSel.innerHTML = rates.length ? rates.map(t=>`<option value="${t.id}">${escapeHtml(t.name)} (${t.rate}%)</option>`).join('') : '<option value="">No taxes configured</option>';
  const def = rates.find(t=>t.isDefault);
  taxSel.value = selectedId || (def ? def.id : '');
}

/* ===================== GENERIC MODAL FORM ===================== */
let _modalSubmitFn = null;

function openFormModal(title, fields, onSubmit){
  document.getElementById('formModalTitle').textContent = title;
  const box = document.getElementById('formModalFields');
  box.innerHTML = fields.map(f=>{
    const hint = f.hint ? `<small class="sub" style="margin-top:3px;display:block">${f.hint}</small>` : '';
    if(f.type==='select'){
      const opts = f.options.map(o=>`<option value="${o.value}" ${o.value===f.value?'selected':''}>${o.label}</option>`).join('');
      return `<div class="field"><label>${f.label}</label><select id="fm_${f.id}">${opts}</select>${hint}</div>`;
    }
    return `<div class="field"><label>${f.label}</label><input id="fm_${f.id}" type="${f.type||'text'}" value="${f.value!==undefined?f.value:''}" placeholder="${f.placeholder||''}">${hint}</div>`;
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
  Promise.resolve(_modalSubmitFn(values)).then(ok=>{
    if(ok !== false){ closeFormModal(); }
  });
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

  const withTotalStock = state.products.map(p=>({p, total: (p.productType==='variable' && Array.isArray(p.variations) && p.variations.length) ? p.variations.reduce((a,v)=>a+(+v.stock||0),0) : (+p.stock||0)}));
  const lowStock = withTotalStock.filter(x=>x.total<=(x.p.lowStockAlert!==undefined && x.p.lowStockAlert!==null ? x.p.lowStockAlert : 5)).sort((a,b)=>a.total-b.total).slice(0,5);
  document.getElementById('lowStockRows').innerHTML = lowStock.length ? lowStock.map(x=>
    `<div class="row"><div class="rowleft"><div class="ico">${productIconHTML(x.p, 22)}</div><div><b>${x.p.name}</b><div class="sub">Only ${x.total} pcs</div></div></div><span class="danger">${x.total}</span></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">No low-stock products</div>`;

  const recent = [...state.sales].slice(-3).reverse();
  document.getElementById('recentSalesRows').innerHTML = recent.length ? recent.map(s=>
    `<div class="row"><div><b>${s.invoice} · ${s.customer}</b><div class="sub">${s.time} · ${s.items.reduce((a,i)=>a+i.qty,0)} items</div></div><b>${fmt(s.total)}</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">No sales yet</div>`;

  const dueList = [...dueCustomers].sort((a,b)=>b.due-a.due).slice(0,5);
  document.getElementById('dueCustomersRows').innerHTML = dueList.length ? dueList.map(c=>
    `<div class="row"><b>${c.name}</b><b class="danger">${fmt(c.due)}</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">No dues</div>`;

  const prodAgg = {};
  state.sales.forEach(s=>{
    s.items.forEach(i=>{
      if(!prodAgg[i.name]) prodAgg[i.name] = {name:i.name, qty:0};
      prodAgg[i.name].qty += i.qty;
    });
  });
  const topProducts = Object.values(prodAgg).sort((a,b)=>b.qty-a.qty).slice(0,10);
  document.getElementById('topProductsRows').innerHTML = topProducts.length ? topProducts.map((p,i)=>
    `<div class="row"><div class="rowleft"><div class="ico">${i+1}</div><div><b>${p.name}</b></div></div><b>${p.qty} pcs</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">No sales yet</div>`;

  const custAgg = {};
  state.sales.forEach(s=>{
    if(!s.customer || s.customer === 'Walk-in Customer') return;
    if(!custAgg[s.customer]) custAgg[s.customer] = {name:s.customer, total:0};
    custAgg[s.customer].total += s.total;
  });
  const topCustomers = Object.values(custAgg).sort((a,b)=>b.total-a.total).slice(0,10);
  document.getElementById('topCustomersRows').innerHTML = topCustomers.length ? topCustomers.map((c,i)=>
    `<div class="row"><div class="rowleft"><div class="ico">${i+1}</div><div><b>${c.name}</b></div></div><b>${fmt(c.total)}</b></div>`
  ).join('') : `<div class="sub" style="padding:15px 0">No customers yet</div>`;

  renderSalesOverviewChart();
}
function renderSalesOverviewChart(){
  const chartEl = document.getElementById('salesOverviewChart');
  if(!chartEl) return;
  const labelsEl = document.getElementById('salesOverviewLabels');
  const rangeSel = document.getElementById('dashboardChartRange');
  const days = rangeSel ? (+rangeSel.value || 7) : 7;

  const dayTotals = [];
  for(let i=days-1;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    const dstr = dateStrFor(d);
    const total = state.sales.filter(s=>s.date===dstr).reduce((a,s)=>a+s.total,0);
    dayTotals.push({label: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}), total});
  }
  const max = Math.max(1, ...dayTotals.map(x=>x.total));
  const hasAny = dayTotals.some(x=>x.total>0);

  if(!hasAny){
    chartEl.style.alignItems = 'center';
    chartEl.style.justifyContent = 'center';
    chartEl.innerHTML = `<div class="sub" style="text-align:center;width:100%">No sales in this period yet</div>`;
    if(labelsEl) labelsEl.innerHTML = '';
    return;
  }
  chartEl.style.alignItems = 'end';
  chartEl.style.justifyContent = '';
  chartEl.innerHTML = dayTotals.map((x,i)=>{
    const pct = x.total>0 ? Math.max(4, Math.round((x.total/max)*100)) : 1;
    const isToday = i === dayTotals.length-1;
    return `<i title="${x.label}: ${fmt(x.total)}" style="height:${pct}%;flex:1;background:${isToday?'var(--gold)':'var(--green)'};border-radius:6px 6px 0 0"></i>`;
  }).join('');
  if(labelsEl){
    labelsEl.innerHTML = days<=14
      ? dayTotals.map(x=>`<span style="flex:1;text-align:center;font-size:9px;color:var(--muted)">${x.label}</span>`).join('')
      : '';
  }
}
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }

/* ===================== POS ===================== */
function renderPOSGrid(){
  const grid = document.getElementById('productGrid');
  const items = getSellableItems();
  grid.innerHTML = items.map(p=>{
    const displayName = p.variationValue ? `${p.name} (${p.variationValue})` : p.name;
    return `<button class="product" data-id="${p.key}" data-name="${displayName}" data-sku="${p.sku}" onclick="addToCart('${p.key}')">
      <span class="emoji">${productIconHTML(p, 40)}</span><b>${displayName}</b><small>${fmt(p.sell)} · Stock ${p.stock}</small>
    </button>`;
  }).join('');
}
function renderPOSCustomers(){
  const sel = document.getElementById('posCustomer');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option>Walk-in Customer</option>' + state.customers.map(c=>`<option>${c.name}</option>`).join('');
  if([...sel.options].some(o=>o.value===current)) sel.value = current;
}
function addToCart(key){
  const p = findSellable(key);
  if(!p) return;
  const displayName = p.variationValue ? `${p.name} (${p.variationValue})` : p.name;
  if(p.stock<=0){ showAlertDialog('Out of stock: ' + displayName, {icon:'📦'}); return; }
  let x = cart.find(i=>i.id===key);
  if(x){
    if(x.qty>=p.stock){ showAlertDialog('Cannot add more than available stock.', {icon:'📦'}); return; }
    x.qty++;
  } else cart.push({id:key, name:displayName, price:p.sell, qty:1, emoji:p.emoji, image:p.image});
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
  const amounts = {};
  let paid = 0;
  PAYMENT_METHODS.forEach(m=>{
    let v = +((document.getElementById(m.inputId)||{}).value) || 0;
    if(v<0) v = 0;
    amounts[m.key] = v;
    paid += v;
  });
  const due = Math.max(0, total - paid);
  const overpaid = Math.max(0, paid - total);
  // cashAmt/bkashAmt kept for backward compatibility with any older code paths
  return {amounts, cashAmt:amounts.cash, bkashAmt:amounts.bkash, paid, due, overpaid};
}
function renderCart(){
  const box = document.getElementById('cart');
  if(!cart.length){
    box.innerHTML = '<div class="sub" style="padding:25px 0;text-align:center">Cart is empty<br>Select a product</div>';
  } else {
    box.innerHTML = cart.map((x,i)=>`<div class="cartline"><div><b>${productIconHTML(x,16)} ${x.name}</b><div class="sub">${fmt(x.price)} × ${x.qty}</div></div><div class="qty"><button onclick="changeQty(${i},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${i},1)">+</button></div><b>${fmt(x.price*x.qty)}</b></div>`).join('');
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
    if(p.overpaid>0){ dueEl.textContent = 'Extra: ' + fmt(p.overpaid); }
    else { dueEl.textContent = fmt(p.due); }
  }
}
function quickPay(mode){
  const t = computeTotals();
  PAYMENT_METHODS.forEach(m=>{
    const el = document.getElementById(m.inputId);
    if(!el) return;
    el.value = (mode===m.key) ? t.total : 0;
  });
  renderCart();
}
function changeQty(i,d){
  const p = findSellable(cart[i].id);
  if(d>0 && p && cart[i].qty>=p.stock){ showAlertDialog('Cannot add more than available stock.', {icon:'📦'}); return; }
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
  const p = getSellableItems().find(x=>(x.sku||'').toLowerCase() === code.toLowerCase());
  if(p){
    addToCart(p.key);
    box.value = '';
    filterProducts();
  } else {
    showAlertDialog('No product found for this barcode/SKU: ' + code, {icon:'🔍'});
  }
}
function openReceipt(){
  if(!cart.length){ showAlertDialog('Add at least one product to the cart first.', {icon:'🛒'}); return; }
  const customer = document.getElementById('posCustomer').value || 'Walk-in Customer';
  const t = computeTotals(); // {subtotal, discountAmt, vatPercent, vatAmt, total}
  const p = getPaymentSplit(t.total); // {amounts:{cash,bkash,nagad,bank,card}, paid, due, overpaid}
  if(p.overpaid>0){ showAlertDialog('The amount paid is more than the bill total. Please fix the payment amounts.', {icon:'৳'}); return; }
  const invoice = state.settings.invoicePrefix + (state.invoiceCounter++);

  // reduce stock
  cart.forEach(item=>{
    adjustStock(item.id, -item.qty);
  });

  const usedMethods = PAYMENT_METHODS.filter(m=>p.amounts[m.key]>0);
  let paymentLabel = usedMethods.map(m=>m.label).join('+') || 'Due';
  if(usedMethods.length && p.due>0) paymentLabel += '+Due';
  if(!usedMethods.length) paymentLabel = 'Due';

  const saleRecord = {
    invoice, customer, time: nowTime(), date: todayStr(),
    items: cart.map(c=>({id:c.id, name:c.name, price:c.price, qty:c.qty})),
    subtotal: t.subtotal, discount: t.discountAmt, vatPercent: t.vatPercent, vat: t.vatAmt,
    total: t.total, paid: {...p.amounts}, paidCash: p.amounts.cash, paidBkash: p.amounts.bkash, due: p.due, payment: paymentLabel
  };
  state.sales.push(saleRecord);

  if(customer !== 'Walk-in Customer'){
    let cust = state.customers.find(c=>c.name===customer);
    if(!cust){ cust = {id:uid(), name:customer, mobile:'-', address:'', totalPurchase:0, due:0, lastPurchase:'Today'}; state.customers.push(cust); }
    cust.totalPurchase += t.total;
    cust.due += p.due;
    cust.lastPurchase = 'Today';
  }
  if(p.due>0){
    const bal = customer!=='Walk-in Customer' ? (state.customers.find(c=>c.name===customer)||{due:p.due}).due : p.due;
    state.ledger.push({date: todayStr(), customer, invoice, debit:t.total, credit:0, balance:bal});
  }
  PAYMENT_METHODS.forEach(m=>{
    if(p.amounts[m.key]>0){
      state.cash.push({time: nowTime(), desc:'Sale '+invoice+' ('+m.label+')', type:'in', amount:p.amounts[m.key]});
    }
  });
  save();

  document.getElementById('receiptItems').innerHTML = cart.map(x=>`<div class="rline"><span>${x.name} ×${x.qty}</span><span>${fmt(x.price*x.qty)}</span></div>`).join('');
  const metaEl = document.getElementById('receiptMeta');
  if(metaEl){
    let metaHtml = `Invoice: ${invoice}<br>Date: ${todayStr()} ${nowTime()}<br>Customer: ${customer}`;
    if(state.settings.storeCode) metaHtml += `<br>Store: ${state.settings.storeCode}`;
    if(state.settings.storeEmail) metaHtml += `<br>Email: ${state.settings.storeEmail}`;
    if(state.settings.website) metaHtml += `<br>Web: ${state.settings.website}`;
    if(state.settings.taxId) metaHtml += `<br>Tax ID: ${state.settings.taxId}`;
    metaEl.innerHTML = metaHtml;
  }
  const rLogo = document.getElementById('receiptLogo');
  if(rLogo){ if(state.settings.logo){ rLogo.src = state.settings.logo; rLogo.style.display='block'; } else { rLogo.style.display='none'; } }
  setText('receiptStoreName', state.settings.storeName || 'My Shop');
  setText('receiptAddress', state.settings.address || '');
  setText('receiptPhone', state.settings.phone || '');
  setText('receiptFooterNote', state.settings.footerNote || 'Thank you • Visit Again');
  const termsEl = document.getElementById('receiptTerms');
  if(termsEl){
    termsEl.textContent = state.settings.termsConditions || '';
    termsEl.style.display = state.settings.termsConditions ? 'block' : 'none';
  }
  const sigEl = document.getElementById('receiptSignature');
  if(sigEl){
    if(state.settings.showSignature && state.settings.ownerName){
      sigEl.textContent = 'Signature: ' + state.settings.ownerName;
      sigEl.style.display = 'block';
    } else {
      sigEl.style.display = 'none';
    }
  }
  setText('rsub', fmt(t.subtotal));
  setText('rdiscount', t.discountAmt>0 ? ('− ' + fmt(t.discountAmt)) : fmt(0));
  setText('rvatLabel', `VAT (${t.vatPercent}%)`);
  setText('rvat', fmt(t.vatAmt));
  setText('rtotal', fmt(t.total));
  const wordsEl = document.getElementById('rwords');
  if(wordsEl){
    wordsEl.textContent = numberToWords(t.total) + ' Taka Only';
    wordsEl.style.display = 'block';
  }
  const breakdownParts = PAYMENT_METHODS.filter(m=>p.amounts[m.key]>0).map(m=>`<div class="rline"><span>Paid (${m.icon} ${m.label})</span><span>${fmt(p.amounts[m.key])}</span></div>`);
  if(!breakdownParts.length) breakdownParts.push(`<div class="rline"><span>Paid</span><span>${fmt(0)}</span></div>`);
  document.getElementById('rpaidBreakdown').innerHTML = breakdownParts.join('');
  setText('rdue', fmt(p.due));
  const changeEl = document.getElementById('rchange');
  if(changeEl){
    const changeAmt = Math.max(0, p.paid - t.total);
    if(state.settings.showChange !== false && changeAmt > 0){
      changeEl.textContent = 'Change: ' + fmt(changeAmt);
      changeEl.style.display = 'block';
    } else {
      changeEl.style.display = 'none';
    }
  }
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

/* ===================== CATEGORIES / BRANDS / UNITS (master data) ===================== */
function ensureMetaLists(){
  if(!Array.isArray(state.categories)) state.categories = [];
  if(!Array.isArray(state.brands)) state.brands = [];
  if(!Array.isArray(state.units)) state.units = [];
  if(!Array.isArray(state.suppliers)) state.suppliers = [];
  if(!Array.isArray(state.paymentMethods) || !state.paymentMethods.length) state.paymentMethods = defaultPaymentMethods();
  if(!Array.isArray(state.taxRates) || !state.taxRates.length) state.taxRates = defaultTaxRates();
  syncPaymentMethods();
}
function metaOptions(listName){
  ensureMetaLists();
  return [{value:'', label:'— None —'}].concat(state[listName].map(x=>({value:x.name, label:x.name})));
}
async function quickAddMeta(listName, selectElId){
  ensureMetaLists();
  const labels = {categories:'Category', brands:'Brand', units:'Unit'};
  const name = await showPromptDialog(`New ${labels[listName]} name:`, '', {icon:'✚', title:'Add ' + labels[listName]});
  if(!name || !name.trim()) return;
  if(!state[listName].some(x=>x.name.toLowerCase()===name.trim().toLowerCase())){
    state[listName].push({id:uid(), name:name.trim()});
    save();
  }
  const sel = document.getElementById(selectElId);
  if(sel){
    sel.innerHTML = metaOptions(listName).map(o=>`<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
    sel.value = name.trim();
  }
}
function renderMetaManageLists(){
  ensureMetaLists();
  ['categories','brands','units'].forEach(listName=>{
    const box = document.getElementById('meta_'+listName+'_rows');
    if(!box) return;
    box.innerHTML = state[listName].length ? state[listName].map(x=>`<div class="row"><b>${escapeHtml(x.name)}</b><button class="link danger" onclick="deleteMetaItem('${listName}','${x.id}')">Delete</button></div>`).join('') : `<div class="sub" style="padding:10px 0">None yet</div>`;
  });
}
async function addMetaItem(listName){
  const inputId = 'metaNew_' + listName;
  const input = document.getElementById(inputId);
  const name = (input?.value || '').trim();
  if(!name) return;
  ensureMetaLists();
  if(state[listName].some(x=>x.name.toLowerCase()===name.toLowerCase())){ showAlertDialog('This already exists.'); return; }
  state[listName].push({id:uid(), name});
  input.value = '';
  save();
  renderMetaManageLists();
}
async function deleteMetaItem(listName, id){
  const ok = await showConfirmDialog('Delete this entry? Products already using it will keep the name as plain text.', {danger:true, title:'Delete'});
  if(!ok) return;
  state[listName] = state[listName].filter(x=>x.id!==id);
  save();
  renderMetaManageLists();
}
function openManageMeta(){
  renderMetaManageLists();
  document.getElementById('metaManageModal').classList.add('show');
}
function closeManageMeta(){
  document.getElementById('metaManageModal').classList.remove('show');
  renderProductsTable(); renderPOSGrid(); // in case category/brand/unit lists changed dropdown data elsewhere
}

/* ===================== SELLABLE ITEMS (flattens variable-product variations for POS/Purchases/Barcode) ===================== */
function getSellableItems(){
  const list = [];
  state.products.forEach(p=>{
    if(p.productType==='variable' && Array.isArray(p.variations) && p.variations.length){
      p.variations.forEach(v=>{
        list.push({
          key: p.id+'::'+v.id, refId:p.id, variationId:v.id,
          name: p.name, variationValue:v.value, emoji:p.emoji, image:p.image,
          sku:v.sku||'', purchase:+v.purchase||0, sell:+v.sell||0, stock:+v.stock||0,
          category:p.category||'', brand:p.brand||'', unit:p.unit||''
        });
      });
    } else {
      list.push({
        key: p.id, refId:p.id, variationId:null,
        name: p.name, variationValue:'', emoji:p.emoji, image:p.image,
        sku:p.sku||'', purchase:+p.purchase||0, sell:+p.sell||0, stock:+p.stock||0,
        category:p.category||'', brand:p.brand||'', unit:p.unit||''
      });
    }
  });
  return list;
}
function findSellable(key){
  return getSellableItems().find(x=>x.key===key);
}
function adjustStock(key, delta){
  if(!key) return;
  const idx = key.indexOf('::');
  const refId = idx===-1 ? key : key.slice(0,idx);
  const variationId = idx===-1 ? null : key.slice(idx+2);
  const p = state.products.find(x=>x.id===refId);
  if(!p) return;
  if(variationId){
    const v = (p.variations||[]).find(x=>x.id===variationId);
    if(v) v.stock = Math.max(0, (+v.stock||0) + delta);
  } else {
    p.stock = Math.max(0, (+p.stock||0) + delta);
  }
}

/* ===================== PRODUCTS & STOCK ===================== */
function renderProductsTable(){
  const body = document.getElementById('productsTableBody');
  if(!body) return;
  body.innerHTML = state.products.map(p=>{
    const isVariable = p.productType==='variable' && Array.isArray(p.variations) && p.variations.length;
    const totalStock = isVariable ? p.variations.reduce((a,v)=>a+(+v.stock||0),0) : p.stock;
    const lowThreshold = (p.lowStockAlert!==undefined && p.lowStockAlert!==null) ? p.lowStockAlert : 5;
    const statusHtml = totalStock<=lowThreshold ? `<span class="danger">Low stock</span>` : `<span class="pill">In stock</span>`;
    const metaBits = [p.category, p.brand, p.unit].filter(Boolean).join(' · ');
    const nameCell = `${productIconHTML(p, 26)} ${p.name}${isVariable?` <span class="pill">${p.variations.length} variants</span>`:''}${metaBits?`<div class="sub">${escapeHtml(metaBits)}</div>`:''}`;
    const skuCell = isVariable ? 'Multiple' : p.sku;
    const purchaseCell = isVariable ? (fmt(Math.min(...p.variations.map(v=>+v.purchase||0))) + '–' + fmt(Math.max(...p.variations.map(v=>+v.purchase||0)))) : fmt(p.purchase);
    const sellCell = isVariable ? (fmt(Math.min(...p.variations.map(v=>+v.sell||0))) + '–' + fmt(Math.max(...p.variations.map(v=>+v.sell||0)))) : fmt(p.sell);
    return `<tr>
      <td>${nameCell}</td><td>${skuCell}</td><td>${purchaseCell}</td><td>${sellCell}</td><td>${totalStock}</td><td>${statusHtml}</td>
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
let _editingProductId = null;
let _variationRowSeq = 0;
let _pfImageData = ''; // base64 photo for the product currently being added/edited
function handleProductImageUpload(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(file.size > 1.5*1024*1024){ showAlertDialog('Image size must be under 1.5MB. Please choose a smaller photo.', {icon:'⚠️'}); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = function(ev){
    _pfImageData = ev.target.result;
    setProductImagePreview(_pfImageData);
  };
  reader.readAsDataURL(file);
}
function removeProductImage(){
  _pfImageData = '';
  setProductImagePreview('');
  const input = document.getElementById('pf_imageInput');
  if(input) input.value = '';
}
function setProductImagePreview(dataUrl){
  const img = document.getElementById('pf_imagePreview');
  const placeholder = document.getElementById('pf_imagePlaceholder');
  const removeBtn = document.getElementById('pf_imageRemoveBtn');
  if(!img) return;
  if(dataUrl){
    img.src = dataUrl; img.style.display = 'block';
    if(placeholder) placeholder.style.display = 'none';
    if(removeBtn) removeBtn.style.display = 'inline';
  } else {
    img.style.display = 'none';
    if(placeholder) placeholder.style.display = 'block';
    if(removeBtn) removeBtn.style.display = 'none';
  }
}
function fillMetaSelect(selectId, listName, selectedValue){
  const sel = document.getElementById(selectId);
  if(!sel) return;
  sel.innerHTML = metaOptions(listName).map(o=>`<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
  sel.value = selectedValue || '';
}
function productTypeChanged(){
  const type = document.getElementById('pf_type').value;
  document.getElementById('pf_simpleSection').style.display = type==='variable' ? 'none' : 'block';
  document.getElementById('pf_variableSection').style.display = type==='variable' ? 'block' : 'none';
}
function addVariationRow(data){
  data = data || {value:'', sku:'', purchase:0, sell:0, stock:0};
  const rowId = 'vr' + (++_variationRowSeq);
  const tbody = document.getElementById('pf_variationRows');
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.innerHTML = `
    <td><input data-f="value" value="${escapeHtml(data.value)}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    <td><input data-f="sku" value="${escapeHtml(data.sku)}" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    <td><input data-f="purchase" type="number" value="${data.purchase}" style="width:80px;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    <td><input data-f="sell" type="number" value="${data.sell}" style="width:80px;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    <td><input data-f="stock" type="number" value="${data.stock}" style="width:70px;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    <td><button type="button" class="link danger" onclick="document.getElementById('${rowId}').remove()">✕</button></td>`;
  tbody.appendChild(tr);
}
function generateVariationRows(){
  const raw = document.getElementById('pf_variationValues').value || '';
  const values = raw.split(',').map(s=>s.trim()).filter(Boolean);
  if(!values.length){ showAlertDialog('Enter at least one variation value, comma-separated (e.g. 100gm,150gm,200gm).'); return; }
  document.getElementById('pf_variationRows').innerHTML = '';
  values.forEach(v=>addVariationRow({value:v, sku:'', purchase:0, sell:0, stock:0}));
}
function readVariationRows(){
  const rows = [...document.querySelectorAll('#pf_variationRows tr')];
  return rows.map(tr=>{
    const get = f=>tr.querySelector(`[data-f="${f}"]`).value;
    return {id:uid(), value:get('value').trim(), sku:get('sku').trim(), purchase:+get('purchase')||0, sell:+get('sell')||0, stock:+get('stock')||0};
  }).filter(v=>v.value);
}
function openAddProduct(){
  ensureMetaLists();
  _editingProductId = null;
  document.getElementById('productFormTitle').textContent = 'Add New Product';
  _pfImageData = '';
  setProductImagePreview('');
  document.getElementById('pf_name').value = '';
  document.getElementById('pf_sku').value = '';
  document.getElementById('pf_purchase').value = 0;
  document.getElementById('pf_sell').value = 0;
  document.getElementById('pf_stock').value = 0;
  document.getElementById('pf_lowStockAlert').value = 5;
  document.getElementById('pf_variationValues').value = '';
  document.getElementById('pf_variationRows').innerHTML = '';
  document.getElementById('pf_type').value = 'simple';
  fillMetaSelect('pf_category', 'categories', '');
  fillMetaSelect('pf_brand', 'brands', '');
  fillMetaSelect('pf_unit', 'units', '');
  fillTaxSelect('');
  productTypeChanged();
  document.getElementById('productFormModal').classList.add('show');
}
function openEditProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  ensureMetaLists();
  _editingProductId = id;
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  _pfImageData = p.image || '';
  setProductImagePreview(_pfImageData);
  document.getElementById('pf_name').value = p.name;
  document.getElementById('pf_sku').value = p.sku || '';
  document.getElementById('pf_purchase').value = p.purchase || 0;
  document.getElementById('pf_sell').value = p.sell || 0;
  document.getElementById('pf_stock').value = p.stock || 0;
  document.getElementById('pf_lowStockAlert').value = (p.lowStockAlert!==undefined && p.lowStockAlert!==null) ? p.lowStockAlert : 5;
  document.getElementById('pf_variationValues').value = '';
  document.getElementById('pf_variationRows').innerHTML = '';
  if(p.productType==='variable' && Array.isArray(p.variations)){
    p.variations.forEach(v=>addVariationRow(v));
  }
  document.getElementById('pf_type').value = p.productType==='variable' ? 'variable' : 'simple';
  fillMetaSelect('pf_category', 'categories', p.category || '');
  fillMetaSelect('pf_brand', 'brands', p.brand || '');
  fillMetaSelect('pf_unit', 'units', p.unit || '');
  fillTaxSelect(p.taxId || '');
  productTypeChanged();
  document.getElementById('productFormModal').classList.add('show');
}
function closeProductFormModal(savedProductId, productType){
  document.getElementById('productFormModal').classList.remove('show');
  _editingProductId = null;
  if(_pendingPurchaseRestore){
    const restore = _pendingPurchaseRestore;
    _pendingPurchaseRestore = null;
    if(savedProductId && productType==='simple') restore.selectProductKey = savedProductId;
    document.getElementById('purchaseFormModal').classList.add('show');
    populatePurchaseFormModal(restore);
  }
}
function saveProductForm(){
  const name = document.getElementById('pf_name').value.trim();
  if(!name){ showAlertDialog('Please enter the product name.'); return; }
  const type = document.getElementById('pf_type').value;
  const category = document.getElementById('pf_category').value;
  const brand = document.getElementById('pf_brand').value;
  const unit = document.getElementById('pf_unit').value;
  let payload = {emoji:'📦', image:_pfImageData || '', name, category, brand, unit, productType:type, lowStockAlert: Math.max(0, +document.getElementById('pf_lowStockAlert').value || 0), taxId: document.getElementById('pf_tax') ? document.getElementById('pf_tax').value : ''};
  if(type==='variable'){
    const variations = readVariationRows();
    if(!variations.length){ showAlertDialog('Add at least one variation row (or use Generate Rows).'); return; }
    payload.variations = variations;
    payload.sku = payload.sku || '';
    payload.purchase = 0; payload.sell = 0; payload.stock = 0;
  } else {
    const sku = document.getElementById('pf_sku').value.trim();
    payload.sku = sku || ('SKU-'+Math.floor(Math.random()*9000+1000));
    payload.purchase = +document.getElementById('pf_purchase').value || 0;
    payload.sell = +document.getElementById('pf_sell').value || 0;
    payload.stock = +document.getElementById('pf_stock').value || 0;
    payload.variations = [];
  }
  let newId;
  if(_editingProductId){
    const p = state.products.find(x=>x.id===_editingProductId);
    Object.assign(p, payload);
    newId = p.id;
  } else {
    newId = uid();
    state.products.push({id:newId, ...payload});
  }
  save(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  closeProductFormModal(newId, payload.productType);
}
async function deleteProduct(id){
  const ok = await showConfirmDialog('Delete this product?', {danger:true, title:'Delete Product'});
  if(!ok) return;
  state.products = state.products.filter(x=>x.id!==id);
  save(); renderProductsTable(); renderPOSGrid(); renderDashboard();
}

/* ===================== CUSTOMERS ===================== */
function renderCustomersTable(){
  const body = document.getElementById('customersTableBody');
  if(!body) return;
  body.innerHTML = state.customers.map(c=>`<tr>
    <td>${c.name}</td><td>${c.mobile}</td><td>${c.address||'-'}</td><td>${fmt(c.totalPurchase)}</td><td class="danger">${fmt(c.due)}</td><td>${c.lastPurchase}</td>
    <td style="white-space:nowrap"><button class="link" onclick="openEditCustomer('${c.id}')">Edit</button> <button class="link danger" onclick="deleteCustomer('${c.id}')">Delete</button></td>
  </tr>`).join('');
}
function openAddCustomer(){
  openFormModal('Add New Customer', [
    {id:'name', label:'Customer Name', value:''},
    {id:'mobile', label:'Phone Number', value:''},
    {id:'address', label:'Customer Address', value:''},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('Please enter the name.'); return false; }
    state.customers.push({id:uid(), name:v.name, mobile:v.mobile||'-', address:v.address||'', totalPurchase:0, due:0, lastPurchase:'-'});
    save(); renderCustomersTable(); renderPOSCustomers(); renderDashboard();
  });
}
function openEditCustomer(id){
  const c = state.customers.find(x=>x.id===id);
  if(!c) return;
  openFormModal('Edit Customer', [
    {id:'name', label:'Customer Name', value:c.name},
    {id:'mobile', label:'Phone Number', value:c.mobile==='-'?'':c.mobile},
    {id:'address', label:'Customer Address', value:c.address||''},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('Please enter the name.'); return false; }
    c.name = v.name; c.mobile = v.mobile||'-'; c.address = v.address||'';
    save(); renderCustomersTable(); renderPOSCustomers(); renderDashboard();
  });
}
async function deleteCustomer(id){
  const ok = await showConfirmDialog('Delete this customer?', {danger:true, title:'Delete Customer'});
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
  if(!dueCustomers.length){ showAlertDialog('No customer currently has any due.', {icon:'👥'}); return; }
  openFormModal('Receive Payment', [
    {id:'customer', label:'Customer', type:'select', options: dueCustomers.map(c=>({value:c.name, label:`${c.name} (Due: ${fmt(c.due)})`})), value:dueCustomers[0].name},
    {id:'amount', label:'Amount Received', type:'number', value:0},
  ], (v)=>{
    const cust = state.customers.find(c=>c.name===v.customer);
    const amt = +v.amount || 0;
    if(amt<=0){ showAlertDialog('Please enter a valid amount.'); return false; }
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
  openFormModal('Add New Expense', [
    {id:'desc', label:'Description', value:''},
    {id:'amount', label:'Amount', type:'number', value:0},
  ], (v)=>{
    const amt = +v.amount || 0;
    if(!v.desc.trim() || amt<=0){ showAlertDialog('Please enter a description and a valid amount.'); return false; }
    state.cash.push({time: nowTime(), desc:v.desc, type:'out', amount:amt});
    save(); renderCashTable(); renderDashboard();
  });
}

/* ===================== SUPPLIERS ===================== */
function renderSuppliersTable(){
  const body = document.getElementById('suppliersTableBody');
  if(!body) return;
  ensureMetaLists();
  body.innerHTML = state.suppliers.length ? state.suppliers.map(s=>`<tr>
    <td>${s.name}</td><td>${s.phone||'-'}</td><td>${s.address||'-'}</td>
    <td style="white-space:nowrap"><button class="link" onclick="openEditSupplier('${s.id}')">Edit</button> <button class="link danger" onclick="deleteSupplier('${s.id}')">Delete</button></td>
  </tr>`).join('') : `<tr><td colspan="4" class="sub" style="text-align:center;padding:16px 0">No suppliers added yet. Click "+ Add Supplier" to add one.</td></tr>`;
}
function supplierOptionsHTML(){
  ensureMetaLists();
  let html = `<option value="">-- No Supplier (optional) --</option>`;
  html += state.suppliers.map(s=>`<option value="${s.id}">${escapeHtml(s.phone?`${s.name} (${s.phone})`:s.name)}</option>`).join('');
  return html;
}
async function quickAddSupplierInline(selectElId){
  const name = await showPromptDialog('Supplier name:', '', {icon:'🚚', title:'Add New Supplier'});
  if(!name || !name.trim()) return;
  const phone = await showPromptDialog('Phone number (optional):', '', {icon:'📞', title:'Add New Supplier'});
  const address = await showPromptDialog('Address (optional):', '', {icon:'📍', title:'Add New Supplier'});
  ensureMetaLists();
  const supplier = {id:uid(), name:name.trim(), phone:(phone||'').trim(), address:(address||'').trim()};
  state.suppliers.push(supplier);
  save(); renderSuppliersTable();
  const sel = document.getElementById(selectElId);
  if(sel){
    sel.innerHTML = supplierOptionsHTML();
    sel.value = supplier.id;
  }
}
function openAddSupplier(){
  openFormModal('Add New Supplier', [
    {id:'name', label:'Supplier Name', value:''},
    {id:'phone', label:'Phone Number', value:''},
    {id:'address', label:'Supplier Address', value:''},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('Please enter the supplier name.'); return false; }
    state.suppliers.push({id:uid(), name:v.name, phone:v.phone||'', address:v.address||''});
    save(); renderSuppliersTable();
  });
}
function openEditSupplier(id){
  const s = state.suppliers.find(x=>x.id===id);
  if(!s) return;
  openFormModal('Edit Supplier', [
    {id:'name', label:'Supplier Name', value:s.name},
    {id:'phone', label:'Phone Number', value:s.phone||''},
    {id:'address', label:'Supplier Address', value:s.address||''},
  ], (v)=>{
    if(!v.name.trim()){ showAlertDialog('Please enter the supplier name.'); return false; }
    s.name = v.name; s.phone = v.phone||''; s.address = v.address||'';
    save(); renderSuppliersTable(); renderPurchasesTable();
  });
}
async function deleteSupplier(id){
  const ok = await showConfirmDialog('Delete this supplier?', {danger:true, title:'Delete Supplier'});
  if(!ok) return;
  state.suppliers = state.suppliers.filter(x=>x.id!==id);
  save(); renderSuppliersTable();
}

let _pendingPurchaseRestore = null;
function populatePurchaseFormModal(preserve){
  ensureMetaLists();
  const items = getSellableItems();
  const supplierSel = document.getElementById('pu_supplier');
  supplierSel.innerHTML = supplierOptionsHTML();
  const productSel = document.getElementById('pu_product');
  productSel.innerHTML = items.length
    ? items.map(p=>`<option value="${p.key}">${escapeHtml(p.variationValue?`${p.name} (${p.variationValue})`:p.name)}</option>`).join('')
    : `<option value="">-- No products yet, click ＋ to add one --</option>`;
  const paySel = document.getElementById('pu_paymentMethod');
  paySel.innerHTML = PAYMENT_METHODS.map(m=>`<option value="${m.key}">${m.icon} ${m.label}</option>`).join('');
  document.getElementById('pu_invoice').value = 'P-' + Math.floor(Math.random()*9000+1000);
  document.getElementById('pu_qty').value = 1;
  if(preserve){
    if(preserve.supplier) supplierSel.value = preserve.supplier;
    if(preserve.invoice) document.getElementById('pu_invoice').value = preserve.invoice;
    if(preserve.qty) document.getElementById('pu_qty').value = preserve.qty;
    if(preserve.paymentMethod) paySel.value = preserve.paymentMethod;
    if(preserve.selectProductKey) productSel.value = preserve.selectProductKey;
  }
}
function openNewPurchase(){
  populatePurchaseFormModal();
  document.getElementById('purchaseFormModal').classList.add('show');
}
function closePurchaseFormModal(){
  document.getElementById('purchaseFormModal').classList.remove('show');
  _pendingPurchaseRestore = null;
}
function openAddProductFromPurchase(){
  _pendingPurchaseRestore = {
    supplier: document.getElementById('pu_supplier').value,
    invoice: document.getElementById('pu_invoice').value,
    qty: document.getElementById('pu_qty').value,
    paymentMethod: document.getElementById('pu_paymentMethod').value,
  };
  document.getElementById('purchaseFormModal').classList.remove('show');
  openAddProduct();
}
function savePurchaseForm(){
  const supplierId = document.getElementById('pu_supplier').value;
  const invoice = document.getElementById('pu_invoice').value.trim() || ('P-' + Math.floor(Math.random()*9000+1000));
  const productKey = document.getElementById('pu_product').value;
  const qty = +document.getElementById('pu_qty').value || 0;
  const paymentKey = document.getElementById('pu_paymentMethod').value;
  const p = findSellable(productKey);
  if(!p){ showAlertDialog('Please select a product (or add a new one with ＋).'); return; }
  if(qty<=0){ showAlertDialog('Please enter a valid quantity.'); return; }
  const supplier = supplierId ? state.suppliers.find(s=>s.id===supplierId) : null;
  const paymentMethod = PAYMENT_METHODS.find(m=>m.key===paymentKey) || PAYMENT_METHODS[0];
  const total = qty * p.purchase;
  adjustStock(p.key, qty);
  const productName = p.variationValue ? `${p.name} (${p.variationValue})` : p.name;
  state.purchases.push({
    id:uid(), date: todayStr(), supplier: supplier ? supplier.name : 'No Supplier', supplierId: supplier ? supplier.id : '',
    invoice, productId:p.key, productName, items:qty, total, status:'Received', paymentMethod: paymentMethod.key
  });
  state.cash.push({time: nowTime(), desc:'Purchase '+invoice+' ('+paymentMethod.label+')', type:'out', amount: total});
  save(); renderPurchasesTable(); renderProductsTable(); renderPOSGrid(); renderDashboard(); renderCashTable();
  closePurchaseFormModal();
}

/* ===================== PURCHASES ===================== */
function renderPurchasesTable(){
  const body = document.getElementById('purchasesTableBody');
  if(!body) return;
  body.innerHTML = state.purchases.slice().reverse().map(p=>{
    const pm = PAYMENT_METHODS.find(m=>m.key===p.paymentMethod);
    const paymentLabel = pm ? `${pm.icon} ${pm.label}` : '-';
    return `<tr>
    <td>${p.date}</td><td>${p.supplier}</td><td>${p.invoice}</td><td>${p.items}</td><td>${fmt(p.total)}</td><td>${paymentLabel}</td><td><span class="pill">${p.status}</span></td>
    <td>${p.id && p.items>0 ? `<button class="link danger" onclick="processPurchaseReturn('${p.id}')">↩ Return</button>` : '—'}</td>
  </tr>`;
  }).join('');
}

function renderPurchaseReturnsTable(){
  const body = document.getElementById('purchaseReturnsTableBody');
  if(!body) return;
  body.innerHTML = state.purchaseReturns.length ? state.purchaseReturns.slice().reverse().map(r=>`<tr>
    <td>${r.date}</td><td>${r.purchaseInvoice}</td><td>${r.supplier}</td><td>${r.product}</td><td>${r.qty}</td><td>${fmt(r.amount)}</td>
  </tr>`).join('') : `<tr><td colspan="6" class="sub" style="text-align:center;padding:20px 0">No purchase returns yet</td></tr>`;
}
async function processPurchaseReturn(id){
  const pur = state.purchases.find(x=>x.id===id);
  if(!pur) return;
  const product = findSellable(pur.productId);
  const maxQty = product ? Math.min(pur.items, product.stock) : pur.items;
  if(maxQty<=0){ showAlertDialog('Not enough stock available, so return is not possible.', {icon:'📦'}); return; }
  const qtyStr = await showPromptDialog(`How many "${pur.productName}" do you want to return to the supplier?`, maxQty, {icon:'↩️', title:'Purchase Return', type:'number', min:0, max:maxQty, hint:`You can return up to ${maxQty} pcs`, okLabel:'Confirm Return'});
  if(qtyStr===null) return;
  const qty = Math.min(maxQty, Math.max(0, parseInt(qtyStr)||0));
  if(qty<=0) return;
  const unitPrice = pur.items ? pur.total/pur.items : (product ? product.purchase : 0);
  const amount = Math.round(qty*unitPrice);
  if(product) adjustStock(pur.productId, -qty);
  state.purchaseReturns.push({date: todayStr(), purchaseInvoice:pur.invoice, supplier:pur.supplier, product:pur.productName, qty, amount});
  pur.items -= qty;
  pur.total -= amount;
  if(pur.items<=0) pur.status = 'Returned';
  save();
  renderPurchasesTable(); renderPurchaseReturnsTable(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  showAlertDialog('Purchase return completed. Stock has been adjusted.', {icon:'✅'});
}

/* ===================== SALES RETURN ===================== */
function renderReturnsTable(){
  const body = document.getElementById('returnsTableBody');
  if(!body) return;
  body.innerHTML = state.returns.length ? state.returns.slice().reverse().map(r=>`<tr>
    <td>${r.date}</td><td>${r.invoice}</td><td>${r.product}</td><td>${r.qty}</td><td>${fmt(r.amount)}</td>
  </tr>`).join('') : `<tr><td colspan="5" class="sub" style="text-align:center;padding:20px 0">No returns yet</td></tr>`;
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
  if(!sale){ result.innerHTML = `<p class="sub" style="margin-top:10px">"${q}" — No invoice found.</p>`; return; }
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
  const qtyStr = await showPromptDialog(`How many pcs of "${item.name}" to return?`, item.qty, {icon:'↩️', title:'Sales Return', type:'number', min:0, max:item.qty, hint:`You can return up to ${item.qty} pcs`, okLabel:'Confirm Return'});
  if(qtyStr===null) return;
  const qty = Math.min(item.qty, Math.max(0, parseInt(qtyStr)||0));
  if(qty<=0) return;
  if(item.id){ adjustStock(item.id, qty); }
  else { const product = state.products.find(p=>p.name===item.name); if(product) product.stock += qty; }
  const amount = qty*item.price;
  state.returns.push({date: todayStr(), invoice, product:item.name, qty, amount});
  item.qty -= qty;
  if(item.qty<=0) sale.items.splice(itemIndex,1);
  sale.total -= amount;
  save();
  renderReturnsTable(); renderProductsTable(); renderPOSGrid(); renderDashboard();
  searchReturnInvoice();
  showAlertDialog('Return completed. Stock updated.', {icon:'✅'});
}

/* ===================== REPORTS ===================== */
function getReportDateRange(){
  const fromStr = (document.getElementById('reportFrom')||{}).value;
  const toStr = (document.getElementById('reportTo')||{}).value;
  const from = fromStr ? new Date(fromStr+'T00:00:00') : null;
  const to = toStr ? new Date(toStr+'T23:59:59') : null;
  return {from, to};
}
function saleInRange(s, from, to){
  const d = new Date(s.date);
  if(isNaN(d)) return true;
  if(from && d < from) return false;
  if(to && d > to) return false;
  return true;
}
function setReportRange(mode){
  const fromEl = document.getElementById('reportFrom');
  const toEl = document.getElementById('reportTo');
  const now = new Date();
  const toInputDate = (d)=> d.toISOString().slice(0,10);
  if(mode==='today'){
    fromEl.value = toInputDate(now); toEl.value = toInputDate(now);
  } else if(mode==='week'){
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - ((day+6)%7));
    fromEl.value = toInputDate(monday); toEl.value = toInputDate(now);
  } else if(mode==='month'){
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    fromEl.value = toInputDate(first); toEl.value = toInputDate(now);
  } else {
    fromEl.value = ''; toEl.value = '';
  }
  renderReports();
}
function renderReports(){
  const {from, to} = getReportDateRange();
  const filteredSales = state.sales.filter(s=>saleInRange(s, from, to));

  const totalSales = filteredSales.reduce((a,s)=>a+s.total,0);
  const itemsSold = filteredSales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);
  const estProfit = filteredSales.reduce((a,s)=>a+s.items.reduce((b,i)=>{
    const p = state.products.find(x=>x.name===i.name);
    const cost = p ? p.purchase : i.price*0.85;
    return b + (i.price-cost)*i.qty;
  },0),0);
  const dueOutstanding = state.customers.reduce((a,c)=>a+c.due,0);
  setText('statMonthlySales', fmt(totalSales));
  setText('statEstProfit', fmt(estProfit));
  setText('statItemsSold', itemsSold.toLocaleString());
  setText('statDueOutstanding', fmt(dueOutstanding));

  const productAgg = {};
  filteredSales.forEach(s=>{
    s.items.forEach(i=>{
      if(!productAgg[i.name]) productAgg[i.name] = {name:i.name, qty:0, revenue:0};
      productAgg[i.name].qty += i.qty;
      productAgg[i.name].revenue += i.price*i.qty;
    });
  });
  const bestSellers = Object.values(productAgg).sort((a,b)=>b.qty-a.qty).slice(0,8);
  const bsBox = document.getElementById('bestSellersRows');
  if(bsBox){
    bsBox.innerHTML = bestSellers.length ? bestSellers.map((b,i)=>`<div class="row"><div class="rowleft"><div class="ico">${i+1}</div><div><b>${b.name}</b><div class="sub">${b.qty} pcs sold</div></div></div><b>${fmt(b.revenue)}</b></div>`).join('') : `<div class="sub" style="padding:15px 0;text-align:center">No sales in this period</div>`;
  }
}
function exportSalesCSV(){
  if(!state.sales.length){ showAlertDialog('No sales data available to export.'); return; }
  const methodCols = PAYMENT_METHODS.map(m=>m.label).join(',');
  let csv = `Invoice,Date,Time,Customer,Subtotal,Discount,VAT%,VAT Amount,${methodCols},Payment,Total\n`;
  state.sales.forEach(s=>{
    const paid = s.paid || {cash:s.paidCash||0, bkash:s.paidBkash||0};
    const methodVals = PAYMENT_METHODS.map(m=>paid[m.key]||0).join(',');
    csv += `${s.invoice},${s.date},${s.time},"${s.customer}",${s.subtotal||s.total},${s.discount||0},${s.vatPercent||0},${s.vat||0},${methodVals},${s.payment},${s.total}\n`;
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
  const map = {settingStoreName:'storeName', settingPhone:'phone', settingAddress:'address', settingReceiptSize:'receiptSize', settingVatPercent:'vatPercent', settingOwnerName:'ownerName', settingFooterNote:'footerNote', settingStoreCode:'storeCode', settingStoreEmail:'storeEmail', settingWebsite:'website', settingTaxId:'taxId', settingInvoicePrefix:'invoicePrefix', settingDefaultDiscount:'defaultDiscount', settingTermsConditions:'termsConditions'};
  Object.keys(map).forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = s[map[id]] !== undefined ? s[map[id]] : (id==='settingVatPercent' || id==='settingDefaultDiscount' ? 0 : '');
  });
  const symEl = document.getElementById('settingCurrencySymbol');
  if(symEl) symEl.value = s.currencySymbol || '৳';
  const placeEl = document.getElementById('settingCurrencyPlacement');
  if(placeEl) placeEl.value = s.currencyPlacement || 'before';
  const toggle = document.getElementById('settingSignatureToggle');
  if(toggle){
    if(s.showSignature) toggle.classList.add('active');
    else toggle.classList.remove('active');
  }
  const chgToggle = document.getElementById('settingChangeToggle');
  if(chgToggle) chgToggle.classList.toggle('active', s.showChange !== false);
}
function toggleSignatureSetting(){
  const toggle = document.getElementById('settingSignatureToggle');
  toggle.classList.toggle('active');
  state.settings.showSignature = toggle.classList.contains('active');
  save();
}
function toggleChangeSetting(){
  const toggle = document.getElementById('settingChangeToggle');
  toggle.classList.toggle('active');
  state.settings.showChange = toggle.classList.contains('active');
  save();
}

/* ===================== CHANGE PASSWORD ===================== */
function openChangePassword(){
  document.getElementById('passwordModal').classList.add('show');
  document.getElementById('cp_current').value = '';
  document.getElementById('cp_new').value = '';
  document.getElementById('cp_confirm').value = '';
  document.getElementById('cp_error').style.display = 'none';
}
function closePasswordModal(){
  document.getElementById('passwordModal').classList.remove('show');
}
async function submitPasswordChange(){
  const current = document.getElementById('cp_current').value;
  const newPass = document.getElementById('cp_new').value;
  const confirmVal = document.getElementById('cp_confirm').value;
  const errorEl = document.getElementById('cp_error');
  const showErr = (msg)=>{ errorEl.textContent = msg; errorEl.style.display = 'block'; };

  if(!current || !newPass || !confirmVal){ showErr('Please fill in all fields.'); return; }
  if(newPass.length < 6){ showErr('New password must be at least 6 characters.'); return; }
  if(newPass !== confirmVal){ showErr('Passwords do not match.'); return; }

  try{
    await window.Firebase.changePassword(current, newPass);
    closePasswordModal();
    showAlertDialog('Password updated successfully!', {icon:'✅'});
  }catch(e){
    console.error(e);
    let msg = 'Failed to update password. ';
    if(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg += 'Current password is incorrect.';
    else if(e.code === 'auth/requires-recent-login') msg += 'Please log out, log in again, and retry.';
    else if(e.code === 'auth/weak-password') msg += 'New password is too weak.';
    else msg += 'Please try again.';
    showErr(msg);
  }
}
function getShopInitials(name){
  const words = (name||'').trim().split(/\s+/).filter(Boolean);
  if(words.length===0) return 'SB';
  if(words.length===1) return words[0].slice(0,2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
function applyBranding(){
  const s = state.settings;
  const logoImg = document.getElementById('brandLogoImg');
  const nameText = document.getElementById('brandNameText');
  const avatarBtn = document.getElementById('avatarBtn');
  if(logoImg){ if(s.logo){ logoImg.src = s.logo; logoImg.style.display = 'block'; } else { logoImg.style.display = 'none'; } }
  if(nameText) nameText.textContent = s.storeName || 'My Shop';
  if(avatarBtn) avatarBtn.textContent = getShopInitials(s.storeName);
}
function saveSettings(){
  state.settings.storeName = document.getElementById('settingStoreName').value;
  state.settings.phone = document.getElementById('settingPhone').value;
  state.settings.address = document.getElementById('settingAddress').value;
  state.settings.receiptSize = document.getElementById('settingReceiptSize').value;
  state.settings.vatPercent = +document.getElementById('settingVatPercent').value || 0;
  state.settings.ownerName = document.getElementById('settingOwnerName').value;
  state.settings.footerNote = document.getElementById('settingFooterNote').value;
  state.settings.storeCode = document.getElementById('settingStoreCode').value;
  state.settings.storeEmail = document.getElementById('settingStoreEmail').value;
  state.settings.website = document.getElementById('settingWebsite').value;
  state.settings.taxId = document.getElementById('settingTaxId').value;
  state.settings.invoicePrefix = document.getElementById('settingInvoicePrefix').value || 'INV-';
  state.settings.defaultDiscount = Math.min(100, Math.max(0, +document.getElementById('settingDefaultDiscount').value || 0));
  state.settings.termsConditions = document.getElementById('settingTermsConditions').value;
  state.settings.currencySymbol = document.getElementById('settingCurrencySymbol').value;
  state.settings.currencyPlacement = document.getElementById('settingCurrencyPlacement').value;
  save();
  applyBranding();
  showAlertDialog('Settings saved.', {icon:'✅'});
}
/* ===================== PROFILE PANEL (avatar icon) ===================== */
function toggleProfileMenu(){
  fillProfileForm();
  document.getElementById('profileModal').classList.add('show');
}
function closeProfileMenu(){
  document.getElementById('profileModal').classList.remove('show');
}
function livePreviewProfileName(){
  const nameEl = document.getElementById('profileDisplayName');
  const val = document.getElementById('profileStoreName').value;
  if(nameEl) nameEl.textContent = val || 'My Shop';
}
async function confirmLogout(){
  const ok = await showConfirmDialog('Do you want to log out?', {icon:'🚪', title:'Logout', okLabel:'Yes, log out', cancelLabel:'No'});
  if(ok) doLogout();
}
function fillProfileForm(){
  const s = state.settings;
  const emailEl = document.getElementById('loggedInEmail');
  const profEmail = document.getElementById('profileEmail');
  if(profEmail) profEmail.textContent = emailEl ? emailEl.textContent : '';
  const nameEl = document.getElementById('profileDisplayName');
  if(nameEl) nameEl.textContent = s.storeName || 'My Shop';
  const map = {profileStoreName:'storeName', profileOwnerName:'ownerName', profilePhone:'phone', profileAddress:'address', profileFooterNote:'footerNote', profileReceiptSize:'receiptSize'};
  Object.keys(map).forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = s[map[id]] !== undefined ? s[map[id]] : '';
  });
  const preview = document.getElementById('profileLogoPreview');
  const placeholder = document.getElementById('profileLogoPlaceholder');
  const removeBtn = document.getElementById('profileRemoveLogoBtn');
  if(preview){
    if(s.logo){
      preview.src = s.logo; preview.style.display = 'block';
      if(placeholder) placeholder.style.display = 'none';
      if(removeBtn) removeBtn.style.display = 'inline';
    } else {
      preview.style.display = 'none';
      if(placeholder) placeholder.style.display = 'flex';
      if(removeBtn) removeBtn.style.display = 'none';
    }
  }
}
function handleProfileLogoUpload(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(file.size > 1024*1024){ showAlertDialog('Image size must be under 1MB. Please choose a smaller image.', {icon:'⚠️'}); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = function(ev){
    state.settings.logo = ev.target.result;
    save();
    fillProfileForm();
    fillSettingsForm();
    applyBranding();
  };
  reader.readAsDataURL(file);
}
function removeProfileLogo(){
  state.settings.logo = '';
  save();
  fillProfileForm();
  fillSettingsForm();
  applyBranding();
}
function saveProfileSettings(){
  state.settings.storeName = document.getElementById('profileStoreName').value;
  state.settings.ownerName = document.getElementById('profileOwnerName').value;
  state.settings.phone = document.getElementById('profilePhone').value;
  state.settings.address = document.getElementById('profileAddress').value;
  state.settings.footerNote = document.getElementById('profileFooterNote').value;
  state.settings.receiptSize = document.getElementById('profileReceiptSize').value;
  save();
  fillSettingsForm();
  applyBranding();
  showAlertDialog('Profile saved.', {icon:'✅'});
  closeProfileMenu();
}
let _staffListCache = [];
let _editingStaffUid = null;
const PERMISSION_ICONS = {
  dashboard:'⌂', pos:'🛒', products:'▣', barcodePrint:'🏷️',
  customers:'♙', ledger:'৳', cash:'◈', purchases:'＋',
  returns:'↩', reports:'⌁', settings:'⚙'
};
function permissionCardsHTML(checkedKeys){
  checkedKeys = checkedKeys || [];
  return PERMISSION_SCREENS.map(s => {
    const checked = checkedKeys.includes(s.key);
    return `
      <div class="permission-card" data-key="${s.key}" onclick="togglePermissionCard(this)">
        <span class="label"><span class="icon">${PERMISSION_ICONS[s.key] || '📌'}</span> ${s.label}</span>
        <div class="toggle-switch ${checked?'active':''}">
          <div class="thumb"></div>
        </div>
      </div>
    `;
  }).join('');
}
function togglePermissionCard(card){
  const toggle = card.querySelector('.toggle-switch');
  toggle.classList.toggle('active');
}
function getSelectedPermissions(){
  const cards = document.querySelectorAll('#uf_permissionsBox .permission-card');
  const perms = [];
  cards.forEach(card => {
    if(card.querySelector('.toggle-switch.active')) {
      perms.push(card.dataset.key);
    }
  });
  return perms;
}
function applyRoleDefaultsToPermissionChecks(){
  const role = document.getElementById('uf_role').value;
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
  const cards = document.querySelectorAll('#uf_permissionsBox .permission-card');
  cards.forEach(card => {
    const toggle = card.querySelector('.toggle-switch');
    if(defaults.includes(card.dataset.key)) toggle.classList.add('active');
    else toggle.classList.remove('active');
  });
}
async function renderUsersList(){
  const box = document.getElementById('usersListRows');
  if(!box || !currentShopId) return;
  box.innerHTML = '<div class="sub" style="padding:12px 0">Loading staff list...</div>';
  try {
    const [staff, invites] = await Promise.all([
      window.Firebase.listStaffForOwner(currentShopId),
      window.Firebase.listInvitesForOwner(currentShopId)
    ]);
    _staffListCache = staff;
    let rows = '';
    staff.forEach((s,i)=>{
      const phoneBit = s.phone ? ` · ${s.phone}` : '';
      const permCount = Array.isArray(s.permissions) && s.permissions.length ? `${s.permissions.length} permissions` : 'Default role permissions';
      rows += `<div class="row"><div><b>${s.name || s.email}</b><div class="sub">${s.role} · ${s.email}${phoneBit} · ${permCount}</div></div><div style="white-space:nowrap"><button class="link" onclick="openEditUser(${i})">Edit</button> <button class="link danger" onclick="removeStaffUser('${s.uid}')">Remove</button></div></div>`;
    });
    invites.forEach(inv=>{
      const phoneBit = inv.phone ? ` · ${inv.phone}` : '';
      rows += `<div class="row"><div><b>${inv.name || inv.email}</b><div class="sub">${inv.role} · ${inv.email}${phoneBit} · <span style="color:var(--gold)">Waiting for login</span></div></div><button class="link danger" onclick="cancelInvite('${inv.email}')">Cancel</button></div>`;
    });
    box.innerHTML = rows || '<div class="sub" style="padding:10px 0">No staff added yet.</div>';
  } catch(e) {
    console.error(e);
    box.innerHTML = '<div class="sub" style="padding:10px 0">Error loading staff list.</div>';
  }
}
function openAddUser(){
  if(currentRole !== 'Admin'){ showAlertDialog('Only Admin can add new staff.'); return; }
  _editingStaffUid = null;
  document.getElementById('userFormTitle').textContent = 'Add New Staff';
  document.getElementById('uf_name').value = '';
  document.getElementById('uf_email').value = '';
  document.getElementById('uf_email').disabled = false;
  document.getElementById('uf_phone').value = '';
  document.getElementById('uf_address').value = '';
  document.getElementById('uf_role').value = 'Cashier';
  document.getElementById('uf_permissionsBox').innerHTML = permissionCardsHTML(ROLE_DEFAULT_PERMISSIONS['Cashier']);
  document.getElementById('userFormModal').classList.add('show');
}
function openEditUser(i){
  const s = _staffListCache[i];
  if(!s) return;
  _editingStaffUid = s.uid;
  document.getElementById('userFormTitle').textContent = 'Edit Staff Permissions';
  document.getElementById('uf_name').value = s.name || '';
  document.getElementById('uf_email').value = s.email || '';
  document.getElementById('uf_email').disabled = true;
  document.getElementById('uf_phone').value = s.phone || '';
  document.getElementById('uf_address').value = s.address || '';
  document.getElementById('uf_role').value = s.role || 'Cashier';
  document.getElementById('uf_permissionsBox').innerHTML = permissionCardsHTML(Array.isArray(s.permissions) && s.permissions.length ? s.permissions : (ROLE_DEFAULT_PERMISSIONS[s.role]||[]));
  document.getElementById('userFormModal').classList.add('show');
}
function closeUserFormModal(){
  document.getElementById('userFormModal').classList.remove('show');
  _editingStaffUid = null;
}
async function saveUserForm(){
  const name = document.getElementById('uf_name').value.trim();
  const email = document.getElementById('uf_email').value.trim();
  const phone = document.getElementById('uf_phone').value.trim();
  const address = document.getElementById('uf_address').value.trim();
  const role = document.getElementById('uf_role').value;
  const permissions = getSelectedPermissions();
  if(!name){ showAlertDialog('Please enter the name.'); return; }
  if(!email || !email.includes('@')){ showAlertDialog('Please enter a valid email.'); return; }
  if(!permissions.length){ showAlertDialog('Please select at least one permission for this staff member.'); return; }
  try{
    if(_editingStaffUid){
      await window.Firebase.updateStaffPermissions(_editingStaffUid, role, name, phone, address, permissions);
      showAlertDialog('Staff permissions updated.', {icon:'✅'});
    } else {
      await window.Firebase.createInvite(email, currentShopId, role, name, phone, address, permissions);
      await window.Firebase.createStaffAccount(email);
      showAlertDialog(`A password-setup email has been sent to "${email}". Once they set their password via that link and log in, they'll automatically be added to your shop — no Firebase Console needed.`, {icon:'✅', title:'Staff Added'});
    }
    closeUserFormModal();
    await renderUsersList();
  }catch(e){
    console.error(e);
    let msg = 'Could not save staff. Please try again.';
    if(e && e.code === 'auth/email-already-in-use') msg = 'An account already exists with this email.';
    showAlertDialog(msg);
  }
}
async function removeStaffUser(staffUid){
  const ok = await showConfirmDialog('Remove this staff member? Their access to this shop will be revoked.', {danger:true, icon:'⚠️', title:'Remove Staff', okLabel:'Yes, remove'});
  if(!ok) return;
  await window.Firebase.unlinkStaff(staffUid);
  renderUsersList();
}
async function cancelInvite(email){
  await window.Firebase.deleteInvite(email);
  renderUsersList();
}

/* ===================== SUPER ADMIN PANEL (all-shops overview) ===================== */
async function renderAdminPanel(){
  if(currentUid !== SUPER_ADMIN_UID) return;
  const tbody = document.getElementById('adminShopsTableBody');
  if(!tbody) return;

  const searchTerm = (document.getElementById('adminSearch')?.value || '').toLowerCase();

  tbody.innerHTML = '<tr><td colspan="7" class="sub">Loading shops...</td></tr>';

  try {
    const shopsRaw = await window.Firebase.listAllShops();

    let shops = shopsRaw.filter(s => {
      const stateData = s.data || {};
      const shopName = (stateData.settings?.storeName || '').toLowerCase();
      const email = (s.ownerEmail || '').toLowerCase();
      return shopName.includes(searchTerm) || email.includes(searchTerm);
    });

    let totalRevenue = 0;
    let totalStaff = 0;
    shops.forEach(s => {
      const stateData = s.data || {};
      if (stateData.sales) {
        stateData.sales.forEach(sale => totalRevenue += (sale.total || 0));
      }
      if (stateData.users) {
        totalStaff += stateData.users.filter(u => u.role !== 'Admin').length;
      }
    });

    const totalShopsEl = document.getElementById('adminTotalShops');
    if(totalShopsEl) totalShopsEl.textContent = shops.length;
    const totalStaffEl = document.getElementById('adminTotalStaff');
    if(totalStaffEl) totalStaffEl.textContent = totalStaff;
    const totalRevenueEl = document.getElementById('adminTotalRevenue');
    if(totalRevenueEl) totalRevenueEl.textContent = fmt(totalRevenue);

    const totalInvitesEl = document.getElementById('adminTotalInvites');
    if(totalInvitesEl) {
      try {
        const count = await window.Firebase.countInvites();
        totalInvitesEl.textContent = count;
      } catch(e) { totalInvitesEl.textContent = '?'; }
    }

    if (!shops.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="sub">No shops found.</td></tr>';
      return;
    }

    tbody.innerHTML = shops.map(s => {
      const stateData = s.data || {};
      const shopName = stateData.settings?.storeName || s.id.slice(0, 10) + '...';
      const productCount = stateData.products ? stateData.products.length : 0;
      const salesCount = stateData.sales ? stateData.sales.length : 0;
      const staffCount = stateData.users ? stateData.users.filter(u => u.role !== 'Admin').length : 0;
      const updated = s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'Never';

      return `
        <tr>
          <td><strong>${escapeHtml(shopName)}</strong></td>
          <td>${escapeHtml(s.ownerEmail || 'N/A')}</td>
          <td>${productCount}</td>
          <td>${salesCount}</td>
          <td>${staffCount}</td>
          <td>${updated}</td>
          <td>
            <button class="link danger" onclick="deleteShopByAdmin('${s.id}')" title="Delete this shop permanently">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch(e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="7" class="danger">Error loading data.</td></tr>';
  }
}

async function deleteShopByAdmin(shopId){
  if(!currentUid || currentUid !== SUPER_ADMIN_UID) {
    showAlertDialog('Unauthorized action.');
    return;
  }
  const confirmed = await showConfirmDialog(
    `Are you sure you want to permanently delete the shop "${shopId}"? This will remove all its products, sales, customers, and settings. This action cannot be undone!`,
    { danger: true, icon: '⚠️', title: 'Delete Shop', okLabel: 'Yes, Delete Permanently' }
  );
  if(!confirmed) return;

  try {
    await window.Firebase.deleteShop(shopId);
    showAlertDialog('Shop deleted successfully.', { icon: '✅' });
    renderAdminPanel();
  } catch(e) {
    showAlertDialog('Failed to delete shop. Please try again.');
    console.error(e);
  }
}

async function exportAdminCSV(){
  if(currentUid !== SUPER_ADMIN_UID) return;
  try {
    const shopsRaw = await window.Firebase.listAllShops();
    let csv = 'Shop Name,Owner Email,Products,Sales,Staff,Last Updated\n';
    shopsRaw.forEach(s => {
      const stateData = s.data || {};
      const shopName = stateData.settings?.storeName || s.id;
      const productCount = stateData.products ? stateData.products.length : 0;
      const salesCount = stateData.sales ? stateData.sales.length : 0;
      const staffCount = stateData.users ? stateData.users.filter(u => u.role !== 'Admin').length : 0;
      const updated = s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'Never';
      csv += `"${shopName}","${s.ownerEmail || 'N/A'}",${productCount},${salesCount},${staffCount},"${updated}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shops_report_${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    showAlertDialog('Failed to export CSV.');
    console.error(e);
  }
}

/* ===================== INIT ===================== */
function renderAll(){
  ensureMetaLists();
  renderPaymentFields();
  applyBranding();
  renderDashboard();
  renderPOSGrid();
  renderPOSCustomers();
  resetPOSExtras();
  renderProductsTable();
  renderCustomersTable();
  renderLedgerTable();
  renderCashTable();
  renderPurchasesTable();
  renderSuppliersTable();
  renderPurchaseReturnsTable();
  renderReturnsTable();
  renderReports();
  fillSettingsForm();
  renderPaymentMethodsList();
  renderTaxRatesList();
}
function renderPaymentFields(){
  const grid = document.getElementById('paymentFieldsGrid');
  if(grid){
    grid.innerHTML = PAYMENT_METHODS.map((m,i)=>{
      const isLastOdd = (PAYMENT_METHODS.length % 2 === 1 && i === PAYMENT_METHODS.length-1);
      return `<input type="number" id="${m.inputId}" min="0" value="0" oninput="renderCart()" placeholder="${m.icon} ${m.label} ৳"${isLastOdd ? ' style="grid-column:1/-1"' : ''}>`;
    }).join('');
  }
  const qp = document.getElementById('quickPayGrid');
  if(qp){
    qp.innerHTML = PAYMENT_METHODS.map(m=>`<button onclick="quickPay('${m.key}')">Full ${m.label}</button>`).join('') + `<button onclick="quickPay('due')">Full Due</button>`;
  }
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
  const resetMsg = document.getElementById('resetMsg');
  const resetErr = document.getElementById('resetErr');
  if(resetMsg) resetMsg.style.display = 'none';
  if(resetErr) resetErr.style.display = 'none';
}
async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if(!email || !password){ showLoginScreen('Please enter email and password.'); return; }
  try{
    await window.Firebase.login(email, password);
  }catch(e){
    showLoginScreen('Login failed — incorrect email or password.');
  }
}
async function handleForgotPassword(){
  const msgEl = document.getElementById('resetMsg');
  const errEl = document.getElementById('resetErr');
  msgEl.style.display = 'none';
  errEl.style.display = 'none';
  const email = document.getElementById('loginEmail').value.trim();
  if(!email){
    errEl.textContent = 'আগে ইমেইল ঠিকানাটি লিখুন।';
    errEl.style.display = 'block';
    return;
  }
  try{
    await window.Firebase.forgotPassword(email);
    msgEl.textContent = 'রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স চেক করুন।';
    msgEl.style.display = 'block';
  }catch(e){
    console.error(e);
    if(e.code === 'auth/user-not-found'){
      errEl.textContent = 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
    } else if(e.code === 'auth/invalid-email'){
      errEl.textContent = 'সঠিক ইমেইল ঠিকানা লিখুন।';
    } else {
      errEl.textContent = 'ইমেইল পাঠানো যায়নি। ঠিকানা যাচাই করে আবার চেষ্টা করুন।';
    }
    errEl.style.display = 'block';
  }
}
function doLogout(){
  if(unsubscribeState){ unsubscribeState(); unsubscribeState = null; }
  currentUid = null;
  currentShopId = null;
  currentRole = 'Admin';
  currentPermissions = null;
  window.Firebase.logout();
}
function applyPermissions(){
  const effective = currentRole==='Admin'
    ? PERMISSION_SCREENS.map(s=>s.key)
    : (Array.isArray(currentPermissions) && currentPermissions.length ? currentPermissions : (ROLE_DEFAULT_PERMISSIONS[currentRole] || []));

  document.querySelectorAll('[data-screen]').forEach(btn=>{
    const id = btn.getAttribute('data-screen');
    // অ্যাডমিন প্যানেল বাটন শুধুমাত্র সুপার অ্যাডমিন দেখতে পাবে
    if(id === 'admin') {
      btn.style.display = (currentUid === SUPER_ADMIN_UID) ? '' : 'none';
    } else {
      btn.style.display = effective.includes(id) ? '' : 'none';
    }
  });

  const addUserBtn = document.getElementById('addUserBtn');
  if(addUserBtn) addUserBtn.style.display = currentRole==='Admin' ? '' : 'none';

  const resetBtn = document.getElementById('resetDataBtn');
  if(resetBtn) resetBtn.style.display = currentRole==='Admin' ? '' : 'none';

  if(!effective.includes(currentScreenId) && currentScreenId !== 'admin'){
    show('dashboard');
  }
}
let currentScreenId = 'dashboard';
async function initAfterAuth(user){
  showApp();
  const emailEl = document.getElementById('loggedInEmail');
  if(emailEl) emailEl.textContent = user.email;
  currentUid = user.uid;

  // Is this user staff at someone's shop? Check for an existing link first, then check invites
  let link = await window.Firebase.getStaffLink(user.uid);
  if(!link){
    const invite = await window.Firebase.getInvite(user.email);
    if(invite){
      await window.Firebase.linkStaff(user.uid, invite.ownerUid, invite.role, invite.name, user.email, invite.phone, invite.address, invite.permissions);
      await window.Firebase.deleteInvite(user.email);
      link = { ownerUid: invite.ownerUid, role: invite.role, name: invite.name, phone: invite.phone, address: invite.address, permissions: invite.permissions };
    }
  }
  if(link){
    currentShopId = link.ownerUid;
    currentRole = link.role || 'Cashier';
    currentPermissions = Array.isArray(link.permissions) && link.permissions.length ? link.permissions : null;
  } else {
    currentShopId = user.uid; // Independent owner — their own shop
    currentRole = 'Admin';
    currentPermissions = null;
  }
  applyPermissions();

  window.Firebase.loadState(currentShopId).then(async remote=>{
    if(remote){
      state = remote;
    } else {
      state = emptyState();
      await window.Firebase.saveState(currentShopId, state);
    }
    renderAll();
    if(unsubscribeState) unsubscribeState();
    unsubscribeState = window.Firebase.watchState(currentShopId, function(remoteState){
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
  category: ['category'],
  brand: ['brand'],
  unit: ['unit'],
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
  if(typeof XLSX === 'undefined'){ showAlertDialog('Import library is loading, please try again in a moment.', {icon:'⏳'}); return; }
  try{
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, {type:'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
    if(!rows.length){ showAlertDialog('No data found in the file.', {icon:'⚠️'}); return; }

    const ok = await showConfirmDialog(`${rows.length} rows found in the file. Matching SKUs will update existing products; others will be added as new. Continue?`, {icon:'📥', title:'Confirm Import', okLabel:'Yes, import'});
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
      const category = String(m.category||'').trim();
      const brand = String(m.brand||'').trim();
      const unit = String(m.unit||'').trim();
      const existing = sku ? state.products.find(p=>p.sku && p.sku.toLowerCase()===sku.toLowerCase()) : null;
      if(existing){
        existing.name = name;
        existing.purchase = purchase;
        existing.sell = sell;
        existing.stock = stock;
        if(emoji) existing.emoji = emoji;
        if(category) existing.category = category;
        if(brand) existing.brand = brand;
        if(unit) existing.unit = unit;
        updated++;
      } else {
        state.products.push({
          id: uid(),
          emoji: emoji || '📦',
          name, purchase, sell, stock,
          sku: sku || ('SKU-'+Math.floor(Math.random()*9000+1000)),
          category, brand, unit, productType:'simple', variations:[],
        });
        added++;
      }
      ensureMetaLists();
      [['categories',category],['brands',brand],['units',unit]].forEach(([listName,val])=>{
        if(val && !state[listName].some(x=>x.name.toLowerCase()===val.toLowerCase())) state[listName].push({id:uid(), name:val});
      });
    });
    save();
    renderProductsTable(); renderPOSGrid(); renderDashboard();
    let msg = `${added} new products added\n${updated} products updated`;
    if(skipped) msg += `\n${skipped} rows skipped (name was empty)`;
    showAlertDialog(msg, {icon:'✅', title:'Import Complete'});
  }catch(e){
    console.error(e);
    showAlertDialog('Could not read the file. Check that it is a valid .xlsx/.xls/.csv file.', {icon:'❌', title:'Import Failed'});
  }
}
function downloadProductTemplate(){
  if(typeof XLSX === 'undefined'){ showAlertDialog('Library is loading, please try again in a moment.', {icon:'⏳'}); return; }
  const sample = [
    {Name:'Miniket Rice 5kg', SKU:'RC-5001', Purchase:320, Sell:350, Stock:24, Emoji:'🍚', Category:'Grocery', Brand:'Miniket', Unit:'Pieces (Pcs)'},
    {Name:'Example Product', SKU:'EX-0001', Purchase:100, Sell:150, Stock:10, Emoji:'📦', Category:'', Brand:'', Unit:''},
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'product_import_template.xlsx');
}

/* ===== Barcode Print System (Ultimate POS style) — one label per page ===== */
const LABEL_SIZES = {
  'roll_32x25': {label:'Continuous Rolls - 31.75mm x 25.4mm (Default)', width:31.75, height:25.4},
  'roll_38x25': {label:'Continuous Rolls - 38.1mm x 25.4mm', width:38.1, height:25.4},
  'roll_51x25': {label:'Continuous Rolls - 50.8mm x 25.4mm', width:50.8, height:25.4},
  'sticker_64x38': {label:'Stickers - 63.5mm x 38.1mm', width:63.5, height:38.1},
  'sticker_76x51': {label:'Stickers - 76.2mm x 50.8mm', width:76.2, height:50.8},
};
const LABEL_INFO_FIELDS = [
  {id:'business', label:'Business Name', checked:false, size:9},
  {id:'name', label:'Product Name', checked:true, size:11},
  {id:'variation', label:'Product Variation', checked:false, size:9},
  {id:'price', label:'Product Price', checked:true, size:10, hasTaxMode:true},
  {id:'packingDate', label:'Print Packing Date', checked:false, size:8},
  {id:'custom', label:'Custom Field', checked:false, size:8, hasText:true},
  {id:'vatText', label:'Show VAT Text', checked:false, size:7},
  {id:'customLabel', label:'Print Custom Label', checked:false, size:8, hasText:true},
  {id:'lot', label:'Print Lot Number', checked:false, size:7},
];
let labelSelection = {}; // productId -> qty (in-memory only, resets per session)

function renderBarcodePrintScreen(){
  renderLabelInfoFieldsUI();
  const sizeSel = document.getElementById('labelSizeSelect');
  if(sizeSel && !sizeSel.options.length){
    sizeSel.innerHTML = Object.entries(LABEL_SIZES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  }
  renderLabelProductsTable();
}
function renderLabelInfoFieldsUI(){
  const box = document.getElementById('labelInfoFieldsRows');
  if(!box || box.dataset.built) return;
  box.dataset.built = '1';
  box.innerHTML = LABEL_INFO_FIELDS.map(f=>{
    const extra = f.hasTaxMode
      ? `<select id="lf_${f.id}_tax" style="margin-left:8px;padding:6px 8px;border:1px solid var(--line);border-radius:8px"><option value="exc">Exc. Tax</option><option value="inc">Inc. Tax</option></select>`
      : (f.hasText ? `<input id="lf_${f.id}_text" placeholder="Text to print" style="margin-left:8px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;width:160px">` : '');
    return `<div class="row"><div class="rowleft" style="flex-wrap:wrap;gap:8px">
      <input type="checkbox" id="lf_${f.id}_chk" ${f.checked?'checked':''} style="width:16px;height:16px">
      <b>${f.label}</b>${extra}
    </div>
    <div style="display:flex;align-items:center;gap:6px"><small class="sub">Font Size</small><input id="lf_${f.id}_size" type="number" min="5" max="30" value="${f.size}" style="width:56px;padding:6px 8px;border:1px solid var(--line);border-radius:8px"></div>
    </div>`;
  }).join('');
}
function renderLabelProductsTable(){
  const box = document.getElementById('labelProductsTableBody');
  if(!box) return;
  const q = (document.getElementById('labelProductSearch')?.value || '').toLowerCase();
  const list = getSellableItems().filter(p=>!q || p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q));
  box.innerHTML = list.map(p=>{
    const checked = labelSelection.hasOwnProperty(p.key);
    const qty = checked ? labelSelection[p.key] : (p.stock || 1);
    const displayName = p.variationValue ? `${p.name} (${p.variationValue})` : p.name;
    return `<tr>
      <td><input type="checkbox" onchange="toggleLabelProduct('${p.key}', this.checked)" ${checked?'checked':''} style="width:16px;height:16px"></td>
      <td>${productIconHTML(p, 20)} ${displayName}</td>
      <td>${p.sku||'-'}</td>
      <td>${p.stock}</td>
      <td><input type="number" min="1" value="${qty}" onchange="setLabelQty('${p.key}', this.value)" style="width:90px;padding:8px;border:1px solid var(--line);border-radius:8px"></td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" class="sub" style="text-align:center;padding:20px 0">No products found</td></tr>`;
}
function filterLabelProductsTable(){ renderLabelProductsTable(); }
function toggleLabelProduct(key, isChecked){
  if(isChecked){
    const p = findSellable(key);
    labelSelection[key] = p ? (p.stock || 1) : 1;
  } else {
    delete labelSelection[key];
  }
}
function setLabelQty(key, val){
  const qty = Math.max(1, Math.min(1000, parseInt(val)||1));
  if(labelSelection.hasOwnProperty(key)) labelSelection[key] = qty;
}
function toggleAllLabelProducts(select){
  if(select){
    getSellableItems().forEach(p=>{ if(p.sku) labelSelection[p.key] = labelSelection[p.key] || (p.stock || 1); });
  } else {
    labelSelection = {};
  }
  renderLabelProductsTable();
}
function setLabelPageSize(widthMm, heightMm){
  let styleTag = document.getElementById('labelPageSizeStyle');
  if(!styleTag){
    styleTag = document.createElement('style');
    styleTag.id = 'labelPageSizeStyle';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `@page{ size: ${widthMm}mm ${heightMm}mm; margin:0; }`;
}
function readLabelOptions(){
  const opts = {};
  LABEL_INFO_FIELDS.forEach(f=>{
    opts[f.id] = {
      checked: !!document.getElementById(`lf_${f.id}_chk`)?.checked,
      size: parseInt(document.getElementById(`lf_${f.id}_size`)?.value) || f.size,
      text: f.hasText ? (document.getElementById(`lf_${f.id}_text`)?.value || '') : '',
      taxMode: f.hasTaxMode ? (document.getElementById(`lf_${f.id}_tax`)?.value || 'exc') : '',
    };
  });
  return opts;
}
function buildLabelInnerHTML(p, opts){
  let html = '';
  if(opts.business.checked) html += `<div style="font-size:${opts.business.size}px;font-weight:700">${escapeHtml(state.settings.storeName||'My Shop')}</div>`;
  if(opts.name.checked) html += `<div style="font-size:${opts.name.size}px;font-weight:700">${escapeHtml(p.name)}</div>`;
  if(opts.variation.checked && p.variationValue) html += `<div style="font-size:${opts.variation.size}px">${escapeHtml(p.variationValue)}</div>`;
  html += `<svg class="bl-svg" data-sku="${escapeHtml(p.sku)}"></svg>`;
  if(opts.price.checked){
    let priceVal = p.sell;
    if(opts.price.taxMode==='inc') priceVal = p.sell * (1 + (state.settings.vatPercent||0)/100);
    html += `<div style="font-size:${opts.price.size}px;font-weight:800">${fmt(priceVal)}</div>`;
  }
  if(opts.lot.checked && p.lotNumber) html += `<div style="font-size:${opts.lot.size}px">Lot: ${escapeHtml(p.lotNumber)}</div>`;
  if(opts.packingDate.checked) html += `<div style="font-size:${opts.packingDate.size}px">${todayStr()}</div>`;
  if(opts.custom.checked && opts.custom.text) html += `<div style="font-size:${opts.custom.size}px">${escapeHtml(opts.custom.text)}</div>`;
  if(opts.customLabel.checked && opts.customLabel.text) html += `<div style="font-size:${opts.customLabel.size}px">${escapeHtml(opts.customLabel.text)}</div>`;
  if(opts.vatText.checked) html += `<div style="font-size:${opts.vatText.size}px">Incl. VAT</div>`;
  return html;
}
function buildBarcodeLabelUnits(p, qty, opts){
  const inner = buildLabelInnerHTML(p, opts);
  const units = [];
  for(let i=0;i<qty;i++) units.push(`<div class="barcodeLabel">${inner}</div>`);
  return units;
}
function renderBarcodeLabelsAndPrint(items, sizeKey, opts, layout){
  const size = LABEL_SIZES[sizeKey] || LABEL_SIZES['roll_32x25'];
  layout = layout === 'a4' ? 'a4' : 'roll';
  const units = [];
  items.forEach(it=>{ units.push(...buildBarcodeLabelUnits(it.product, it.qty, opts)); });

  let bodyHTML, layoutCSS;
  if(layout === 'a4'){
    // Arrange labels in a grid on standard A4 sheets — good for sticker sheets printed on a normal printer
    const A4_W = 210, A4_H = 297, MARGIN = 8, GAP = 2.5;
    const cols = Math.max(1, Math.floor((A4_W - 2*MARGIN + GAP) / (size.width + GAP)));
    const rows = Math.max(1, Math.floor((A4_H - 2*MARGIN + GAP) / (size.height + GAP)));
    const perPage = cols * rows;
    const pages = [];
    for(let i=0;i<units.length;i+=perPage){ pages.push(units.slice(i, i+perPage)); }
    bodyHTML = pages.map(pageUnits=>`<div class="a4Sheet">${pageUnits.join('')}</div>`).join('');
    layoutCSS = `
  @page{ size:A4; margin:${MARGIN}mm; }
  .a4Sheet{ display:grid; grid-template-columns:repeat(${cols}, ${size.width}mm); grid-auto-rows:${size.height}mm; gap:${GAP}mm; page-break-after:always; break-after:page; }
  .a4Sheet:last-child{ page-break-after:auto; break-after:auto; }
  .barcodeLabel{ width:${size.width}mm; height:${size.height}mm; }`;
  } else {
    // One label = one physical page (for thermal/continuous roll label printers)
    bodyHTML = units.map(u=>`<div class="barcodeLabelPage">${u}</div>`).join('');
    layoutCSS = `
  @page{ size:${size.width}mm ${size.height}mm; margin:0; }
  .barcodeLabelPage{ width:${size.width}mm; height:${size.height}mm; display:flex; align-items:center; justify-content:center; page-break-after:always; break-after:page; background:#fff; margin:0 auto 4px; }
  .barcodeLabelPage:last-child{ page-break-after:auto; break-after:auto; }
  .barcodeLabel{ width:100%; height:100%; }`;
  }

  // Open a brand new tab (like Glorious POS's /labels/preview) so the main app stays untouched
  const win = window.open('', '_blank');
  if(!win){
    showAlertDialog('Please allow pop-ups for this site so the label preview can open in a new tab.', {icon:'⚠️', title:'Pop-up Blocked'});
    return;
  }
  const doc = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Print Labels</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#f2f2f2;font-family:Inter,Segoe UI,"Noto Sans Bengali",sans-serif;${layout==='a4'?'display:flex;flex-direction:column;align-items:center;':''}}
  .barcodeLabel{ padding:1.2mm; border:0.3mm dashed #999; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; background:#fff; box-sizing:border-box; overflow:hidden; }
  .bl-svg{max-width:96%;max-height:62%}
  ${layoutCSS}
  @media print{ body{background:#fff} }
</style>
</head>
<body>
${bodyHTML}
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.12.3/JsBarcode.all.min.js"><\/script>
<script>
window.onload = function(){
  document.querySelectorAll('svg.bl-svg').forEach(function(svg){
    try{ JsBarcode(svg, svg.getAttribute('data-sku'), {format:'CODE128', displayValue:true, fontSize:9, height:26, width:1.3, margin:2}); }catch(e){}
  });
  setTimeout(function(){ window.focus(); window.print(); }, 250);
};
<\/script>
</body></html>`;
  win.document.open();
  win.document.write(doc);
  win.document.close();
}
function previewAndPrintLabels(){
  const items = Object.entries(labelSelection).map(([key,qty])=>{
    const p = findSellable(key);
    return p && p.sku ? {product:p, qty:Math.max(1, Math.min(1000, qty||1))} : null;
  }).filter(Boolean);
  if(!items.length){ showAlertDialog('Select at least one product with a SKU/barcode.', {icon:'⚠️'}); return; }
  const opts = readLabelOptions();
  const sizeKey = document.getElementById('labelSizeSelect')?.value || 'roll_32x25';
  const layout = document.getElementById('labelLayoutSelect')?.value || 'roll';
  renderBarcodeLabelsAndPrint(items, sizeKey, opts, layout);
}
// Quick actions from the Products screen — jump to the Barcode Print screen pre-selected
function printBarcodeLabel(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  const isVariable = p.productType==='variable' && Array.isArray(p.variations) && p.variations.length;
  if(!isVariable && !p.sku){ showAlertDialog('This product has no SKU/barcode set. Please edit it and add a SKU first.', {icon:'⚠️'}); return; }
  labelSelection = {};
  getSellableItems().filter(x=>x.refId===id).forEach(x=>{ if(x.sku) labelSelection[x.key] = x.stock || 1; });
  show('barcodePrint');
  renderBarcodePrintScreen();
}
function printAllBarcodeLabels(){
  const withSku = getSellableItems().filter(p=>p.sku);
  if(!withSku.length){ showAlertDialog('No products have a SKU/barcode set.', {icon:'⚠️'}); return; }
  labelSelection = {};
  withSku.forEach(p=>{ labelSelection[p.key] = Math.max(1, Math.min(50, p.stock||1)); });
  show('barcodePrint');
  renderBarcodePrintScreen();
}

/* ===== Camera Barcode Scanner (webcam-based, no physical scanner needed) ===== */
let cameraScanActive = false;
let lastCameraScanCode = '';
let lastCameraScanTime = 0;
function openCameraScanner(){
  if(typeof Quagga === 'undefined'){
    showAlertDialog('Scanner is loading, please try again in a moment.', {icon:'⏳'});
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
      showAlertDialog('Could not start the camera. Please allow camera permission in your browser.', {icon:'🚫'});
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
  const p = getSellableItems().find(x=>(x.sku||'').toLowerCase() === code.toLowerCase());
  if(p){
    addToCart(p.key);
    closeCameraScanner();
    showAlertDialog(p.name + ' added to cart.', {icon:'✅', title:'Scan Successful'});
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

/* ===== Global barcode scanner listener (works when the POS screen is active) ===== */
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
      const p = getSellableItems().find(x=>(x.sku||'').toLowerCase() === code.toLowerCase());
      if(p) addToCart(p.key);
      else showAlertDialog('Barcode not matched: ' + code, {icon:'🔍'});
    }
    return;
  }
  if(e.key.length === 1){ scanBuffer += e.key; }
  clearTimeout(scanTimer);
  scanTimer = setTimeout(()=>{ scanBuffer = ''; }, 300);
});
/* ===================== NUMBER TO WORDS ===================== */
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const fn = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + fn(n%100) : '');
    if (n < 100000) return fn(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + fn(n%1000) : '');
    if (n < 10000000) return fn(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + fn(n%100000) : '');
    return fn(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + fn(n%10000000) : '');
  };
  return fn(Math.round(num));
}