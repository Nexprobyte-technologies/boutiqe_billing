/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { FormEvent, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { BillingView } from './components/billing/BillingView';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { InvoicesView } from './components/admin/InvoicesView';
import { ProductsView } from './components/admin/ProductsView';
import { BarcodeStudioView } from './components/admin/BarcodeStudioView';
import { InventoryView } from './components/admin/InventoryView';
import { ArrowRight, LockKeyhole, Store } from 'lucide-react';

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const [email, setEmail] = useState('test');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      await refreshSettings();
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl min-h-[620px] overflow-hidden rounded-[2rem] bg-white shadow-2xl grid md:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden md:flex flex-col justify-between bg-stone-900 p-12 text-white relative overflow-hidden">
          <div className="absolute -right-24 -bottom-28 h-96 w-96 rounded-full border border-amber-500/20" />
          <div className="absolute -right-8 -bottom-12 h-64 w-64 rounded-full border border-amber-500/20" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-stone-950"><Store className="h-6 w-6" /></span>
            <div>
              <p className="font-serif text-lg font-bold tracking-wide">{settings.boutiqueName}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-amber-400">Point of Sale</p>
            </div>
          </div>
          <div className="relative max-w-md">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Welcome back</p>
            <h1 className="font-serif text-5xl leading-tight">A beautiful day to do business.</h1>
            <p className="mt-5 text-sm leading-7 text-stone-300">Sign in to manage your boutique, serve customers, and keep every detail in balance.</p>
          </div>
          <p className="relative text-xs text-stone-500">Secure access for your boutique team</p>
        </section>

        <section className="flex items-center justify-center px-7 py-12 sm:px-12">
          <form onSubmit={submit} className="w-full max-w-sm">
            <div className="mb-8 md:hidden">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-stone-950"><Store className="h-6 w-6" /></span>
              <p className="font-serif text-xl font-bold">{settings.boutiqueName}</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Your boutique, at a glance</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-stone-900">Welcome back</h2>
            <p className="mt-2 text-sm text-stone-500">Sign in to continue to your point of sale.</p>

            <label className="mt-8 block text-sm font-semibold text-stone-700" htmlFor="login-email">User name</label>
            <input id="login-email" type="text" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" placeholder="Enter your user name" />

            <label className="mt-5 block text-sm font-semibold text-stone-700" htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" placeholder="Enter your password" />

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-stone-600">
              <p className="font-semibold text-stone-800">Demo account</p>
              <p className="mt-1">User name <span className="font-mono font-semibold">test</span><span className="mx-2 text-amber-400">·</span>Password <span className="font-mono font-semibold">test123</span></p>
            </div>

            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={submitting} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60">
              <LockKeyhole className="h-4 w-4" /> {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function BoutiqueApp() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const { user, loading } = useAuth();

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPathname(path);
  };

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname === '/admin') navigate('/');
  }, [loading, user, pathname]);

  const renderAdminContent = () => {
    switch (adminTab) {
      case 'dashboard': return <DashboardView onNavigateToTab={(tab) => setAdminTab(tab as AdminTab)} />;
      case 'invoices': return <InvoicesView onCreateInvoice={() => navigate('/')} />;
      case 'products': return <ProductsView />;
      case 'barcodes': return <BarcodeStudioView />;
      case 'inventory': return <InventoryView />;
      default: return <DashboardView />;
    }
  };

  if (loading) return <div className="min-h-screen bg-stone-100" aria-label="Loading" />;
  if (!user) return <LoginPage onLogin={() => navigate('/')} />;

  if (pathname === '/admin') {
    return (
      <div className="min-h-screen bg-stone-50 font-sans">
        <AdminLayout activeTab={adminTab} onTabChange={setAdminTab} onBackToBilling={() => navigate('/')}>
          {renderAdminContent()}
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <BillingView />
      <button type="button" onClick={() => navigate('/admin')} className="fixed bottom-4 right-4 z-40 rounded-full border border-stone-700 bg-stone-900/95 px-4 py-3 text-xs font-semibold text-white shadow-xl transition hover:bg-stone-800">
        Open Admin Dashboard
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BoutiqueApp />
      </SettingsProvider>
    </AuthProvider>
  );
}
