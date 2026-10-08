import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Users,
  DollarSign,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const DashboardView: React.FC<{ onNavigateToTab?: (tab: string) => void }> = ({ onNavigateToTab }) => {
  const { formatCurrency } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardKPIs();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-stone-400">
        Loading boutique executive metrics...
      </div>
    );
  }

  const { kpis, topSellingProducts, categorySales, paymentMethodDistribution, salesTrend, recentInvoices, lowStockAlerts } = data;

  const maxSalesInTrend = Math.max(...salesTrend.map((t: any) => t.amount), 1000);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Executive Dashboard</h1>
          <p className="text-xs text-stone-500">Live sales performance, retail metrics &amp; inventory telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
            <Calendar className="w-3.5 h-3.5 text-stone-400" /> Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(kpis.todaySales)}</p>
          <p className="text-[11px] text-stone-500 mt-1">
            <span className="font-semibold text-emerald-700">{kpis.todayOrders} invoices</span> closed today
          </p>
        </div>

        {/* This Month's Sales */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">This Month's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(kpis.thisMonthSales)}</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Total lifetime: <span className="font-semibold text-stone-700">{formatCurrency(kpis.totalSales)}</span>
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Inventory Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif font-black text-2xl text-stone-900 mt-2">{kpis.lowStockCount}</p>
          <p className="text-[11px] text-red-600 font-medium mt-1">
            {kpis.outOfStockCount > 0 ? `${kpis.outOfStockCount} out of stock` : 'Garments below threshold'}
          </p>
        </div>

        {/* Total Patrons */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Patron Directory</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif font-black text-2xl text-stone-900 mt-2">{kpis.totalCustomers}</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Across {kpis.totalProducts} active boutique lines
          </p>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Bar Chart (7-Days) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-sm text-stone-900">7-Day Sales Performance</h2>
              <p className="text-xs text-stone-500">Daily gross revenue across all boutique registers</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-800">
              Total: {formatCurrency(salesTrend.reduce((a: number, b: any) => a + b.amount, 0))}
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 flex items-end gap-3 pt-6 border-b border-stone-200 pb-2">
            {salesTrend.map((day: any) => {
              const heightPct = Math.max(8, Math.round((day.amount / maxSalesInTrend) * 100));
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono font-medium text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(day.amount)}
                  </span>
                  <div className="w-full max-w-[40px] bg-stone-100 rounded-t-lg overflow-hidden flex items-end h-44">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-stone-900 group-hover:bg-amber-600 transition-all rounded-t-lg"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 font-medium">{day.label.split(',')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-sm text-stone-900">Payment Channels</h2>
            <p className="text-xs text-stone-500 mb-4">Breakdown by tender mode</p>

            <div className="space-y-3">
              {Object.entries(paymentMethodDistribution).map(([method, amount]: [string, any]) => {
                const totalRev = kpis.totalSales || 1;
                const pct = Math.round((amount / totalRev) * 100);
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-stone-700">{method}</span>
                      <span className="font-mono text-stone-500">{formatCurrency(amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-amber-700 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Pending Balance Receivable:</span>
            <span className="font-mono font-bold text-red-600">{formatCurrency(kpis.pendingPaymentsTotal)}</span>
          </div>
        </div>
      </div>

      {/* Top Products & Low Stock Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-stone-900">Boutique Best Sellers</h2>
            <span className="text-xs text-stone-400">By volume sold</span>
          </div>
          <div className="divide-y divide-stone-100">
            {topSellingProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-stone-400">No sales recorded yet</p>
            ) : (
              topSellingProducts.map((p: any, idx: number) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-xs text-stone-900">{p.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">SKU: {p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-xs text-stone-900">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] text-stone-500">{p.unitsSold} units billed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Box */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-sm text-stone-900">Stock Replenishment Needed</h2>
            </div>
            <span className="text-xs text-stone-400">Low stock alert</span>
          </div>

          <div className="divide-y divide-stone-100">
            {lowStockAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 flex flex-col items-center gap-1">
                <CheckCircle2 className="w-5 h-5" />
                <span>All boutique pieces are well stocked above minimum limits.</span>
              </div>
            ) : (
              lowStockAlerts.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-stone-900">{item.name}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      SKU: {item.sku} • Threshold: {item.minStock} units
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold font-mono">
                      {item.currentStock} remaining
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h2 className="font-semibold text-sm text-stone-900">Recent Transactions</h2>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('invoices')}
              className="text-xs text-amber-800 font-semibold hover:underline flex items-center gap-1"
            >
              View All Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-stone-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-stone-900">{inv.customerName}</p>
                    <p className="text-[10px] text-stone-400">{inv.customerPhone}</p>
                  </td>
                  <td className="py-3 px-3 text-stone-600">{inv.invoiceDate}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
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
