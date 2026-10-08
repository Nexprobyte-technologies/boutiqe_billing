import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  X,
  RotateCcw,
} from 'lucide-react';
import { Product, Supplier } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

function createEan13Barcode() {
  const body = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return `${body}${(10 - (sum % 10)) % 10}`;
}

export const ProductsView: React.FC = () => {
  const { formatCurrency, categories, taxRates } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Sarees',
    subcategory: '',
    brand: 'Velvet & Vine',
    color: 'Crimson',
    size: 'Free Size',
    material: 'Pure Silk',
    purchasePrice: 4000,
    sellingPrice: 7999,
    mrp: 9999,
    currentStock: 10,
    minStock: 3,
    taxRateId: 'TAX-12',
    supplierId: '',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    description: '',
  });

  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter, stockFilter]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
        stockStatus: stockFilter || undefined,
      });
      if (res.success) {
        setProducts(res.products);
        setLoadError(null);
      }
    } catch (err) {
      console.error(err);
      setLoadError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.getSuppliers();
      if (res.success) setSuppliers(res.suppliers);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not generate a barcode.');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SAR-${Math.floor(100 + Math.random() * 900)}`,
      barcode: createEan13Barcode(),
      category: 'Sarees',
      subcategory: 'Kanjivaram Silk',
      brand: 'Velvet & Vine',
      color: 'Maroon',
      size: 'Free Size',
      material: 'Pure Mulberry Silk',
      purchasePrice: 5000,
      sellingPrice: 9999,
      mrp: 12499,
      currentStock: 8,
      minStock: 2,
      taxRateId: 'TAX-12',
      supplierId: suppliers[0]?.id || '',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      description: 'Handcrafted luxury piece tailored for high-end boutique clients.',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      subcategory: p.subcategory || '',
      brand: p.brand,
      color: p.color,
      size: p.size,
      material: p.material,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      currentStock: p.currentStock,
      minStock: p.minStock,
      taxRateId: p.taxRateId,
      supplierId: p.supplierId || '',
      imageUrl: p.imageUrl || '',
      description: p.description,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleGenerateBarcode = async () => {
    try {
      const res = await api.generateBarcode('EAN13');
      if (res.success) {
        setFormData((prev) => ({ ...prev, barcode: res.barcode }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, formData);
        if (res.success) {
          setFeedbackMessage(`Product "${res.product.name}" updated successfully.`);
          setIsModalOpen(false);
          loadProducts();
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      } else {
        const res = await api.createProduct(formData);
        if (res.success) {
          setFeedbackMessage(`Product "${res.product.name}" added with ID ${res.product.id}.`);
          setIsModalOpen(false);
          loadProducts();
          setTimeout(() => setFeedbackMessage(null), 3500);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (confirm(`Are you sure you want to delete ${p.name}?`)) {
      try {
        const res = await api.deleteProduct(p.id);
        if (res.success) {
          setFeedbackMessage(`Product ${p.name} deleted.`);
          loadProducts();
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Product Catalog</h1>
          <p className="text-xs text-stone-500">Manage boutique garments, unique barcodes, SKU taxonomy &amp; pricing</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Boutique Garment
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <span>Product catalog could not be loaded: {loadError}</span>
          <button type="button" onClick={loadProducts} className="font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      {feedbackMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {feedbackMessage}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, barcode, color or size..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button type="button" onClick={loadProducts} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50">
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="">All Stock Levels</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-3">SKU &amp; Barcode</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">Loading catalog...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">No products match your criteria.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {p.id} • {p.color} • {p.size}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono font-semibold text-stone-800">{p.sku}</p>
                      <p className="font-mono text-[10px] text-stone-500">{p.barcode}</p>
                    </td>
                    <td className="py-3 px-3 text-stone-600">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-500">
                      {formatCurrency(p.purchasePrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.currentStock <= 0
                            ? 'bg-red-100 text-red-800'
                            : p.currentStock <= p.minStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-semibold text-stone-900 text-base">
                {editingProduct ? `Edit Garment: ${editingProduct.sku}` : 'Add New Boutique Garment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Garment Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pure Zari Kanjivaram Bridal Saree"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono uppercase"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-stone-700">Barcode *</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-amber-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Kanjivaram Silk"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Size / Fit</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tax Rate</label>
                  <select
                    value={formData.taxRateId}
                    onChange={(e) => setFormData({ ...formData, taxRateId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    {taxRates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="">None / In-house</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
