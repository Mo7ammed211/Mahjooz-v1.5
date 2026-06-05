// ═══════════════════════════════════════════════════════
//  محجوز — نظام الوسائط الذكي v1.0
//  Smart Media Upload: Auto-compress images + Video support
// ═══════════════════════════════════════════════════════
// الضغط عبر Canvas API (مجاني، بدون مكتبات خارجية)
// الفيديو: رفع مباشر مع شريط تقدم حقيقي
// ═══════════════════════════════════════════════════════

(function() {
  'use strict';

  // ─── الإعدادات الافتراضية ────────────────────────────
  const DEFAULTS = {
    image: {
      maxWidthHeight: 1280,   // أقصى بُعد بالبكسل
      quality:        0.82,   // جودة JPEG (0.82 = لا فرق محسوس مع توفير 80%)
      maxSizeKB:      350,    // نستهدف ≤ 350 KB
      format:         'image/jpeg',
    },
    video: {
      maxSizeMB: 50,          // 50 MB حد أقصى
      allowedTypes: ['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mov'],
      allowedExts: ['.mp4','.webm','.mov','.avi'],
    }
  };

  // ─── 1. ضغط الصورة ────────────────────────────────────
  /**
   * يضغط ملف صورة باستخدام Canvas API
   * @param {File} file — ملف الصورة الأصلي
   * @param {Object} opts — خيارات الضغط (اختيارية)
   * @returns {Promise<{blob: Blob, url: string, originalKB: number, compressedKB: number, ratio: string}>}
   */
  window.mUpload_compressImage = async function(file, opts = {}) {
    const cfg = { ...DEFAULTS.image, ...opts };

    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('الملف ليس صورة صالحة'));
        return;
      }

      const originalKB = Math.round(file.size / 1024);

      // إذا الصورة أصغر من الحد المستهدف بالفعل
      if (file.size <= cfg.maxSizeKB * 1024 && file.type === 'image/jpeg') {
        const url = URL.createObjectURL(file);
        resolve({ blob: file, url, originalKB, compressedKB: originalKB, ratio: '0%' });
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const max = cfg.maxWidthHeight;

        // تصغير الأبعاد مع الحفاظ على النسبة
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round(height * max / width);
            width  = max;
          } else {
            width  = Math.round(width * max / height);
            height = max;
          }
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // ضغط تكيفي: إذا لم يصل للحجم المستهدف، نقلل الجودة تدريجياً
        let quality = cfg.quality;
        let blob;

        const tryCompress = () => {
          canvas.toBlob(
            (b) => {
              if (!b) { reject(new Error('فشل ضغط الصورة')); return; }
              blob = b;
              const compressedKB = Math.round(b.size / 1024);

              // إذا لازلنا فوق الحجم المستهدف وبإمكاننا تقليل الجودة أكثر
              if (compressedKB > cfg.maxSizeKB && quality > 0.5) {
                quality -= 0.08;
                tryCompress();
                return;
              }

              const url   = URL.createObjectURL(b);
              const ratio = originalKB > 0
                ? Math.round((1 - compressedKB / originalKB) * 100) + '%'
                : '0%';
              resolve({ blob: b, url, originalKB, compressedKB, ratio });
            },
            cfg.format,
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => reject(new Error('تعذّر قراءة الصورة'));
      reader.onerror = () => reject(new Error('تعذّر تحميل الملف'));
      reader.readAsDataURL(file);
    });
  };

  // ─── 2. رفع الصورة (مع ضغط تلقائي) ────────────────────
  /**
   * يضغط الصورة ثم يرفعها لـ Firebase Storage
   * @param {File} file — ملف الصورة
   * @param {string} storagePath — المسار في Storage مثل 'images/services/abc123'
   * @param {Function} [onProgress] — callback(percent)
   * @returns {Promise<string>} — رابط الصورة المرفوعة
   */
  window.mUpload_uploadImage = async function(file, storagePath, onProgress = null) {
    if (!file) throw new Error('لم يتم اختيار صورة');
    if (!window.firebase || !firebase.storage) throw new Error('Firebase Storage غير مهيأ');

    // ضغط الصورة
    let uploadBlob = file;
    try {
      const result = await window.mUpload_compressImage(file);
      uploadBlob = result.blob;
      console.log(`[MediaUpload] صورة مضغوطة: ${result.originalKB}KB → ${result.compressedKB}KB (وُفِّر ${result.ratio})`);
    } catch(compErr) {
      console.warn('[MediaUpload] تعذّر الضغط، سيتم الرفع بدونه:', compErr.message);
    }

    return new Promise((resolve, reject) => {
      const ref  = firebase.storage().ref(storagePath);
      const task = ref.put(uploadBlob, { contentType: 'image/jpeg' });

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
          if (onProgress) onProgress(pct);
        },
        (err) => reject(err),
        async () => {
          try {
            const url = await task.snapshot.ref.getDownloadURL();
            resolve(url);
          } catch(e) { reject(e); }
        }
      );
    });
  };

  // ─── 3. التحقق من الفيديو ──────────────────────────────
  /**
   * يتحقق من صلاحية ملف فيديو
   * @param {File} file
   * @returns {{ valid: boolean, error?: string }}
   */
  window.mUpload_validateVideo = function(file) {
    if (!file) return { valid: false, error: 'لم يتم اختيار فيديو' };

    const cfg   = DEFAULTS.video;
    const sizeMB = file.size / (1024 * 1024);
    const ext   = '.' + file.name.split('.').pop().toLowerCase();

    if (sizeMB > cfg.maxSizeMB) {
      return { valid: false, error: `حجم الفيديو ${sizeMB.toFixed(1)} MB يتجاوز الحد الأقصى ${cfg.maxSizeMB} MB` };
    }

    const typeOk = cfg.allowedTypes.includes(file.type) || file.type.startsWith('video/');
    const extOk  = cfg.allowedExts.includes(ext);

    if (!typeOk && !extOk) {
      return { valid: false, error: `نوع الملف غير مدعوم. المدعوم: MP4, WebM, MOV` };
    }

    return { valid: true };
  };

  // ─── 4. رفع الفيديو ────────────────────────────────────
  /**
   * يرفع فيديو لـ Firebase Storage مع شريط تقدم
   * @param {File} file — ملف الفيديو
   * @param {string} storagePath — المسار في Storage مثل 'videos/services/abc123'
   * @param {Function} [onProgress] — callback(percent, bytesUploaded, totalBytes)
   * @returns {Promise<string>} — رابط الفيديو
   */
  window.mUpload_uploadVideo = async function(file, storagePath, onProgress = null) {
    const check = window.mUpload_validateVideo(file);
    if (!check.valid) throw new Error(check.error);

    if (!window.firebase || !firebase.storage) throw new Error('Firebase Storage غير مهيأ');

    console.log(`[MediaUpload] رفع فيديو: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    return new Promise((resolve, reject) => {
      const ref  = firebase.storage().ref(storagePath);
      const meta = { contentType: file.type || 'video/mp4' };
      const task = ref.put(file, meta);

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100);
          if (onProgress) onProgress(pct, snap.bytesTransferred, snap.totalBytes);
        },
        (err) => {
          console.error('[MediaUpload] خطأ في رفع الفيديو:', err);
          reject(err);
        },
        async () => {
          try {
            const url = await task.snapshot.ref.getDownloadURL();
            console.log('[MediaUpload] ✅ تم رفع الفيديو:', url.substring(0, 80) + '...');
            resolve(url);
          } catch(e) { reject(e); }
        }
      );
    });
  };

  // ─── 5. واجهة منتقي الوسائط ────────────────────────────
  /**
   * يُنتج HTML لواجهة رفع الصورة والفيديو معاً
   * @param {Object} opts
   * @param {string} opts.imageId — معرّف حقل الصورة
   * @param {string} opts.videoId — معرّف حقل الفيديو
   * @param {string} [opts.currentImageUrl] — رابط الصورة الحالية
   * @param {string} [opts.currentVideoUrl] — رابط الفيديو الحالي
   * @param {boolean} [opts.imageRequired=false]
   * @param {boolean} [opts.showVideo=true]
   * @returns {string} HTML
   */
  window.mUpload_renderMediaFields = function(opts = {}) {
    const {
      imageId           = 'mu-image',
      videoId           = 'mu-video',
      currentImageUrl   = '',
      currentVideoUrl   = '',
      imageRequired     = false,
      showVideo         = true,
    } = opts;

    const imgPreviewId  = imageId + '-preview';
    const vidPreviewId  = videoId + '-preview';
    const imgProgressId = imageId + '-prog';
    const vidProgressId = videoId + '-prog';

    return `
    <!-- ══ حقل الصورة ══ -->
    <div class="mu-field-wrap">
      <label class="mu-label">
        🖼️ الصورة${imageRequired ? ' <span style="color:#ef4444">*</span>' : ''}
        <span class="mu-hint">يُفضّل أقل من 2 MB — سيتم الضغط تلقائياً</span>
      </label>

      <div class="mu-drop-zone" id="${imageId}-zone" onclick="document.getElementById('${imageId}').click()"
        ondragover="event.preventDefault();this.classList.add('mu-drag-over')"
        ondragleave="this.classList.remove('mu-drag-over')"
        ondrop="event.preventDefault();this.classList.remove('mu-drag-over');mUpload_handleImageDrop(event,'${imageId}')">
        <input type="file" id="${imageId}" accept="image/*" style="display:none" onclick="event.stopPropagation()"
          onchange="mUpload_previewImage(this,'${imgPreviewId}','${imgProgressId}')">
        <div id="${imgPreviewId}" class="mu-preview-area">
          ${currentImageUrl
            ? `<img src="${currentImageUrl}" class="mu-thumb" alt="الصورة الحالية">
               <div class="mu-overlay-label">📷 انقر لتغيير الصورة</div>`
            : `<div class="mu-drop-content">
                <div class="mu-drop-icon">🖼️</div>
                <div class="mu-drop-text">انقر أو اسحب صورة هنا</div>
                <div class="mu-drop-sub">JPG, PNG, WebP — حد أقصى 10 MB (سيُضغط تلقائياً)</div>
               </div>`
          }
        </div>
        <div id="${imgProgressId}" class="mu-progress-wrap" style="display:none">
          <div class="mu-progress-bar"><div class="mu-progress-fill" id="${imgProgressId}-fill"></div></div>
          <div class="mu-progress-text" id="${imgProgressId}-text">جاري المعالجة...</div>
        </div>
      </div>
    </div>

    ${showVideo ? `
    <!-- ══ حقل الفيديو ══ -->
    <div class="mu-field-wrap" style="margin-top:16px">
      <label class="mu-label">
        🎬 فيديو <span class="mu-badge-opt">اختياري</span>
        <span class="mu-hint">MP4, WebM, MOV — حد أقصى 50 MB</span>
      </label>

      <div class="mu-drop-zone mu-video-zone" id="${videoId}-zone" onclick="document.getElementById('${videoId}').click()"
        ondragover="event.preventDefault();this.classList.add('mu-drag-over')"
        ondragleave="this.classList.remove('mu-drag-over')"
        ondrop="event.preventDefault();this.classList.remove('mu-drag-over');mUpload_handleVideoDrop(event,'${videoId}')">
        <input type="file" id="${videoId}" accept=".mp4,.webm,.mov,.avi,.mkv,.3gp,.m4v,video/*,video/mp4,video/webm,video/quicktime" style="display:none" onclick="event.stopPropagation()"
          onchange="mUpload_previewVideo(this,'${vidPreviewId}','${vidProgressId}')">
        <div id="${vidPreviewId}" class="mu-preview-area">
          ${currentVideoUrl
            ? `<video src="${currentVideoUrl}" class="mu-video-thumb" controls muted></video>
               <div class="mu-overlay-label">🎬 انقر لتغيير الفيديو</div>`
            : `<div class="mu-drop-content">
                <div class="mu-drop-icon">🎬</div>
                <div class="mu-drop-text">انقر أو اسحب فيديو هنا</div>
                <div class="mu-drop-sub">MP4, WebM, MOV — حد أقصى 50 MB</div>
               </div>`
          }
        </div>
        <div id="${vidProgressId}" class="mu-progress-wrap" style="display:none">
          <div class="mu-progress-bar"><div class="mu-progress-fill" id="${vidProgressId}-fill"></div></div>
          <div class="mu-progress-text" id="${vidProgressId}-text">جاري التحقق من الملف...</div>
        </div>
      </div>
    </div>
    ` : ''}`;
  };

  // ─── 6. معاينة الصورة قبل الرفع ────────────────────────
  window.mUpload_previewImage = async function(input, previewId, progressId) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (typeof toast === 'function') toast('يرجى اختيار ملف صورة صالح', 'error');
      return;
    }

    const preview  = document.getElementById(previewId);
    const progWrap = document.getElementById(progressId);
    const progFill = document.getElementById(progressId + '-fill');
    const progText = document.getElementById(progressId + '-text');

    if (progWrap) {
      progWrap.style.display = 'block';
      if (progFill) progFill.style.width = '0%';
      if (progText) progText.textContent = '⏳ جاري ضغط الصورة...';
    }

    try {
      const result = await window.mUpload_compressImage(file);
      if (preview) {
        preview.innerHTML = `
          <div style="position:relative;display:inline-block;width:100%">
            <img src="${result.url}" class="mu-thumb" alt="معاينة الصورة"
              style="width:100%;max-height:180px;object-fit:cover;border-radius:8px">
            <div class="mu-compress-badge">
              ✅ مضغوطة ${result.originalKB}KB → ${result.compressedKB}KB
              <span style="color:#10b981;font-weight:800">(وُفِّر ${result.ratio})</span>
            </div>
          </div>`;
      }
      if (progWrap) {
        if (progFill) progFill.style.width = '100%';
        if (progText) progText.textContent = `✅ جاهزة للرفع (${result.compressedKB} KB)`;
        setTimeout(() => { progWrap.style.display = 'none'; }, 2500);
      }
    } catch(e) {
      // fallback: عرض الصورة بدون ضغط
      const url = URL.createObjectURL(file);
      if (preview) preview.innerHTML = `<img src="${url}" class="mu-thumb" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px">`;
      if (progWrap) progWrap.style.display = 'none';
    }
  };

  // ─── 7. معاينة الفيديو قبل الرفع ──────────────────────
  window.mUpload_previewVideo = function(input, previewId, progressId) {
    const file = input.files[0];
    if (!file) return;

    const check = window.mUpload_validateVideo(file);
    if (!check.valid) {
      if (typeof toast === 'function') toast(check.error, 'error');
      input.value = '';
      return;
    }

    const preview  = document.getElementById(previewId);
    const progWrap = document.getElementById(progressId);
    const progText = document.getElementById(progressId + '-text');

    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const url    = URL.createObjectURL(file);

    if (preview) {
      preview.innerHTML = `
        <div style="position:relative;width:100%">
          <video src="${url}" class="mu-video-thumb" controls muted
            style="width:100%;max-height:200px;border-radius:8px;background:#000"></video>
          <div class="mu-compress-badge mu-video-badge">
            🎬 ${file.name} — ${sizeMB} MB
          </div>
        </div>`;
    }
    if (progWrap) {
      progWrap.style.display = 'block';
      const fill = document.getElementById(progressId + '-fill');
      if (fill) fill.style.width = '100%';
      if (progText) progText.textContent = `✅ فيديو جاهز للرفع (${sizeMB} MB)`;
      setTimeout(() => { progWrap.style.display = 'none'; }, 2500);
    }
  };

  // ─── 8. Drag & Drop ────────────────────────────────────
  window.mUpload_handleImageDrop = function(event, inputId) {
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    const previewId  = inputId + '-preview';
    const progressId = inputId + '-prog';
    window.mUpload_previewImage(input, previewId, progressId);
  };

  window.mUpload_handleVideoDrop = function(event, inputId) {
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('video/')) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    const previewId  = inputId + '-preview';
    const progressId = inputId + '-prog';
    window.mUpload_previewVideo(input, previewId, progressId);
  };

  // ─── 9. دالة الرفع الشاملة (صورة + فيديو معاً) ──────
  /**
   * ترفع الصورة والفيديو معاً من حقلَي input
   * @param {Object} opts
   * @param {string} opts.imageInputId — معرّف حقل الصورة
   * @param {string} opts.videoInputId — معرّف حقل الفيديو
   * @param {string} opts.basePath     — المسار الأساسي (مثل 'services/abc123')
   * @param {Function} [opts.onImageProgress]
   * @param {Function} [opts.onVideoProgress]
   * @returns {Promise<{imageUrl: string|null, videoUrl: string|null}>}
   */
  window.mUpload_uploadAll = async function(opts = {}) {
    const {
      imageInputId,
      videoInputId,
      basePath,
      onImageProgress,
      onVideoProgress,
      currentImageUrl = null,
      currentVideoUrl = null,
    } = opts;

    let imageUrl = currentImageUrl;
    let videoUrl = currentVideoUrl;

    // رفع الصورة إن اختيرت
    const imgInput = imageInputId ? document.getElementById(imageInputId) : null;
    if (imgInput && imgInput.files && imgInput.files[0]) {
      const timestamp = Date.now();
      const imgPath   = `images/${basePath}_${timestamp}.jpg`;
      imageUrl = await window.mUpload_uploadImage(imgInput.files[0], imgPath, onImageProgress);
    }

    // رفع الفيديو إن اختير
    const vidInput = videoInputId ? document.getElementById(videoInputId) : null;
    if (vidInput && vidInput.files && vidInput.files[0]) {
      const file = vidInput.files[0];
      const check = window.mUpload_validateVideo(file);
      if (!check.valid) throw new Error(check.error);
      const ext     = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const vidPath = `videos/${basePath}_${timestamp}.${ext}`;
      videoUrl = await window.mUpload_uploadVideo(file, vidPath, onVideoProgress);
    }

    return { imageUrl, videoUrl };
  };

  // ─── 10. مشغّل الفيديو الاحترافي ────────────────────
  /**
   * يُنتج HTML لمشغّل فيديو احترافي
   * @param {string} videoUrl
   * @param {string} [posterUrl] — صورة الغلاف
   * @param {boolean} [autoplay=false]
   * @returns {string} HTML
   */
  window.mUpload_renderVideoPlayer = function(videoUrl, posterUrl = '', autoplay = false) {
    if (!videoUrl) return '';
    return `
    <div class="mu-player-wrap">
      <video
        class="mu-player"
        src="${videoUrl}"
        ${posterUrl ? `poster="${posterUrl}"` : ''}
        ${autoplay ? 'autoplay muted' : ''}
        controls
        playsinline
        preload="metadata"
        style="width:100%;border-radius:12px;background:#000;max-height:400px;display:block"
        onerror="this.closest('.mu-player-wrap').innerHTML='<a href=\\'${videoUrl}\\' target=\\'_blank\\' class=\\'btn btn-secondary btn-sm\\'>🎬 فتح الفيديو خارجياً</a>'"
      ></video>
    </div>`;
  };

  // ─── 11. الـ CSS الخاص بنظام الوسائط ─────────────────
  (function _injectMediaCSS() {
    if (document.getElementById('mu-style')) return;
    const style = document.createElement('style');
    style.id = 'mu-style';
    style.textContent = `
      .mu-field-wrap { direction: rtl; }
      .mu-label { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:8px; }
      .mu-hint { font-size:11px; color:var(--text-muted); font-weight:400; margin-right:auto; }
      .mu-badge-opt { font-size:10px; background:rgba(139,92,246,0.12); color:var(--primary); border:1px solid rgba(139,92,246,0.2); border-radius:6px; padding:1px 6px; font-weight:600; }

      .mu-drop-zone {
        border: 2px dashed var(--glass-border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: rgba(255,255,255,0.02);
        overflow: hidden;
        position: relative;
      }
      .mu-drop-zone:hover, .mu-drop-zone.mu-drag-over {
        border-color: var(--primary);
        background: rgba(139,92,246,0.05);
      }
      .mu-video-zone { border-color: rgba(13,148,136,0.4); }
      .mu-video-zone:hover, .mu-video-zone.mu-drag-over { border-color: #0d9488; background: rgba(13,148,136,0.05); }

      .mu-preview-area { min-height: 120px; display:flex; align-items:center; justify-content:center; position:relative; padding:12px; }
      .mu-thumb { width:100%; max-height:180px; object-fit:cover; border-radius:8px; display:block; }
      .mu-video-thumb { width:100%; max-height:200px; border-radius:8px; background:#000; display:block; }
      .mu-overlay-label {
        position:absolute; bottom:10px; left:50%; transform:translateX(-50%);
        background:rgba(0,0,0,0.7); color:#fff; font-size:11px; font-weight:600;
        padding:4px 10px; border-radius:20px; white-space:nowrap; pointer-events:none;
      }
      .mu-drop-content { text-align:center; padding:20px; }
      .mu-drop-icon { font-size:32px; margin-bottom:6px; }
      .mu-drop-text { font-size:14px; font-weight:700; color:var(--text-main); margin-bottom:4px; }
      .mu-drop-sub { font-size:11px; color:var(--text-muted); }

      .mu-progress-wrap { padding:8px 14px; background:rgba(0,0,0,0.2); border-top:1px solid var(--glass-border); }
      .mu-progress-bar { height:4px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-bottom:6px; }
      .mu-progress-fill { height:100%; background:linear-gradient(90deg,var(--primary),#10b981); border-radius:4px; transition:width 0.3s ease; }
      .mu-progress-text { font-size:11px; color:var(--text-muted); text-align:center; }

      .mu-compress-badge {
        position:absolute; top:8px; right:8px;
        background:rgba(0,0,0,0.75); backdrop-filter:blur(4px);
        color:#fff; font-size:10px; font-weight:600;
        padding:3px 8px; border-radius:20px;
        white-space:nowrap; pointer-events:none;
      }
      .mu-video-badge { background:rgba(13,148,136,0.85); }

      .mu-player-wrap { border-radius:12px; overflow:hidden; background:#000; }

      /* شريط تقدم الرفع المنبثق */
      .mu-upload-progress-toast {
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        background:var(--bg-card); border:1px solid var(--glass-border);
        border-radius:16px; padding:16px 20px; min-width:280px; max-width:360px;
        box-shadow:0 8px 32px rgba(0,0,0,0.4); z-index:9999;
        direction:rtl; text-align:right;
      }
      .mu-upload-progress-toast .mu-upt-title { font-size:13px; font-weight:700; margin-bottom:8px; }
      .mu-upload-progress-toast .mu-upt-bar { height:6px; background:rgba(255,255,255,0.1); border-radius:6px; overflow:hidden; }
      .mu-upload-progress-toast .mu-upt-fill { height:100%; background:linear-gradient(90deg,var(--primary),#10b981); transition:width 0.2s; border-radius:6px; }
      .mu-upload-progress-toast .mu-upt-pct { font-size:20px; font-weight:900; color:var(--primary); text-align:center; margin-top:6px; }
    `;
    document.head.appendChild(style);
  })();

  // ─── 12. شريط تقدم الرفع المنبثق ────────────────────
  window.mUpload_showProgressToast = function(title = 'جاري الرفع...') {
    let el = document.getElementById('mu-upload-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mu-upload-toast';
      el.className = 'mu-upload-progress-toast';
      el.innerHTML = `
        <div class="mu-upt-title" id="mu-upt-title">${title}</div>
        <div class="mu-upt-bar"><div class="mu-upt-fill" id="mu-upt-fill" style="width:0%"></div></div>
        <div class="mu-upt-pct" id="mu-upt-pct">0%</div>
      `;
      document.body.appendChild(el);
    }
    el.querySelector('#mu-upt-title').textContent = title;
    el.style.display = 'block';
    return el;
  };

  window.mUpload_updateProgressToast = function(percent, label = '') {
    const fill = document.getElementById('mu-upt-fill');
    const pct  = document.getElementById('mu-upt-pct');
    const title = document.getElementById('mu-upt-title');
    if (fill) fill.style.width = percent + '%';
    if (pct)  pct.textContent  = percent + '%';
    if (label && title) title.textContent = label;
  };

  window.mUpload_hideProgressToast = function() {
    const el = document.getElementById('mu-upload-toast');
    if (el) { el.style.display = 'none'; }
  };

  console.log('[MediaUpload] ✅ نظام الوسائط الذكي جاهز — ضغط تلقائي للصور + دعم الفيديو حتى 50 MB');
})();
