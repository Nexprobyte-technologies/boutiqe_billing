import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings, TaxRate } from '../types';
import { api } from '../services/api';

interface SettingsContextType {
  settings: StoreSettings;
  taxRates: TaxRate[];
  categories: any[];
  currencySymbol: string;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

const defaultSettings: StoreSettings = {
  boutiqueName: 'Velvet & Vine',
  tagline: 'Haute Couture & Heritage Silks',
  logoText: 'VELVET & VINE',
  address: '14 Lavelle Promenade, Indiranagar 100ft Road',
  cityStateZip: 'Bengaluru, Karnataka 560038',
  phone: '+91 98450 12890',
  email: 'concierge@velvetandvine.in',
  website: 'www.velvetandvine.in',
  gstin: '29AABCU9603R1ZM',
  currencySymbol: '₹',
  currencyCode: 'INR',
  invoicePrefix: 'INV-2026-',
  defaultPrintFormat: 'A4',
  invoiceFooterNotes: 'Thank you for shopping at Velvet & Vine. Your handcrafted garment is bespoke and precious.',
  termsAndConditions: '1. Exchange within 7 days with original invoice & tag.\n2. Customized garments cannot be returned.',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      if (res.success) {
        setSettings(res.settings);
        setTaxRates(res.taxRates);
        setCategories(res.categories);
      }
    } catch (err) {
      console.warn('Using default store settings fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const formatCurrency = (amount: number) => {
    const symbol = settings.currencySymbol || '₹';
    return `${symbol}${Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        taxRates,
        categories,
        currencySymbol: settings.currencySymbol || '₹',
        loading,
        refreshSettings,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
