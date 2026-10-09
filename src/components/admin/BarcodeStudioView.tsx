import React, { useEffect, useMemo, useState } from 'react';
import {
  Barcode as BarcodeIcon,
  Check,
  Copy,
  Edit2,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { Pagination } from './Pagination';

const PAGE_SIZE = 8;
const emptyForm = { name: '', sku: '', barcode: '', sellingPrice: 0 };

export const BarcodeStudioView: React.FC = () => {
  const { settings, formatCurrency } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [labelQuantity, setLabelQuantity] = useState<number>(6);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      if (res.success) {
        setProducts(res.products);
        setSelectedProduct((current) => res.products.find((product) => product.id === current?.id) || res.products[0] || null);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load barcode records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => [product.name, product.sku, product.barcode].some((value) => value.toLowerCase().includes(query)));
  }, [products, search]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm, sku: `TAG-${Math.floor(1000 + Math.random() * 9000)}` });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, sku: product.sku, barcode: product.barcode, sellingPrice: product.sellingPrice });
    setError('');
    setModalOpen(true);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = editingProduct
        ? await api.updateProduct(editingProduct.id, form)
        : await api.createProduct(form);
      setSelectedProduct(result.product);
      setFeedback(editingProduct ? 'Barcode record updated.' : 'Barcode record created.');
      setModalOpen(false);
      await loadProducts();
      window.setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this barcode record.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete barcode record for ${product.name}? This also removes the product.`)) return;
    try {
      await api.deleteProduct(product.id);
      setFeedback('Barcode record deleted.');
      await loadProducts();
      window.setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this barcode record.');
    }
  };

  const generateBarcode = async () => {
    try {
      const result = await api.generateBarcode('EAN13');
      setForm((current) => ({ ...current, barcode: result.barcode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a barcode.');
    }
  };

  const copyBarcode = async () => {
    if (!selectedProduct) return;
    try {
      await navigator.clipboard.writeText(selectedProduct.barcode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  };

  const BarcodeGraphic = ({ code }: { code: string }) => {
    const leftL = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const leftG = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
    const rightR = leftL.map((pattern) => pattern.replace(/[01]/g, (bit) => bit === '0' ? '1' : '0'));
    const parity = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    const isEan13 = /^\d{13}$/.test(code);
    let bits = '101';
    if (isEan13) {
      const digits = code.split('').map(Number);
      const pattern = parity[digits[0]];
      for (let index = 0; index < 6; index += 1) bits += pattern[index] === 'L' ? leftL[digits[index + 1]] : leftG[digits[index + 1]];
      bits += '01010';
      for (let index = 7; index < 13; index += 1) bits += rightR[digits[index]];
      bits += '101';
    }
    return (
      <div className="flex flex-col items-center">
        {isEan13 ? <svg className="my-1 h-12 w-full max-w-[230px]" viewBox="0 0 113 48" role="img" aria-label={`EAN-13 barcode ${code}`} shapeRendering="crispEdges">
          {bits.split('').map((bit, index) => bit === '1' ? <rect key={index} x={index + 9} y="0" width="1" height={index < 3 || (index >= 45 && index < 50) || index >= 92 ? 48 : 40} fill="#1c1917" /> : null)}
        </svg> : <p className="my-2 text-[10px] text-red-600">Use a 13-digit EAN barcode to print a scannable label.</p>}
        <p className="font-mono text-[10px] tracking-widest text-stone-700">{code}</p>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-stone-900">Barcode Studio</h1>
          <p className="text-xs text-stone-500">Manage barcode records and print boutique price tags</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} disabled={!selectedProduct} className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"><Printer className="h-4 w-4" /> Print ({labelQuantity})</button>
          <button type="button" onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"><Plus className="h-4 w-4" /> Add barcode</button>
        </div>
      </div>

      {feedback && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{feedback}</p>}
      {error && !modalOpen && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold text-stone-900">Barcode records</h2><p className="mt-1 text-xs text-stone-500">{filteredProducts.length} products</p></div>
          <label className="relative block w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, SKU or barcode" className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Barcode</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? <tr><td colSpan={5} className="py-12 text-center text-stone-400">Loading barcode records…</td></tr>
                : pageProducts.length === 0 ? <tr><td colSpan={5} className="py-12 text-center text-stone-400">No matching products found.</td></tr>
                  : pageProducts.map((product) => <tr key={product.id} onClick={() => setSelectedProduct(product)} className={`cursor-pointer transition hover:bg-amber-50/50 ${selectedProduct?.id === product.id ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-stone-900">{product.name}</td><td className="px-4 py-3 font-mono text-stone-600">{product.sku}</td><td className="px-4 py-3 font-mono text-stone-600">{product.barcode}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(product.sellingPrice)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><button type="button" title="Edit" onClick={(event) => { event.stopPropagation(); openEdit(product); }} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"><Edit2 className="h-4 w-4" /></button><button type="button" title="Delete" onClick={(event) => { event.stopPropagation(); void deleteProduct(product); }} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageSize={PAGE_SIZE} totalItems={filteredProducts.length} onPageChange={setPage} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs lg:col-span-4">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-stone-900">Tag configuration</h2>{selectedProduct && <button type="button" onClick={copyBarcode} title="Copy barcode" className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy code</button>}</div>
          {selectedProduct ? <div className="space-y-3 rounded-xl bg-stone-50 p-3 text-xs"><p className="font-semibold text-stone-900">{selectedProduct.name}</p><p className="font-mono text-stone-600">{selectedProduct.sku} · {selectedProduct.barcode}</p><p className="font-semibold">{formatCurrency(selectedProduct.sellingPrice)}</p></div> : <p className="text-xs text-stone-500">Select a product from the table to preview its tag.</p>}
          <div><label className="mb-2 block text-xs font-semibold text-stone-600">Labels to print</label><div className="flex flex-wrap gap-2">{[4, 6, 8, 12, 24].map((qty) => <button key={qty} type="button" onClick={() => setLabelQuantity(qty)} className={`rounded-lg border px-3 py-1.5 text-xs ${labelQuantity === qty ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-700'}`}>{qty}</button>)}</div></div>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-stone-200 bg-stone-100/70 p-5 lg:col-span-8"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">Print sheet preview</p><div id="printable-barcode-sheet" className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">{selectedProduct && Array.from({ length: labelQuantity }).map((_, index) => <div key={index} className="flex flex-col items-center rounded-xl border border-stone-300 bg-white p-3 text-center text-stone-900"><p className="font-serif text-[11px] font-black uppercase tracking-wider text-amber-950">{settings.boutiqueName}</p><p className="mt-0.5 line-clamp-1 text-[10px] font-semibold">{selectedProduct.name}</p><p className="font-mono text-[9px] text-stone-500">SKU: {selectedProduct.sku}</p><div className="my-1.5 flex w-full justify-center"><BarcodeGraphic code={selectedProduct.barcode} /></div><p className="mt-0.5 font-mono text-sm font-black">{formatCurrency(selectedProduct.sellingPrice)}</p><p className="text-[8px] text-stone-400">Inclusive of all taxes</p></div>)}</div></div>
      </section>

      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><form onSubmit={saveProduct} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-stone-900">{editingProduct ? 'Edit barcode record' : 'Add barcode record'}</h2><p className="mt-1 text-xs text-stone-500">This record is saved in the product catalog.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><X className="h-4 w-4" /></button></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <label className="block text-xs font-semibold text-stone-600">Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-500" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-stone-600">SKU<input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono font-normal text-stone-900 outline-none focus:border-amber-500" /></label><label className="block text-xs font-semibold text-stone-600">Selling price<input required min="0" type="number" step="0.01" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal text-stone-900 outline-none focus:border-amber-500" /></label></div>
        <label className="block text-xs font-semibold text-stone-600">Barcode<div className="mt-1 flex gap-2"><input required value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} className="w-full rounded-xl border border-stone-200 px-3 py-2.5 font-mono font-normal text-stone-900 outline-none focus:border-amber-500" /><button type="button" onClick={() => void generateBarcode()} title="Generate EAN-13 barcode" className="shrink-0 rounded-xl border border-stone-200 px-3 text-stone-700 hover:bg-stone-50"><BarcodeIcon className="h-4 w-4" /></button></div></label>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Create record'}</button></div>
      </form></div>}
    </div>
  );
};
