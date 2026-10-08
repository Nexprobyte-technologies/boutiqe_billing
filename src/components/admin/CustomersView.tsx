import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export const CustomersView: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers(search || undefined);
      if (res.success) setCustomers(res.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const viewCustomerInvoices = async (c: Customer) => {
    try {
      const res = await api.getCustomerDetails(c.id);
      if (res.success) {
        setSelectedCustomerDetails(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Customer Directory</h1>
          <p className="text-xs text-stone-500">Patron relationship management, purchase history &amp; VIP preferences</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Boutique Patron
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patrons by name, phone or email..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Patron Details</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Bills Count</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-3">Preferences / Notes</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">Loading patrons...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">No patrons found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-900">{c.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{c.id}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-stone-800 font-mono text-[11px]">{c.phone}</p>
                      {c.email && <p className="text-stone-500 text-[10px]">{c.email}</p>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">{c.totalBills}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="py-3 px-3 text-stone-600 text-[11px] max-w-xs truncate">
                      {c.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => viewCustomerInvoices(c)}
                          className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700"
                        >
                          Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Customer Orders History Modal */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h3 className="font-semibold text-sm text-stone-900">{selectedCustomerDetails.customer.name}</h3>
                <p className="text-xs text-stone-500 font-mono">
                  {selectedCustomerDetails.customer.phone} • Lifetime: {formatCurrency(selectedCustomerDetails.customer.totalPurchases)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerDetails(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
              {selectedCustomerDetails.invoices.length === 0 ? (
                <p className="text-center py-6 text-stone-400">No invoices on file for this patron.</p>
              ) : (
                selectedCustomerDetails.invoices.map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-stone-200 flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold text-stone-900">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-stone-500">{inv.invoiceDate} • {inv.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-stone-900">{formatCurrency(inv.grandTotal)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 font-semibold font-mono">
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Patron Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-semibold text-base text-stone-900">
              {editingCustomer ? 'Edit Patron Profile' : 'Add New Boutique Patron'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Postal Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Preferences &amp; Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
