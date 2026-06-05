/* ============================================================
   phase34.js — خدمة المشاركة الموحدة (Unified Share Service)
   ============================================================ */

(function () {
  if (typeof I18N === 'undefined') return;

  const add = (k, ar, en) => { I18N.ar[k] = ar; I18N.en[k] = en; };

  add('share', 'مشاركة', 'Share');
  add('share_service', 'مشاركة الخدمة', 'Share Service');
  add('share_via', 'مشاركة عبر', 'Share Via');
  add('copy_link', 'نسخ الرابط', 'Copy Link');
  add('link_copied', 'تم نسخ الرابط بنجاح', 'Link Copied');
  add('share_whatsapp', 'مشاركة واتساب', 'Share WhatsApp');
  add('share_facebook', 'مشاركة فيسبوك', 'Share Facebook');
  add('share_twitter', 'مشاركة تويتر', 'Share Twitter');
  add('share_email', 'مشاركة بريد', 'Share Email');
  add('invite_friend', 'دعوة صديق', 'Invite Friend');
  add('invite_message', 'رؤية خدمة رائعة! جربها', 'Check out this amazing service!');

})();

// ============================================================
// Generic Unified Share System
// ============================================================

window.ph34_shareItem = async function(type, id, extra = {}) {
  let title = '';
  let text = '';
  let url = '';
  let icon = '🔷';
  let subText = '';
  let priceText = '';

  if (type === 'service') {
    const s = AppData.services.find(svc => svc.id === id);
    if (!s) return;
    title = s.name;
    icon = s.icon || '🔷';
    subText = s.desc || '';
    priceText = s.price ? `${s.price.toLocaleString('ar-YE')} ريال` : '';
    text = `رؤية خدمة مميزة: ${s.name}\n${s.price ? `السعر: ${s.price.toLocaleString('ar-YE')} ريال\n` : ''}${s.desc ? `الوصف: ${s.desc}\n` : ''}`;
    url = `${window.location.origin}?page=service&id=${id}`;
  } else if (type === 'store') {
    const s = AppData.stores.find(str => str.id === id);
    if (!s) return;
    title = s.name;
    icon = s.icon || '🏪';
    subText = s.desc || '';
    text = `رؤية متجر رائع على منصة محجوز: ${s.name}\n${s.desc ? `الوصف: ${s.desc}\n` : ''}`;
    url = `${window.location.origin}?page=store&storeId=${id}`;
  } else if (type === 'product') {
    const p = AppData.storeProducts.find(prod => prod.id === id);
    if (!p) return;
    title = p.name;
    icon = p.icon || '🛍️';
    subText = p.desc || '';
    priceText = p.price ? `${p.price.toLocaleString('ar-YE')} ريال` : '';
    text = `رؤية منتج مميز: ${p.name}\n${p.price ? `السعر: ${p.price.toLocaleString('ar-YE')} ريال\n` : ''}${p.desc ? `الوصف: ${p.desc}\n` : ''}`;
    const storeId = extra.storeId || p.storeId;
    url = `${window.location.origin}?page=store&storeId=${storeId}&productId=${id}`;
  } else if (type === 'category') {
    const c = AppData.cats.find(cat => cat.id === id);
    if (!c) return;
    const section = extra.section || c.section || 'bookings';
    title = c.name;
    icon = c.icon || '📂';
    subText = c.description || '';
    text = `تصفح تصنيف ${c.name} على منصة محجوز:\n${c.description ? `الوصف: ${c.description}\n` : ''}`;
    url = `${window.location.origin}?page=listing&section=${section}&catId=${id}`;
  } else if (type === 'region') {
    const r = AppData.regions.find(reg => reg.id === id);
    if (!r) return;
    title = r.name;
    icon = '📍';
    subText = `الفرع/المنطقة: ${r.name}`;
    text = `تصفح الخدمات والمنتجات المتاحة في فرع: ${r.name} على منصة محجوز\n`;
    url = `${window.location.origin}?page=home&regionId=${id}`;
  } else {
    return;
  }

  // حفظ تفاصيل المشاركة الحالية للحدث
  window.__ph34_currentShare = { type, id, title, text, url, icon, subText, priceText };

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">📤 ${I18N.ar.share || 'مشاركة'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    
    <div class="ph34-service-preview" style="background:var(--bg-card);padding:16px;border-radius:12px;margin-bottom:20px;text-align:center;border:1px solid var(--glass-border)">
      <div style="font-size:42px;margin-bottom:8px">${icon}</div>
      <div style="font-weight:800;font-size:18px;color:var(--text-main)">${escHtml(title)}</div>
      ${subText ? `<div style="color:var(--text-muted);font-size:13px;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis">${escHtml(subText)}</div>` : ''}
      ${priceText ? `<div style="font-size:20px;font-weight:900;color:var(--primary);margin-top:8px">${priceText}</div>` : ''}
    </div>
    
    <div class="ph34-share-options">
      <button class="ph34-share-btn" onclick="ph34_copySharedLink()" style="background:var(--primary)">
        <span style="font-size:20px">🔗</span>
        <span>${I18N.ar.copy_link || 'نسخ الرابط'}</span>
      </button>
      
      <button class="ph34-share-btn" style="background:#25d366" onclick="ph34_shareWhatsAppGeneric()">
        <span style="font-size:20px">💬</span>
        <span>${I18N.ar.share_whatsapp || 'مشاركة واتساب'}</span>
      </button>
      
      <button class="ph34-share-btn" style="background:#1877f2" onclick="ph34_shareFacebookGeneric()">
        <span style="font-size:20px">📘</span>
        <span>${I18N.ar.share_facebook || 'مشاركة فيسبوك'}</span>
      </button>
      
      <button class="ph34-share-btn" style="background:#1da1f2" onclick="ph34_shareTwitterGeneric()">
        <span style="font-size:20px">🐦</span>
        <span>${I18N.ar.share_twitter || 'مشاركة تويتر'}</span>
      </button>
      
      <button class="ph34-share-btn" style="background:#ea4335" onclick="ph34_shareEmailGeneric()">
        <span style="font-size:20px">📧</span>
        <span>${I18N.ar.share_email || 'مشاركة بريد إلكتروني'}</span>
      </button>
    </div>
  `);
};

// --- Legacy Wrapper ---
window.ph34_shareService = async function(serviceId) {
  return window.ph34_shareItem('service', serviceId);
};

// --- Copy & Share Helpers ---
window.ph34_copySharedLink = async function() {
  const url = window.__ph34_currentShare?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    toast(I18N.ar.link_copied || 'تم نسخ الرابط بنجاح', 'success');
  } catch(e) {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toast(I18N.ar.link_copied || 'تم نسخ الرابط بنجاح', 'success');
  }
};

window.ph34_shareWhatsAppGeneric = function() {
  const info = window.__ph34_currentShare;
  if (!info) return;
  const msg = `${info.text}\nالرابط: ${info.url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

window.ph34_shareFacebookGeneric = function() {
  const info = window.__ph34_currentShare;
  if (!info) return;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(info.url)}`, '_blank');
};

window.ph34_shareTwitterGeneric = function() {
  const info = window.__ph34_currentShare;
  if (!info) return;
  const tweet = `${info.title}\n${info.url}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
};

window.ph34_shareEmailGeneric = function() {
  const info = window.__ph34_currentShare;
  if (!info) return;
  const subject = info.title;
  const body = `مرحباً!\n\nرؤية هذا الرابط المشترك من منصة ${AppData.appName || 'محجوز'}:\n\n${info.text}\n\nالرابط: ${info.url}`;
  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
};

// ============================================================
// Invite Friend (Referral)
// ============================================================

window.ph34_inviteFriend = async function() {
  const referalCode = State.currentUser?.referralCode || ('REF' + Date.now().toString(36).toUpperCase());
  const url = `${window.location.origin}?ref=${referalCode}`;
  
  const text = `مرحباً!\n\nانضم لي في ${AppData.appName || 'محجوز'} - منصة الخدمات الرائدة!\n\nسجل عبر الرابط التالي واحصل على خصم:\n${url}\n\nتحياتي!`;
  
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">👥 ${I18N.ar.invite_friend}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:16px">🎁</div>
      <p style="margin-bottom:16px">دعوة صديق واستلم مكافأتك بعد أول طلب!</p>
      
      <div style="background:var(--bg-card);padding:16px;border-radius:12px;margin:20px 0">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">رابط الدعوة</div>
        <div style="font-size:18px;font-weight:700;word-break:break-all">${url}</div>
      </div>
      
      <button class="btn btn-primary btn-block" onclick="ph34_copyReferralLink('${url}')">
        🔗 نسخ رابط الدعوة
      </button>
      
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-secondary" style="flex:1;background:#25d366;color:#fff;border:none" onclick="window.open('https://wa.me/?text=${encodeURIComponent(text)}','_blank')">
          💬 واتساب
        </button>
      </div>
    </div>
  `);
};

window.ph34_copyReferralLink = async function(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast(I18N.ar.link_copied || 'تم نسخ الرابط بنجاح', 'success');
  } catch(e) {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toast(I18N.ar.link_copied || 'تم نسخ الرابط بنجاح', 'success');
  }
};

// ============================================================
// Add Styles
// ============================================================

(function() {
  if (window.ph34_stylesAdded) return;
  window.ph34_stylesAdded = true;
  
  const style = document.createElement('style');
  style.textContent = `
    .ph34-share-options { display: flex; flex-direction: column; gap: 8px; }
    .ph34-share-btn { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 16px; border: none; border-radius: 12px; color: #fff; font-weight: 600; cursor: pointer; transition: transform 0.2s; text-align: center; }
    .ph34-share-btn:hover { transform: translateY(-2px); }
    
    .btn-share {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 7px 13px; border-radius: 10px; font-size: 13px; font-weight: 700;
      background: rgba(139, 92, 246, 0.08); color: var(--primary); border: 1.5px solid rgba(139, 92, 246, 0.25);
      text-decoration: none; cursor: pointer; transition: all 0.18s;
      white-space: nowrap;
    }
    .btn-share svg { width: 15px; height: 15px; flex-shrink: 0; }
    .btn-share:hover { background: var(--primary); color: #fff; border-color: var(--primary);
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35); transform: translateY(-1px); }
    .btn-share--full { display: flex; width: 100%; border-radius: 10px; justify-content: center;
      padding: 9px 13px; font-size: 13px; }
  `;
  document.head.appendChild(style);
})();

console.log('[Phase 34] Share Service System loaded');