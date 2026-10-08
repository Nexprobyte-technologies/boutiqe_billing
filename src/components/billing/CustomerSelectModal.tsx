import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Phone, Mail, MapPin, Check } from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../services/api';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  currentCustomerId?: string;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  currentCustomerId,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(false);

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      setIsAddingNew(false);
      setError('');
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      setError('Name and Phone are mandatory.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.createCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        address: newAddress.trim(),
        notes: newNotes.trim(),
      });

      if (res.success && res.customer) {
        onSelectCustomer(res.customer);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div>
            <h3 className="font-semibold text-stone-900 text-base">
              {isAddingNew ? 'Add New Boutique Patron' : 'Select Customer'}
            </h3>
            <p className="text-xs text-stone-500">
              {isAddingNew ? 'Create profile with contact details' : 'Search VIPs and regular clients'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAddingNew ? (
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone or email..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> New Customer
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="text-center py-8 text-xs text-stone-400">Loading patrons...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-stone-500">No patrons found matching "{search}"</p>
                  <button
                    onClick={() => {
                      setNewName(search);
                      setIsAddingNew(true);
                    }}
                    className="mt-3 text-xs text-amber-700 font-medium hover:underline"
                  >
                    + Add "{search}" as new customer
                  </button>
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = c.id === currentCustomerId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-stone-900">{c.name}</span>
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                            {c.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" /> {c.phone}
                          </span>
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" /> {c.email}
                            </span>
                          )}
                        </div>
                        {c.address && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-400 truncate max-w-sm">
                            <MapPin className="w-3 h-3 shrink-0" /> {c.address}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-3.5 flex-1 overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Radhika Apte"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. radhika@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Address</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. 104 Richmond Town, Bengaluru"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Notes / Preferences</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Likes pastel Banarasi silks, Size 38"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50"
              >
                Back to List
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Save & Select'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
