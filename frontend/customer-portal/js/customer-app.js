let customerCart = [];

async function initCustomerPortal() {
  const customer = await fetchCustomerApi('/customers/1');
  const profileEl = document.getElementById('customer-welcome');
  if (profileEl && customer) {
    profileEl.innerHTML = `
      <h2>Welcome back, ${customer.name}!</h2>
      <div class="loyalty-badge">
        <i class="fa-solid fa-star"></i> Loyalty Points: <strong>${customer.loyaltyPoints}</strong>
      </div>
    `;
  }

  const products = await fetchCustomerApi('/products');
  const container = document.getElementById('store-products-grid');
  if (container && products) {
    container.innerHTML = products.map(prod => `
      <div class="store-card">
        <div class="img-wrapper">
          <img src="${prod.imageUrl}" alt="${prod.name}" class="store-img">
        </div>
        <h4>${prod.name}</h4>
        <p class="price">$${prod.unitPrice.toFixed(2)}</p>
        <button onclick="addToCustomerCart(${prod.id}, '${prod.name.replace(/'/g, "\\'")}', ${prod.unitPrice})">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    `).join('');
  }
}

function addToCustomerCart(id, name, unitPrice) {
  const existing = customerCart.find(i => i.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    customerCart.push({ id, name, unitPrice, quantity: 1 });
  }
  renderCustomerCart();
}

function renderCustomerCart() {
  const cartBody = document.getElementById('customer-cart-body');
  const countBadge = document.getElementById('cart-count');
  if (!cartBody) return;

  const totalQty = customerCart.reduce((sum, item) => sum + item.quantity, 0);
  if (countBadge) countBadge.innerText = totalQty;

  if (customerCart.length === 0) {
    cartBody.innerHTML = `<tr class="empty-row"><td colspan="2">Your cart is empty.</td></tr>`;
    document.getElementById('customer-total').innerText = `$0.00`;
    return;
  }

  let total = 0;
  cartBody.innerHTML = customerCart.map(item => {
    const itemTotal = item.unitPrice * item.quantity;
    total += itemTotal;
    return `
      <tr>
        <td>${item.name} x${item.quantity}</td>
        <td>$${itemTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  document.getElementById('customer-total').innerText = `$${total.toFixed(2)}`;
}

async function placeCustomerOrder() {
  if (customerCart.length === 0) return alert("Your shopping cart is empty!");

  const response = await fetchCustomerApi('/sales-orders', {
    method: 'POST',
    body: JSON.stringify({ items: customerCart })
  });

  if (response) {
    alert("🎉 Order placed successfully!");
    customerCart = [];
    renderCustomerCart();
  }
}

initCustomerPortal();
