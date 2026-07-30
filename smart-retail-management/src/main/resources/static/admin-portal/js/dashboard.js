document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('zetlan_token');
  if (!token) { window.location.replace('auth.html'); return; }

  const userNameEl = document.getElementById('dynamic-user-name');
  if (userNameEl) userNameEl.textContent = localStorage.getItem('zetlan_user_name') || 'System User';

  initSidebarDrawer();
  initAvatarMenu();
  applyRBAC();
  initRouter();
  initSystemSettings();
  fetchDashboardData();
  initConfirmModal();

  document.getElementById('pos-search')?.addEventListener('input', (e) => filterPOSGrid(e.target.value));
  initPOSCustomerSearch();
});

function logoutUser() {
  localStorage.removeItem('zetlan_token');
  localStorage.removeItem('zetlan_user_name');
  localStorage.removeItem('zetlan_user_role');
  window.location.replace('auth.html');
}

function deleteMyAccount() {
  openConfirmModal(
    "Delete Your Account?",
    "Are you absolutely sure? You will be immediately logged out and permanently lose access.",
    async () => {
      try {
        const loggedInUsername = localStorage.getItem('zetlan_user_name');
        const tokenHeader = { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` };

        // 1. Attempt to remove from Employees table
        try {
          const emps = await apiRequest('/employees').catch(() => []);
          const meEmp = emps.find(e => (e.username === loggedInUsername || e.fullName === loggedInUsername || e.email === loggedInUsername));
          if (meEmp) {
            await fetch(`http://localhost:8080/api/employees/${meEmp.id}`, { method: 'DELETE', headers: tokenHeader });
          }
        } catch (e) { /* Ignore if employee endpoint is restricted */ }

        // 2. Attempt to remove from Users table
        try {
          const users = await apiRequest('/users').catch(() => []);
          const meUser = users.find(u => (u.name === loggedInUsername || u.email === loggedInUsername));
          if (meUser) {
            await fetch(`http://localhost:8080/api/users/${meUser.id}`, { method: 'DELETE', headers: tokenHeader });
          }
        } catch (e) { /* Ignore if users endpoint is restricted */ }

        logoutUser();
      } catch (err) {
        showCustomToast("Failed to delete account. Ensure no active constraints exist.", true);
      }
    }
  );
}

// ------------------------------------------------------------------
// OFF-CANVAS HAMBURGER DRAWER & AVATAR SLIDE MENU LOGIC
// ------------------------------------------------------------------
function initSidebarDrawer() {
  const openBtn = document.getElementById('hamburger-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const drawer = document.getElementById('sidebar-nav-drawer');
  const overlay = document.getElementById('sidebar-overlay');

  if (openBtn) openBtn.addEventListener('click', () => { drawer.classList.add('open'); overlay.classList.add('active'); });
  if (closeBtn) closeBtn.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('active'); });
  if (overlay) overlay.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('active'); });

  document.querySelectorAll('#sidebar-menu a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    });
  });
}

function initAvatarMenu() {
  const avatarBtn = document.getElementById('avatar-btn');
  const closeBtn = document.getElementById('close-user-menu');
  const menu = document.getElementById('user-slide-menu');
  const overlay = document.getElementById('user-menu-overlay');

  if (avatarBtn) avatarBtn.addEventListener('click', () => { menu.classList.add('open'); overlay.classList.add('active'); });
  if (closeBtn) closeBtn.addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('active'); });
  if (overlay) overlay.addEventListener('click', () => { menu.classList.remove('open'); overlay.classList.remove('active'); });
}

function closeAvatarMenu() {
  const menu = document.getElementById('user-slide-menu');
  const overlay = document.getElementById('user-menu-overlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function openProfileModal() {
  closeAvatarMenu();
  const modal = document.getElementById('profile-modal');
  const nameEl = document.getElementById('profile-modal-name');
  const roleEl = document.getElementById('profile-modal-role');
  const privEl = document.getElementById('profile-modal-privileges');

  const name = localStorage.getItem('zetlan_user_name') || 'System User';
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';

  if (nameEl) nameEl.textContent = name;
  if (roleEl) {
    roleEl.textContent = `${role} ACCESS`;
    roleEl.className = `badge ${role === 'ADMIN' ? 'orange' : role === 'MANAGER' ? 'shift' : 'active'} mb-md`;
  }
  if (privEl) {
    privEl.textContent = role === 'ADMIN' ? 'Full Control' : role === 'MANAGER' ? 'Operational & Catalog' : 'Standard Terminal';
  }

  if (modal) modal.classList.add('active');
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.classList.remove('active');
}

function openPOSFromAvatar() {
  closeAvatarMenu();
  openPOSModal();
}

function navigateToSettingsFromAvatar() {
  closeAvatarMenu();
  const settingsLink = document.querySelector('.nav-links a[data-target="settings-view"]');
  if (settingsLink) settingsLink.click();
}

function applyRBAC() {
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  document.querySelectorAll('#sidebar-menu li').forEach(li => {
    const privilege = li.getAttribute('data-privilege');
    if (privilege && privilege !== 'ALL' && !privilege.includes(role)) {
      li.classList.add('hidden-el');
    }
  });
  if (role === 'STAFF') {
    document.querySelectorAll('.rbac-add').forEach(btn => btn.classList.add('hidden-el'));
  }
}

function initRouter() {
  const links = document.querySelectorAll('.nav-links a');
  const views = document.querySelectorAll('.view-section');
  const title = document.getElementById('current-page-title');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';

  const addProductBtn = document.querySelector('#products-view .btn-primary');
  if (role !== 'STAFF' && addProductBtn) addProductBtn.addEventListener('click', () => openProductModal());

  const addCustomerBtn = document.querySelector('#customers-view .btn-primary');
  if (addCustomerBtn) {
    addCustomerBtn.classList.remove('hidden-el');
    addCustomerBtn.addEventListener('click', () => openCustomerModal());
  }

  const addSupplierBtn = document.querySelector('#suppliers-view .btn-primary');
  if (role !== 'STAFF' && addSupplierBtn) addSupplierBtn.addEventListener('click', () => openSupplierModal());

  const addEmployeeBtn = document.querySelector('#employees-view .btn-primary');
  if (role === 'ADMIN' && addEmployeeBtn) addEmployeeBtn.addEventListener('click', () => openEmployeeModal());

  const addOrderBtns = document.querySelectorAll('#orders-view button');
  addOrderBtns.forEach(btn => {
    if (btn.textContent.includes('New Order')) {
      btn.addEventListener('click', () => openPOSModal());
    }
  });

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      title.innerHTML = link.innerHTML;

      const targetId = link.getAttribute('data-target');
      views.forEach(view => {
        view.classList.remove('active');
        if (view.id === targetId) view.classList.add('active');
      });

      if (targetId === 'dashboard-view') fetchDashboardData();
      if (targetId === 'products-view') fetchProducts();
      if (targetId === 'orders-view') fetchOrders();
      if (targetId === 'customers-view') fetchCustomers();
      if (targetId === 'suppliers-view') fetchSuppliers();
      if (targetId === 'employees-view') fetchEmployees();
    });
  });
}

