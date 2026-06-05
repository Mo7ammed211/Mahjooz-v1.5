/* ============================================================
   Mahjooz — Professional Ads Management System
   ============================================================ */

// ─── Translations ───────────────────────────────────────────
(function () {
  if (typeof I18N === 'undefined') return;
  const add = (k, ar, en) => { I18N.ar[k] = ar; I18N.en[k] = en; };
  add('ads_management',   'إدارة الإعلانات',                    'Ads Management');
  add('ad_type_banner',   'بانر',                               'Banner');
  add('ad_type_popup',    'نافذة منبثقة',                       'Popup');
  add('ad_type_slider',   'شريط التمرير',                       'Slider');
  add('ad_type_interstitial', 'بيني',                           'Interstitial');
  add('ad_type_native',   'مدمج',                               'Native');
  add('ad_status_active', 'نشط',                                'Active');
  add('ad_status_paused', 'متوقف',                              'Paused');
  add('ad_status_expired','منتهي',                              'Expired');
  add('ad_status_draft',  'مسودة',                              'Draft');
})();

// ─── Ad Types ───────────────────────────────────────────────
const AD_TYPES = {
  banner:       { icon: '🟦', label: 'بانر' },
  popup:        { icon: '🎯', label: 'نافذة منبثقة' },
  slider:       { icon: '🎠', label: 'سلايدر (شريط متحرك)' },
  interstitial: { icon: '📱', label: 'إعلان بيني (ملء الشاشة)' },
  native:       { icon: '📝', label: 'إعلان مدمج' }
};

// ─── Helper ─────────────────────────────────────────────────
function _adEsc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}

// ─── Ensure AppData.ads is always a valid array, normalize old format ──
function _getAds() {
  if (typeof AppData === 'undefined') return [];
  if (!Array.isArray(AppData.ads)) AppData.ads = [];
  // Normalize old ads that used `active: true/false` instead of `status`
  AppData.ads.forEach(a => {
    if (!a.status && typeof a.active !== 'undefined') {
      a.status = a.active ? 'active' : 'paused';
    }
    if (!a.status) a.status = 'active'; // default
  });
  return AppData.ads;
}

