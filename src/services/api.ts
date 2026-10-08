import { Product, Customer, Invoice, Supplier, StockMovement, ReturnRecord, StoreSettings, TaxRate, User, DashboardKPIs, AuditLog } from '../types';

const API_BASE = '/api';

function buildQuery<T extends object>(params?: T): string {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('boutique_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'An error occurred with the request');
  }
  return data;
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ success: boolean; token: string; user: User }>(res);
    localStorage.setItem('boutique_token', data.token);
    return data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  switchDemoRole: async (role: string): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ role }),
    });
    const data = await handleResponse<{ success: boolean; token: string; user: User }>(res);
    localStorage.setItem('boutique_token', data.token);
    return data;
  },

  getUsers: async (): Promise<{ success: boolean; users: User[] }> => {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  // Products & Barcode
  getProducts: async (params?: { search?: string; category?: string; stockStatus?: string }): Promise<{ success: boolean; products: Product[] }> => {
    const query = buildQuery(params);
    const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getProductByBarcode: async (barcode: string): Promise<{ success: boolean; product: any }> => {
    const res = await fetch(`${API_BASE}/products/barcode/${encodeURIComponent(barcode)}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  generateBarcode: async (type = 'CODE128'): Promise<{ success: boolean; barcode: string; format: string }> => {
    const res = await fetch(`${API_BASE}/products/barcodes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ type }),
    });
    return handleResponse(res);
  },

  createProduct: async (productData: Partial<Product>): Promise<{ success: boolean; product: Product }> => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<{ success: boolean; product: Product }> => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Invoices & Billing
  createInvoice: async (payload: any): Promise<{ success: boolean; message: string; invoice: Invoice }> => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getInvoices: async (params?: { search?: string; paymentStatus?: string; status?: string; startDate?: string; endDate?: string }): Promise<{ success: boolean; invoices: Invoice[] }> => {
    const query = buildQuery(params);
    const res = await fetch(`${API_BASE}/invoices${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getHeldInvoices: async (): Promise<{ success: boolean; invoices: Invoice[] }> => {
    const res = await fetch(`${API_BASE}/invoices/held`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  holdInvoice: async (invoice: any): Promise<{ success: boolean; invoice: Invoice }> => {
    const res = await fetch(`${API_BASE}/invoices/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(invoice),
    });
    return handleResponse(res);
  },

  removeHeldInvoice: async (invoiceNumber: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE}/invoices/held/${invoiceNumber}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  cancelInvoice: async (invoiceNumber: string, reason: string): Promise<{ success: boolean; invoice: Invoice }> => {
    const res = await fetch(`${API_BASE}/invoices/${invoiceNumber}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  // Customers
  getCustomers: async (search?: string): Promise<{ success: boolean; customers: Customer[] }> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/customers${q}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getCustomerDetails: async (id: string): Promise<{ success: boolean; customer: Customer; invoices: Invoice[] }> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  createCustomer: async (customer: Partial<Customer>): Promise<{ success: boolean; customer: Customer }> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(customer),
    });
    return handleResponse(res);
  },

  updateCustomer: async (id: string, updates: Partial<Customer>): Promise<{ success: boolean; customer: Customer }> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  deleteCustomer: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Suppliers
  getSuppliers: async (): Promise<{ success: boolean; suppliers: Supplier[] }> => {
    const res = await fetch(`${API_BASE}/suppliers`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  createSupplier: async (data: Partial<Supplier>): Promise<{ success: boolean; supplier: Supplier }> => {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateSupplier: async (id: string, data: Partial<Supplier>): Promise<{ success: boolean; supplier: Supplier }> => {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Inventory
  getInventory: async (filter?: string, search?: string): Promise<{ success: boolean; inventory: Product[]; stats: any }> => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/inventory?${params.toString()}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  adjustStock: async (payload: { productId: string; quantity: number; type: string; notes: string }): Promise<{ success: boolean; product: Product }> => {
    const res = await fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getStockMovements: async (productId?: string, type?: string): Promise<{ success: boolean; movements: StockMovement[] }> => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (type) params.append('type', type);
    const res = await fetch(`${API_BASE}/inventory/movements?${params.toString()}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  // Returns
  getReturns: async (): Promise<{ success: boolean; returns: ReturnRecord[] }> => {
    const res = await fetch(`${API_BASE}/returns`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  processReturn: async (payload: any): Promise<{ success: boolean; returnRecord: ReturnRecord }> => {
    const res = await fetch(`${API_BASE}/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Reports & Dashboard
  getDashboardKPIs: async (): Promise<{
    success: boolean;
    kpis: DashboardKPIs;
    topSellingProducts: any[];
    categorySales: Record<string, number>;
    paymentMethodDistribution: Record<string, number>;
    salesTrend: { date: string; label: string; amount: number; count: number }[];
    recentInvoices: Invoice[];
    lowStockAlerts: Product[];
  }> => {
    const res = await fetch(`${API_BASE}/reports/dashboard`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  getSalesReport: async (startDate?: string, endDate?: string): Promise<{ success: boolean; summary: any; invoices: Invoice[] }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await fetch(`${API_BASE}/reports/sales?${params.toString()}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  // Settings
  getSettings: async (): Promise<{ success: boolean; settings: StoreSettings; taxRates: TaxRate[]; categories: any[] }> => {
    const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  updateSettings: async (settings: Partial<StoreSettings>): Promise<{ success: boolean; settings: StoreSettings }> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  updateTaxRates: async (taxRates: TaxRate[]): Promise<{ success: boolean; taxRates: TaxRate[] }> => {
    const res = await fetch(`${API_BASE}/settings/taxes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ taxRates }),
    });
    return handleResponse(res);
  },

  // Audit Logs
  getAuditLogs: async (entity?: string, user?: string): Promise<{ success: boolean; logs: AuditLog[] }> => {
    const params = new URLSearchParams();
    if (entity) params.append('entity', entity);
    if (user) params.append('user', user);
    const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },
};
