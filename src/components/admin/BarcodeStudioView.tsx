import React, { useState, useEffect } from 'react';
import {
  Barcode as BarcodeIcon,
  Printer,
  Sparkles,
  Download,
  Copy,
  Check,
  Package,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const BarcodeStudioView: React.FC = () => {
  const { settings, formatCurrency } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [labelQuantity, setLabelQuantity] = useState<number>(6);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      if (res.success && res.products.length > 0) {
        setProducts(res.products);
        setSelectedProduct(res.products[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintLabels = () => {
    window.print();
  };

  const copyBarcode = () => {
    if (selectedProduct) {
      navigator.clipboard.writeText(selectedProduct.barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pure SVG Barcode Generator Component
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
      for (let index = 0; index < 6; index += 1) {
        bits += pattern[index] === 'L' ? leftL[digits[index + 1]] : leftG[digits[index + 1]];
      }
      bits += '01010';
      for (let index = 7; index < 13; index += 1) bits += rightR[digits[index]];
      bits += '101';
    }

    return (
      <div className="flex flex-col items-center">
        {isEan13 ? (
          <svg className="my-1 h-12 w-full max-w-[230px]" viewBox="0 0 113 48" role="img" aria-label={`EAN-13 barcode ${code}`} shapeRendering="crispEdges">
            {bits.split('').map((bit, index) => {
              if (bit !== '1') return null;
              const guardBar = index < 3 || (index >= 45 && index < 50) || index >= 92;
              return <rect key={index} x={index + 9} y="0" width="1" height={guardBar ? 48 : 40} fill="#1c1917" />;
            })}
          </svg>
        ) : <p className="my-2 text-[10px] text-red-600">Use a 13-digit EAN barcode to print a scannable label.</p>}
        <p className="font-mono text-[10px] tracking-widest text-stone-700">{code}</p>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Barcode Studio</h1>
          <p className="text-xs text-stone-500">Design, format &amp; print commercial boutique price tags &amp; barcode labels</p>
        </div>
        <button
          type="button"
          onClick={handlePrintLabels}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4" /> Print Label Sheet ({labelQuantity} Tags)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="font-semibold text-sm text-stone-900">Tag Configuration</h2>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Select Garment</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                if (found) setSelectedProduct(found);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku} • {formatCurrency(p.sellingPrice)})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Barcode:</span>
                <span className="font-bold flex items-center gap-1">
                  {selectedProduct.barcode}
                  <button onClick={copyBarcode} className="text-stone-400 hover:text-stone-700">
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">SKU:</span>
                <span>{selectedProduct.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Selling Price:</span>
                <span className="font-bold">{formatCurrency(selectedProduct.sellingPrice)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Labels to Print</label>
            <div className="flex items-center gap-2">
              {[4, 6, 8, 12, 24].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setLabelQuantity(qty)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    labelQuantity === qty
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Label Preview Sheet */}
        <div className="lg:col-span-7 bg-stone-100/70 rounded-2xl border border-stone-200/80 p-6 flex flex-col items-center">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
            Print Sheet Preview (Standard Jewelry / Garment Hang-Tag)
          </p>

          <div
            id="printable-barcode-sheet"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl"
          >
            {selectedProduct &&
              Array.from({ length: labelQuantity }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-stone-300 p-3 shadow-xs flex flex-col items-center text-center text-stone-900 font-sans"
                >
                  <p className="font-serif font-black text-[11px] tracking-wider uppercase text-amber-950">
                    {settings.boutiqueName}
                  </p>
                  <p className="text-[10px] font-semibold text-stone-800 line-clamp-1 mt-0.5">
                    {selectedProduct.name}
                  </p>
                  <p className="text-[9px] text-stone-500 font-mono">
                    SKU: {selectedProduct.sku}
                  </p>

                  <div className="my-1.5 w-full flex justify-center">
                    <BarcodeGraphic code={selectedProduct.barcode} />
                  </div>

                  <p className="font-mono font-black text-sm text-stone-900 mt-0.5">
                    {formatCurrency(selectedProduct.sellingPrice)}
                  </p>
                  <p className="text-[8px] text-stone-400">Inclusive of all taxes</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