// ------------------------------------------------------------------
// PERSISTENT CLIENT-SIDE SETTINGS ENGINE
// ------------------------------------------------------------------
function initSystemSettings() {
  const storeNameInput = document.getElementById('setting-store-name');
  const taxRateInput = document.getElementById('setting-tax-rate');
  const loyaltyRateInput = document.getElementById('setting-loyalty-rate');
  const darkModeCheckbox = document.getElementById('setting-dark-mode');
  const emailAlertsCheckbox = document.getElementById('setting-email-alerts');
  const autoBackupCheckbox = document.getElementById('setting-auto-backup');

  const savedStoreName = localStorage.getItem('zetlan_store_name');
  const savedTaxRate = localStorage.getItem('zetlan_tax_rate');
  const savedLoyaltyRate = localStorage.getItem('zetlan_loyalty_rate');
  const savedDarkMode = localStorage.getItem('zetlan_dark_mode');
  const savedEmailAlerts = localStorage.getItem('zetlan_email_alerts');
  const savedAutoBackup = localStorage.getItem('zetlan_auto_backup');

  if (storeNameInput && savedStoreName !== null) storeNameInput.value = savedStoreName;
  if (taxRateInput && savedTaxRate !== null) taxRateInput.value = savedTaxRate;
  if (loyaltyRateInput && savedLoyaltyRate !== null) loyaltyRateInput.value = savedLoyaltyRate;
  if (darkModeCheckbox && savedDarkMode !== null) darkModeCheckbox.checked = (savedDarkMode === 'true');
  if (emailAlertsCheckbox && savedEmailAlerts !== null) emailAlertsCheckbox.checked = (savedEmailAlerts === 'true');
  if (autoBackupCheckbox && savedAutoBackup !== null) autoBackupCheckbox.checked = (savedAutoBackup === 'true');
}

function saveSystemSettings() {
  const storeNameInput = document.getElementById('setting-store-name');
  const taxRateInput = document.getElementById('setting-tax-rate');
  const loyaltyRateInput = document.getElementById('setting-loyalty-rate');
  const darkModeCheckbox = document.getElementById('setting-dark-mode');
  const emailAlertsCheckbox = document.getElementById('setting-email-alerts');
  const autoBackupCheckbox = document.getElementById('setting-auto-backup');

  if (storeNameInput) localStorage.setItem('zetlan_store_name', storeNameInput.value.trim());
  if (taxRateInput) localStorage.setItem('zetlan_tax_rate', taxRateInput.value);
  if (loyaltyRateInput) localStorage.setItem('zetlan_loyalty_rate', loyaltyRateInput.value);
  if (darkModeCheckbox) localStorage.setItem('zetlan_dark_mode', darkModeCheckbox.checked);
  if (emailAlertsCheckbox) localStorage.setItem('zetlan_email_alerts', emailAlertsCheckbox.checked);
  if (autoBackupCheckbox) localStorage.setItem('zetlan_auto_backup', autoBackupCheckbox.checked);

  showCustomToast('System settings & preferences saved successfully!');
}

