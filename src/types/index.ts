export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  isDefault?: boolean;
}

export interface StoreSettings {
  boutiqueName: string;
  tagline: string;
  logoText: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  currencySymbol: string;
  currencyCode: string;
  invoicePrefix: string;
  defaultPrintFormat: 'A4' | 'THERMAL';
  invoiceFooterNotes: string;
  termsAndConditions: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  imageUrl?: string;
  color: string;
  size: string;
  material: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  discount: number;
  taxRateId: string;
  currentStock: number;
  minStock: number;
  supplierId?: string;
  supplierName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstin?: string;
  notes?: string;
  totalPurchases: number;
  totalBills: number;
  lastPurchaseDate?: string;
  outstandingAmount: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  totalPurchases: number;
  outstandingAmount: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  barcode: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface PaymentRecord {
  method: 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';
  amount: number;
  referenceNumber?: string;
  date: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  itemDiscountTotal: number;
  invoiceDiscountType: 'percentage' | 'fixed';
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  additionalCharges: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: string;
  payments: PaymentRecord[];
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'REFUNDED';
  status: 'COMPLETED' | 'HOLD' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'TRANSFER';
  referenceInvoiceId?: string;
  user: string;
  date: string;
  notes: string;
}

export interface ReturnRecord {
  id: string;
  invoiceId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    reason: string;
  }[];
  totalRefundAmount: number;
  refundMethod: 'Cash' | 'UPI' | 'Store Credit';
  processedBy: string;
  date: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface DashboardKPIs {
  totalSales: number;
  todaySales: number;
  thisMonthSales: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomers: number;
  pendingPaymentsTotal: number;
}
