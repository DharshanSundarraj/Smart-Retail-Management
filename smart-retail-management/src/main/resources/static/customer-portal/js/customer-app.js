document.addEventListener('DOMContentLoaded', () => {
  loadStorefront();
  initCartSidebar();
});

let customerCart = [];

async function loadStorefront() {
  const catalogContainer = document.getElementById('catalog-container');
  if (!catalogContainer) return;

  try {
    const products = await apiRequest('/products');

    if (!products || products.length === 0) {
      catalogContainer.innerHTML = '<p class="empty-msg">Our store is currently empty. Check back later!</p>';
      return;
    }

    const availableProducts = products.filter(p => p.stockQuantity > 0);

    if (availableProducts.length === 0) {
      catalogContainer.innerHTML = '<p class="empty-msg">All items are currently out of stock. Check back soon!</p>';
      return;
    }

    const groupedByCategory = availableProducts.reduce((acc, product) => {
      const cat = product.categoryName || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    catalogContainer.innerHTML = Object.keys(groupedByCategory).map(category => `
      <div class="category-block">
        <div class="category-header-wrap">
          <h3>${category}</h3>
        </div>
        <div class="store-grid">
          ${groupedByCategory[category].map(product => {
            let fallbackImg = `https://placehold.co/400x400/1e1e1e/38bdf8?text=${product.name.charAt(0).toUpperCase()}`;
            let rawUrl = product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`) : fallbackImg;
            let imgSrc = encodeURI(rawUrl);
            const safeName = product.name.replace(/'/g, "\\'");
            const formattedPrice = Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return `
              <div class="product-card">
                <div class="product-img-wrapper">
                  <img src="${imgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="${product.name}">
                </div>

                <div class="product-info">
                  <h4>${product.name}</h4>
                  <p class="price">₹${formattedPrice}</p>
                  <p class="stock-status">In Stock: ${product.stockQuantity}</p>
                </div>
                <button type="button" class="btn-add-cart" onclick="addToCart(${product.id}, '${safeName}', ${product.price})">
                  <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error("Failed to load storefront products:", err);
    catalogContainer.innerHTML = '<p class="empty-msg">Error loading products. Please ensure the backend server is running.</p>';
  }
}

/* Cart Sidebar Slide-In Logic */
function initCartSidebar() {
  const toggleBtn = document.getElementById('cart-toggle-btn');
  const closeBtn = document.getElementById('close-cart-btn');
  const sidebar = document.getElementById('slide-cart');
  const overlay = document.getElementById('cart-overlay');

  function openCart() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }

  function closeCart() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openCart);
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);
}

function addToCart(id, name, price) {
  const existingItem = customerCart.find(item => item.id === id);
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    customerCart.push({ id, name, price, qty: 1, selected: true });
  }

  renderCart();
  triggerCartBump();
  showCustomToast(`Added ${name} to cart`);
}

function toggleSelectCartItem(id) {
  const item = customerCart.find(i => i.id === id);
  if (item) {
    item.selected = !item.selected;
    renderCart();
  }
}

function updateCartQty(id, change) {
  const item = customerCart.find(i => i.id === id);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      removeFromCart(id);
    } else {
      renderCart();
    }
  }
}

function removeFromCart(id) {
  customerCart = customerCart.filter(item => item.id !== id);
  renderCart();
}

function triggerCartBump() {
  const cartBtn = document.getElementById('cart-toggle-btn');
  if (!cartBtn) return;
  cartBtn.classList.remove('cart-bump');
  void cartBtn.offsetWidth;
  cartBtn.classList.add('cart-bump');
}

function renderCart() {
  const container = document.getElementById('customer-cart-body');
  const totalEl = document.getElementById('customer-total');
  const countEl = document.getElementById('cart-count');

  if (!container || !totalEl || !countEl) return;

  if (customerCart.length === 0) {
    container.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
    totalEl.textContent = '₹0.00';
    countEl.textContent = '0';
    return;
  }

  let grandTotal = 0;
  let totalItems = 0;

  container.innerHTML = customerCart.map(item => {
    const itemTotal = item.price * item.qty;
    totalItems += item.qty;
    if (item.selected) {
      grandTotal += itemTotal;
    }

    const formattedItemTotal = itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `
      <div class="cart-item-card ${item.selected ? 'is-selected' : ''}">
        <div class="cart-col-check">
          <input type="checkbox" class="custom-cart-checkbox" ${item.selected ? 'checked' : ''} onchange="toggleSelectCartItem(${item.id})">
        </div>

        <div class="cart-col-info">
          <strong class="cart-item-title">${item.name}</strong>
          <span class="cart-item-unit">₹${Number(item.price).toFixed(2)} each</span>
        </div>

        <div class="cart-col-qty">
          <div class="cart-qty-box">
            <button type="button" class="qty-control-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button type="button" class="qty-control-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
          </div>
        </div>

        <div class="cart-col-price">
          <strong class="cart-item-subtotal">₹${formattedItemTotal}</strong>
        </div>

        <div class="cart-col-del">
          <button type="button" class="del-btn" onclick="removeFromCart(${item.id})" title="Remove Item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  countEl.textContent = totalItems;
}

// Linked Directly to Admin Backend via POST /api/sales-orders
async function processCustomerCheckout() {
  const selectedItems = customerCart.filter(item => item.selected);

  if (selectedItems.length === 0) {
    showCustomToast("Please select at least one item to check out!", true);
    return;
  }

  const orderPayload = {
    employeeId: null, // Online Guest Self-Checkout
    customerId: null, // Sets customer as Guest Walk-in/Online
    items: selectedItems.map(item => ({
      productId: item.id,
      quantity: item.qty
    }))
  };

  try {
    await apiRequest('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    showCustomToast("Order placed successfully! Stock synchronized.");
    // Remove checked out items from cart
    customerCart = customerCart.filter(item => !item.selected);
    renderCart();

    document.getElementById('slide-cart')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('active');
    await loadStorefront();

  } catch (error) {
    console.error("Checkout failed:", error);
    showCustomToast(error.message || "Checkout failed. Item may be out of stock.", true);
  }
}

function showCustomToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `custom-toast ${isError ? 'toast-error' : ''}`;
  const icon = isError ? 'fa-circle-exclamation' : 'fa-circle-check';
  toast.innerHTML = `<i class="fa-solid ${icon} toast-icon-left"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 2900);
}