// ------------------------------------------------------------------
// DASHBOARD & DYNAMIC OPERATIONS FEED LOGIC
// ------------------------------------------------------------------
async function fetchDashboardData(showToast = false) {
  try {
    const [products, orders] = await Promise.all([
      apiRequest('/products').catch(() => []),
      apiRequest('/sales-orders').catch(() => [])
    ]);

    let totalValue = 0;
    let lowStockCount = 0;
    let lowStockItems = [];

    products.forEach(p => {
      totalValue += (p.price * p.stockQuantity);
      if (p.stockQuantity < 10) {
        lowStockCount++;
        lowStockItems.push(p);
      }
    });

    document.getElementById('stat-inventory-value').textContent = `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('stat-total-products').textContent = products.length;
    document.getElementById('stat-low-stock').textContent = `${lowStockCount} Items`;

    const alertsContainer = document.getElementById('alerts-widget-container');
    if (alertsContainer) {
      if (lowStockItems.length > 0) {
        alertsContainer.innerHTML = lowStockItems.map(item => `
          <div class="alert-widget-item">
            <div class="alert-icon-box"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="alert-text-box">
              <h4>${item.name}</h4>
              <p>Only ${item.stockQuantity} units left in stock.</p>
            </div>
          </div>
        `).join('');
      } else {
        alertsContainer.innerHTML = '<p class="empty-msg">All stock is healthy.</p>';
      }
    }

    const recentContainer = document.getElementById('recent-operations-container');
    if (recentContainer) {
      const recentOrders = Array.isArray(orders) ? orders.slice().reverse().slice(0, 5) : [];
      if (recentOrders.length > 0) {
        recentContainer.innerHTML = `
          <div class="recent-ops-list">
            ${recentOrders.map(o => {
              const custName = (o.customerName && o.customerName.toLowerCase() !== 'walk-in') ? o.customerName : 'Guest Checkout';
              const formattedDate = o.orderDate ? new Date(o.orderDate).toLocaleString() : 'Just now';
              const itemCount = o.items ? o.items.length : 1;
              const totalVal = Number(o.totalAmount || 0);

              return `
                <div class="recent-op-item">
                  <div class="recent-op-icon"><i class="fa-solid fa-bag-shopping"></i></div>
                  <div class="recent-op-details">
                    <strong class="recent-op-title">Sales Order ${o.orderNumber || '#' + o.id}</strong>
                    <span class="recent-op-sub">${custName} • ${itemCount} item(s) • ${formattedDate}</span>
                  </div>
                  <div class="recent-op-amount">
                    +₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        recentContainer.innerHTML = '<p class="empty-msg">No recent sales operations logged yet.</p>';
      }
    }

    if (showToast) {
      showCustomToast('Dashboard data synchronized!');
    }

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    if (showToast) showCustomToast('Failed to sync dashboard data.', true);
  }
}

async function fetchProducts() {
  const tbody = document.getElementById('products-table-body');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const canDelete = role === 'ADMIN';

  try {
    const data = await apiRequest('/products');
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No products found in catalog.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(p => {
      let actionBtns = '';
      if (canEdit) actionBtns += `<button class="btn btn-secondary btn-sm" onclick="openProductModal(${p.id})"><i class="fa-solid fa-pen"></i></button>`;
      if (canDelete) actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>`;
      if (!canEdit && !canDelete) actionBtns = `<span class="view-only-label"><i class="fa-solid fa-eye"></i> View Only</span>`;

      let fallbackImg = `https://placehold.co/100x100/1a1a1a/38bdf8?text=${p.name.charAt(0).toUpperCase()}`;
      let rawUrl = p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:8080${p.imageUrl.startsWith('/') ? '' : '/'}${p.imageUrl}`) : fallbackImg;
      let imgSrc = encodeURI(rawUrl);

      return `
      <tr>
        <td class="text-muted">#${p.id}</td>
        <td>
          <div class="table-product-cell">
            <div class="table-thumb-wrapper">
               <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" class="table-thumb-img" alt="${p.name}">
            </div>
            <div class="table-product-info">
              <strong>${p.name}</strong>
            </div>
          </div>
        </td>
        <td class="text-muted">${p.categoryName || 'General'}</td>
        <td class="font-bold">₹${Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="font-medium">${p.stockQuantity}</td>
        <td><div class="table-actions-row">${actionBtns}</div></td>
      </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">API Connection Error. Ensure backend is running.</td></tr>';
  }
}

// ------------------------------------------------------------------
// SUPPLIERS & EMPLOYEES LOGIC (DUAL-TABLE SYNCHRONIZED MERGING)
// ------------------------------------------------------------------
async function fetchSuppliers() {
  const tbody = document.getElementById('suppliers-table-body');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const canDelete = role === 'ADMIN';

  try {
    const data = await apiRequest('/suppliers');
    if (!data.length) return tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No suppliers found.</td></tr>';

    tbody.innerHTML = data.map(s => {
      let actionBtns = '';
      if (canEdit) actionBtns += `<button class="btn btn-secondary btn-sm" onclick="openSupplierModal(${s.id})"><i class="fa-solid fa-pen"></i></button>`;
      if (canDelete) actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteSupplier(${s.id})"><i class="fa-solid fa-trash"></i></button>`;
      if (!canEdit && !canDelete) actionBtns = `<span class="view-only-label"><i class="fa-solid fa-eye"></i> View Only</span>`;

      return `
      <tr>
        <td class="text-muted">#${s.id}</td>
        <td><strong>${s.companyName}</strong><br><span class="table-subtext">${s.contactPerson}</span></td>
        <td class="text-muted">${s.email}</td>
        <td>${s.phone}</td>
        <td><div class="table-actions-row">${actionBtns}</div></td>
      </tr>`;
    }).join('');
  } catch (err) { tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">API Error.</td></tr>'; }
}

async function fetchEmployees() {
  const tbody = document.getElementById('employees-table-body');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  const canEdit = role === 'ADMIN';
  const canDelete = role === 'ADMIN';
  const loggedInUser = localStorage.getItem('zetlan_user_name');

  try {
    // Simultaneously query BOTH /api/employees and /api/users to combine staff and auth-registered users
    const [employeesData, usersData] = await Promise.all([
      apiRequest('/employees').catch(() => []),
      apiRequest('/users').catch(() => [])
    ]);

    const mergedMap = new Map();

    // 1. Add employees first
    if (Array.isArray(employeesData)) {
      employeesData.forEach(emp => {
        const key = (emp.email || emp.username || `emp_${emp.id}`).toLowerCase();
        mergedMap.set(key, {
          id: emp.id,
          name: emp.fullName || emp.username || 'Unnamed Staff',
          email: emp.email || 'No email',
          role: (emp.roleName || emp.role || 'STAFF').toUpperCase(),
          source: 'employee',
          rawId: emp.id
        });
      });
    }

    // 2. Add registered users from 'users' table without duplicating existing emails
    if (Array.isArray(usersData)) {
      usersData.forEach(usr => {
        const key = (usr.email || usr.name || `usr_${usr.id}`).toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            id: usr.id,
            name: usr.name || usr.fullName || 'Registered User',
            email: usr.email || 'No email',
            role: (usr.role || usr.roleName || 'STAFF').toUpperCase(),
            source: 'user',
            rawId: usr.id
          });
        } else {
          const existing = mergedMap.get(key);
          if (usr.role) existing.role = usr.role.toUpperCase();
        }
      });
    }

    const combinedList = Array.from(mergedMap.values());

    if (!combinedList.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No employees found.</td></tr>';
      return;
    }

    tbody.innerHTML = combinedList.map((emp, idx) => {
      let actionBtns = '';
      if (canEdit && emp.source === 'employee') {
        actionBtns += `<button class="btn btn-secondary btn-sm" onclick="openEmployeeModal(${emp.rawId})" title="Edit"><i class="fa-solid fa-pen"></i></button>`;
      }

      const isMe = (emp.name === loggedInUser || emp.email === loggedInUser);
      if (canDelete && !isMe) {
        actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteEmployeeRecord(${emp.rawId}, '${emp.source}')" title="Delete"><i class="fa-solid fa-trash"></i></button>`;
      } else if (canDelete && isMe) {
        actionBtns += `<span class="view-only-label">(You)</span>`;
      }

      if (!actionBtns) actionBtns = `<span class="view-only-label"><i class="fa-solid fa-eye"></i> View Only</span>`;

      const empRole = emp.role || 'STAFF';
      const badgeClass = empRole === 'ADMIN' ? 'orange' : empRole === 'MANAGER' ? 'shift' : 'active';
      const badgeText = empRole === 'ADMIN' ? 'Admin Access' : empRole === 'MANAGER' ? 'Manager Access' : 'Active';

      return `
      <tr>
        <td class="text-muted">#${idx + 1}</td>
        <td><strong>${emp.name}</strong></td>
        <td class="text-muted">${emp.email}</td>
        <td>${empRole}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td><div class="table-actions-row">${actionBtns}</div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error("Fetch employees error:", err);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">API Error loading staff & roles.</td></tr>';
  }
}

// ------------------------------------------------------------------
// SALES ORDERS LOGIC
// ------------------------------------------------------------------
let globalOrdersCache = [];

async function fetchOrders() {
  const tbody = document.getElementById('orders-table-body');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  const canDelete = role === 'ADMIN';

  try {
    const data = await apiRequest('/sales-orders');
    globalOrdersCache = Array.isArray(data) ? data : [];

    if (!globalOrdersCache.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No sales orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = globalOrdersCache.slice().reverse().map(o => {
      let actionBtns = `<button class="btn btn-secondary btn-sm" onclick="openOrderDetailsModal(${o.id})"><i class="fa-solid fa-receipt"></i> Details</button>`;
      if (canDelete) actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteOrder(${o.id})"><i class="fa-solid fa-trash"></i></button>`;

      const custName = (o.customerName && o.customerName.toLowerCase() !== 'walk-in') ? o.customerName : 'Guest Checkout (No Account)';
      const formattedDate = o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'Just Now';
      const totalAmount = Number(o.totalAmount || 0);

      return `
      <tr>
        <td class="text-muted">#${o.id}</td>
        <td><strong>${custName}</strong></td>
        <td class="text-muted">${formattedDate}</td>
        <td class="font-bold">₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td class="font-medium">${o.status || 'COMPLETED'}</td>
        <td><div class="table-actions-row">${actionBtns}</div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error("Sales Order Fetch Error:", err);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">API Error. Unable to fetch sales ledger.</td></tr>';
  }
}

function openOrderDetailsModal(orderId) {
  const order = globalOrdersCache.find(o => o.id === orderId);
  if (!order) return showCustomToast("Order data missing from cache.", true);

  document.getElementById('detail-order-number').textContent = order.orderNumber || `#${order.id}`;
  document.getElementById('detail-customer').textContent = (order.customerName && order.customerName.toLowerCase() !== 'walk-in') ? order.customerName : 'Guest Checkout (No Account)';

  const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleString() : new Date().toLocaleString();

  document.getElementById('detail-meta').innerHTML = `
    <span class="meta-date-text">${dateStr}</span>
    <span class="meta-cashier-badge"><i class="fa-solid fa-user-tag"></i> ${order.employeeName || 'Staff Terminal'}</span>
  `;

  const tbody = document.getElementById('detail-items-body');
  if (order.items && order.items.length > 0) {
    tbody.innerHTML = order.items.map(item => `
      <tr>
        <td><strong>${item.productName || 'Catalog Item'}</strong></td>
        <td class="text-center">${item.quantity || 1}</td>
        <td class="text-right text-muted">₹${Number(item.unitPrice || 0).toFixed(2)}</td>
        <td class="text-right font-bold">₹${Number(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No item details found.</td></tr>';
  }

  document.getElementById('detail-total').textContent = `₹${Number(order.totalAmount || 0).toFixed(2)}`;
  document.getElementById('order-details-modal').classList.add('active');
}

function closeOrderDetailsModal() { document.getElementById('order-details-modal').classList.remove('active'); }

async function fetchCustomers() {
  const tbody = document.getElementById('customers-table-body');
  const role = localStorage.getItem('zetlan_user_role') || 'STAFF';
  const canEdit = role === 'ADMIN' || role === 'MANAGER';
  const canDelete = role === 'ADMIN';

  try {
    const data = await apiRequest('/customers');
    if (!data.length) return tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No customers found.</td></tr>';

    tbody.innerHTML = data.map(c => {
      let actionBtns = '';
      if (canEdit) actionBtns += `<button class="btn btn-secondary btn-sm" onclick="openCustomerModal(${c.id})"><i class="fa-solid fa-pen"></i></button>`;
      if (canDelete) actionBtns += `<button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id})"><i class="fa-solid fa-trash"></i></button>`;
      if (!canEdit && !canDelete) actionBtns = `<span class="view-only-label"><i class="fa-solid fa-eye"></i> View Only</span>`;

      return `
      <tr>
        <td class="text-muted">#${c.id}</td>
        <td><strong>${c.name}</strong><br><span class="customer-loyalty"><i class="fa-solid fa-star"></i> ${c.loyaltyPoints || 0} Points</span></td>
        <td class="text-muted">${c.email}</td>
        <td>${c.phone}</td>
        <td><div class="table-actions-row">${actionBtns}</div></td>
      </tr>`;
    }).join('');
  } catch (err) { tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">API Connection Error.</td></tr>'; }
}

// ------------------------------------------------------------------
// GLOBAL TOAST & CONFIRMATION MODAL LOGIC
// ------------------------------------------------------------------
function showCustomToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `custom-toast ${isError ? 'toast-error' : ''}`;
  const icon = isError ? 'fa-circle-exclamation' : 'fa-circle-check';
  toast.innerHTML = `<i class="fa-solid ${icon} btn-icon-left"></i> ${message}`;

  toast.animate([{ transform: 'translateX(100%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
  container.appendChild(toast);
  setTimeout(() => { toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => container.removeChild(toast); }, 2900);
}

let confirmActionCallback = null;

function initConfirmModal() {
  const confirmBtn = document.getElementById('confirm-action-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      if (confirmActionCallback) await confirmActionCallback();
      closeConfirmModal();
    });
  }
}

function openConfirmModal(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  confirmActionCallback = callback;
  document.getElementById('confirm-modal').classList.add('active');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
  confirmActionCallback = null;
}

// ------------------------------------------------------------------
// PRODUCT CRUD LOGIC
// ------------------------------------------------------------------
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const catDropdown = document.getElementById('modal-category-dropdown');

if (catDropdown) {
  const selectedCat = document.getElementById('modal-category-selected');
  selectedCat.addEventListener('click', (e) => { e.stopPropagation(); catDropdown.classList.toggle('active'); });
  document.addEventListener('click', (e) => { if (!catDropdown.contains(e.target)) catDropdown.classList.remove('active'); });
}

async function populateCategoryDropdown(selectedId = null) {
  const optionsContainer = document.getElementById('modal-category-options');
  const selectedText = document.getElementById('modal-category-selected');
  const hiddenInput = document.getElementById('modal-product-category');
  try {
    const categories = await apiRequest('/categories');
    optionsContainer.innerHTML = categories.map(c => `<div class="dropdown-option" data-value="${c.id}">${c.name}</div>`).join('');
    optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedText.textContent = opt.textContent;
        hiddenInput.value = opt.getAttribute('data-value');
        catDropdown.classList.remove('active');
      });
    });
    if (selectedId) {
      const selectedOpt = categories.find(c => c.id == selectedId);
      if (selectedOpt) { selectedText.textContent = selectedOpt.name; hiddenInput.value = selectedOpt.id; }
    } else { selectedText.textContent = 'Select a category'; hiddenInput.value = ''; }
  } catch (err) { optionsContainer.innerHTML = '<div class="dropdown-option">Error loading categories</div>'; }
}