// ─── Main Render ────────────────────────────────────────────
window.renderAdminAds = function () {
  try {
    const ads = _getAds();
    const searchQuery = (typeof State !== 'undefined' ? State.adminSearch || '' : '').toLowerCase();

    const filtered = searchQuery
      ? ads.filter(a => (a.title || '').toLowerCase().includes(searchQuery))
      : ads;

    const totals = {
      active:      ads.filter(a => a.status === 'active').length,
      paused:      ads.filter(a => a.status === 'paused').length,
      totalViews:  ads.reduce((s, a) => s + (a.impressions || 0), 0),
      totalClicks: ads.reduce((s, a) => s + (a.clicks || 0), 0)
    };

    const i18n = (typeof I18N !== 'undefined' && I18N.ar) ? I18N.ar : {};

    // ── Header ──
    let h = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <h2>📢 ${i18n.ads_management || 'إدارة الإعلانات'}</h2>
        <span class="badge badge-teal">${totals.active} نشط</span>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <input type="text" class="form-control" id="admin-ads-search"
          placeholder="🔍 ابحث عن إعلان..."
          value="${_adEsc(searchQuery)}"
          oninput="State.adminSearch=this.value;render();"
          style="width:250px">
        <button class="btn btn-primary" onclick="ph27_showCreateAdModal()">➕ إنشاء إعلان</button>
      </div>
    </div>`;

    // ── Stats ──
    h += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px">
      <div class="stat-card"><div class="stat-num" style="color:#10b981">${totals.active}</div><div class="stat-label">نشط</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#f59e0b">${totals.paused}</div><div class="stat-label">متوقف</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#3b82f6">${totals.totalViews.toLocaleString()}</div><div class="stat-label">المشاهدات</div></div>
      <div class="stat-card"><div class="stat-num" style="color:#8b5cf6">${totals.totalClicks.toLocaleString()}</div><div class="stat-label">النقرات</div></div>
    </div>`;

    // ── Table or Empty ──
    if (filtered.length > 0) {
      h += `<div class="table-wrap"><table class="admin-table"><thead><tr>
        <th>العنوان</th><th>النوع</th><th>الميزانية</th>
        <th>المشاهدات</th><th>النقرات</th><th>الحالة</th><th>إجراءات</th>
      </tr></thead><tbody>`;

      for (const a of filtered) {
        const ctr = a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) : '0.0';
        const statusBadge = { active:'badge-teal', paused:'badge-gold', expired:'badge-rose', draft:'badge-purple' }[a.status] || 'badge-purple';
        const statusIcon  = { active:'🟢', paused:'⏸️', expired:'❌', draft:'📝' }[a.status] || '📝';
        const typeInfo    = AD_TYPES[a.type] || { icon:'📢', label: a.type || '-' };

        h += `<tr>
          <td style="font-weight:700">${_adEsc(a.title)}</td>
          <td><span class="badge badge-purple">${typeInfo.icon} ${i18n['ad_type_' + a.type] || typeInfo.label}</span></td>
          <td style="font-weight:600;color:#10b981">${(a.budget || 0).toLocaleString()} ر</td>
          <td>${(a.impressions || 0).toLocaleString()}</td>
          <td><span style="font-weight:600">${(a.clicks || 0).toLocaleString()}</span> <span style="font-size:11px;color:#8b5cf6">(${ctr}%)</span></td>
          <td><span class="badge ${statusBadge}">${statusIcon} ${i18n['ad_status_' + a.status] || a.status}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-secondary" onclick="ph27_showCreateAdModal('${a.id}')" title="تعديل">✏️</button>
              ${a.status === 'active'
                ? `<button class="btn btn-sm btn-warning" onclick="ph27_toggleStatus('${a.id}','paused')" title="إيقاف مؤقت">⏸️</button>`
                : `<button class="btn btn-sm btn-success" onclick="ph27_toggleStatus('${a.id}','active')" title="تفعيل">▶️</button>`
              }
              <button class="btn btn-sm btn-danger" onclick="ph27_deleteAd('${a.id}')" title="حذف">🗑️</button>
            </div>
          </td>
        </tr>`;
      }

      h += `</tbody></table></div>`;
    } else {
      h += `<div class="empty-state">
        <div class="empty-icon">📢</div>
        <div class="empty-title">لا توجد إعلانات حتى الآن</div>
        <div class="empty-desc">أنشئ أول إعلان لعرضه للمستخدمين</div>
        <button class="btn btn-primary" onclick="ph27_showCreateAdModal()">➕ إنشاء إعلان</button>
      </div>`;
    }

    return h;
  } catch (err) {
    console.error('[Ads] renderAdminAds error:', err);
    return `<div style="padding:40px;text-align:center;color:var(--danger)">خطأ: ${err.message}</div>`;
  }
};

