import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  Plus,
  Trash2,
  Clock,
  Printer,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Customer, InvoiceItem, Invoice, PaymentRecord } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { LiveInvoicePreview } from './LiveInvoicePreview';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { HoldBillsModal } from './HoldBillsModal';

export const BillingView: React.FC = () => {
  const { settings, taxRates, formatCurrency } = useSettings();
  const { user } = useAuth();

  // Inventory & Customers state
  const [products, setProducts] = useState<Product[]>([]);
  const [heldBills, setHeldBills] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // Active Bill State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Discounts & Charges
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer'>('UPI');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidAmountTouched, setPaidAmountTouched] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);

  // Barcode input state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);

  // Product Search Dropdown State
  const [productSearch, setProductSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Success Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL' | null>(null);

  // Load products and held bills on mount
  useEffect(() => {
    loadInitialData();
    generateTempInvoiceNumber();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, heldRes] = await Promise.all([
        api.getProducts(),
        api.getHeldInvoices(),
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (heldRes.success) setHeldBills(heldRes.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateTempInvoiceNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-2026-${random}`);
  };

  // Keyboard shortcut listener for barcode scanner auto-focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 or Alt+B focuses barcode input
      if (e.key === 'F2' || (e.altKey && e.key === 'b')) {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F4 or Alt+S focuses product search
      if (e.key === 'F4' || (e.altKey && e.key === 's')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set default customer info
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerEmail(c.email || c.city || '');
    setCustomerAddress(c.address || '');
  };

  useEffect(() => {
    const normalizePhone = (value: string) => value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const digits = normalizePhone(customerPhone);
    if (digits.length < 10 || (selectedCustomer && normalizePhone(selectedCustomer.phone) === digits)) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.getCustomers(digits);
        if (!active) return;
        const match = res.customers.find((customer) => normalizePhone(customer.phone) === digits);
        if (match) handleSelectCustomer(match);
      } catch (err) {
        if (active) console.error('Customer phone lookup failed:', err);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerPhone, selectedCustomer]);

  // Barcode Scan Handler
  const handleBarcodeSubmit = async (barcodeVal: string): Promise<string | null> => {
    const code = barcodeVal.trim();
    if (!code) return null;

    setBarcodeError('');
    try {
      try {
        const res = await api.getProductByBarcode(code);
        if (res.success && res.product) {
          addProductToBill(res.product);
          setBarcodeInput('');
          return res.product.name as string;
        }
      } catch {
        // QR codes may contain a product SKU instead of its barcode.
      }

      const catalog = await api.getProducts({ search: code });
      const normalizedCode = code.toLowerCase();
      const product = catalog.products.find((candidate) =>
        candidate.sku.toLowerCase() === normalizedCode ||
        candidate.barcode.toLowerCase() === normalizedCode ||
        candidate.name.toLowerCase() === normalizedCode ||
        candidate.variants?.some((variant) => variant.sku.toLowerCase() === normalizedCode || variant.barcode.toLowerCase() === normalizedCode)
      );

      if (!product) throw new Error(`No product found for barcode or QR code "${code}".`);
      const variant = product.variants?.find((item) => item.sku.toLowerCase() === normalizedCode || item.barcode.toLowerCase() === normalizedCode);
      const scannedProduct = variant ? {
        ...product,
        variantId: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        stock: variant.stock,
      } : product;
      addProductToBill(scannedProduct);
      setBarcodeInput('');
      return product.name;
    } catch (err: any) {
      setBarcodeError(err.message || `No product found for barcode or QR code "${code}"`);
      setTimeout(() => setBarcodeError(''), 4000);
      return null;
    }
  };

  // Add Product to Current Bill
  const addProductToBill = (prod: any) => {
    const existingIndex = items.findIndex((i) => i.productId === prod.id && (!prod.variantId || i.variantId === prod.variantId));

    if (existingIndex > -1) {
      // Increase quantity
      const updated = [...items];
      const target = updated[existingIndex];
      const newQty = target.quantity + 1;

      // Check stock
      if (prod.stock !== undefined && newQty > prod.stock) {
        setErrorMessage(`Only ${prod.stock} units of "${prod.name}" available in stock.`);
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }

      const gross = target.unitPrice * newQty;
      const discount = target.discountType === 'percentage'
        ? (gross * target.discountValue) / 100
        : target.discountValue;
      const net = gross - discount;
      const tax = (net * target.taxRate) / 100;

      target.quantity = newQty;
      target.discountAmount = Math.round(discount * 100) / 100;
      target.taxAmount = Math.round(tax * 100) / 100;
      target.total = Math.round((net + tax) * 100) / 100;

      setItems(updated);
    } else {
      // Add new item
      const unitPrice = prod.price || prod.sellingPrice;
      const taxRateObj = taxRates.find((t) => t.id === prod.taxRateId) ||
        taxRates.find((t) => t.isDefault) || { rate: 12 };
      const rate = taxRateObj.rate || 12;

      const gross = unitPrice * 1;
      const itemTax = (gross * rate) / 100;

      const newItem: InvoiceItem = {
        id: `ITM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        variantId: prod.variantId,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        size: prod.size || 'Free Size',
        color: prod.color || 'Standard',
        quantity: 1,
        unitPrice,
        discountAmount: 0,
        discountType: 'percentage',
        discountValue: 0,
        taxRate: rate,
        taxAmount: Math.round(itemTax * 100) / 100,
        total: Math.round((gross + itemTax) * 100) / 100,
      };

      setItems([newItem, ...items]);
    }

    setProductSearch('');
    setIsSearchOpen(false);
  };

  // Update line item quantity
  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    const updated = [...items];
    const target = updated[index];
    const originalProd = products.find((p) => p.id === target.productId);

    if (originalProd && newQty > originalProd.currentStock) {
      setErrorMessage(`Cannot exceed available stock (${originalProd.currentStock})`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const gross = target.unitPrice * newQty;
    const discount = target.discountType === 'percentage'
      ? (gross * target.discountValue) / 100
      : target.discountValue;
    const net = gross - discount;
    const tax = (net * target.taxRate) / 100;

    target.quantity = newQty;
    target.discountAmount = Math.round(discount * 100) / 100;
    target.taxAmount = Math.round(tax * 100) / 100;
    target.total = Math.round((net + tax) * 100) / 100;

    setItems(updated);
  };

  // Update line item discount
  const updateItemDiscount = (index: number, val: number, type: 'percentage' | 'fixed') => {
    const updated = [...items];
    const target = updated[index];
    const gross = target.unitPrice * target.quantity;

    const discount = type === 'percentage'
      ? (gross * Math.min(100, Math.max(0, val))) / 100
      : Math.min(gross, Math.max(0, val));
    const net = gross - discount;
    const tax = (net * target.taxRate) / 100;

    target.discountType = type;
    target.discountValue = val;
    target.discountAmount = Math.round(discount * 100) / 100;
    target.taxAmount = Math.round(tax * 100) / 100;
    target.total = Math.round((net + tax) * 100) / 100;

    setItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Live Calculations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const grossAfterItemDisc = subtotal - itemDiscountTotal;

  const invoiceDiscountAmount = invoiceDiscountType === 'percentage'
    ? (grossAfterItemDisc * Math.min(100, Math.max(0, invoiceDiscountValue))) / 100
    : Math.min(grossAfterItemDisc, Math.max(0, invoiceDiscountValue));

  const taxableAmount = grossAfterItemDisc - invoiceDiscountAmount;
  const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((taxAmount / 2) * 100) / 100;

  const rawGrandTotal = taxableAmount + taxAmount + (Number(additionalCharges) || 0);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100;
  const grandTotal = roundedGrandTotal;

  // Auto-fill paid amount if not manually touched
  useEffect(() => {
    if (!paidAmountTouched) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal, paidAmountTouched]);

  useEffect(() => {
    if (!invoiceToPrint || !printFormat) return;

    const printTimer = window.setTimeout(() => {
      document.documentElement.dataset.printFormat = printFormat;
      const handleAfterPrint = () => {
        delete document.documentElement.dataset.printFormat;
        setInvoiceToPrint(null);
        setPrintFormat(null);
      };
      window.addEventListener('afterprint', handleAfterPrint, { once: true });
      window.print();
    }, 100);

    return () => window.clearTimeout(printTimer);
  }, [invoiceToPrint, printFormat]);

  const balanceAmount = Math.max(0, grandTotal - paidAmount);
  const changeDue = Math.max(0, paidAmount - grandTotal);
  const paymentStatus = paidAmount <= 0 ? 'PENDING' : paidAmount < grandTotal ? 'PARTIALLY_PAID' : 'PAID';

  // Construct active invoice object for preview
  const currentInvoicePreview: Partial<Invoice> & { items: InvoiceItem[] } = {
    invoiceNumber: invoiceNumber || 'INV-2026-000001',
    invoiceDate,
    dueDate,
    customerId: selectedCustomer?.id || 'WALK-IN',
    customerName: customerName || 'Walk-in Guest',
    customerPhone,
    customerEmail,
    customerAddress,
    items,
    subtotal,
    itemDiscountTotal,
    invoiceDiscountType,
    invoiceDiscountValue,
    invoiceDiscountAmount,
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount: 0,
    additionalCharges,
    roundOff,
    grandTotal,
    paymentMethod,
    paidAmount,
    balanceAmount,
    paymentStatus: paymentStatus as any,
    status: 'COMPLETED',
    notes,
    createdBy: user?.name || 'Cashier',
  };

  // Reset / New Bill
  const resetBill = () => {
    setItems([]);
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setInvoiceDiscountValue(0);
    setAdditionalCharges(0);
    setNotes('');
    setPaidAmountTouched(false);
    generateTempInvoiceNumber();
  };

  // Hold current bill
  const handleHoldBill = async () => {
    if (items.length === 0) {
      setErrorMessage('Cannot hold an empty bill.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const res = await api.holdInvoice(currentInvoicePreview);
      if (res.success) {
        setHeldBills([res.invoice, ...heldBills]);
        setSuccessMessage(`Bill parked with ID ${res.invoice.invoiceNumber}`);
        resetBill();
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Recall held bill
  const handleRecallBill = (bill: Invoice) => {
    setInvoiceNumber(bill.invoiceNumber);
    setInvoiceDate(bill.invoiceDate);
    setDueDate(bill.dueDate);
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setCustomerEmail(bill.customerEmail);
    setCustomerAddress(bill.customerAddress);
    setItems(bill.items);
    setInvoiceDiscountType(bill.invoiceDiscountType);
    setInvoiceDiscountValue(bill.invoiceDiscountValue);
    setAdditionalCharges(bill.additionalCharges);
    setNotes(bill.notes || '');
    setPaymentMethod(bill.paymentMethod as any);
    setPaidAmount(bill.paidAmount);
    setPaidAmountTouched(true);

    // Remove from held
    api.removeHeldInvoice(bill.invoiceNumber);
    setHeldBills(heldBills.filter((h) => h.invoiceNumber !== bill.invoiceNumber));
  };

  // Discard held bill
  const handleDiscardHeld = async (invNum: string) => {
    await api.removeHeldInvoice(invNum);
    setHeldBills(heldBills.filter((h) => h.invoiceNumber !== invNum));
  };

  // Complete Invoice (Server Transaction)
  const handleSaveInvoice = async (printFormat?: 'A4' | 'THERMAL') => {
    if (items.length === 0) {
      setErrorMessage('Please add at least one boutique product to the invoice.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerId: selectedCustomer?.id,
        customerName: customerName.trim() || 'Walk-in Patron',
        customerPhone: customerPhone.trim() || '0000000000',
        customerEmail,
        customerAddress,
        invoiceDate,
        dueDate,
        items: items.map((itm) => ({
          productId: itm.productId,
          variantId: itm.variantId,
          quantity: itm.quantity,
          discountType: itm.discountType,
          discountValue: itm.discountValue,
        })),
        invoiceDiscountType,
        invoiceDiscountValue,
        additionalCharges,
        paymentMethod,
        paidAmount,
        notes,
      };

        const res = await api.createInvoice(payload);
      if (res.success && res.invoice) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d97706', '#b45309', '#78350f', '#10b981'],
        });

        setSuccessMessage(`Invoice ${res.invoice.invoiceNumber} created & inventory updated!`);
        setTimeout(() => setSuccessMessage(null), 4000);

        // Refresh inventory to reflect stock deduction
        api.getProducts().then((pRes) => {
          if (pRes.success) setProducts(pRes.products);
        });

        if (printFormat) {
          setInvoiceToPrint(res.invoice);
          setPrintFormat(printFormat);
        }

        resetBill();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save invoice');
      setTimeout(() => setErrorMessage(null), 4500);
    } finally {
      setLoading(false);
    }
  };

  // Filter products for dropdown
  const filteredProducts = productSearch.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.barcode.includes(productSearch) ||
          p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.color.toLowerCase().includes(productSearch.toLowerCase())
      )
    : [];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-50">
      {/* Top POS Header */}
      <header className="h-14 border-b border-stone-200/90 bg-white px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-900 text-amber-50 flex items-center justify-center font-serif font-black text-sm tracking-wider shadow-xs">
            V
          </div>
          <div>
            <h1 className="font-serif font-bold text-stone-900 text-sm tracking-widest uppercase">
              {settings.boutiqueName}
            </h1>
            <p className="text-[10px] text-stone-400 -mt-0.5 tracking-wider uppercase">Boutique POS &amp; Billing</p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Held Bills Badge Button */}
          <button
            onClick={() => setIsHoldModalOpen(true)}
            className="relative px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-xs font-medium text-stone-700 transition-all flex items-center gap-1.5"
            title="View Parked / Held Bills"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Held Bills</span>
            {heldBills.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                {heldBills.length}
              </span>
            )}
          </button>

          {/* New Bill Button */}
          <button
            onClick={resetBill}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-all flex items-center gap-1.5"
            title="Clear and start new bill"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">New Bill</span>
          </button>

          {/* Cashier Profile Badge */}
          <div className="h-7 pl-2 pr-3 bg-stone-100 rounded-full flex items-center gap-2 text-xs border border-stone-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-stone-800">{user?.name || 'Cashier'}</span>
            <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full uppercase font-mono">
              {user?.role || 'CASHIER'}
            </span>
          </div>
        </div>
      </header>

      {/* Toast Feedback Banners */}
      {successMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ==================== LEFT PANEL: BILLING CREATION FORM ==================== */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* Card 1: Customer & Invoice Metadata */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-700" /> Customer Information
              </span>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1"
              >
                {selectedCustomer ? 'Change Patron' : '+ Select / Add Customer'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-stone-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setSelectedCustomer(null);
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Invoice Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={invoiceNumber}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 font-mono text-xs select-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-mono">
                    AUTO
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Billing Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-stone-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 mb-1">Email / City (Optional)</label>
                <input
                  type="text"
                  value={customerEmail || customerAddress}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. patron@boutique.in"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-stone-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Barcode & Product Search Controls */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Barcode Scanner Input */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <button type="button" onClick={() => setIsScannerModalOpen(true)} className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider flex items-center gap-1 hover:text-amber-800">
                    <Barcode className="w-3.5 h-3.5 text-amber-600" /> Scan Barcode (USB / Keyboard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScannerModalOpen(true)}
                    className="text-[10px] text-amber-700 font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Camera Scanner
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeSubmit(barcodeInput);
                      }
                    }}
                    placeholder="Type or scan with USB reader, or click the label for camera..."
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => barcodeInput.trim() ? handleBarcodeSubmit(barcodeInput) : setIsScannerModalOpen(true)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-amber-900 text-amber-50 rounded-lg text-[11px] font-medium hover:bg-amber-800 transition-colors"
                  >
                    Lookup
                  </button>
                </div>
                {barcodeError && <p className="text-[11px] text-red-600 mt-1">{barcodeError}</p>}
              </div>

              {/* Product Search Dropdown Field */}
              <div className="flex-1 relative">
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Search Boutique Catalog
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search by name, SKU, saree, kurti..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-xs"
                  />
                </div>

                {/* Dropdown Results */}
                {isSearchOpen && productSearch.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-stone-200 z-30 max-h-64 overflow-y-auto divide-y divide-stone-100 animate-fadeIn">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-stone-400">
                        No boutique garments found matching "{productSearch}"
                      </div>
                    ) : (
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => addProductToBill(p)}
                          className="p-3 hover:bg-amber-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-xs text-stone-900 group-hover:text-amber-900">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-stone-500 font-mono">
                                SKU: {p.sku} • Barcode: {p.barcode} • {p.color} • {p.size}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xs text-stone-900">{formatCurrency(p.sellingPrice)}</p>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${
                                p.currentStock <= p.minStock
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.currentStock} in stock
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick-Pick Popular Silks Carousel */}
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add Popular Pieces
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {products.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProductToBill(p)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:border-amber-400 bg-stone-50/50 hover:bg-amber-50/50 text-[11px] text-stone-700 flex items-center gap-2 shrink-0 transition-all text-left"
                  >
                    <span className="font-medium truncate max-w-[130px]">{p.name}</span>
                    <span className="font-semibold text-stone-900 font-mono">{formatCurrency(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Invoice Items Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-700" /> Invoice Line Items ({items.length})
              </span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-[11px] text-stone-400 hover:text-red-600 transition-colors"
                >
                  Clear All Items
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-stone-300 mb-2 stroke-[1.5]" />
                <p className="font-medium text-stone-600">Your invoice is empty</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Scan a garment barcode or select from the search catalog above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/80 text-stone-500 font-semibold border-b border-stone-200/60 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Garment Details</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Unit Price</th>
                      <th className="py-2.5 px-2 text-center">Disc (%)</th>
                      <th className="py-2.5 px-2 text-center">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-stone-50/40">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-stone-900">{item.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {item.sku} • {item.barcode}
                          </p>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center justify-center border border-stone-200 rounded-lg overflow-hidden w-20 mx-auto bg-white">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, item.quantity - 1)}
                              className="px-2 py-0.5 text-stone-500 hover:bg-stone-100 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQty(idx, parseInt(e.target.value, 10) || 1)}
                              className="w-8 text-center text-xs font-semibold focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, item.quantity + 1)}
                              className="px-2 py-0.5 text-stone-500 hover:bg-stone-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-medium">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountValue || 0}
                            onChange={(e) => updateItemDiscount(idx, parseFloat(e.target.value) || 0, 'percentage')}
                            className="w-14 mx-auto text-center py-1 rounded-lg border border-stone-200 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-[11px] text-stone-500">
                          {item.taxRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold font-mono text-stone-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 4: Discounts, Extra Charges, & Payment Method */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Overall Invoice Discount</label>
                <div className="flex gap-1">
                  <select
                    value={invoiceDiscountType}
                    onChange={(e) => setInvoiceDiscountType(e.target.value as any)}
                    className="px-2 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 font-medium"
                  >
                    <option value="fixed">₹ (Fixed)</option>
                    <option value="percentage">% (Percent)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={invoiceDiscountValue}
                    onChange={(e) => setInvoiceDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Alteration / Shipping</label>
                <input
                  type="number"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Invoice Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Wedding trousseau packing"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            </div>

            {/* Payment Section */}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-700" /> Payment Settlement
                </span>
                {paymentMethod === 'UPI' && (
                  <button
                    type="button"
                    onClick={() => setShowUpiQr(!showUpiQr)}
                    className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> {showUpiQr ? 'Hide QR' : 'Show UPI QR Code'}
                  </button>
                )}
              </div>

              {/* Payment Methods Pill Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {(['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                      paymentMethod === method
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-white text-stone-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* UPI QR Display Modal if toggled */}
              {showUpiQr && paymentMethod === 'UPI' && (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-4 mb-3 animate-fadeIn">
                  <div className="w-24 h-24 bg-white p-2 rounded-lg border border-amber-300 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=boutique@okaxis&pn=VelvetVine&am=${grandTotal}&cu=INR`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-amber-950">Scan &amp; Pay via Any UPI App</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">Google Pay, PhonePe, Paytm, BHIM</p>
                    <p className="text-sm font-bold text-amber-950 mt-1">Amount: {formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              )}

              {/* Paid Amount vs Balance Due */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => {
                      setPaidAmount(parseFloat(e.target.value) || 0);
                      setPaidAmountTouched(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">Balance Due</label>
                  <div className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-xs text-red-600">
                    {formatCurrency(balanceAmount)}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 mb-1">Change to Return</label>
                  <div className="px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono font-bold text-xs text-emerald-700">
                    {formatCurrency(changeDue)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Execution Footer Bar */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 z-10">
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Payable Grand Total</p>
              <p className="text-2xl font-serif font-black text-stone-900 tracking-tight">
                {formatCurrency(grandTotal)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHoldBill}
                disabled={items.length === 0}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-white text-xs font-medium text-stone-700 hover:bg-amber-50/50 disabled:opacity-40 transition-colors"
              >
                Hold Bill
              </button>

              <button
                type="button"
                onClick={() => handleSaveInvoice('THERMAL')}
                disabled={items.length === 0 || loading}
                className="px-3.5 py-2.5 rounded-xl border border-stone-900 bg-stone-100 text-stone-900 hover:bg-stone-200 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                title="Save & Print 80mm POS Receipt"
              >
                <Printer className="w-3.5 h-3.5" /> POS Receipt
              </button>

              <button
                type="button"
                onClick={() => handleSaveInvoice('A4')}
                disabled={items.length === 0 || loading}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-md flex items-center gap-2 disabled:opacity-40 transition-all hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Complete &amp; Print A4
              </button>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PANEL: LIVE INVOICE PREVIEW ==================== */}
        <div className="lg:col-span-5 h-full overflow-hidden">
          <LiveInvoicePreview
            invoice={invoiceToPrint || currentInvoicePreview}
            onPrint={(format) => handleSaveInvoice(format)}
          />
        </div>
      </div>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScan={handleBarcodeSubmit}
      />

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleSelectCustomer}
        currentCustomerId={selectedCustomer?.id}
      />

      <HoldBillsModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        heldBills={heldBills}
        onRecall={handleRecallBill}
        onDiscard={handleDiscardHeld}
      />
    </div>
  );
};