function resetProductForm() {
  if (productForm) productForm.reset();
  const selCat = document.getElementById('modal-category-selected');
  if (selCat) selCat.textContent = 'Select a category';
  document.getElementById('modal-product-category').value = '';
  document.getElementById('modal-product-id').value = '';
}

async function openProductModal(productId = null) {
  if (!productForm || !productModal) return;
  resetProductForm();
  if (productId) {
    document.getElementById('product-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Product';
    document.getElementById('modal-product-id').value = productId;
    try {
      const product = await apiRequest(`/products/${productId}`);
      document.getElementById('modal-product-name').value = product.name;
      document.getElementById('modal-product-sku').value = product.sku;
      document.getElementById('modal-product-price').value = product.price;
      document.getElementById('modal-product-stock').value = product.stockQuantity;
      document.getElementById('modal-product-desc').value = product.description || '';
      await populateCategoryDropdown(product.categoryId);
    } catch (err) { return showCustomToast("Failed to load product details.", true); }
  } else {
    document.getElementById('product-modal-title').innerHTML = '<i class="fa-solid fa-box"></i> Add New Product';
    await populateCategoryDropdown();
  }
  productModal.classList.add('active');
}

function closeProductModal() { if (productModal) productModal.classList.remove('active'); }

if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-product-id').value;
    const fileInput = document.getElementById('modal-product-image');
    const categoryValue = document.getElementById('modal-product-category').value;

    if (!categoryValue) return showCustomToast("Please select a category from the dropdown.", true);

    const payload = {
      name: document.getElementById('modal-product-name').value,
      sku: document.getElementById('modal-product-sku').value,
      categoryId: parseInt(categoryValue),
      price: parseFloat(document.getElementById('modal-product-price').value),
      stockQuantity: parseInt(document.getElementById('modal-product-stock').value),
      description: document.getElementById('modal-product-desc').value
    };

    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (fileInput && fileInput.files.length > 0) formData.append('image', fileInput.files[0]);

    try {
      const fetchOptions = { method: id ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` }, body: formData };
      const url = id ? `http://localhost:8080/api/products/${id}` : `http://localhost:8080/api/products`;
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ensure SKU is unique.");
      }

      showCustomToast(id ? "Product updated successfully!" : "Product added to catalog!");
      closeProductModal();
      fetchProducts();
      if (document.getElementById('dashboard-view').classList.contains('active')) fetchDashboardData();
    } catch (error) {
      showCustomToast(`Failed to save: ${error.message}`, true);
    }
  });
}

