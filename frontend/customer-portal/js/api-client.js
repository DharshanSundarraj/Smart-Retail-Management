const BASE_URL = 'http://localhost:8080/api';

const mockCustomerData = {
  profile: { id: 101, name: "Jane Doe", loyaltyPoints: 350 },
  products: [
    { 
      id: 101, 
      name: "Wireless Ergonomic Mouse", 
      stockQuantity: 45, 
      unitPrice: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80" 
    },
    { 
      id: 102, 
      name: "Mechanical RGB Keyboard", 
      stockQuantity: 15, 
      unitPrice: 89.99,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80" 
    },
    { 
      id: 103, 
      name: "27-inch 4K Monitor", 
      stockQuantity: 8, 
      unitPrice: 299.99,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80" 
    },
    { 
      id: 104, 
      name: "Noise-Canceling Headphones", 
      stockQuantity: 22, 
      unitPrice: 149.99,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80" 
    },
    { 
      id: 105, 
      name: "HD USB Webcam", 
      stockQuantity: 30, 
      unitPrice: 59.99,
      imageUrl: "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=400&auto=format&fit=crop&q=80" 
    },
    { 
      id: 106, 
      name: "USB-C Multiport Hub", 
      stockQuantity: 50, 
      unitPrice: 39.99,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&auto=format&fit=crop&q=80" 
    }
  ]
};

async function fetchCustomerApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) throw new Error("Backend response error");
    return await response.json();
  } catch (error) {
    console.warn("Backend offline. Using local mock data for endpoint:", endpoint);
    if (endpoint.includes('/customers')) return mockCustomerData.profile;
    if (endpoint.includes('/products')) return mockCustomerData.products;
    return { status: "SUCCESS", message: "Order placed successfully!" };
  }
}
