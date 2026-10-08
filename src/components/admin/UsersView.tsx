import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Check, X, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const UsersView: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  const permissionsMatrix = [
    { feature: 'Scan Barcodes & Create Bills', cashier: true, manager: true, admin: true },
    { feature: 'Manage Customers & Patrons', cashier: true, manager: true, admin: true },
    { feature: 'Hold & Recall Parked Bills', cashier: true, manager: true, admin: true },
    { feature: 'Process Product Returns & Refunds', cashier: false, manager: true, admin: true },
    { feature: 'Adjust Inventory & Receive Consignments', cashier: false, manager: true, admin: true },
    { feature: 'Cancel Invoices & Restock', cashier: false, manager: true, admin: true },
    { feature: 'Edit Catalog Products & Prices', cashier: false, manager: false, admin: true },
    { feature: 'Delete Products & Patrons', cashier: false, manager: false, admin: true },
    { feature: 'Manage Suppliers & Vendors', cashier: false, manager: true, admin: true },
    { feature: 'View Financial & Profit Reports', cashier: false, manager: false, admin: true },
    { feature: 'Configure GST & Store Branding', cashier: false, manager: false, admin: true },
    { feature: 'Access Security Audit Trail', cashier: false, manager: false, admin: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-wide">Staff &amp; Role-Based Access (RBAC)</h1>
        <p className="text-xs text-stone-500">Manage cashier credentials, store managers, administrators &amp; permissions matrix</p>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-sm text-stone-900">Active Boutique Staff Members</h2>
          <span className="text-xs text-stone-500">{users.length} registered profiles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Email &amp; Contact</th>
                <th className="py-3 px-3 text-center">Active Status</th>
                <th className="py-3 px-4 text-center">Simulate Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const isCurrent = user?.id === u.id;
                return (
                  <tr key={u.id} className={isCurrent ? 'bg-amber-50/40' : 'hover:bg-stone-50/60'}>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-stone-900 flex items-center gap-2">
                        {u.name} {isCurrent && <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">Active User</span>}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">{u.id}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="text-stone-700 font-medium">{u.email}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{u.phone}</p>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => switchRole(u.role)}
                        disabled={isCurrent}
                        className="px-3 py-1 rounded-lg border border-stone-200 hover:border-amber-400 text-[11px] font-medium text-stone-700 hover:bg-white disabled:opacity-40 transition-colors"
                      >
                        {isCurrent ? 'Current' : `Switch to ${u.role}`}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <h2 className="font-semibold text-sm text-stone-900">Role-Based Permission Matrix</h2>
          <p className="text-xs text-stone-500">Security enforcement table applied at REST API and UI levels</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Capability / Operation</th>
                <th className="py-3 px-4 text-center">CASHIER</th>
                <th className="py-3 px-4 text-center">MANAGER</th>
                <th className="py-3 px-4 text-center">ADMIN / SUPER_ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-stone-50/40">
                  <td className="py-2.5 px-4 font-medium text-stone-800">{row.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.cashier ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.manager ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-stone-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