function deleteProduct(productId) {
  openConfirmModal("Delete Product?", "Are you sure you want to remove this product from the catalog?", async () => {
    try {
      const fetchOptions = { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` } };
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, fetchOptions);
      if (!response.ok) throw new Error("Backend blocked deletion");
      showCustomToast("Product deleted permanently.");
      fetchProducts();
      if (document.getElementById('dashboard-view').classList.contains('active')) fetchDashboardData();
    } catch (error) { showCustomToast("Cannot delete. Product is currently linked to an active sales order.", true); }
  });
}

// ------------------------------------------------------------------
// CUSTOMER, SUPPLIER, & EMPLOYEE CRUD LOGIC
// ------------------------------------------------------------------
const customerModal = document.getElementById('customer-modal');
const customerForm = document.getElementById('customer-form');
function resetCustomerForm() { if (customerForm) customerForm.reset(); document.getElementById('modal-customer-id').value = ''; }
async function openCustomerModal(customerId = null) {
  if (!customerForm || !customerModal) return;
  resetCustomerForm();
  if (customerId) {
    document.getElementById('customer-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Customer';
    document.getElementById('modal-customer-id').value = customerId;
    try {
      const customer = await apiRequest(`/customers/${customerId}`);
      document.getElementById('modal-customer-name').value = customer.name;
      document.getElementById('modal-customer-email').value = customer.email;
      document.getElementById('modal-customer-phone').value = customer.phone;
      document.getElementById('modal-customer-address').value = customer.address || '';
    } catch (err) { return showCustomToast("Failed to load customer details.", true); }
  } else { document.getElementById('customer-modal-title').innerHTML = '<i class="fa-solid fa-user-plus"></i> Add New Customer'; }
  customerModal.classList.add('active');
}
function closeCustomerModal() { if (customerModal) customerModal.classList.remove('active'); }
if (customerForm) {
  customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-customer-id').value;
    const payload = {
      name: document.getElementById('modal-customer-name').value,
      email: document.getElementById('modal-customer-email').value,
      phone: document.getElementById('modal-customer-phone').value,
      address: document.getElementById('modal-customer-address').value
    };
    try {
      if (id) await apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest('/customers', { method: 'POST', body: JSON.stringify(payload) });
      showCustomToast(id ? "Customer updated successfully!" : "New customer registered!");
      closeCustomerModal(); fetchCustomers();
    } catch (error) { showCustomToast("Failed to save customer. Check for duplicate emails.", true); }
  });
}
function deleteCustomer(customerId) {
  openConfirmModal("Delete Customer?", "Are you sure you want to delete this customer? All loyalty points will be lost.", async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/customers/${customerId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` } });
      if (!response.ok) throw new Error("Backend blocked deletion");
      showCustomToast("Customer deleted permanently."); fetchCustomers();
    } catch (error) { showCustomToast("Cannot delete. Customer is linked to active sales orders.", true); }
  });
}

