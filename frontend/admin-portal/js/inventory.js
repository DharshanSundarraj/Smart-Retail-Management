document.addEventListener('DOMContentLoaded', () => {
  loadInventoryData();

  const refreshBtn = document.getElementById('refresh-inventory-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadInventoryData);
  }
});

async function loadInventoryData() {
  // Find table body or table container
  const tableBody = document.querySelector('#inventory-table tbody') || document.querySelector('.inventory-section tbody');
  const totalProductsEl = document.getElementById('stat-total-products');
  const lowStockEl = document.getElementById('stat-low-stock');

  try {
    const products = await apiRequest('/products');

    if (!products || products.length === 0) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">No inventory found.</td></tr>';
      return;
    }

    // Update KPI summary cards
    if (totalProductsEl) totalProductsEl.textContent = products.length;
    
    const lowStockCount = products.filter(p => p.stockQuantity < 10).length;
    if (lowStockEl) lowStockEl.textContent = `${lowStockCount} Items`;

    // Populate Inventory Table rows
    if (tableBody) {
      tableBody.innerHTML = products.map(product => `
        <tr>
          <td>${product.id}</td>
          <td><strong>${product.name}</strong></td>
          <td>${product.stockQuantity}</td>
          <td>$${Number(product.unitPrice).toFixed(2)}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error("Failed to render inventory:", err);
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="4" class="empty-msg">Error loading inventory data.</td></tr>';
  }
}
