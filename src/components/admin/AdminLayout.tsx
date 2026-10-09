import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Barcode,
  Boxes,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export type AdminTab =
  | 'dashboard'
  | 'invoices'
  | 'products'
  | 'barcodes'
  | 'inventory';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onBackToBilling: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  onBackToBilling,
  children,
}) => {
  const { user, switchRole } = useAuth();
  const { settings } = useSettings();

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices & Orders', icon: Receipt },
    { id: 'products', label: 'Product Catalog', icon: Package },
    { id: 'barcodes', label: 'Barcode Studio', icon: Barcode },
    { id: 'inventory', label: 'Inventory & Movements', icon: Boxes },
  ];

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden text-stone-900">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col shrink-0 border-r border-stone-800">
        {/* Boutique Branding */}
        <div className="h-16 px-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-black tracking-widest text-sm text-stone-100 uppercase">
              {settings.boutiqueName}
            </h2>
            <p className="text-[10px] text-amber-500 font-mono tracking-wider">ADMINISTRATION PORTAL</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600/90 text-white shadow-xs font-semibold'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Back to POS Button & Profile */}
        <div className="p-3 border-t border-stone-800 space-y-2">
          <button
            type="button"
            onClick={onBackToBilling}
            className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Billing POS
          </button>

          <div className="p-2.5 rounded-xl bg-stone-800/70 border border-stone-700/50 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-medium text-stone-200 truncate">{user?.name}</p>
              <p className="text-[10px] font-mono text-amber-400 uppercase">{user?.role}</p>
            </div>
            <select
              value={user?.role}
              onChange={(e) => switchRole(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-[10px] rounded-lg px-2 py-1 text-stone-300"
              title="Switch demo role"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="CASHIER">CASHIER</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-stone-50">
        {children}
      </main>
    </div>
  );
};
