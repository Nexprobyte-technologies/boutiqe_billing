import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { ReturnRecord, Invoice } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const ReturnsView: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [reason, setReason] = useState('Fabric / size mismatch');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'UPI' | 'Store Credit'>('Store Credit');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadReturns();
    loadInvoices();
  }, []);

  const loadReturns = async () => {
    const res = await api.getReturns();
    if (res.success) setReturns(res.returns);
  };

  const loadInvoices = async () => {
    const res = await api.getInvoices({ status: 'COMPLETED' });
    if (res.success) setInvoices(res.invoices);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedProductId) return;

    try {
      const res = await api.processReturn({
        invoiceId: selectedInvoice.invoiceNumber,
        items: [
          {
            productId: selectedProductId,
            quantity: returnQty,
            reason,
          },
        ],
        refundMethod,
        notes,
      });

      if (res.success) {
        setFeedback(`Return ${res.returnRecord.id} completed. Garments restocked & refund recorded.`);
        setSelectedInvoice(null);
        setSelectedProductId('');
        loadReturns();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Return failed');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Returns &amp; Refunds</h1>
        <p className="text-xs text-stone-500">Process customer returns, issue store credits/refunds &amp; restore inventory</p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {feedback}
        </div>
      )}

      {/* Return Workflow Form */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
        <h2 className="font-semibold text-sm text-stone-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-700" /> Process a Garment Return
        </h2>

        <form onSubmit={handleProcessReturn} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Select Completed Invoice</label>
            <select
              value={selectedInvoice?.invoiceNumber || ''}
              onChange={(e) => {
                const inv = invoices.find((i) => i.invoiceNumber === e.target.value);
                setSelectedInvoice(inv || null);
                if (inv && inv.items.length > 0) {
                  setSelectedProductId(inv.items[0].productId);
                }
              }}
              required
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
            >
              <option value="">-- Choose Invoice --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} • {inv.customerName} ({formatCurrency(inv.grandTotal)})
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Item to Return</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  {selectedInvoice.items.map((itm) => (
                    <option key={itm.id} value={itm.productId}>
                      {itm.name} (Qty: {itm.quantity} • {formatCurrency(itm.total)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.items.find((i) => i.productId === selectedProductId)?.quantity || 1}
                  value={returnQty}
                  onChange={(e) => setReturnQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reason for Return</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="Size / Fit Mismatch">Size / Fit Mismatch</option>
                  <option value="Color Shade Variation">Color Shade Variation</option>
                  <option value="Fabric Weave Imperfection">Fabric Weave Imperfection</option>
                  <option value="Gift Exchange">Gift Exchange</option>
                  <option value="Other / Client Request">Other / Client Request</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Refund Tender</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="Store Credit">Store Credit (Gift Voucher)</option>
                  <option value="UPI">UPI Reversal</option>
                  <option value="Cash">Cash Refund</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Garment tags intact"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors shadow-xs"
                >
                  Process Return &amp; Restock Inventory
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Returns History Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-sm text-stone-900">Return &amp; Refund Log</h2>
          <span className="text-xs text-stone-500">{returns.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Return ID</th>
                <th className="py-3 px-3">Orig. Invoice</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Returned Garment</th>
                <th className="py-3 px-3 text-right">Refund Amount</th>
                <th className="py-3 px-3 text-center">Tender</th>
                <th className="py-3 px-4">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">No returns recorded yet.</td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{r.id}</td>
                    <td className="py-3 px-3 font-mono text-stone-700">{r.invoiceId}</td>
                    <td className="py-3 px-3 font-medium text-stone-800">{r.customerName}</td>
                    <td className="py-3 px-3">
                      {r.items.map((item, i) => (
                        <p key={i} className="text-stone-700">
                          {item.quantity}x {item.productName} <span className="text-stone-400">({item.reason})</span>
                        </p>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                      -{formatCurrency(r.totalRefundAmount)}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px]">
                        {r.refundMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">{r.processedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
