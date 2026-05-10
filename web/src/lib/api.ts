import { auth } from './firebase';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return `http://${hostname}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchProducts = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/products`, { headers });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const fetchTransactions = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/transactions`, { headers });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const fetchCategories = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories`, { headers });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

export const createCategory = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create category');
  }
  return res.json();
};

export const updateCategory = async (id: string, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update category');
  }
  return res.json();
};

export const deleteCategory = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete category');
  }
  return true;
};

export const fetchDailySummary = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/transactions/summary/daily`, { headers });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
};

export const fetchDeepSummary = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/transactions/summary/deep`, { headers });
  if (!res.ok) throw new Error('Failed to fetch deep summary');
  return res.json();
};

export const fetchSalesReportByProduct = async (startDate?: string, endDate?: string) => {
  const headers = await getAuthHeaders();
  let url = `${API_URL}/transactions/reports/sales-by-product`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch sales report');
  return res.json();
};

export const createProduct = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: Failed to create product`);
  }
  
  return res.json();
};

export const updateProduct = async (id: string, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: Failed to update product`);
  }
  
  return res.json();
};

export const deleteProduct = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${res.status}: Failed to delete product`);
  }
  
  return true;
};

// User Management
export const fetchUsers = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users`, { headers });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const createUserAccount = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create user account');
  }
  return res.json();
};

export const updateUser = async (id: string, data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update user');
  }
  return res.json();
};

export const updateUserRole = async (id: string, role: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/${id}/role`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json();
};

export const deleteUser = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return true;
};

export const cancelTransaction = async (id: string, password: string) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to cancel transaction');
  }
  return res.json();
};

export const createRestockBill = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/restock`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create restock bill');
  }
  return res.json();
};

export const fetchRestockBills = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/restock`, { headers });
  if (!res.ok) throw new Error('Failed to fetch restock bills');
  return res.json();
};

export const fetchShopConfig = async () => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/shop`, { headers });
  if (!res.ok) throw new Error('Failed to fetch shop config');
  return res.json();
};

export const updateShopConfig = async (data: any) => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/shop`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update shop config');
  }
  return res.json();
};
