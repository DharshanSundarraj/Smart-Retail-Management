const BASE_URL = 'http://localhost:8080/api';

async function apiRequest(endpoint, options = {}) {
  // Automatically pull the token from localStorage
  const token = localStorage.getItem('zetlan_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`Backend API call failed at ${endpoint}:`, error);
    throw error;
  }
}