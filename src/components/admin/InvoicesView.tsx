import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  RotateCcw,
  CheckCircle2,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { Invoice } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { LiveInvoicePreview } from '../billing/LiveInvoicePreview';
import { Pagination } from './Pagination';

const PAGE_SIZE = 10;

export const InvoicesView: React.FC<{ onCreateInvoice?: () => void }> = ({ onCreateInvoice }) => {
  const { formatCurrency, settings } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer return / order cancelled');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingInvoice, setProcessingInvoice] = useState<string | null>(null);

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
  const totalPages = Math.max(1, Math.ceil(visibleInvoices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageInvoices = visibleInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter]);

  const invoiceCategories = [
    { label: 'All Orders', status: '', count: invoices.length },
    { label: 'Completed', status: 'COMPLETED', count: invoices.filter((invoice) => invoice.status === 'COMPLETED').length },
    { label: 'Held', status: 'HOLD', count: invoices.filter((invoice) => invoice.status === 'HOLD').length },
    { label: 'Cancelled', status: 'CANCELLED', count: invoices.filter((invoice) => invoice.status === 'CANCELLED').length },
    { label: 'Refunded', status: 'REFUNDED', count: invoices.filter((invoice) => invoice.status === 'REFUNDED').length },
  ];

  const handleCancelInvoice = async () => {
    if (!cancelModalInvoice) return;
    setProcessingInvoice(cancelModalInvoice.invoiceNumber);
    try {
      const res = await api.cancelInvoice(cancelModalInvoice.invoiceNumber, cancelReason);
      if (res.success) {
        setActionMessage(`Invoice ${cancelModalInvoice.invoiceNumber} cancelled & items restocked`);
        setCancelModalInvoice(null);
        await loadInvoices();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invoice');
    } finally {
      setProcessingInvoice(null);
    }
  };

  const handleDeleteHeldInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Delete held order ${invoice.invoiceNumber}? This draft will be permanently removed.`)) return;
    setProcessingInvoice(invoice.invoiceNumber);
    try {
      await api.removeHeldInvoice(invoice.invoiceNumber);
      setActionMessage(`Held order ${invoice.invoiceNumber} deleted.`);
      await loadInvoices();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete held order');
    } finally {
      setProcessingInvoice(null);
    }
  };

  const downloadExcel = () => {
    const headers = [
      'Invoice Number', 'Date', 'Customer', 'Phone', 'Email', 'Order Status', 'Payment Status',
      'Payment Method', 'Items', 'Subtotal', 'Discount', 'GST', 'Grand Total', 'Staff',
    ];
    const escapeCell = (value: unknown) => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = visibleInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.invoiceDate,
      invoice.customerName,
      invoice.customerPhone,
      invoice.customerEmail || '',
      invoice.status,
      invoice.paymentStatus,
      invoice.paymentMethod,
      invoice.items.map((item) => `${item.name} (${item.sku}) x${item.quantity}`).join('; '),
      invoice.subtotal,
      invoice.itemDiscountTotal,
      invoice.taxAmount,
      invoice.grandTotal,
      invoice.createdBy,
    ]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setActionMessage(`Downloaded ${visibleInvoices.length} invoice${visibleInvoices.length === 1 ? '' : 's'} as an Excel-compatible CSV.`);
    setTimeout(() => setActionMessage(null), 3500);
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadExcel} disabled={visibleInvoices.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Download Excel (CSV)
          </button>
          <button type="button" onClick={loadInvoices} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50">
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {onCreateInvoice && <button type="button" onClick={onCreateInvoice} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800"><Plus className="h-3.5 w-3.5" /> Create invoice</button>}
        </div>
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
                pageInvoices.map((inv) => (
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
                        {inv.status === 'HOLD' && (
                          <button
                            type="button"
                            onClick={() => void handleDeleteHeldInvoice(inv)}
                            disabled={processingInvoice === inv.invoiceNumber}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                            title="Delete held draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <Pagination page={currentPage} pageSize={PAGE_SIZE} totalItems={visibleInvoices.length} onPageChange={setPage} />
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
                disabled={processingInvoice === cancelModalInvoice.invoiceNumber}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                {processingInvoice === cancelModalInvoice.invoiceNumber ? 'Saving…' : 'Confirm & Restock'}
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
