import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';
import { Invoice } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const ReportsView: React.FC = () => {
  const { formatCurrency, settings } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let start = '';
      const end = now.toISOString().slice(0, 10);

      if (dateRange === 'today') {
        start = end;
      } else if (dateRange === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        start = d.toISOString().slice(0, 10);
      } else if (dateRange === 'month') {
        start = `${end.slice(0, 7)}-01`;
      }

      const res = await api.getSalesReport(start || undefined, end || undefined);
      if (res.success) {
        setInvoices(res.invoices);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (invoices.length === 0) return;

    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Phone',
      'Items Count',
      'Subtotal',
      'Discount',
      'Tax Amount',
      'Grand Total',
      'Payment Method',
      'Payment Status',
      'Staff',
    ];

    const rows = invoices.map((i) => [
      i.invoiceNumber,
      i.invoiceDate,
      `"${i.customerName}"`,
      i.customerPhone,
      i.items.length,
      i.subtotal,
      i.itemDiscountTotal + i.invoiceDiscountAmount,
      i.taxAmount,
      i.grandTotal,
      i.paymentMethod,
      i.paymentStatus,
      `"${i.createdBy}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boutique_sales_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Reports &amp; Analytics</h1>
          <p className="text-xs text-stone-500">Comprehensive sales registers, GST tax reports &amp; CSV export</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={invoices.length === 0}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-40"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV Spreadsheet
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-700">Reporting Timeframe:</span>
        <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateRange(item.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                dateRange === item.id ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Invoices Executed</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{summary.invoiceCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Gross Sales</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(summary.totalSales)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">GST Collected</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(summary.totalTax)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Discounts Allowed</span>
            <p className="font-serif font-black text-2xl text-emerald-800 mt-2">{formatCurrency(summary.totalDiscount)}</p>
          </div>
        </div>
      )}

      {/* Report Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">GST</th>
                <th className="py-3 px-3 text-right">Net Grand Total</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-4">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 text-stone-600">{inv.invoiceDate}</td>
                  <td className="py-3 px-4 font-medium text-stone-800">{inv.customerName}</td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600">{formatCurrency(inv.taxableAmount)}</td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600">{formatCurrency(inv.taxAmount)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">{formatCurrency(inv.grandTotal)}</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">{inv.paymentMethod}</span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 text-[11px]">{inv.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