// ─── Show Create / Edit Modal ────────────────────────────────
window.ph27_showCreateAdModal = function (adId) {
  const ads = _getAds();
  const ad  = adId ? ads.find(a => a.id === adId) : null;
  const isEdit = !!ad;

  let typeOpts = '';
  for (const [k, v] of Object.entries(AD_TYPES)) {
    typeOpts += `<option value="${k}"${ad?.type === k ? ' selected' : ''}>${v.icon} ${v.label}</option>`;
  }

  const html = `
  <div class="modal-header">
    <h2 class="modal-title">${isEdit ? '✏️ تعديل إعلان' : '➕ إنشاء إعلان جديد'}</h2>
    <button class="modal-close" onclick="closeModal()">✕</button>
  </div>
  <div style="max-height:72vh;overflow-y:auto;padding:4px 2px">

    <div class="form-group">
      <label class="form-label">العنوان <span style="color:var(--danger)">*</span></label>
      <input class="form-control" id="ph27-title" value="${_adEsc(ad?.title || '')}" placeholder="مثال: خصم 20% على الخدمات">
    </div>

    <div class="form-group">
      <label class="form-label">الوصف</label>
      <textarea class="form-control" id="ph27-desc" rows="3" placeholder="وصف مختصر للإعلان...">${_adEsc(ad?.description || '')}</textarea>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">نوع الإعلان</label>
        <select class="form-control" id="ph27-type">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">الميزانية (ر)</label>
        <input class="form-control" id="ph27-budget" type="number" min="0" value="${ad?.budget || 0}">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">تاريخ البدء</label>
        <input class="form-control" id="ph27-start" type="date" value="${(ad?.startDate || '').split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الانتهاء</label>
        <input class="form-control" id="ph27-end" type="date" value="${(ad?.endDate || '').split('T')[0]}">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">الأولوية (1 = أعلى)</label>
        <input class="form-control" id="ph27-priority" type="number" min="1" max="10" value="${ad?.priority || 5}">
      </div>
      <div class="form-group">
        <label class="form-label">رابط الإعلان</label>
        <input class="form-control" id="ph27-url" value="${_adEsc(ad?.targetUrl || '')}" placeholder="https://...">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">صورة الإعلان ${isEdit ? '(اتركه فارغاً للإبقاء على الصورة الحالية)' : ''}</label>
      <input class="form-control" id="ph27-img" type="file" accept="image/*"
        onchange="ph27_checkImgSize(this)">
      <small id="ph27-img-hint" style="color:var(--text-muted);font-size:11px;margin-top:4px;display:block">
        📌 يُفضّل صور أقل من 2MB — يتم الضغط تلقائياً للحفظ
      </small>
    </div>

    <div style="display:flex;gap:12px;margin-top:20px">
      <button class="btn btn-primary btn-block" id="ph27-save-btn"
        onclick="ph27_saveAd('${adId || ''}')">
        ${isEdit ? '💾 حفظ التغييرات' : '✅ إنشاء الإعلان'}
      </button>
      <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
    </div>

  </div>`;

  openModal(html);
};

