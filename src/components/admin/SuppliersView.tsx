import React, { useState, useEffect } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, Edit2 } from 'lucide-react';
import { Supplier } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const SuppliersView: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await api.getSuppliers();
      if (res.success) setSuppliers(res.suppliers);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', company: '', phone: '', email: '', address: '', gstin: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      company: s.company,
      phone: s.phone,
      email: s.email,
      address: s.address,
      gstin: s.gstin,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
      } else {
        await api.createSupplier(formData);
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Suppliers &amp; Vendors</h1>
          <p className="text-xs text-stone-500">Manage handloom guilds, weavers, embroidery artisans &amp; jewelry partners</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Vendor Partner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Vendor Details</th>
                <th className="py-3 px-3">Company Name</th>
                <th className="py-3 px-3">Phone / Contact</th>
                <th className="py-3 px-3">GSTIN</th>
                <th className="py-3 px-3 text-right">Lifetime Purchases</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/60">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-stone-900">{s.name}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{s.id}</p>
                  </td>
                  <td className="py-3.5 px-3 text-stone-700 font-medium">{s.company}</td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-stone-600">{s.phone}</td>
                  <td className="py-3.5 px-3 font-mono text-[10px] text-stone-500">{s.gstin || '—'}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-stone-900">
                    {formatCurrency(s.totalPurchases)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-stone-900">
              {editingSupplier ? 'Edit Vendor Profile' : 'Add Vendor Partner'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Company / Loom Name *</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono uppercase"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
