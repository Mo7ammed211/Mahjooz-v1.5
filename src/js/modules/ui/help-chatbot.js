/* ============================================================
   Help Chatbot — بوت المساعدة الذكي
   ------------------------------------------------------------
   أيقونة 💬 عائمة تفتح نافذة دردشة مع إجابات فورية
   وزر تواصل واتساب كخيار أخير
   ============================================================ */
'use strict';

(function () {

  // ── CSS ────────────────────────────────────────────────────
  const css = `
    #help-fab {
      position: fixed; bottom: 88px; left: 20px;
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      border: none; cursor: pointer; z-index: 9990;
      box-shadow: 0 8px 24px rgba(124,58,237,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      color: white;
    }
    #help-fab:hover { transform: scale(1.1) translateY(-2px); box-shadow: 0 12px 32px rgba(124,58,237,0.55); }
    #help-fab.open { background: linear-gradient(135deg,#ef4444,#dc2626); }
    #help-fab .fab-badge {
      position: absolute; top:-4px; right:-4px;
      width:18px; height:18px; border-radius:50%;
      background:#ef4444; color:white;
      font-size:10px; font-weight:800;
      display:flex; align-items:center; justify-content:center;
      border:2px solid var(--bg-base,#0f0f1a);
      animation: fabPulse 1.5s infinite;
    }
    @keyframes fabPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.2);} }

    #help-chat-panel {
      position: fixed; bottom: 152px; left: 20px;
      width: 340px; max-height: 520px;
      background: var(--bg-card,#1e1e2e);
      border: 1px solid rgba(124,58,237,0.3);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.55);
      z-index: 9989; display: flex; flex-direction: column;
      font-family: 'Cairo',sans-serif; direction: rtl;
      overflow: hidden;
      transform: scale(0.92) translateY(20px); opacity: 0;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      pointer-events: none;
    }
    #help-chat-panel.open {
      transform: scale(1) translateY(0); opacity: 1;
      pointer-events: all;
    }
    .hc-header {
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    }
    .hc-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .hc-header-text { flex: 1; }
    .hc-header-name { font-size: 14px; font-weight: 800; color: white; }
    .hc-header-status { font-size: 11px; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 4px; }
    .hc-status-dot { width:7px; height:7px; border-radius:50%; background:#4ade80; display:inline-block; }

    .hc-messages {
      flex: 1; overflow-y: auto; padding: 14px 12px;
      display: flex; flex-direction: column; gap: 10px;
      min-height: 200px;
    }
    .hc-messages::-webkit-scrollbar { width: 4px; }
    .hc-messages::-webkit-scrollbar-track { background: transparent; }
    .hc-messages::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 99px; }

    .hc-msg {
      max-width: 85%; padding: 10px 14px;
      border-radius: 14px; font-size: 13px; line-height: 1.6;
      animation: hcMsgIn 0.25s ease;
    }
    @keyframes hcMsgIn { from{ opacity:0; transform:translateY(8px); } to{ opacity:1; transform:translateY(0); } }
    .hc-msg.bot {
      background: rgba(124,58,237,0.1);
      border: 1px solid rgba(124,58,237,0.2);
      color: var(--text-main,#f1f5f9);
      align-self: flex-start; border-radius: 4px 14px 14px 14px;
    }
    .hc-msg.user {
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; align-self: flex-end;
      border-radius: 14px 4px 14px 14px;
    }

    .hc-quick-replies {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 8px 12px 4px;
    }
    .hc-qr {
      background: rgba(124,58,237,0.1);
      border: 1px solid rgba(124,58,237,0.25);
      color: #a78bfa; border-radius: 99px;
      padding: 6px 12px; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
      font-family: 'Cairo',sans-serif;
    }
    .hc-qr:hover { background: rgba(124,58,237,0.2); transform: translateY(-1px); }

    .hc-footer {
      padding: 10px 12px;
      border-top: 1px solid var(--border,rgba(255,255,255,0.07));
      display: flex; gap: 8px; align-items: center;
    }
    .hc-input {
      flex: 1; background: rgba(255,255,255,0.05);
      border: 1px solid var(--border,rgba(255,255,255,0.08));
      border-radius: 10px; padding: 9px 12px;
      font-size: 13px; color: var(--text-main,#f1f5f9);
      font-family: 'Cairo',sans-serif; outline: none;
      direction: rtl; text-align: right;
      transition: border-color 0.2s;
    }
    .hc-input:focus { border-color: rgba(124,58,237,0.5); }
    .hc-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#7c3aed,#4f46e5);
      border: none; cursor: pointer; color: white;
      font-size: 14px; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
    }
    .hc-send:hover { transform: scale(1.1); }

    .hc-whatsapp {
      display: flex; align-items: center; gap: 8px;
      background: rgba(37,211,102,0.12);
      border: 1px solid rgba(37,211,102,0.3);
      border-radius: 12px; padding: 10px 14px;
      margin: 4px 12px 8px; cursor: pointer;
      color: #25d366; font-size: 13px; font-weight: 700;
      text-decoration: none; transition: all 0.2s;
      font-family: 'Cairo',sans-serif; direction: rtl;
    }
    .hc-whatsapp:hover { background: rgba(37,211,102,0.2); }

    @media (max-width: 480px) {
      #help-chat-panel { left: 8px; right: 8px; width: auto; bottom: 144px; }
      #help-fab { bottom: 80px; left: 12px; }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.id = 'hc-styles';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── قاعدة بيانات الأسئلة والأجوبة ──────────────────────
  const QA = {
    customer: [
      {
        q: '📅 كيف أحجز خدمة؟',
        a: 'من الصفحة الرئيسية اختر "خدمات" أو "حجوزات"، اضغط على الخدمة المطلوبة، ثم "أضف للسلة" أو "احجز الآن" وحدد الموعد المناسب واكمل الدفع.'
      },
      {
        q: '💰 كيف أشحن المحفظة؟',
        a: 'اذهب لـ "محفظتي" ← "شحن الرصيد"، اختر طريقة الدفع (تحويل بنكي أو إيداع)، أرسل المبلغ لأحد حسابات المنصة، وارفع صورة الإيصال. سيُضاف الرصيد خلال دقائق.'
      },
      {
        q: '📍 كيف أتتبع طلبي؟',
        a: 'من القائمة السفلية اذهب لـ "طلباتي"، ستجد كل طلباتك مع حالتها الحالية. عند خروج المندوب يمكنك تتبع موقعه حياً على الخريطة.'
      },
      {
        q: '❌ كيف ألغي طلباً؟',
        a: 'الطلب يمكن إلغاؤه قبل قبوله من المزود من صفحة "طلباتي". بعد القبول يرجى التواصل مع الدعم عبر واتساب للمساعدة.'
      },
      {
        q: '🛒 كيف أستخدم السلة؟',
        a: 'أضف أي منتجات أو خدمات للسلة بالضغط على "أضف للسلة"، ثم اضغط أيقونة السلة 🛒 في الشريط العلوي لمراجعة طلبك وإتمام الدفع دفعة واحدة.'
      },
      {
        q: '⭐ كيف أقيّم الخدمة؟',
        a: 'بعد اكتمال الطلب ستظهر لك رسالة تطلب منك التقييم. يمكنك أيضاً الذهاب لـ "طلباتي" والضغط على "تقييم" بجانب الطلب المكتمل.'
      }
    ],
    vendor: [
      {
        q: '🔔 كيف أقبل طلباً؟',
        a: 'ستصلك إشعار فور وصول طلب جديد. افتح لوحة التحكم وستجد الطلب في "الطلبات الواردة". اضغط "قبول" لبدء التجهيز أو "رفض" مع ذكر السبب.'
      },
      {
        q: '📦 كيف أضيف منتجاً؟',
        a: 'من لوحة التحكم اذهب لـ "المنتجات"، اضغط "إضافة من الكتالوج" لاختيار منتج موجود وتحديد سعرك، أو "اقتراح منتج جديد" لإرساله للإدارة للمراجعة.'
      },
      {
        q: '💵 كيف أستلم أرباحي؟',
        a: 'أرباحك تُضاف تلقائياً لمحفظتك بعد اكتمال كل طلب. من "محفظتي" اضغط "طلب سحب" وحدد المبلغ والحساب البنكي، سيتم التحويل خلال 24 ساعة.'
      },
      {
        q: '🕐 كيف أغير أوقات العمل؟',
        a: 'من لوحة التحكم اذهب للإعدادات ← "أوقات العمل"، حدد أيام وساعات دوامك ليعلم العملاء متى أنت متاح ولتجنب الطلبات خارج وقتك.'
      },
      {
        q: '📊 كيف أرى إحصائياتي؟',
        a: 'من لوحة التحكم اضغط "الإحصائيات" لترى ملخص مبيعاتك اليومية والشهرية، أعلى المنتجات مبيعاً، وتقييمات العملاء.'
      }
    ],
    driver: [
      {
        q: '📦 كيف أقبل طلب توصيل؟',
        a: 'ستصلك إشعار بطلب توصيل جديد في منطقتك. اضغط "قبول" خلال 60 ثانية لتجنب تمريره لمندوب آخر. ثم توجه للمزود لاستلام الطلب.'
      },
      {
        q: '💵 كيف أستلم أجري؟',
        a: 'أجر كل توصيل يُضاف لمحفظتك فور تسليم الطلب. من "محفظتي" اطلب السحب في أي وقت.'
      },
      {
        q: '🗺️ كيف أصل للعميل؟',
        a: 'بعد استلام الطلب من المزود، اضغط "عرض العنوان" لفتح الخريطة مباشرة مع الاتجاهات للعميل.'
      }
    ]
  };

  const WELCOME = {
    customer: 'أهلاً بك! 👋 أنا مساعدك الذكي في محجوز. كيف يمكنني مساعدتك اليوم؟',
    vendor:   'أهلاً مزود الخدمة! 💼 أنا هنا لمساعدتك في إدارة أعمالك. ماذا تحتاج؟',
    driver:   'أهلاً مندوب التوصيل! 🚗 لديك سؤال عن العمل؟ أنا هنا!',
    admin:    'أهلاً! 👑 مساعد إداري محجوز في خدمتك.'
  };

  // رقم واتساب الدعم (يمكن تغييره)
  const SUPPORT_WA = '96777000000';

  // ── بناء واجهة الشات ─────────────────────────────────────
  let panelEl = null, messagesEl = null, inputEl = null, fabEl = null;
  let isOpen = false;
  let currentRole = 'customer';

  function buildUI() {
    // FAB button
    fabEl = document.createElement('button');
    fabEl.id = 'help-fab';
    fabEl.title = 'مساعدة';
    fabEl.innerHTML = '<span class="fab-badge">؟</span>💬';
    fabEl.onclick = togglePanel;
    document.body.appendChild(fabEl);

    // Chat panel
    panelEl = document.createElement('div');
    panelEl.id = 'help-chat-panel';
    panelEl.innerHTML =
      '<div class="hc-header">'
      + '<div class="hc-avatar">🤖</div>'
      + '<div class="hc-header-text">'
      + '<div class="hc-header-name">مساعد محجوز</div>'
      + '<div class="hc-header-status"><span class="hc-status-dot"></span> متاح الآن</div>'
      + '</div></div>'
      + '<div class="hc-messages" id="hc-messages"></div>'
      + '<div class="hc-quick-replies" id="hc-qr"></div>'
      + '<a class="hc-whatsapp" href="https://wa.me/' + SUPPORT_WA + '?text=' + encodeURIComponent('مرحباً، أحتاج مساعدة في منصة محجوز') + '" target="_blank">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>'
      + 'تواصل مع الدعم عبر واتساب</a>'
      + '<div class="hc-footer">'
      + '<input class="hc-input" id="hc-input" placeholder="اكتب سؤالك..." />'
      + '<button class="hc-send" onclick="window._hcSend()">➤</button>'
      + '</div>';
    document.body.appendChild(panelEl);

    messagesEl = document.getElementById('hc-messages');
    inputEl = document.getElementById('hc-input');
    if (inputEl) {
      inputEl.addEventListener('keydown', function(e){ if(e.key==='Enter') window._hcSend(); });
    }
  }

  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      panelEl.classList.add('open');
      fabEl.classList.add('open');
      fabEl.innerHTML = '✕';
      // تحميل الرسالة الترحيبية في أول فتح
      if (!messagesEl.children.length) {
        currentRole = (window.State && State.currentUser) ? (State.currentUser.role || 'customer') : 'customer';
        addBotMsg(WELCOME[currentRole] || WELCOME.customer);
        showQuickReplies();
      }
    } else {
      panelEl.classList.remove('open');
      fabEl.classList.remove('open');
      fabEl.innerHTML = '<span class="fab-badge">؟</span>💬';
    }
  }

  function addBotMsg(text) {
    const msg = document.createElement('div');
    msg.className = 'hc-msg bot';
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMsg(text) {
    const msg = document.createElement('div');
    msg.className = 'hc-msg user';
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showQuickReplies() {
    const qrEl = document.getElementById('hc-qr');
    if (!qrEl) return;
    const role = currentRole;
    const items = QA[role] || QA.customer;
    qrEl.innerHTML = '';
    items.forEach(function(item) {
      const btn = document.createElement('button');
      btn.className = 'hc-qr';
      btn.textContent = item.q;
      btn.onclick = function() {
        addUserMsg(item.q);
        qrEl.innerHTML = '';
        setTimeout(function() {
          addBotMsg(item.a);
          setTimeout(function() {
            addMoreBtn(qrEl, items);
          }, 300);
        }, 400);
      };
      qrEl.appendChild(btn);
    });
  }

  function addMoreBtn(qrEl, items) {
    const btn = document.createElement('button');
    btn.className = 'hc-qr';
    btn.textContent = '🔄 أسئلة أخرى';
    btn.onclick = function() {
      qrEl.innerHTML = '';
      items.forEach(function(item) {
        const b = document.createElement('button');
        b.className = 'hc-qr';
        b.textContent = item.q;
        b.onclick = function() {
          addUserMsg(item.q);
          qrEl.innerHTML = '';
          setTimeout(function() {
            addBotMsg(item.a);
            setTimeout(function() { addMoreBtn(qrEl, items); }, 300);
          }, 400);
        };
        qrEl.appendChild(b);
      });
    };
    qrEl.appendChild(btn);
  }

  window._hcSend = function() {
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addUserMsg(text);

    const role = currentRole;
    const items = QA[role] || QA.customer;
    // بحث بسيط في الأسئلة
    const lower = text.toLowerCase();
    let found = null;
    items.forEach(function(item) {
      if (!found) {
        const keywords = item.q.replace(/[❌📦💵🔔📅💰📍⭐🛒🕐📊🗺️]/g,'').trim().split(' ');
        if (keywords.some(function(k){ return k.length > 2 && lower.includes(k); })) {
          found = item;
        }
      }
    });

    setTimeout(function() {
      if (found) {
        addBotMsg(found.a);
      } else {
        addBotMsg('عذراً، لم أجد إجابة محددة لسؤالك. يمكنك التواصل مع فريق الدعم عبر واتساب أدناه وسيساعدك فوراً 😊');
      }
    }, 500);
  };

  // ── التهيئة ──────────────────────────────────────────────
  function init() {
    if (document.getElementById('help-fab')) return;
    buildUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 800); });
  } else {
    setTimeout(init, 800);
  }

  // تحديث الدور عند تغيير المستخدم
  setInterval(function() {
    if (window.State && State.currentUser) {
      var r = State.currentUser.role || 'customer';
      if (r !== currentRole) { currentRole = r; }
    }
  }, 2000);

  console.log('[HelpChatbot] ✅ بوت المساعدة loaded 💬');
})();