const supplierModal = document.getElementById('supplier-modal');
const supplierForm = document.getElementById('supplier-form');
function resetSupplierForm() { if (supplierForm) supplierForm.reset(); document.getElementById('modal-supplier-id').value = ''; }
async function openSupplierModal(supplierId = null) {
  if (!supplierForm || !supplierModal) return;
  resetSupplierForm();
  if (supplierId) {
    document.getElementById('supplier-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Supplier';
    document.getElementById('modal-supplier-id').value = supplierId;
    try {
      const supplier = await apiRequest(`/suppliers/${supplierId}`);
      document.getElementById('modal-supplier-company').value = supplier.companyName;
      document.getElementById('modal-supplier-person').value = supplier.contactPerson;
      document.getElementById('modal-supplier-email').value = supplier.email;
      document.getElementById('modal-supplier-phone').value = supplier.phone;
      document.getElementById('modal-supplier-address').value = supplier.address || '';
    } catch (err) { return showCustomToast("Failed to load supplier details.", true); }
  } else { document.getElementById('supplier-modal-title').innerHTML = '<i class="fa-solid fa-truck"></i> Add Supplier'; }
  supplierModal.classList.add('active');
}
function closeSupplierModal() { if (supplierModal) supplierModal.classList.remove('active'); }
if (supplierForm) {
  supplierForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-supplier-id').value;
    const payload = {
      companyName: document.getElementById('modal-supplier-company').value,
      contactPerson: document.getElementById('modal-supplier-person').value,
      email: document.getElementById('modal-supplier-email').value,
      phone: document.getElementById('modal-supplier-phone').value,
      address: document.getElementById('modal-supplier-address').value
    };
    try {
      if (id) await apiRequest(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
      showCustomToast(id ? "Supplier updated successfully!" : "New supplier registered!");
      closeSupplierModal(); fetchSuppliers();
    } catch (error) { showCustomToast("Failed to save supplier.", true); }
  });
}
function deleteSupplier(supplierId) {
  openConfirmModal("Delete Supplier?", "Are you sure you want to delete this supplier from the system?", async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/suppliers/${supplierId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` } });
      if (!response.ok) throw new Error("Backend blocked deletion");
      showCustomToast("Supplier deleted permanently."); fetchSuppliers();
    } catch (error) { showCustomToast("Failed to delete supplier.", true); }
  });
}

const employeeModal = document.getElementById('employee-modal');
const employeeForm = document.getElementById('employee-form');
function resetEmployeeForm() { if (employeeForm) employeeForm.reset(); document.getElementById('modal-employee-id').value = ''; }
async function openEmployeeModal(employeeId = null) {
  if (!employeeForm || !employeeModal) return;
  resetEmployeeForm();
  if (employeeId) {
    document.getElementById('employee-modal-title').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Employee';
    document.getElementById('modal-employee-id').value = employeeId;
    document.getElementById('modal-employee-password').placeholder = "Leave blank to keep current password";
    document.getElementById('modal-employee-password').required = false;
    try {
      const emp = await apiRequest(`/employees/${employeeId}`);
      document.getElementById('modal-employee-name').value = emp.fullName;
      document.getElementById('modal-employee-username').value = emp.username;
      document.getElementById('modal-employee-email').value = emp.email;
      document.getElementById('modal-employee-role').value = emp.roleId;
    } catch (err) { return showCustomToast("Failed to load employee details.", true); }
  } else {
    document.getElementById('employee-modal-title').innerHTML = '<i class="fa-solid fa-user-shield"></i> Add Employee';
    document.getElementById('modal-employee-password').placeholder = "Enter new password";
    document.getElementById('modal-employee-password').required = true;
  }
  employeeModal.classList.add('active');
}
function closeEmployeeModal() { if (employeeModal) employeeModal.classList.remove('active'); }
if (employeeForm) {
  employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modal-employee-id').value;
    const payload = {
      fullName: document.getElementById('modal-employee-name').value,
      username: document.getElementById('modal-employee-username').value,
      email: document.getElementById('modal-employee-email').value,
      roleId: parseInt(document.getElementById('modal-employee-role').value),
      password: document.getElementById('modal-employee-password').value
    };
    try {
      if (id) await apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiRequest('/employees', { method: 'POST', body: JSON.stringify(payload) });
      showCustomToast(id ? "Employee updated successfully!" : "New employee registered!");
      closeEmployeeModal(); fetchEmployees();
    } catch (error) { showCustomToast("Failed to save employee. Check unique fields.", true); }
  });
}
function deleteEmployeeRecord(id, source = 'employee') {
  openConfirmModal("Delete Account Access?", "Are you sure you want to revoke system access for this user?", async () => {
    try {
      const endpoint = source === 'user' ? `/users/${id}` : `/employees/${id}`;
      const response = await fetch(`http://localhost:8080/api${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` }
      });
      if (!response.ok) throw new Error("Backend blocked deletion");
      showCustomToast("User account access revoked.");
      fetchEmployees();
    } catch (error) {
      showCustomToast("Failed to delete user account.", true);
    }
  });
}

