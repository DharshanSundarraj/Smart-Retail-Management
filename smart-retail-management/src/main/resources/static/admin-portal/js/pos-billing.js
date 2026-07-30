document.addEventListener('DOMContentLoaded', () => {
  initPOS();
});

let posCart = [];

async function initPOS() {
  try {
    const products = await apiRequest('/products');
    populatePOSProducts(products);
  } catch (err) {
    console.error("Failed to load POS products:", err);
    showCustomToast("Error: Could not load products from backend.", true);
  }

  const checkoutBtn = document.getElementById('pos-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', processCheckout);
  }
}

function populatePOSProducts(products) {
  const selectEl = document.getElementById('pos-product-select');
  const addBtn = document.getElementById('pos-add-btn');

  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">-- Select Product --</option>';
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    const price = p.price || 0;
    opt.textContent = `${p.name} ($${Number(price).toFixed(2)})`;
    opt.dataset.price = price;
    opt.dataset.name = p.name;
    selectEl.appendChild(opt);
  });

  if (addBtn) {
    addBtn.onclick = () => {
      const selectedOpt = selectEl.options[selectEl.selectedIndex];
      const qtyInput = document.getElementById('pos-qty-input');
      const qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

      if (!selectedOpt || !selectedOpt.value) {
        showCustomToast("Please select a product first.", true);
        return;
      }

      addToPOSCart({
        id: selectedOpt.value,
        name: selectedOpt.dataset.name,
        price: parseFloat(selectedOpt.dataset.price),
        qty: qty
      });

      showCustomToast(`Added ${qty}x ${selectedOpt.dataset.name}`);
      qtyInput.value = 1; // reset input
    };
  }
}

function addToPOSCart(item) {
  const existing = posCart.find(i => i.id === item.id);
  if (existing) {
    existing.qty += item.qty;
  } else {
    posCart.push(item);
  }
  renderPOSCart();
}

function renderPOSCart() {
  const tbody = document.querySelector('#pos-cart-table tbody');
  const totalEl = document.getElementById('pos-total-price');

  if (!tbody) return;

  if (posCart.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No items added to cart yet.</td></tr>';
    if (totalEl) totalEl.textContent = '$0.00';
    return;
  }

  let grandTotal = 0;
  tbody.innerHTML = posCart.map((item, index) => {
    const itemTotal = item.price * item.qty;
    grandTotal += itemTotal;
    return `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.qty}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>$${itemTotal.toFixed(2)}</td>
        <td><button onclick="removeFromPOSCart(${index})" class="btn btn-sm btn-danger"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

function removeFromPOSCart(index) {
  posCart.splice(index, 1);
  renderPOSCart();
}

async function processCheckout() {
  if (posCart.length === 0) {
    showCustomToast("Terminal cart is empty!", true);
    return;
  }

  const orderPayload = {
    employeeId: 1,
    items: posCart.map(item => ({
      productId: parseInt(item.id),
      quantity: item.qty
    }))
  };

  try {
    const response = await apiRequest('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    showCustomToast(`Sale Completed! Subtotal: $${response.subtotal || posCart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0).toFixed(2)}`);
    posCart = [];
    renderPOSCart();

  } catch (error) {
    console.error("Checkout failed:", error);
    showCustomToast("Transaction failed. Endpoint may not exist yet.", true);
  }
}

// Global Custom Toast for Admin Portal
function showCustomToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `custom-toast ${isError ? 'toast-error' : ''}`;
  const icon = isError ? 'fa-circle-exclamation' : 'fa-circle-check';

  toast.innerHTML = `<i class="fa-solid ${icon}" style="margin-right: 8px;"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 2900);
}