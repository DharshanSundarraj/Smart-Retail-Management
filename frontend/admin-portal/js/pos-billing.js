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
    opt.textContent = `${p.name} ($${Number(p.unitPrice).toFixed(2)})`;
    opt.dataset.price = p.unitPrice;
    opt.dataset.name = p.name;
    selectEl.appendChild(opt);
  });

  if (addBtn) {
    addBtn.onclick = () => {
      const selectedOpt = selectEl.options[selectEl.selectedIndex];
      const qtyInput = document.getElementById('pos-qty-input');
      const qty = parseInt(qtyInput ? qtyInput.value : 1, 10);

      if (!selectedOpt || !selectedOpt.value) {
        alert('Please select a product.');
        return;
      }

      addToPOSCart({
        id: selectedOpt.value,
        name: selectedOpt.dataset.name,
        price: parseFloat(selectedOpt.dataset.price),
        qty: qty
      });
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
        <td><button onclick="removeFromPOSCart(${index})" class="btn btn-sm btn-danger">X</button></td>
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
    alert('Cart is empty!');
    return;
  }

  alert('Sale Completed Successfully!');
  posCart = [];
  renderPOSCart();
}
