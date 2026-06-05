// ═══════════════════════════════════════════════════════
//  محجوز — Routing Engine & Multi-Vendor Logic
//  Distance calculation + Vendor Sorting + Chained Routing
// ═══════════════════════════════════════════════════════
'use strict';

// ─── Distance Calculation (Haversine) ────────────────
window.ph43_calculateDistance = function(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ─── ترتيب المزودين حسب أقل سعر توصيل لحي العميل ────────────────
// هذا يستبدل Haversine بمنطق أسعار التوصيل الفعلية
window.ph47_sortVendorsByDeliveryFee = function(vendorIds, customerSubzone) {
  if (!customerSubzone || !vendorIds || !vendorIds.length) {
    return vendorIds.map(id => ({ id, subzone: '', fee: 999999, routeFound: false }));
  }
  return vendorIds
    .map(vid => {
      // البحث في users أولاً (للمزودين المرتبطين بحساب)
      const user  = (AppData.users || []).find(u => u.id === vid || u.uid === vid);
      // البحث في pdb_entries (قاعدة بيانات المزودين)
      const entry = (AppData.pdbEntries || []).find(e => e.linkedUserId === vid);
      const vendorSubzone = user?.subzoneName || entry?.subzoneName || '';
      const vendorZone    = user?.zoneName    || entry?.zoneName    || '';

      // احسب سعر التوصيل إذا كانت دالة dp_calculateFee متاحة
      let fee = 999999;
      let routeFound = false;
      if (vendorSubzone && typeof dp_calculateFee === 'function') {
        const result = dp_calculateFee(vendorSubzone, customerSubzone);
        if (result.found) {
          fee = result.fee;
          routeFound = true;
        }
      }

      return { id: vid, subzone: vendorSubzone, zone: vendorZone, fee, routeFound };
    })
    .sort((a, b) => a.fee - b.fee); // الأقل سعراً أولاً = الأقرب للعميل
};

// ─── حساب رسوم التوصيل لطلب متعدد المزودين ────────────────────────
// يجمع رسوم التوصيل من كل مزود منفصل (مثلاً: 500 ريال + 1000 ريال = 1500)
window.ph47_calculateMultiVendorDeliveryFee = function(cartItems, customerSubzone) {
  if (!customerSubzone) return { totalFee: 0, vendorFees: {}, vendorSubzones: {} };

  const vendorFees     = {};  // { vendorId: fee }
  const vendorSubzones = {};  // { vendorId: subzoneName }

  for (const item of cartItems) {
    const vendors = item.assignedVendors || [];
    if (!vendors.length) continue;

    // جد المزود الأقرب لهذا المنتج
    const sorted = ph47_sortVendorsByDeliveryFee(vendors, customerSubzone);
    const best   = sorted[0];
    if (!best) continue;

    // كل مزود يُضاف مرة واحدة فقط لتجنب التكرار
    if (!(best.id in vendorFees)) {
      vendorFees[best.id]     = best.routeFound ? best.fee : 0;
      vendorSubzones[best.id] = best.subzone;
    }
    // تعيين المزود الأقرب لهذا المنتج
    item._bestVendorId      = best.id;
    item._bestVendorSubzone = best.subzone;
    item._deliveryFee       = best.fee;
  }

  const totalFee = Object.values(vendorFees).reduce((s, f) => s + f, 0);
  return { totalFee, vendorFees, vendorSubzones };
};

// ─── Admin: Show Vendor Assignment Modal ──────────────
window.ph43_showVendorAssignmentModal = async function(orderId) {
  const o = (AppData.orders || []).find(x => x.id === orderId);
  if (!o) return;

  const vendors = (AppData.users || []).filter(u => ['vendor', 'provider'].includes(u.role));
  
  // Try to get customer coordinates
  // (In a real scenario, these would be in the order or user profile)
  const custLat = o.lat || State.currentUser?.lat || 0;
  const custLng = o.lng || State.currentUser?.lng || 0;

  const orderRegion = o.orderRegionId || o.regionId || State.currentUser?.regionId || null;

  // Calculate distances for all vendors
  vendors.forEach(v => {
    v._dist = ph43_calculateDistance(custLat, custLng, v.lat || 0, v.lng || 0);
    const vendorRegion = v.regionId || null;
    v._sameRegion = !!(orderRegion && vendorRegion && orderRegion === vendorRegion);
  });

  // Sort by same region first, then distance
  vendors.sort((a, b) => {
    if (a._sameRegion && !b._sameRegion) return -1;
    if (!a._sameRegion && b._sameRegion) return 1;
    return a._dist - b._dist;
  });

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">👤 تعيين مزودي خدمة</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="margin-bottom:16px; font-size:14px; color:var(--text-secondary)">
      اختر مزوداً واحداً أو أكثر. سيقوم النظام بتوجيه الطلب للأقرب أولاً ([أولوية نفس المنطقة]).
    </div>
    <div style="max-height:400px; overflow-y:auto; border:1px solid var(--border); border-radius:12px; padding:8px">
      ${vendors.map(v => `
        <label style="display:flex; align-items:center; gap:12px; padding:12px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.2s" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
          <input type="checkbox" class="vendor-pool-cb" value="${v.id}" style="width:20px; height:20px">
          <div style="flex:1">
            <div style="font-weight:700; display:flex; align-items:center; gap:8px">
              <span>${v.name}</span>
              ${v._sameRegion ? `<span style="background:rgba(16,185,129,0.15);color:#059669;border-radius:6px;padding:1px 7px;font-size:10px;font-weight:800;border:1px solid rgba(16,185,129,0.3)">📍 نفس المنطقة</span>` : ''}
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px">
              📍 يبعد حوالي ${v._dist < 1000 ? Math.round(v._dist) + ' كم' : 'مسافة غير معروفة'}
            </div>
          </div>
          <span class="badge badge-purple">${v.role === 'vendor' ? 'صاحب متجر' : 'مزود خدمة'}</span>
        </label>
      `).join('')}
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary btn-block btn-lg" onclick="ph43_startRouting('${orderId}')">🚀 بدء التوجيه للأقرب</button>
    </div>
  `);
};

// ─── Admin: Approve & Auto-Route ───────────────────────
window.ph43_approveAndAutoRoute = async function(orderId) {
  const o = (AppData.orders || []).find(x => x.id === orderId);
  if (!o) return;

  showLoader('جاري تحليل المزودين المعتمدين...');
  try {
    // Collect all assigned vendors for items in this order
    let candidateIds = [];
    
    // Auto-routing bypass for Tier-Level Vendor Routing
    if (o.vendorId) {
      candidateIds.push(o.vendorId);
    } else if (o.type === 'store_order' && o.items) {
      o.items.forEach(item => {
        const p = AppData.storeProducts?.find(x => x.id === item.productId);
        if (p && p.assignedVendors) candidateIds.push(...p.assignedVendors);
      });
    } else {
      const s = AppData.services?.find(x => x.id === o.svcId);
      if (s && s.assignedVendors) candidateIds.push(...s.assignedVendors);
    }

    // Unique IDs
    candidateIds = [...new Set(candidateIds)];

    if (!candidateIds.length) {
      toast('لا يوجد مزودين معتمدين لهذه الخدمة/المنتجات. يرجى تعيينهم أولاً.', 'warning');
      hideLoader(); return;
    }

    // التوجيه الذكي: الأقل سعر توصيل = الأقرب للعميل
    const custLat = o.lat || 0;
    const custLng = o.lng || 0;
    const orderRegion = o.orderRegionId || o.regionId || State.currentUser?.regionId || null;
    const customerSubzone = o.customerSubzone || '';
    let pool;
    if (customerSubzone && typeof ph47_sortVendorsByDeliveryFee === 'function') {
      // الترتيب الجديد حسب أسعار التوصيل
      pool = ph47_sortVendorsByDeliveryFee(candidateIds, customerSubzone).map(x => x.id);
    } else {
      // احتياطي: إذا لم يتوفر حي العميل → الترتيب الجغرافي القديم
      pool = candidateIds.map(id => {
        const v = AppData.users.find(u => u.id === id);
        const dist = ph43_calculateDistance(custLat, custLng, v?.lat || 0, v?.lng || 0);
        const vendorRegion = v?.regionId || null;
        const sameRegion   = !!(orderRegion && vendorRegion && orderRegion === vendorRegion);
        return { id, dist, sameRegion };
      })
      .sort((a, b) => {
        if (a.sameRegion && !b.sameRegion) return -1;
        if (!a.sameRegion && b.sameRegion) return 1;
        return a.dist - b.dist;
      })
      .map(x => x.id);
    }

    // Update Order
    const firstVendorId = pool[0];
    const firstVendor = AppData.users.find(u => u.id === firstVendorId);
    const firstVendorRegion = firstVendor?.regionId || null;
    const regionMatchNote = (orderRegion && firstVendorRegion && orderRegion === firstVendorRegion)
      ? ` (📍 نفس منطقة الطلب)`
      : ' (أقرب منطقة متاحة)';

    await fsUpdate('orders', orderId, {
      vendorPool: pool,
      currentVendorIdx: 0,
      providerUid: firstVendorId,
      providerName: firstVendor?.name || '—',
      status: 'pending_provider',
      vendorNotifiedAt: new Date(),
      locationCount: 1,
      additionalDeliveryFee: 0,
      orderRegionId: orderRegion,
      routingLog: [{ at: new Date(), msg: `تمت الموافقة الإدارية. النظام اختار تلقائياً ${pool.length} مزودين${customerSubzone ? ` (بناءً على حي العميل: ${customerSubzone})` : ' (ترتيب جغرافي)'}. البداية مع: ${firstVendorId}` }]
    });

    toast('✅ تمت الموافقة وتوجيه الطلب للأقرب تلقائياً ([أولوية نفس المنطقة])', 'success');
    await render();
  } catch (e) {
    console.error(e);
    toast('فشل التوجيه التلقائي', 'error');
  } finally {
    hideLoader();
  }
};

// ─── Vendor: Show Partial Accept Modal ────────────────
window.ph43_showPartialAcceptModal = function(orderId) {
  const o = (AppData.orders || []).find(x => x.id === orderId);
  if (!o || !o.items) return;

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">📦 مراجعة منتجات الطلب</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="margin-bottom:16px; font-size:14px; color:var(--text-secondary)">
      حدد المنتجات المتوفرة لديك حالياً. المنتجات غير المحددة سيتم توجيهها للموقع التالي.
    </div>
    <div style="max-height:400px; overflow-y:auto; border:1px solid var(--border); border-radius:12px">
      ${o.items.map((item, idx) => `
        <div style="padding:12px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:8px">
          <div style="display:flex; align-items:center; gap:10px">
            <input type="checkbox" class="item-accept-cb" data-idx="${idx}" checked style="width:20px; height:20px">
            <div style="flex:1; font-weight:700">${item.name}</div>
            <div style="color:var(--primary); font-weight:700">الكمية: ${item.qty}</div>
          </div>
          <div class="rejection-reason-wrap" style="display:none; margin-inline-start:30px">
            <select class="form-control item-reject-reason" style="font-size:12px; padding:6px">
              <option value="out_of_stock">❌ غير متوفر (نفد المخزون)</option>
              <option value="not_available">❌ لا يمكن توفيره حالياً</option>
              <option value="damaged">❌ تالف أو غير صالح</option>
            </select>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary btn-block btn-lg" onclick="ph43_submitVendorDecision('${orderId}')">✅ تأكيد وتحديث الطلب</button>
    </div>
  `);

  // Listen for checkbox changes to show/hide reason
  document.querySelectorAll('.item-accept-cb').forEach(cb => {
    cb.addEventListener('change', function() {
      const reasonWrap = this.closest('div').nextElementSibling;
      if (reasonWrap) reasonWrap.style.display = this.checked ? 'none' : 'block';
    });
  });
};

// ─── Vendor: Submit Decision ─────────────────────────
window.ph43_submitVendorDecision = async function(orderId) {
  const o = (AppData.orders || []).find(x => x.id === orderId);
  if (!o) return;

  const items = [...o.items];
  let rejectedCount = 0;
  const cUid = State.currentUser.uid;

  document.querySelectorAll('.item-accept-cb').forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    if (cb.checked) {
      items[idx].status = 'accepted';
      items[idx].fulfilledBy = cUid;
      items[idx].acceptedAt = new Date();
    } else {
      items[idx].status = 'rejected';
      items[idx].rejectionReason = cb.closest('div').nextElementSibling.querySelector('select').value;
      rejectedCount++;
    }
  });

  showLoader('جاري تحديث الطلب...');
  try {
    const acceptedInThisSite = items.filter(i => i.fulfilledBy === cUid).length;
    const siteLabel = `الموقع رقم ${o.locationCount || 1}`;
    
    // Update items in DB
    await fsUpdate('orders', orderId, { items });

    if (rejectedCount > 0) {
      // Logic for routing to next vendor or back to admin
      await ph43_routeToNextVendor(orderId, items.filter(i => i.status === 'rejected'));
    } else {
      // All items in this order (or remaining items) are accepted by this vendor
      // Now it goes back to admin for FINAL APPROVAL
      await fsUpdate('orders', orderId, {
        status: 'pending_final_admin',
        routingLog: [...(o.routingLog || []), { 
          at: new Date(), 
          msg: `المزود ${cUid} قبل جميع المنتجات المسندة إليه. بانتظار الموافقة النهائية.` 
        }]
      });
      toast('✅ تم قبول المنتجات. بانتظار الموافقة النهائية من الإدارة.', 'success');
    }
    
    closeModal();
    await render();
  } catch (e) {
    toast('حدث خطأ أثناء تحديث الطلب', 'error');
  } finally {
    hideLoader();
  }
};

// ─── Admin: Final Approval ────────────────────────────
window.ph43_adminFinalApprove = async function(orderId) {
  if (!confirm('تأكيد الموافقة النهائية وإرسال الإشعار للعميل؟')) return;
  
  showLoader('جاري الاعتماد النهائي...');
  try {
    const o = (AppData.orders || []).find(x => x.id === orderId);
    // Build the displayStatus for the customer (Privacy)
    // Group items by fulfilledBy to count locations
    const locations = {};
    o.items.forEach(item => {
      if (item.status === 'accepted' && item.fulfilledBy) {
        if (!locations[item.fulfilledBy]) locations[item.fulfilledBy] = 0;
        locations[item.fulfilledBy] += 1;
      }
    });

    const locEntries = Object.entries(locations);
    let displayStatus = `تم قبول طلبك! المنتجات جاهزة من ${locEntries.length} مواقع مختلفة.`;
    if (locEntries.length > 1) {
      displayStatus = `طلبك جاهز من ${locEntries.length} مواقع: `;
      locEntries.forEach(([uid, count], idx) => {
        displayStatus += `${count} منتجات من الموقع ${idx + 1}${idx < locEntries.length - 1 ? ' و ' : ''}`;
      });
    }

    await fsUpdate('orders', orderId, {
      status: 'approved',
      displayStatus: displayStatus,
      finalApprovedAt: new Date()
    });
    toast('✅ تمت الموافقة النهائية وإبلاغ العميل', 'success');
    await render();
  } catch (e) {
    toast('فشل الاعتماد', 'error');
  } finally {
    hideLoader();
  }
};

// ─── Logic: Route to Next Vendor ──────────────────────
window.ph43_routeToNextVendor = async function(orderId, rejectedItems) {
  const o = (AppData.orders || []).find(x => x.id === orderId);
  if (!o || !o.vendorPool) return;

  const nextIdx = (o.currentVendorIdx || 0) + 1;
  
  if (nextIdx < o.vendorPool.length) {
    const nextVendorId = o.vendorPool[nextIdx];
    const nextVendor = AppData.users.find(u => u.id === nextVendorId);
    
    // Add 10 YER for each additional location
    const newExtraFee = (o.additionalDeliveryFee || 0) + 10;
    const newLocationCount = (o.locationCount || 1) + 1;

    await fsUpdate('orders', orderId, {
      currentVendorIdx: nextIdx,
      providerUid: nextVendorId,
      providerName: nextVendor?.name || '—',
      status: 'pending_provider',
      vendorNotifiedAt: new Date(),
      locationCount: newLocationCount,
      additionalDeliveryFee: newExtraFee,
      total: (o.total || 0) + 10, // Update total price
      routingLog: [...(o.routingLog || []), { 
        at: new Date(), 
        msg: `المزود السابق رفض بعض المنتجات. تم التوجيه للموقع التالي: ${nextVendorId}` 
      }]
    });
    toast('تم توجيه المنتجات المرفوضة للموقع التالي', 'info');
  } else {
    // No more vendors in pool
    await fsUpdate('orders', orderId, {
      status: 'pending_final_admin', // Back to admin to decide what to do with unfulfilled items
      routingLog: [...(o.routingLog || []), { 
        at: new Date(), 
        msg: 'انتهت قائمة المزودين ولم تكتمل كافة المنتجات.' 
      }]
    });
    toast('انتهت قائمة المزودين المتاحين. بانتظار قرار الإدارة النهائي.', 'warning');
  }
};
