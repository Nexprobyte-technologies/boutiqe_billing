import React, { useState } from 'react';
import { Printer, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Invoice, InvoiceItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface LiveInvoicePreviewProps {
  invoice: Partial<Invoice> & { items: InvoiceItem[] };
  onPrint?: (format: 'A4' | 'THERMAL') => void;
  onDownloadPdf?: () => void;
}

export const LiveInvoicePreview: React.FC<LiveInvoicePreviewProps> = ({
  invoice,
  onPrint,
  onDownloadPdf,
}) => {
  const { settings, formatCurrency } = useSettings();
  const [previewMode, setPreviewMode] = useState<'A4' | 'THERMAL'>('A4');

  const printCurrent = () => {
    if (onPrint) {
      onPrint(previewMode);
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-100/70 border-l border-stone-200/80 p-4 lg:p-6 overflow-hidden">
      {/* Top Preview Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-sm font-bold">
            V
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm tracking-wide">Live Invoice Preview</h3>
            <p className="text-[11px] text-stone-500">Real-time stationery & POS receipt render</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Toggle Pill */}
          <div className="bg-stone-200/70 p-0.5 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('A4')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                previewMode === 'A4'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              A4 Invoice
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('THERMAL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                previewMode === 'THERMAL'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              80mm Thermal
            </button>
          </div>

          <button
            type="button"
            onClick={printCurrent}
            className="px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Print invoice"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Preview Scroll Container */}
      <div className="flex-1 overflow-y-auto pt-4 flex justify-center items-start">
        {previewMode === 'A4' ? (
          /* A4 Detailed Boutique Stationery Card */
          <div
            id="printable-invoice"
            className="w-full max-w-[650px] bg-white rounded-2xl shadow-md border border-stone-200/90 p-8 text-stone-800 transition-all text-xs"
          >
            {/* Boutique Header */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl font-bold tracking-widest text-stone-900 uppercase">
                    {settings.boutiqueName}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 italic mt-0.5">{settings.tagline}</p>
                <div className="mt-3 text-[11px] text-stone-600 space-y-0.5 leading-relaxed">
                  <p>{settings.address}</p>
                  <p>{settings.cityStateZip}</p>
                  <p>
                    <span className="text-stone-400">Phone:</span> {settings.phone} •{' '}
                    <span className="text-stone-400">Email:</span> {settings.email}
                  </p>
                  {settings.gstin && (
                    <p className="font-mono font-medium text-stone-700">GSTIN: {settings.gstin}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-semibold text-[10px] uppercase tracking-widest border border-amber-200">
                  Tax Invoice
                </span>
                <p className="font-mono font-bold text-stone-900 text-base mt-2">
                  {invoice.invoiceNumber || 'INV-DRAFT'}
                </p>
                <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                  <p>
                    <span className="text-stone-400">Date:</span>{' '}
                    <span className="font-medium text-stone-700">
                      {invoice.invoiceDate || new Date().toISOString().slice(0, 10)}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Due:</span>{' '}
                    <span className="font-medium text-stone-700">
                      {invoice.dueDate || new Date().toISOString().slice(0, 10)}
                    </span>
                  </p>
                  <p>
                    <span className="text-stone-400">Cashier:</span>{' '}
                    <span className="font-medium text-stone-700">{invoice.createdBy || 'Staff'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Billed To Box */}
            <div className="my-6 p-4 rounded-xl bg-stone-50/70 border border-stone-200/60 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Billed To (Client)</p>
                <p className="font-semibold text-sm text-stone-900 mt-1">
                  {invoice.customerName || 'Walk-in Patron'}
                </p>
                {invoice.customerPhone && (
                  <p className="text-[11px] text-stone-600 mt-0.5">Contact: {invoice.customerPhone}</p>
                )}
                {invoice.customerEmail && (
                  <p className="text-[11px] text-stone-500">{invoice.customerEmail}</p>
                )}
                {invoice.customerAddress && (
                  <p className="text-[11px] text-stone-500 mt-1 max-w-sm">{invoice.customerAddress}</p>
                )}
              </div>

              {invoice.paymentStatus && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Payment Status</p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      invoice.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : invoice.paymentStatus === 'PARTIALLY_PAID'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {invoice.paymentStatus === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                    {invoice.paymentStatus}
                  </span>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Method: <span className="font-semibold text-stone-700">{invoice.paymentMethod || 'Cash'}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Invoice Line Items Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-stone-100/80 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Rate</th>
                    <th className="py-2.5 px-2 text-right">Disc</th>
                    <th className="py-2.5 px-2 text-right">GST</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(!invoice.items || invoice.items.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                        No items added to current bill yet. Scan a barcode or search products.
                      </td>
                    </tr>
                  ) : (
                    invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-stone-900">{item.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            SKU: {item.sku} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}
                          </p>
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium text-stone-800">{item.quantity}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-stone-500">
                          {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-stone-500">{item.taxRate}%</td>
                        <td className="py-2.5 px-3 text-right font-semibold font-mono text-stone-900">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations and Breakdown */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-6 border-t border-stone-200 pt-4">
              <div className="flex-1 space-y-3">
                {invoice.notes && (
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/60">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Special Notes</p>
                    <p className="text-[11px] text-stone-700 mt-0.5">{invoice.notes}</p>
                  </div>
                )}
                <div className="text-[10px] text-stone-500 space-y-1">
                  <p className="font-semibold text-stone-700 uppercase tracking-wider">Terms & Conditions:</p>
                  <p className="whitespace-pre-line leading-relaxed text-stone-500">
                    {settings.termsAndConditions}
                  </p>
                </div>
              </div>

              {/* Totals Summary Column */}
              <div className="w-full md:w-64 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">{formatCurrency(invoice.subtotal || 0)}</span>
                </div>

                {(invoice.itemDiscountTotal || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Item Discounts</span>
                    <span className="font-mono font-medium">-{formatCurrency(invoice.itemDiscountTotal || 0)}</span>
                  </div>
                )}

                {(invoice.invoiceDiscountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Invoice Discount</span>
                    <span className="font-mono font-medium">-{formatCurrency(invoice.invoiceDiscountAmount || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-500">
                  <span>Taxable Base</span>
                  <span className="font-mono">{formatCurrency(invoice.taxableAmount || 0)}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>GST Total</span>
                  <span className="font-mono font-medium">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>

                {(invoice.additionalCharges || 0) > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping / Alteration</span>
                    <span className="font-mono">{formatCurrency(invoice.additionalCharges || 0)}</span>
                  </div>
                )}

                {(invoice.roundOff || 0) !== 0 && (
                  <div className="flex justify-between text-stone-400 text-[10px]">
                    <span>Round Off</span>
                    <span className="font-mono">
                      {(invoice.roundOff || 0) > 0 ? `+${invoice.roundOff}` : invoice.roundOff}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-300 flex justify-between items-center text-sm font-bold text-stone-900">
                  <span className="font-serif">Grand Total</span>
                  <span className="font-mono text-base text-amber-950 font-extrabold">
                    {formatCurrency(invoice.grandTotal || 0)}
                  </span>
                </div>

                {invoice.paidAmount !== undefined && (
                  <div className="pt-2 border-t border-dashed border-stone-200 flex justify-between text-stone-600 text-[11px]">
                    <span>Amount Paid</span>
                    <span className="font-mono font-semibold text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                )}
                {(invoice.balanceAmount || 0) > 0 && (
                  <div className="flex justify-between text-red-700 font-semibold text-[11px]">
                    <span>Balance Due</span>
                    <span className="font-mono">{formatCurrency(invoice.balanceAmount || 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature & Footer */}
            <div className="mt-8 pt-6 border-t border-stone-200 flex justify-between items-end text-[11px] text-stone-400">
              <div className="italic text-stone-500">
                <p>{settings.invoiceFooterNotes}</p>
                <p className="mt-0.5 text-[10px] text-stone-400">Computer-generated tax invoice. No physical signature required.</p>
              </div>
              <div className="text-right">
                <div className="w-32 border-b border-stone-300 mb-1" />
                <span className="text-[10px] text-stone-500 font-medium uppercase">Authorized Signatory</span>
              </div>
            </div>
          </div>
        ) : (
          /* 80mm POS Thermal Receipt Layout */
          <div
            id="printable-thermal"
            className="w-[310px] bg-white rounded-xl shadow-md border border-stone-300 p-5 font-mono text-[11px] text-stone-900 leading-tight"
          >
            {/* Thermal Boutique Header */}
            <div className="text-center pb-3 border-b border-dashed border-stone-400">
              <h2 className="font-serif font-black text-base tracking-widest uppercase">{settings.boutiqueName}</h2>
              <p className="text-[10px] text-stone-600 italic">{settings.tagline}</p>
              <p className="text-[10px] text-stone-600 mt-1">{settings.address}</p>
              <p className="text-[10px] text-stone-600">{settings.cityStateZip}</p>
              <p className="text-[10px] text-stone-600">Ph: {settings.phone}</p>
              {settings.gstin && <p className="text-[10px] font-bold mt-0.5">GSTIN: {settings.gstin}</p>}
            </div>

            {/* Meta */}
            <div className="py-2 border-b border-dashed border-stone-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>RECEIPT:</span>
                <span className="font-bold">{invoice.invoiceNumber || 'INV-DRAFT'}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{invoice.invoiceDate || new Date().toISOString().slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-semibold truncate max-w-[170px]">{invoice.customerName || 'Walk-in'}</span>
              </div>
              {invoice.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{invoice.createdBy || 'Staff'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="py-2 border-b border-dashed border-stone-400">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-stone-200">
                <span>ITEM</span>
                <span>QTY x RATE</span>
                <span>TOTAL</span>
              </div>
              <div className="divide-y divide-dotted divide-stone-200 pt-1">
                {(!invoice.items || invoice.items.length === 0) ? (
                  <p className="py-4 text-center text-stone-400 italic">No items</p>
                ) : (
                  invoice.items.map((item, idx) => (
                    <div key={idx} className="py-1">
                      <div className="font-semibold text-[11px] truncate">{item.name}</div>
                      <div className="flex justify-between text-[10px] text-stone-600">
                        <span>{item.sku}</span>
                        <span>
                          {item.quantity} x {item.unitPrice}
                        </span>
                        <span className="font-bold text-stone-900">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Thermal Totals */}
            <div className="py-2 border-b border-dashed border-stone-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal || 0)}</span>
              </div>
              {(invoice.itemDiscountTotal || 0) + (invoice.invoiceDiscountAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>
                    -{formatCurrency((invoice.itemDiscountTotal || 0) + (invoice.invoiceDiscountAmount || 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax:</span>
                <span>{formatCurrency(invoice.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-stone-900">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.grandTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1">
                <span>PAID ({invoice.paymentMethod || 'Cash'}):</span>
                <span>{formatCurrency(invoice.paidAmount !== undefined ? invoice.paidAmount : invoice.grandTotal || 0)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[9px] text-stone-600 space-y-1">
              <p className="font-bold uppercase tracking-wider">THANK YOU FOR YOUR VISIT</p>
              <p>Exchanges accepted within 7 days with bill.</p>
              <p>Dry clean recommended for silks.</p>
              <p className="font-mono text-[8px] text-stone-400 mt-2">*** {settings.website} ***</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
