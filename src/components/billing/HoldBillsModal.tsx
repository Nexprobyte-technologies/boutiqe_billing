import React from 'react';
import { X, Clock, Trash2, ArrowRight } from 'lucide-react';
import { Invoice } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface HoldBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: Invoice[];
  onRecall: (invoice: Invoice) => void;
  onDiscard: (invoiceNumber: string) => void;
}

export const HoldBillsModal: React.FC<HoldBillsModalProps> = ({
  isOpen,
  onClose,
  heldBills,
  onRecall,
  onDiscard,
}) => {
  const { formatCurrency } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-base">Held Bills</h3>
              <p className="text-xs text-stone-500">{heldBills.length} parked transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {heldBills.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm font-medium text-stone-700">No bills currently on hold</p>
              <p className="text-xs text-stone-400 mt-1">Use the "Hold Bill" button while billing to park an order</p>
            </div>
          ) : (
            heldBills.map((bill) => (
              <div
                key={bill.invoiceNumber}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white hover:border-amber-300 transition-all flex items-center justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900">{bill.customerName || 'Walk-in Guest'}</span>
                    <span className="text-[10px] font-mono bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-sm">
                      {bill.invoiceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'} • Total:{' '}
                    <span className="font-semibold text-stone-900">{formatCurrency(bill.grandTotal)}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Saved by {bill.createdBy || 'Cashier'} at {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDiscard(bill.invoiceNumber)}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Discard held bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onRecall(bill);
                      onClose();
                    }}
                    className="px-3 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors flex items-center gap-1 group-hover:bg-amber-800"
                  >
                    Resume <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
