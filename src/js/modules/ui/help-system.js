/* ============================================================
   Help & Guide System — نظام المساعدة والتعلم التفاعلي
   ------------------------------------------------------------
   يحقن أيقونات ❓ تلقائياً في الـ DOM بعد كل تنقل بواسطة
   MutationObserver — لا يعتمد على template literals في pages.js
   ============================================================ */
'use strict';

(function () {

  // ── CSS Styles ──────────────────────────────────────────────
  const STYLE_ID = 'ui-help-styles';
  if (!document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = `
      .ui-help-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.06));
        border: 1.5px solid rgba(124,58,237,0.35);
        color: #a78bfa;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 8px rgba(124, 58, 237, 0.12);
        margin-inline-start: 8px;
        vertical-align: middle;
        padding: 0;
        line-height: 1;
        flex-shrink: 0;
        text-decoration: none;
      }
      .ui-help-btn:hover {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        border-color: #a78bfa;
        color: #ffffff;
        box-shadow: 0 0 14px rgba(124, 58, 237, 0.5);
        transform: scale(1.15);
      }
      .ui-help-btn:active { transform: scale(0.95); }
      .ui-help-modal-wrap {
        font-family: 'Cairo', sans-serif;
        text-align: right;
        direction: rtl;
      }
      .ui-help-badge {
        background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.12));
        border: 1px solid rgba(139,92,246,0.25);
        color: #a78bfa;
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 14px;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // ── Guide Content Database ───────────────────────────────────
  const HELP_GUIDES = {
    home: {
      title: "🏠 دليل الصفحة الرئيسية",
      desc: "أهلاً بك في منصة محجوز! بوابتك الشاملة لتلبية كافة احتياجاتك اليومية.",
      steps: [
        "🔎 استخدم حقل البحث العلوي للوصول السريع إلى أي خدمة أو منتج برقم الصنف (SKU).",
        "📅 قسم الخدمات يتيح لك حجز صيانة، تنظيف، أو مهن متخصصة مباشرة بالموعد.",
        "🏪 قسم المتاجر يتيح لك الشراء والتوصيل الفوري من الصيدليات والمتاجر القريبة.",
        "🚗 قسم التأجير يوفر لك إمكانية استئجار المنتجات المختلفة كفساتين أو سيارات لفترات محددة."
      ]
    },
    listing_bookings: {
      title: "📅 دليل قسم الحجوزات",
      desc: "هذا القسم مخصص للخدمات التي تتطلب حجزاً مسبقاً وتحديد موعد وتاريخ محدد.",
      steps: [
        "📂 تصفح الأقسام الفرعية للوصول للخدمة التي ترغب بحجزها.",
        "🛒 اضغط 'أضف للسلة' لتجميع أكثر من خدمة وإتمامها في طلب واحد.",
        "💳 يمكنك الدفع الفوري من محفظتك الإلكترونية، أو الدفع نقداً عند الاستلام."
      ]
    },
    listing_services: {
      title: "🔧 دليل الخدمات المهنية",
      desc: "احجز أفضل المهنيين والخبراء لأعمال الصيانة والتركيبات المنزلية في منطقتك الجغرافية.",
      steps: [
        "📍 فلترة تلقائية: تظهر لك فقط الخدمات المتوفرة في منطقتك الجغرافية الحالية.",
        "💬 اضغط 'استفسار' للتحدث مباشرة عبر واتساب مع الدعم."
      ]
    },
    listing_professions: {
      title: "🛠️ دليل نظام المهن الحرة",
      desc: "اطلب فنيين ومتخصصين لزيارة ومعاينة المشاكل المعقدة في منزلك.",
      steps: [
        "🔍 اختر المشكلة التي تواجهها من الأعطال الشائعة.",
        "💵 مجانية المعاينة: يتم إرسال طلب الزيارة لمعاينة المشكلة مجاناً أولاً.",
        "📝 بعد الفحص، يقدم لك المهني عرض السعر للاتفاق عليه."
      ]
    },
    listing_stores: {
      title: "🏪 دليل المتاجر والصيدليات",
      desc: "اطلب السلع، الأدوية، والمنتجات الاستهلاكية مع توصيل سريع لباب منزلك.",
      steps: [
        "🛍️ تسوق من صيدليات ومتاجر متعددة في نفس الوقت من خلال سلتك الموحدة.",
        "⚡ التوصيل التلقائي: يقوم النظام بتوجيه المندوب الأقرب للمتجر لتسليمها فوراً.",
        "📍 الترتيب الجغرافي: تظهر لك المتاجر القريبة في منطقتك أولاً."
      ]
    },
    listing_rental: {
      title: "🚗 دليل قسم التأجير",
      desc: "نظام التأجير يتيح لك حجز المنتجات التي تحتاجها لفترة مؤقتة.",
      steps: [
        "📅 حدد تاريخ بداية الإيجار وتاريخ الإرجاع لمعرفة التكلفة الإجمالية.",
        "👨‍💼 اختر المزوّد المعتمد وتأكد من قراءة شروط التأجير قبل الحجز."
      ]
    },
    wallet: {
      title: "💰 دليل المحفظة الرقمية",
      desc: "محفظة محجوز هي وسيلتك الأسرع والأكثر أماناً للدفع واستلام الأموال.",
      steps: [
        "💳 شحن الرصيد: أرسل حوالة بنكية وارفع الإيصال ليتم شحن محفظتك خلال دقائق.",
        "🎉 الدفع بالمحفظة يمنحك الأولوية في معالجة طلبك وخصومات خاصة."
      ]
    },
    myorders: {
      title: "📋 دليل تتبع وإدارة الطلبات",
      desc: "تابع مسار وحالة طلباتك الحالية وتفاعل مع العمليات النشطة.",
      steps: [
        "🔄 تحديث حي: تابع حالة طلبك (عند المزود، مع المندوب، قيد المعاينة).",
        "📍 تتبع على الخريطة: عند خروج المندوب، تتبع موقعه حياً.",
        "⭐ قيّم المزود والمندوب بعد استلام الطلب."
      ]
    },
    addresses: {
      title: "📍 دليل دفتر العناوين",
      desc: "احفظ عناوينك المعتادة لتسريع عمليات الشراء.",
      steps: [
        "🏡 احفظ عناوين متعددة (البيت، العمل، بيت الأهل).",
        "📌 تأكد من اختيار إحداثيات الخريطة بدقة."
      ]
    },
    rewards: {
      title: "🌟 دليل مكافآت ونقاط الولاء",
      desc: "منصة محجوز تكافئك على كل حجز وطلب تقوم به.",
      steps: [
        "🔄 اجمع النقاط تلقائياً فور اكتمال كل طلب.",
        "💵 تحويل الرصيد: يمكنك تحويل النقاط المجمعة إلى رصيد حقيقي في محفظتك.",
        "🏆 ارتفع بمستوى حسابك لتحصل على نسب كاش باك أكبر."
      ]
    },
    provider_dashboard: {
      title: "💼 دليل لوحة مزود الخدمة",
      desc: "لوحتك الشاملة لإدارة أعمالك، طلباتك، والمنتجات التي تقدمها.",
      steps: [
        "🔔 الطلبات الواردة: تظهر لك الطلبات الموجهة إليك لحظياً، اقبل أو رفض.",
        "📦 إدارة المنتجات: ربط منتجات جديدة من الكتالوج وتعيين الأسعار.",
        "🚀 اقترح خدمة أو منتج جديد غير متوفر للإدارة لإضافته."
      ]
    },
    admin_dashboard: {
      title: "👑 دليل لوحة الإدارة",
      desc: "شاشتك الرئيسية للتحكم الكامل بجميع تفاصيل وعمليات منصة محجوز.",
      steps: [
        "📊 إحصائيات حية: راقب المبيعات اليومية وأداء المندوبين والمزودين.",
        "⚙️ الإعدادات العامة: عدّل رسوم التوصيل وطرق الدفع النشطة.",
        "🚗 تعيين يدوي: في حال تعذر التعيين التلقائي، اختر المندوب أو المزود يدوياً."
      ]
    },
    stalled_orders: {
      title: "⚠️ دليل شاشة الطلبات المتوقفة",
      desc: "أداة مراقبة ذكية للطلبات التي لم تتم معالجتها تلقائياً.",
      steps: [
        "🚨 تنبيهات فورية: الطلبات تظهر هنا تلقائياً لكي لا ينساها فريق العمل.",
        "🚗 إعادة التوجيه اليدوي: ابحث واختر مندوباً أو مزوداً بديلاً فوراً."
      ]
    },
    staff_assignments: {
      title: "👥 دليل توزيع صلاحيات الموظفين",
      desc: "قسّم المهام بين موظفي الإدارة لضمان أمان وسرعة العمل.",
      steps: [
        "📍 ربط المناطق: حدد لكل موظف نطاقاً جغرافياً معيناً.",
        "🔧 ربط الأقسام: عيّن الموظف في أقسام محددة لتنظيم سير العمل."
      ]
    },
    drivers_database: {
      title: "🚗 دليل قاعدة المندوبين الهرمية",
      desc: "أداة الإدارة لتصنيف وتنظيم مندوبي التوصيل.",
      steps: [
        "📁 التصنيف الهرمي: أنشئ تصنيفات رئيسية ثم فئات فرعية.",
        "📍 الربط الجغرافي: عيّن المندوب في منطقة جغرافية محددة.",
        "🔗 اربط المندوب بحساب مستخدم مسجل لاستقبال الطلبات حياً."
      ]
    },
    checkout: {
      title: "🛒 دليل إتمام الطلب والدفع",
      desc: "خطوتك الأخيرة لتأكيد مشترياتك وضمان التوصيل السليم.",
      steps: [
        "📍 عنوان التوصيل: راجع وحدد العنوان السليم لتسهيل وصول المندوب.",
        "💳 اختر طريقة الدفع: المحفظة، الدفع عند الاستلام، أو الإيداع البنكي.",
        "💬 أضف أي ملاحظات أو تعليمات خاصة للمندوب."
      ]
    },
    store_checkout: {
      title: "🛒 دليل إتمام طلب المتجر",
      desc: "راجع سلتك وأكمل الطلب في ثوانٍ.",
      steps: [
        "📦 راجع المنتجات في سلتك وعدّل الكميات إذا لزم.",
        "📍 أكّد عنوان التوصيل ليصل إليك المندوب بسهولة.",
        "💰 اختر الدفع بالمحفظة لأسرع معالجة لطلبك."
      ]
    },
    rental_checkout: {
      title: "🚗 دليل إتمام طلب التأجير",
      desc: "أكمل حجز المنتج المستأجر وحدد فترة الاستخدام.",
      steps: [
        "📅 راجع تواريخ البداية والإرجاع ومدة الإيجار.",
        "💵 تحقق من إجمالي التكلفة قبل تأكيد الحجز.",
        "📜 اقرأ شروط التأجير وسياسة الضمان بعناية."
      ]
    },
    advanced_analytics: {
      title: "📊 دليل التحليلات المتقدمة",
      desc: "شاشة الإحصائيات والتقارير التفصيلية لأداء المنصة.",
      steps: [
        "📈 عرض المخططات البيانية للمبيعات والطلبات عبر الزمن.",
        "🗓️ فلتر بالتاريخ لمقارنة أداء فترات مختلفة.",
        "📤 صدّر التقارير بصيغة PDF للاطلاع والمشاركة."
      ]
    }
  };

  // ── الدالتان العامتان (window) ───────────────────────────────
  window.ui_helpBtn = function (key, style) {
    if (!HELP_GUIDES[key]) return '';
    style = style || '';
    return '<button class="ui-help-btn" data-help-key="' + key + '" onclick="event.stopPropagation();window.ui_showHelpModal(\'' + key + '\')" style="' + style + '" title="شرح الاستخدام" aria-label="مساعدة">❓</button>';
  };

  window.ui_showHelpModal = function (key) {
    const guide = HELP_GUIDES[key];
    if (!guide) {
      if (typeof toast === 'function') toast('دليل المساعدة غير متوفر حالياً لهذا القسم', 'info');
      return;
    }
    const stepsHtml = guide.steps.map(function(step, idx) {
      return '<div style="display:flex;gap:12px;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:12px;padding:12px 16px;align-items:flex-start;transition:transform 0.2s" onmouseover="this.style.transform=\'translateX(-4px)\'" onmouseout="this.style.transform=\'none\'">'
        + '<div style="width:24px;height:24px;border-radius:50%;background:rgba(124,58,237,0.12);color:#a78bfa;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;">' + (idx + 1) + '</div>'
        + '<div style="font-size:13px;line-height:1.6;color:var(--text-main);">' + step + '</div>'
        + '</div>';
    }).join('');

    const html = '<div class="modal-header" style="border-bottom:1px solid var(--border);padding-bottom:14px;">'
      + '<h2 class="modal-title" style="display:flex;align-items:center;gap:8px;font-family:\'Cairo\',sans-serif;">' + guide.title + '</h2>'
      + '<button class="modal-close" onclick="closeModal()">✕</button>'
      + '</div>'
      + '<div class="ui-help-modal-wrap" style="padding:20px;">'
      + '<div class="ui-help-badge">💡 دليل الاستخدام السريع</div>'
      + '<p style="font-size:14px;font-weight:700;line-height:1.7;margin-bottom:20px;color:var(--text-secondary);">' + guide.desc + '</p>'
      + '<div style="display:flex;flex-direction:column;gap:12px;">' + stepsHtml + '</div>'
      + '<button class="btn btn-primary btn-block btn-lg" onclick="closeModal()" style="margin-top:24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;font-weight:800;font-family:\'Cairo\',sans-serif;">👍 فهمت ذلك، شكراً!</button>'
      + '</div>';

    if (typeof openModal === 'function') {
      openModal(html);
    } else {
      alert(guide.title + '\n\n' + guide.desc + '\n\n' + guide.steps.map(function(s, i){ return (i+1) + '. ' + s; }).join('\n'));
    }
  };

  // ── Auto-Inject: حقن الأيقونات تلقائياً بعد كل render ───────
  // خريطة: نص عنصر أو selector → مفتاح المساعدة
  const INJECT_RULES = [
    // صفحات العميل
    { match: /نتائج البحث|ابحث/, key: 'home',             tags: ['H1','H2'] },
    { match: /طلباتي/,          key: 'myorders',          tags: ['H1','H2'] },
    { match: /محفظتي/,          key: 'wallet',            tags: ['H1','H2'] },
    { match: /الحجوزات/,        key: 'listing_bookings',  tags: ['H1','H2'] },
    { match: /الخدمات المهنية/, key: 'listing_services',  tags: ['H1','H2'] },
    { match: /المهن الحرة/,     key: 'listing_professions',tags: ['H1','H2'] },
    { match: /المتاجر|الصيدليات/, key: 'listing_stores',  tags: ['H1','H2'] },
    { match: /التأجير/,         key: 'listing_rental',    tags: ['H1','H2'] },
    // لوحات التحكم
    { match: /لوحة الإحصائيات|الإحصائيات/, key: 'admin_dashboard',  tags: ['H1','H2','H3'] },
    { match: /طلبات المزود|لوحة المزود/,   key: 'provider_dashboard', tags: ['H1','H2','H3'] },
    { match: /الطلبات المتوقفة/,           key: 'stalled_orders',    tags: ['H1','H2','H3'] },
    { match: /قاعدة المندوبين|المندوبون/,  key: 'drivers_database',  tags: ['H1','H2','H3'] },
    { match: /صلاحيات الموظفين|توزيع الموظفين/, key: 'staff_assignments', tags: ['H1','H2','H3'] },
    { match: /التحليلات المتقدمة|صلاحيات الموظفين الإضافية/, key: 'advanced_analytics', tags: ['H1','H2','H3'] },
    // نوافذ checkout
    { match: /تأكيد الحجز|تأكيد الطلب/,  key: 'checkout',       tags: ['H1','H2','H3'] },
    { match: /سلة المتجر|تأكيد طلب المتجر/, key: 'store_checkout', tags: ['H1','H2','H3'] },
    { match: /تأكيد التأجير|إتمام التأجير/, key: 'rental_checkout', tags: ['H1','H2','H3'] },
  ];

  function injectHelpIcons(root) {
    root = root || document;
    INJECT_RULES.forEach(function(rule) {
      rule.tags.forEach(function(tag) {
        var els = root.querySelectorAll(tag);
        els.forEach(function(el) {
          // تجنب الحقن المكرر
          if (el.querySelector('.ui-help-btn[data-help-key="' + rule.key + '"]')) return;
          if (rule.match.test(el.textContent)) {
            var btn = document.createElement('button');
            btn.className = 'ui-help-btn';
            btn.setAttribute('data-help-key', rule.key);
            btn.setAttribute('title', 'شرح الاستخدام');
            btn.setAttribute('aria-label', 'مساعدة');
            btn.textContent = '❓';
            btn.onclick = function(e) {
              e.stopPropagation();
              window.ui_showHelpModal(rule.key);
            };
            el.appendChild(btn);
          }
        });
      });
    });
  }

  // مراقبة التغييرات في #app أو body
  function startObserver() {
    var target = document.getElementById('app') || document.body;
    var observer = new MutationObserver(function(mutations) {
      var changed = mutations.some(function(m) {
        return m.addedNodes.length > 0 || m.type === 'childList';
      });
      if (changed) {
        // تأخير صغير لانتهاء الـ render
        setTimeout(function() { injectHelpIcons(); }, 80);
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    // حقن فوري عند أول تحميل
    setTimeout(function() { injectHelpIcons(); }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  console.log('[HelpSystem] ✅ نظام المساعدة التلقائي loaded — MutationObserver نشط ❓💡');
})();