function deleteEmployee(id) {
  deleteEmployeeRecord(id, 'employee');
}

function deleteOrder(orderId) {
  openConfirmModal("Delete Sales Order?", "Are you sure you want to permanently delete this receipt? This action cannot be undone.", async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/sales-orders/${orderId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('zetlan_token')}` } });
      if (!response.ok) throw new Error("Backend blocked deletion");
      showCustomToast("Sales order deleted permanently."); fetchOrders();
      if (document.getElementById('dashboard-view').classList.contains('active')) fetchDashboardData();
    } catch (error) { showCustomToast("Failed to delete the order.", true); }
  });
}

// ------------------------------------------------------------------
// 2-STEP POINT OF SALE (POS) SYSTEM & SEARCHABLE CUSTOMERS
// ------------------------------------------------------------------
let posCart = [];
let posProductsCache = [];
let posCustomersCache = [];

function goToPOSStep(stepNumber) {
  const s1Indicator = document.getElementById('pos-step-indicator-1');
  const s2Indicator = document.getElementById('pos-step-indicator-2');
  const s1View = document.getElementById('pos-step-1-view');
  const s2View = document.getElementById('pos-step-2-view');

  if (!s1Indicator || !s2Indicator || !s1View || !s2View) return;

  if (stepNumber === 2 && posCart.length === 0) {
    showCustomToast("Please add at least 1 item to your cart before reviewing!", true);
    return;
  }

  s1Indicator.classList.remove('active');
  s2Indicator.classList.remove('active');
  s1View.classList.remove('active');
  s2View.classList.remove('active');

  if (stepNumber === 1) {
    s1Indicator.classList.add('active');
    s1View.classList.add('active');
  } else {
    s1Indicator.classList.add('completed');
    s2Indicator.classList.add('active');
    s2View.classList.add('active');
    renderPOSCart();
  }
}

async function openPOSModal() {
  const posModal = document.getElementById('pos-modal');
  if (!posModal) return;

  posCart = [];
  goToPOSStep(1);
  updatePOSStep1Badge();

  try {
    const products = await apiRequest('/products');
    posProductsCache = products.filter(p => p.stockQuantity > 0);
    renderPOSGrid(posProductsCache);

    posCustomersCache = await apiRequest('/customers').catch(() => []);
    clearPOSCustomer();
  } catch (error) {
    showCustomToast("Error loading POS data. Check backend connection.", true);
  }

  posModal.classList.add('active');
}

function closePOSModal() {
  const posModal = document.getElementById('pos-modal');
  if (posModal) posModal.classList.remove('active');
}

function renderPOSGrid(products) {
  const grid = document.getElementById('pos-product-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p class="empty-msg pos-empty-msg">No matching items found in stock.</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    let fallbackImg = `https://placehold.co/100x100/1a1a1a/38bdf8?text=${p.name.charAt(0).toUpperCase()}`;
    let rawUrl = p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:8080${p.imageUrl.startsWith('/') ? '' : '/'}${p.imageUrl}`) : fallbackImg;
    let imgSrc = encodeURI(rawUrl);
    const safeName = p.name.replace(/'/g, "\\'");

    return `
      <div class="pos-grid-card" onclick="addToPOSCart(${p.id}, '${safeName}', ${p.price})">
        <div class="pos-card-thumb">
          <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" class="table-thumb-img" alt="${p.name}">
        </div>
        <h4 class="pos-card-title" title="${p.name}">${p.name}</h4>
        <p class="pos-card-price">₹${Number(p.price).toFixed(2)}</p>
      </div>
    `;
  }).join('');
}

function filterPOSGrid(searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = posProductsCache.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.sku.toLowerCase().includes(term)
  );
  renderPOSGrid(filtered);
}

function addToPOSCart(id, name, price) {
  const existingItem = posCart.find(item => item.id === id);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    posCart.push({ id, name, price, qty: 1 });
  }
  updatePOSStep1Badge();
  showCustomToast(`Added ${name} to checkout cart!`);
}

function removeFromPOSCart(id) {
  posCart = posCart.filter(item => item.id !== id);
  renderPOSCart();
  updatePOSStep1Badge();
}

function updatePOSQty(id, change) {
  const item = posCart.find(i => i.id === id);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      removeFromPOSCart(id);
    } else {
      renderPOSCart();
      updatePOSStep1Badge();
    }
  }
}

function updatePOSStep1Badge() {
  const countBadge = document.getElementById('pos-step1-count-badge');
  const totalBadge = document.getElementById('pos-step1-total-badge');
  if (!countBadge || !totalBadge) return;

  const totalQty = posCart.reduce((sum, i) => sum + i.qty, 0);
  const totalVal = posCart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  countBadge.textContent = `${totalQty} Item${totalQty !== 1 ? 's' : ''}`;
  totalBadge.textContent = `₹${totalVal.toFixed(2)}`;
}

function renderPOSCart() {
  const tbody = document.getElementById('pos-cart-table-body');
  const totalEl = document.getElementById('pos-total-price');
  if (!tbody || !totalEl) return;

  if (posCart.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Your cart is empty</td></tr>';
    totalEl.textContent = '₹0.00';
    return;
  }

  let grandTotal = 0;
  tbody.innerHTML = posCart.map(item => {
    const itemTotal = item.price * item.qty;
    grandTotal += itemTotal;

    return `
      <tr class="pos-cart-row">
        <td>
          <div class="pos-cart-name" title="${item.name}">${item.name}</div>
        </td>
        <td class="text-center">
          <div class="pos-qty-group">
            <button type="button" onclick="updatePOSQty(${item.id}, -1)" class="pos-qty-btn">-</button>
            <span class="pos-qty-val">${item.qty}</span>
            <button type="button" onclick="updatePOSQty(${item.id}, 1)" class="pos-qty-btn">+</button>
          </div>
        </td>
        <td class="text-right text-muted">₹${item.price.toFixed(2)}</td>
        <td class="text-right font-bold">₹${itemTotal.toFixed(2)}</td>
        <td class="text-center">
          <button type="button" onclick="removeFromPOSCart(${item.id})" class="pos-del-btn"><i class="fa-solid fa-xmark"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  totalEl.textContent = `₹${grandTotal.toFixed(2)}`;
}

// ------------------------------------------------------------------
// SEARCHABLE CUSTOMER BOARD LOGIC
// ------------------------------------------------------------------
function initPOSCustomerSearch() {
  const input = document.getElementById('pos-customer-search-input');
  const list = document.getElementById('pos-customer-options-list');
  if (!input || !list) return;

  input.addEventListener('focus', () => {
    renderCustomerOptionsList(posCustomersCache);
    list.classList.add('active');
  });

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = posCustomersCache.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
    renderCustomerOptionsList(filtered);
    list.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    const box = document.getElementById('pos-customer-search-box');
    if (box && !box.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove('active');
    }
  });
}

