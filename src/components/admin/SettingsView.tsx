import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, ShieldCheck, Percent } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { api } from '../../services/api';
import { TaxRate } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, taxRates, refreshSettings } = useSettings();
  const [formData, setFormData] = useState({ ...settings });
  const [taxes, setTaxes] = useState<TaxRate[]>([...taxRates]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings(formData);
      await api.updateTaxRates(taxes);
      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Store &amp; Tax Settings</h1>
        <p className="text-xs text-stone-500">Configure boutique stationery branding, contact info, default print layouts &amp; GST tax slabs</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Boutique settings successfully updated and saved!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Boutique Profile */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="font-semibold text-sm text-stone-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-700" /> Boutique Identity &amp; Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Boutique Name *</label>
              <input
                type="text"
                value={formData.boutiqueName}
                onChange={(e) => setFormData({ ...formData, boutiqueName: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Store Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">City, State &amp; PIN *</label>
              <input
                type="text"
                value={formData.cityStateZip}
                onChange={(e) => setFormData({ ...formData, cityStateZip: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Concierge Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Boutique GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* Currency & Print Format Settings */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="font-semibold text-sm text-stone-900">Billing &amp; Printing Preferences</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-base"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Default Print Format</label>
              <select
                value={formData.defaultPrintFormat}
                onChange={(e) => setFormData({ ...formData, defaultPrintFormat: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
              >
                <option value="A4">Standard Detailed A4 Stationery</option>
                <option value="THERMAL">80mm POS Thermal Receipt</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-stone-700 mb-1">Invoice Footer Notes</label>
              <input
                type="text"
                value={formData.invoiceFooterNotes}
                onChange={(e) => setFormData({ ...formData, invoiceFooterNotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-stone-700 mb-1">Terms &amp; Conditions (Printed on Invoice)</label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-sans"
              />
            </div>
          </div>
        </div>

        {/* GST Tax Slabs Configuration */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-2xs space-y-4">
          <h2 className="font-semibold text-sm text-stone-900 flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-700" /> Configurable GST Tax Slabs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {taxes.map((t, idx) => (
              <div key={t.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-stone-800">{t.name}</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded-md">
                    {t.rate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-stone-500">
                  <div>CGST: {t.cgst}%</div>
                  <div>SGST: {t.sgst}%</div>
                  <div>IGST: {t.igst}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-xs"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Settings...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
};
