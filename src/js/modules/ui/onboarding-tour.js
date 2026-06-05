/* ============================================================
   Onboarding Tour — الجولة الترحيبية التفاعلية
   ------------------------------------------------------------
   تظهر للمستخدم الجديد عند أول تسجيل دخول
   Spotlight يُضيء كل عنصر مع tooltip شارح
   ============================================================ */
'use strict';

(function () {

  // ── الأنماط CSS ───────────────────────────────────────────
  const css = `
    #ob-overlay {
      position: fixed; inset: 0; z-index: 99990;
      pointer-events: none;
    }
    #ob-overlay svg { width:100%; height:100%; }
    #ob-blocker {
      position: fixed; inset: 0; z-index: 99989;
      background: transparent;
    }
    #ob-tooltip {
      position: fixed; z-index: 99995;
      background: var(--bg-card, #1e1e2e);
      border: 1px solid rgba(124,58,237,0.4);
      border-radius: 16px;
      padding: 20px 22px;
      width: 300px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2);
      font-family: 'Cairo', sans-serif;
      direction: rtl;
      text-align: right;
      color: var(--text-main, #f1f5f9);
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      pointer-events: all;
    }
    #ob-tooltip.ob-hidden { opacity:0; transform:scale(0.92) translateY(8px); pointer-events:none; }
    .ob-badge {
      font-size: 10px; font-weight: 800;
      background: linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.2));
      border: 1px solid rgba(124,58,237,0.3);
      color: #a78bfa;
      border-radius: 99px; padding: 2px 10px;
      display: inline-block; margin-bottom: 10px;
    }
    .ob-title {
      font-size: 15px; font-weight: 800;
      margin-bottom: 6px; line-height: 1.5;
    }
    .ob-desc {
      font-size: 13px; line-height: 1.7;
      color: var(--text-secondary, #94a3b8);
      margin-bottom: 16px;
    }
    .ob-progress {
      display: flex; gap: 5px; margin-bottom: 14px; justify-content: flex-start;
    }
    .ob-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(124,58,237,0.2);
      transition: all 0.3s;
    }
    .ob-dot.active { background: #7c3aed; transform: scale(1.3); }
    .ob-dot.done { background: rgba(124,58,237,0.5); }
    .ob-actions { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
    .ob-btn-skip {
      font-size: 12px; color: var(--text-muted,#64748b);
      background: none; border: none; cursor: pointer;
      font-family: 'Cairo',sans-serif; padding: 4px 8px;
      transition: color 0.2s;
    }
    .ob-btn-skip:hover { color: var(--text-secondary,#94a3b8); }
    .ob-btn-next {
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; border: none; border-radius: 10px;
      padding: 9px 20px; font-size: 13px; font-weight: 800;
      font-family: 'Cairo',sans-serif; cursor: pointer;
      transition: all 0.2s; flex: 1; max-width: 160px;
    }
    .ob-btn-next:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(124,58,237,0.4); }
    .ob-btn-prev {
      background: rgba(255,255,255,0.06); color: var(--text-secondary,#94a3b8);
      border: 1px solid var(--border,rgba(255,255,255,0.08)); border-radius: 10px;
      padding: 9px 14px; font-size: 13px; font-weight: 700;
      font-family: 'Cairo',sans-serif; cursor: pointer; transition: all 0.2s;
    }
    .ob-btn-prev:hover { background: rgba(255,255,255,0.1); }
    #ob-start-modal {
      position: fixed; inset: 0; z-index: 99998;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cairo',sans-serif; direction: rtl;
      animation: obFadeIn 0.4s ease;
    }
    .ob-start-card {
      background: var(--bg-card,#1e1e2e);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 20px; padding: 36px 32px;
      max-width: 420px; width: 90%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.6);
      animation: obSlideUp 0.4s cubic-bezier(0.4,0,0.2,1);
    }
    .ob-start-icon { font-size: 52px; margin-bottom: 16px; display: block; }
    .ob-start-title { font-size: 22px; font-weight: 900; color: var(--text-main,#f1f5f9); margin-bottom: 10px; }
    .ob-start-desc { font-size: 14px; color: var(--text-secondary,#94a3b8); line-height: 1.7; margin-bottom: 24px; }
    .ob-start-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .ob-btn-start {
      background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white;
      border: none; border-radius: 12px; padding: 12px 28px;
      font-size: 15px; font-weight: 800; font-family: 'Cairo',sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .ob-btn-start:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(124,58,237,0.4); }
    .ob-btn-later {
      background: rgba(255,255,255,0.06); color: var(--text-muted,#64748b);
      border: 1px solid var(--border,rgba(255,255,255,0.08)); border-radius: 12px;
      padding: 12px 20px; font-size: 14px; font-weight: 700;
      font-family: 'Cairo',sans-serif; cursor: pointer; transition: all 0.2s;
    }
    @keyframes obFadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes obSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'ob-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── خطوات الجولة لكل دور ──────────────────────────────────
  const TOURS = {
    customer: [
      {
        selector: '.search-box, #global-search, [class*="search"]',
        fallback: '.nav-bar, header, .top-bar',
        title: '🔎 البحث السريع',
        desc: 'ابحث عن أي خدمة أو منتج باسمه أو رقم الصنف (SKU) للوصول إليه فوراً.'
      },
      {
        selector: '.section-card, .service-card, [onclick*="listing"]',
        fallback: 'main, #app-content, #app',
        title: '📅 استعرض الخدمات',
        desc: 'اختر من الحجوزات، الخدمات المهنية، المتاجر، أو التأجير — لكل قسم شرح خاص يظهر بالضغط على ❓'
      },
      {
        selector: '[onclick*="cart"], .cart-btn, .add-to-cart, [class*="cart"]',
        fallback: '.bottom-nav, .nav-bottom',
        title: '🛒 أضف للسلة',
        desc: 'اضغط "أضف للسلة" لجمع أكثر من خدمة أو منتج وإتمامها دفعة واحدة في طلب موحد.'
      },
      {
        selector: '[onclick*="wallet"], [href*="wallet"], .wallet-link',
        fallback: '.bottom-nav, nav',
        title: '💰 المحفظة الرقمية',
        desc: 'اشحن محفظتك لدفع الطلبات بسرعة والحصول على خصومات خاصة. الشحن عبر تحويل بنكي ورفع الإيصال.'
      },
      {
        selector: '[onclick*="myorders"], [onclick*="my-orders"]',
        fallback: '.bottom-nav, nav',
        title: '📋 تتبع طلباتك',
        desc: 'من قسم "طلباتي" تابع حالة كل طلب حياً — من قبول المزود حتى وصول المندوب لبابك.'
      },
      {
        selector: '[onclick*="help-center"], .help-btn, #help-fab',
        fallback: 'body',
        title: '❓ مركز المساعدة',
        desc: 'في أي وقت اضغط على أيقونة 💬 لفتح البوت المساعد، أو ابحث في مركز المساعدة عن إجابة لأي سؤال.'
      }
    ],
    vendor: [
      {
        selector: '[onclick*="vendor"], .vendor-dashboard, [class*="vendor"]',
        fallback: 'main, #app-content, #app',
        title: '💼 لوحة تحكمك',
        desc: 'مرحباً بك كمزود خدمة! من هنا تدير كل شيء — طلباتك، منتجاتك، وأرباحك.'
      },
      {
        selector: '.order-card, [onclick*="acceptOrder"], [class*="order"]',
        fallback: 'main, #app-content',
        title: '🔔 قبول الطلبات',
        desc: 'عند وصول طلب جديد ستتلقى إشعاراً فورياً. اضغط "قبول" لبدء التجهيز أو "رفض" إذا كنت غير متاح.'
      },
      {
        selector: '[onclick*="products"], [onclick*="catalog"], [class*="product"]',
        fallback: 'main, #app-content',
        title: '📦 إدارة المنتجات',
        desc: 'أضف منتجاتك من الكتالوج الموحد وحدد أسعارك التنافسية. يمكنك اقتراح منتج جديد للإدارة.'
      },
      {
        selector: '[onclick*="wallet"], .wallet-vendor',
        fallback: 'main, #app-content',
        title: '💵 استلام أرباحك',
        desc: 'أرباحك تُضاف لمحفظتك تلقائياً بعد اكتمال كل طلب. اطلب سحب الأرباح في أي وقت.'
      },
      {
        selector: '[onclick*="help-center"], #help-fab, .help-btn',
        fallback: 'body',
        title: '💬 هنا عند الحاجة',
        desc: 'اضغط على أيقونة المساعدة في أي وقت للحصول على إجابات فورية أو التواصل مع فريق الدعم.'
      }
    ]
  };

  // ── بناء SVG overlay ──────────────────────────────────────
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'ob-overlay';
    overlay.innerHTML = '<svg id="ob-svg" xmlns="http://www.w3.org/2000/svg"></svg>';
    document.body.appendChild(overlay);

    const blocker = document.createElement('div');
    blocker.id = 'ob-blocker';
    blocker.onclick = function() {};
    document.body.appendChild(blocker);

    return overlay;
  }

  function buildTooltip() {
    const el = document.createElement('div');
    el.id = 'ob-tooltip';
    el.className = 'ob-hidden';
    document.body.appendChild(el);
    return el;
  }

  function highlightElement(el) {
    const svg = document.getElementById('ob-svg');
    const W = window.innerWidth, H = window.innerHeight;
    let r = { x: 0, y: 0, w: W, h: H, rx: 0 };
    if (el) {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      r = {
        x: rect.left - pad, y: rect.top - pad,
        w: rect.width + pad * 2, h: rect.height + pad * 2,
        rx: 10
      };
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '<defs>'
      + '<mask id="ob-mask">'
      + '<rect width="' + W + '" height="' + H + '" fill="white"/>'
      + '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" rx="' + r.rx + '" fill="black"/>'
      + '</mask></defs>'
      + '<rect width="' + W + '" height="' + H + '" fill="rgba(0,0,0,0.72)" mask="url(#ob-mask)"/>'
      + (el ? '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" rx="' + r.rx + '" fill="none" stroke="#7c3aed" stroke-width="2" opacity="0.8"/>' : '');
  }

  function positionTooltip(tooltip, targetEl) {
    const TW = 300, margin = 14;
    const W = window.innerWidth, H = window.innerHeight;
    let left, top;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      // محاولة وضعه أسفل العنصر
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - TW / 2;
      // تصحيح حدود الشاشة
      if (top + 250 > H) top = rect.top - 250 - margin;
      if (left < 10) left = 10;
      if (left + TW > W - 10) left = W - TW - 10;
      if (top < 10) top = 10;
    } else {
      left = W / 2 - TW / 2;
      top = H / 2 - 140;
    }
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.width = TW + 'px';
  }

  // ── منطق الجولة ───────────────────────────────────────────
  let tourSteps = [], currentStep = 0, tooltipEl = null;

  function findEl(step) {
    let el = null;
    if (step.selector) {
      try { el = document.querySelector(step.selector); } catch(e){}
    }
    if (!el && step.fallback) {
      try { el = document.querySelector(step.fallback); } catch(e){}
    }
    return el;
  }

  function renderStep(idx) {
    const step = tourSteps[idx];
    if (!step) { endTour(); return; }
    currentStep = idx;

    const targetEl = findEl(step);
    highlightElement(targetEl);
    positionTooltip(tooltipEl, targetEl);

    const total = tourSteps.length;
    const dotsHtml = tourSteps.map(function(_, i) {
      return '<div class="ob-dot' + (i < idx ? ' done' : (i === idx ? ' active' : '')) + '"></div>';
    }).join('');

    tooltipEl.innerHTML =
      '<div class="ob-badge">خطوة ' + (idx + 1) + ' من ' + total + '</div>'
      + '<div class="ob-progress">' + dotsHtml + '</div>'
      + '<div class="ob-title">' + step.title + '</div>'
      + '<div class="ob-desc">' + step.desc + '</div>'
      + '<div class="ob-actions">'
      + '<button class="ob-btn-skip" onclick="window._obSkip()">تخطي الجولة</button>'
      + (idx > 0 ? '<button class="ob-btn-prev" onclick="window._obPrev()">← السابق</button>' : '<span></span>')
      + '<button class="ob-btn-next" onclick="window._obNext()">' + (idx === total - 1 ? '🎉 إنهاء' : 'التالي ←') + '</button>'
      + '</div>';

    tooltipEl.classList.remove('ob-hidden');

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  window._obNext = function() {
    if (currentStep < tourSteps.length - 1) renderStep(currentStep + 1);
    else endTour();
  };
  window._obPrev = function() {
    if (currentStep > 0) renderStep(currentStep - 1);
  };
  window._obSkip = endTour;

  function endTour() {
    // إخفاء
    const overlay = document.getElementById('ob-overlay');
    const blocker = document.getElementById('ob-blocker');
    if (tooltipEl) { tooltipEl.classList.add('ob-hidden'); setTimeout(function(){ tooltipEl.remove(); }, 400); tooltipEl = null; }
    if (overlay) overlay.remove();
    if (blocker) blocker.remove();
    // حفظ أن الجولة اكتملت
    try { localStorage.setItem('mahjooz_tour_done_' + (window._obRole || 'customer'), '1'); } catch(e){}
    // عرض رسالة إنهاء
    if (typeof toast === 'function') toast('🎉 أنت الآن جاهز لاستخدام المنصة!', 'success');
  }

  function startTour(role) {
    window._obRole = role;
    tourSteps = TOURS[role] || TOURS['customer'];
    currentStep = 0;

    buildOverlay();
    tooltipEl = buildTooltip();

    setTimeout(function() { renderStep(0); }, 200);
  }

  // ── نافذة البداية ─────────────────────────────────────────
  function showStartModal(role) {
    const isVendor = role === 'vendor';
    const modal = document.createElement('div');
    modal.id = 'ob-start-modal';
    modal.innerHTML =
      '<div class="ob-start-card">'
      + '<span class="ob-start-icon">' + (isVendor ? '💼' : '👋') + '</span>'
      + '<div class="ob-start-title">أهلاً ' + (isVendor ? 'بك كمزود خدمة!' : 'بك في محجوز!') + '</div>'
      + '<div class="ob-start-desc">' + (isVendor
          ? 'دعنا نريك كيف تدير طلباتك ومنتجاتك وتستلم أرباحك في دقيقتين فقط.'
          : 'دعنا نريك كيف تحجز خدمة، تتسوق، وتدفع بأمان في دقيقتين فقط.')
      + '</div>'
      + '<div class="ob-start-btns">'
      + '<button class="ob-btn-start" onclick="window._obStartNow()">🚀 ابدأ الجولة</button>'
      + '<button class="ob-btn-later" onclick="window._obLater()">لاحقاً</button>'
      + '</div></div>';
    document.body.appendChild(modal);

    window._obStartNow = function() {
      modal.remove();
      startTour(role);
    };
    window._obLater = function() {
      modal.remove();
      try { localStorage.setItem('mahjooz_tour_done_' + role, '1'); } catch(e){}
    };
  }

  // ── الدالة العامة لإطلاق الجولة يدوياً ───────────────────
  window.startOnboardingTour = function(role) {
    role = role || (window.State && State.currentUser ? State.currentUser.role : 'customer');
    if (TOURS[role]) startTour(role);
    else startTour('customer');
  };

  // ── التحقق من أول تسجيل دخول ──────────────────────────────
  function checkAndLaunch() {
    if (!window.State || !State.currentUser) return;
    const role = State.currentUser.role;
    if (role !== 'customer' && role !== 'vendor') return;

    const key = 'mahjooz_tour_done_' + role;
    try {
      if (localStorage.getItem(key)) return; // سبق وأكمل الجولة
    } catch(e){}

    // تأخير لانتهاء تحميل الصفحة
    setTimeout(function() { showStartModal(role); }, 1500);
  }

  // مراقبة تغيير حالة المستخدم
  var _lastUid = null;
  setInterval(function() {
    if (window.State && State.currentUser && State.currentUser.uid !== _lastUid) {
      _lastUid = State.currentUser.uid;
      checkAndLaunch();
    }
  }, 1000);

  // إعادة الجولة — تُستدعى من صفحة الإعدادات
  window.resetOnboardingTour = function(role) {
    role = role || 'customer';
    try { localStorage.removeItem('mahjooz_tour_done_' + role); } catch(e){}
    showStartModal(role);
  };

  console.log('[OnboardingTour] ✅ الجولة الترحيبية loaded 🚀');
})();