// ─── Save Ad (Create or Update) ─────────────────────────────
window.ph27_saveAd = async function (adId) {
  // Disable button to prevent double submit
  const btn = document.getElementById('ph27-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري الحفظ...'; }

  try {
    const title = (document.getElementById('ph27-title')?.value || '').trim();
    if (!title) {
      if (typeof toast === 'function') toast('يرجى إدخال عنوان الإعلان', 'error');
      if (btn) { btn.disabled = false; btn.textContent = adId ? '💾 حفظ التغييرات' : '✅ إنشاء الإعلان'; }
      return;
    }

    const ads    = _getAds();
    const oldAd  = adId ? ads.find(a => a.id === adId) : null;

    const data = {
      title,
      description: (document.getElementById('ph27-desc')?.value || '').trim(),
      type:        document.getElementById('ph27-type')?.value || 'banner',
      budget:      parseInt(document.getElementById('ph27-budget')?.value) || 0,
      startDate:   document.getElementById('ph27-start')?.value || '',
      endDate:     document.getElementById('ph27-end')?.value || '',
      priority:    parseInt(document.getElementById('ph27-priority')?.value) || 5,
      targetUrl:   (document.getElementById('ph27-url')?.value || '').trim(),
      status:      oldAd?.status || 'active',
      impressions: oldAd?.impressions || 0,
      clicks:      oldAd?.clicks     || 0,
      spent:       oldAd?.spent      || 0,
    };

    // Handle image upload — compress before saving to stay under Firestore 1MB limit
    const file = document.getElementById('ph27-img')?.files?.[0];
    if (file) {
      data.imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Resize: max 800px width or height, maintaining aspect ratio
            const MAX_SIZE = 800;
            let w = img.width;
            let h = img.height;
            if (w > MAX_SIZE || h > MAX_SIZE) {
              if (w > h) {
                h = Math.round(h * (MAX_SIZE / w));
                w = MAX_SIZE;
              } else {
                w = Math.round(w * (MAX_SIZE / h));
                h = MAX_SIZE;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width  = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            // Compress to JPEG, quality 0.72 — keeps result ~150-400KB
            let quality = 0.72;
            let result = canvas.toDataURL('image/jpeg', quality);

            // If still too large (>700KB base64 ≈ ~525KB binary), reduce quality further
            while (result.length > 700_000 && quality > 0.3) {
              quality -= 0.1;
              result = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(result);
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else if (oldAd?.imageBase64) {
      data.imageBase64 = oldAd.imageBase64; // keep existing
    }

    if (adId) {
      // ── Update ──
      await fsUpdate('ads', adId, data);
      // Update local cache immediately
      const idx = AppData.ads.findIndex(a => a.id === adId);
      if (idx !== -1) AppData.ads[idx] = { ...AppData.ads[idx], ...data };
      if (typeof toast === 'function') toast('✅ تم تحديث الإعلان', 'success');
    } else {
      // ── Create ──
      const newId = await fsAdd('ads', data);
      // Add to local cache immediately so UI updates without full reload
      if (!Array.isArray(AppData.ads)) AppData.ads = [];
      AppData.ads.unshift({ id: newId, ...data, createdAt: new Date().toISOString() });
      if (typeof toast === 'function') toast('✅ تم إنشاء الإعلان', 'success');
    }

    if (typeof closeModal === 'function') closeModal();
    if (typeof render === 'function') await render();

  } catch (err) {
    console.error('[Ads] ph27_saveAd error:', err);
    if (typeof toast === 'function') toast('خطأ: ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = adId ? '💾 حفظ التغييرات' : '✅ إنشاء الإعلان'; }
  }
};

// ─── Toggle Status ───────────────────────────────────────────
window.ph27_toggleStatus = async function (adId, newStatus) {
  try {
    await fsUpdate('ads', adId, { status: newStatus });
    // Update local cache
    const ad = _getAds().find(a => a.id === adId);
    if (ad) ad.status = newStatus;
    if (typeof toast === 'function') toast(newStatus === 'active' ? '✅ تم تفعيل الإعلان' : '⏸️ تم إيقاف الإعلان', 'success');
    if (typeof render === 'function') await render();
  } catch (err) {
    console.error('[Ads] ph27_toggleStatus error:', err);
    if (typeof toast === 'function') toast('خطأ: ' + err.message, 'error');
  }
};

// ─── Delete Ad ───────────────────────────────────────────────
window.ph27_deleteAd = async function (adId) {
  if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
  try {
    await fsDelete('ads', adId);
    // Remove from local cache immediately
    if (Array.isArray(AppData.ads)) {
      AppData.ads = AppData.ads.filter(a => a.id !== adId);
    }
    if (typeof toast === 'function') toast('🗑️ تم حذف الإعلان', 'success');
    if (typeof render === 'function') await render();
  } catch (err) {
    console.error('[Ads] ph27_deleteAd error:', err);
    if (typeof toast === 'function') toast('خطأ: ' + err.message, 'error');
  }
};

// ─── Edit shortcut ───────────────────────────────────────────
window.ph27_showEditAdModal = function (adId) {
  window.ph27_showCreateAdModal(adId);
};

// ─── Image Size Warning ──────────────────────────────────────
window.ph27_checkImgSize = function (input) {
  const hint = document.getElementById('ph27-img-hint');
  if (!hint || !input.files?.[0]) return;
  const sizeMB = (input.files[0].size / 1024 / 1024).toFixed(1);
  if (input.files[0].size > 2 * 1024 * 1024) {
    hint.innerHTML = `⚠️ الصورة كبيرة (${sizeMB} MB) — سيتم ضغطها تلقائياً قبل الحفظ`;
    hint.style.color = '#f59e0b';
  } else {
    hint.innerHTML = `✅ الصورة مناسبة (${sizeMB} MB)`;
    hint.style.color = '#10b981';
  }
};

console.log('[Ads] Professional Ads System v2.0 loaded.');