function renderCustomerOptionsList(customers) {
  const list = document.getElementById('pos-customer-options-list');
  if (!list) return;

  let html = `<div class="searchable-option" onclick="selectPOSCustomer('', 'Guest Checkout (No Account)')">
    <strong>Guest Checkout (No Account)</strong>
  </div>`;

  if (customers.length > 0) {
    html += customers.map(c => `
      <div class="searchable-option" onclick="selectPOSCustomer(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
        <strong>${c.name}</strong>
        <span><i class="fa-solid fa-phone"></i> ${c.phone || 'No phone'} | <i class="fa-solid fa-star text-accent"></i> ${c.loyaltyPoints || 0} Pts</span>
      </div>
    `).join('');
  } else {
    html += `<div class="searchable-option text-muted">No registered customers match search</div>`;
  }

  list.innerHTML = html;
}

function selectPOSCustomer(id, name) {
  const input = document.getElementById('pos-customer-search-input');
  const hiddenId = document.getElementById('pos-customer-id');
  const list = document.getElementById('pos-customer-options-list');
  const badgeName = document.getElementById('pos-selected-customer-name');

  if (input) input.value = '';
  if (hiddenId) hiddenId.value = id || '';
  if (badgeName) badgeName.textContent = name;
  if (list) list.classList.remove('active');
}

function clearPOSCustomer() {
  selectPOSCustomer('', 'Guest Checkout (No Account)');
}

async function processPOSCheckout() {
  if (posCart.length === 0) {
    showCustomToast("Cannot checkout an empty cart!", true);
    return;
  }

  const customerId = document.getElementById('pos-customer-id').value;

  const orderPayload = {
    employeeId: 1,
    customerId: customerId ? parseInt(customerId) : null,
    items: posCart.map(item => ({
      productId: item.id,
      quantity: item.qty
    }))
  };

  try {
    await apiRequest('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    showCustomToast("Transaction Processed Successfully!");
    closePOSModal();

    if (document.getElementById('orders-view').classList.contains('active')) {
      await fetchOrders();
    }
    if (document.getElementById('dashboard-view').classList.contains('active')) {
      await fetchDashboardData();
    }
    if (document.getElementById('products-view').classList.contains('active')) {
      await fetchProducts();
    }

  } catch (error) {
    console.error("Checkout failed:", error);
    showCustomToast("Transaction failed. Check inventory stock levels.", true);
  }
}