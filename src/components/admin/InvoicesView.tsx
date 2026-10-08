import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  FileText,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react';
import { Invoice } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { LiveInvoicePreview } from '../billing/LiveInvoicePreview';

export const InvoicesView: React.FC = () => {
  const { formatCurrency, settings } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer return / order cancelled');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const [invoiceRes, heldRes] = await Promise.all([
        api.getInvoices(),
        api.getHeldInvoices(),
      ]);
      const uniqueInvoices = new Map<string, Invoice>();
      [...invoiceRes.invoices, ...heldRes.invoices].forEach((invoice) => {
        uniqueInvoices.set(invoice.invoiceNumber, invoice);
      });
      setInvoices([...uniqueInvoices.values()].sort((a, b) =>
        `${b.invoiceDate || ''}${b.createdAt || ''}`.localeCompare(`${a.invoiceDate || ''}${a.createdAt || ''}`)
      ));
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const visibleInvoices = invoices.filter((invoice) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.customerName.toLowerCase().includes(query) || invoice.customerPhone.includes(query) ||
      (invoice.customerEmail || '').toLowerCase().includes(query);
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesPayment = !paymentFilter || invoice.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const invoiceCategories = [
    { label: 'All Orders', status: '', count: invoices.length },
    { label: 'Completed', status: 'COMPLETED', count: invoices.filter((invoice) => invoice.status === 'COMPLETED').length },
    { label: 'Held', status: 'HOLD', count: invoices.filter((invoice) => invoice.status === 'HOLD').length },
    { label: 'Cancelled', status: 'CANCELLED', count: invoices.filter((invoice) => invoice.status === 'CANCELLED').length },
    { label: 'Refunded', status: 'REFUNDED', count: invoices.filter((invoice) => invoice.status === 'REFUNDED').length },
  ];

  const handleCancelInvoice = async () => {
    if (!cancelModalInvoice) return;
    try {
      const res = await api.cancelInvoice(cancelModalInvoice.invoiceNumber, cancelReason);
      if (res.success) {
        setActionMessage(`Invoice ${cancelModalInvoice.invoiceNumber} cancelled & items restocked`);
        setCancelModalInvoice(null);
        loadInvoices();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    }
  };

  const printInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Invoices &amp; Orders</h1>
          <p className="text-xs text-stone-500">{invoices.length} order{invoices.length === 1 ? '' : 's'} across all invoice categories</p>
        </div>
        <button type="button" onClick={loadInvoices} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50">
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh invoices
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <span>Invoices could not be loaded: {loadError}</span>
          <button type="button" onClick={loadInvoices} className="font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {actionMessage}
        </div>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {invoiceCategories.map((category) => (
          <button
            key={category.status || 'all'}
            type="button"
            onClick={() => setStatusFilter(category.status)}
            className={`rounded-2xl border p-4 text-left transition ${statusFilter === category.status ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-stone-200 bg-white hover:border-amber-300'}`}
          >
            <span className="block text-xs font-medium text-stone-500">{category.label}</span>
            <span className="mt-1 block font-serif text-2xl font-bold text-stone-900">{category.count}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer name or phone..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="">All Payments</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Order Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">Loading invoices...</td>
                </tr>
              ) : visibleInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">No invoices found matching criteria.</td>
                </tr>
              ) : (
                visibleInvoices.map((inv) => (
                  <tr key={inv.id || inv.invoiceNumber} className="hover:bg-stone-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-stone-900">{inv.customerName}</p>
                      <p className="text-[10px] text-stone-500 font-mono">{inv.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-3 text-stone-600">{inv.invoiceDate}</td>
                    <td className="py-3.5 px-3 text-stone-600 font-medium">{inv.items.length} items</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'COMPLETED'
                            ? 'bg-stone-100 text-stone-800'
                            : 'bg-red-50 text-red-700 line-through'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="View Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => printInvoice(inv)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-amber-50"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {inv.status !== 'CANCELLED' && inv.status !== 'HOLD' && (
                          <button
                            type="button"
                            onClick={() => setCancelModalInvoice(inv)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                            title="Cancel Invoice & Restock"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Invoice {selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs text-stone-500">Issued on {selectedInvoice.invoiceDate} by {selectedInvoice.createdBy}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printInvoice(selectedInvoice)}
                  className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Customer summary */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase">Customer</p>
                  <p className="font-semibold text-stone-900 mt-0.5">{selectedInvoice.customerName}</p>
                  <p className="text-stone-500 font-mono text-[11px]">{selectedInvoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase">Payment Method</p>
                  <p className="font-semibold text-stone-900 mt-0.5">{selectedInvoice.paymentMethod}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Garment</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Rate</th>
                      <th className="py-2.5 px-2 text-right">GST</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedInvoice.items.map((itm) => (
                      <tr key={itm.id}>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-stone-900">{itm.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">SKU: {itm.sku}</p>
                        </td>
                        <td className="py-2.5 px-2 text-center">{itm.quantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(itm.unitPrice)}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-stone-500">{itm.taxRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">{formatCurrency(itm.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="w-60 ml-auto space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discounts:</span>
                    <span className="font-mono">-{formatCurrency(selectedInvoice.itemDiscountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-stone-300 flex justify-between font-bold text-sm text-stone-900">
                  <span>Grand Total:</span>
                  <span className="font-mono font-extrabold">{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Confirmation Modal */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-stone-900">
              Cancel Invoice {cancelModalInvoice.invoiceNumber}?
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Cancelling this invoice will immediately restore inventory quantities for all{' '}
              {cancelModalInvoice.items.length} items and mark the order as cancelled.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalInvoice(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50"
              >
                Keep Invoice
              </button>
              <button
                type="button"
                onClick={handleCancelInvoice}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Confirm &amp; Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="print-preview-host fixed -left-[10000px] top-0 h-screen w-[800px] overflow-hidden" aria-hidden="true">
          <LiveInvoicePreview invoice={selectedInvoice} />
        </div>
      )}
    </div>
  );
};
