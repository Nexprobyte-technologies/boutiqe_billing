import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowUpDown,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  History,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';
import { Product, StockMovement } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const InventoryView: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [tab, setTab] = useState<'levels' | 'movements'>('levels');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Stock Adjustment Modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'PURCHASE' | 'ADJUSTMENT' | 'DAMAGE' | 'TRANSFER'>('PURCHASE');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, [search, filter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory(filter || undefined, search || undefined);
      if (res.success) {
        setInventory(res.inventory);
        setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const res = await api.getStockMovements();
      if (res.success) {
        setMovements(res.movements);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;

    // Negate for damage / transfer
    const finalQty = (adjustType === 'DAMAGE' || adjustType === 'TRANSFER')
      ? -Math.abs(adjustQuantity)
      : Math.abs(adjustQuantity);

    try {
      const res = await api.adjustStock({
        productId: adjustProduct.id,
        quantity: finalQty,
        type: adjustType,
        notes: adjustNotes || `Stock adjustment (${adjustType})`,
      });

      if (res.success) {
        setFeedback(`Stock adjusted for ${adjustProduct.name}. New stock: ${res.product.currentStock}`);
        setAdjustProduct(null);
        setAdjustNotes('');
        loadInventory();
        loadMovements();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Inventory Management</h1>
          <p className="text-xs text-stone-500">Real-time stock valuation, inventory adjustments &amp; movements ledger</p>
        </div>

        {/* Tab switcher */}
        <div className="bg-stone-200/70 p-1 rounded-xl flex items-center text-xs">
          <button
            type="button"
            onClick={() => setTab('levels')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'levels' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Current Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setTab('movements')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-all ${
              tab === 'movements' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Stock Movement Ledger
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {feedback}
        </div>
      )}

      {/* Valuation KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Total Garment Units</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{stats.totalUnits}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Across {stats.totalProducts} catalog lines</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Inventory Cost Valuation</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(stats.costValuation)}</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Purchase cost of current stock</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Retail Sales Valuation</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{formatCurrency(stats.retailValuation)}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Estimated gross potential</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500">Threshold Warnings</span>
            <p className="font-serif font-black text-2xl text-stone-900 mt-2">{stats.lowStockCount}</p>
            <p className="text-[11px] text-red-600 font-medium mt-0.5">{stats.outOfStockCount} pieces out of stock</p>
          </div>
        </div>
      )}

      {tab === 'levels' ? (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inventory by garment name, SKU or barcode..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
            >
              <option value="">All Stock</option>
              <option value="LOW_STOCK">Low Stock Alert</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="IN_STOCK">Adequately Stocked</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Garment</th>
                    <th className="py-3 px-3">SKU &amp; Barcode</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-center">Min Threshold</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Holding Value</th>
                    <th className="py-3 px-4 text-center">Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inventory.map((p) => {
                    const holdingValue = p.currentStock * p.purchasePrice;
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/60">
                        <td className="py-3 px-4 font-semibold text-stone-900">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span>{p.sku}</span> • <span className="text-stone-400">{p.barcode}</span>
                        </td>
                        <td className="py-3 px-3 text-stone-600">{p.category}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                              p.currentStock <= 0
                                ? 'bg-red-100 text-red-800'
                                : p.currentStock <= p.minStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.currentStock}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-stone-500">{p.minStock}</td>
                        <td className="py-3 px-3 text-right font-mono text-stone-500">
                          {formatCurrency(p.purchasePrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900">
                          {formatCurrency(holdingValue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustProduct(p);
                              setAdjustQuantity(1);
                              setAdjustType('PURCHASE');
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Movements Ledger Table */
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-stone-900">Immutable Stock Movement Ledger</h2>
            <span className="text-xs text-stone-500">{movements.length} total movement logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-3 text-center">Movement Type</th>
                  <th className="py-3 px-3 text-center">Qty Changed</th>
                  <th className="py-3 px-3 text-center">Stock Transition</th>
                  <th className="py-3 px-3">Reference / Notes</th>
                  <th className="py-3 px-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/60 font-sans">
                    <td className="py-3 px-4 text-stone-500 font-mono text-[10px]">
                      {new Date(m.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-900">{m.productName}</p>
                      <p className="text-[10px] text-stone-400 font-mono">SKU: {m.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.type === 'SALE'
                            ? 'bg-blue-50 text-blue-700'
                            : m.type === 'RETURN'
                            ? 'bg-emerald-50 text-emerald-700'
                            : m.type === 'PURCHASE'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-stone-600">
                      {m.previousStock} &rarr; <span className="font-bold text-stone-900">{m.newStock}</span>
                    </td>
                    <td className="py-3 px-3 text-stone-600 text-[11px] max-w-xs truncate">
                      {m.referenceInvoiceId ? (
                        <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded-xs mr-1">
                          {m.referenceInvoiceId}
                        </span>
                      ) : null}
                      {m.notes}
                    </td>
                    <td className="py-3 px-4 text-stone-500 text-[11px]">{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-stone-900">
              Adjust Stock: {adjustProduct.name}
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Current Available Stock: <span className="font-bold text-stone-900">{adjustProduct.currentStock} units</span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="PURCHASE">+ Consignment / Supplier Purchase</option>
                  <option value="ADJUSTMENT">+ Regular Inventory Stock Count Adjustment</option>
                  <option value="DAMAGE">- Damaged / Defective Stock</option>
                  <option value="TRANSFER">- Transfer to Another Boutique Store</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes / Reason</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Received new shipment from Silk Guild"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
