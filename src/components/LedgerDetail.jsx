import React, { useState, useMemo } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Calendar, 
  Receipt, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  formatCurrency, 
  formatExactDateTime, 
  calculateMemberBalance, 
  getAvatarMeta 
} from '../utils/formatters';

export const LedgerDetail = ({
  member,
  transactions,
  onDeleteTransaction,
  onDeleteMember,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showDeleteMemberConfirm, setShowDeleteMemberConfirm] = useState(false);

  // Compute member transactions with running balance (sorted newest first for display)
  const memberHistory = useMemo(() => {
    if (!member) return [];

    // Filter member txns and sort oldest to newest to compute running balance
    const list = transactions
      .filter((t) => t.member_id === member.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let running = 0;
    const computed = list.map((txn) => {
      const amt = Number(txn.amount) || 0;
      if (txn.type === 'GAVE') {
        running += amt;
      } else {
        running -= amt;
      }
      return {
        ...txn,
        runningBalance: running,
      };
    });

    // Return newest first for display
    return computed.reverse();
  }, [member, transactions]);

  if (!member) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Receipt className="w-12 h-12 stroke-[1.5] mb-3 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-300">No Member Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Select a member from the carousel above or tap "+ Add Member" to start managing transactions.
        </p>
      </div>
    );
  }

  const { netBalance, status } = calculateMemberBalance(member.id, transactions);
  const { initials, gradient } = getAvatarMeta(member.name);

  // Clean phone number for tel: and whatsapp:
  const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      {/* Member Profile Header */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}
          >
            {initials}
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight flex items-center gap-2">
              {member.name}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
              {member.phone ? (
                <span>{member.phone}</span>
              ) : (
                <span className="text-slate-500 italic">No phone</span>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{memberHistory.length} entries</span>
            </div>
          </div>
        </div>

        {/* Member Action Buttons & Current Balance */}
        <div className="flex items-center space-x-2">
          {cleanPhone && (
            <>
              {/* WhatsApp Shortcut */}
              <a
                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
                  member.name
                )},%20your%20current%20balance%20with%20us%20is%20${encodeURIComponent(
                  formatCurrency(Math.abs(netBalance))
                )}%20(${netBalance > 0 ? "You'll Get / Due" : "Advance / Settled"}).`}
                target="_blank"
                rel="noreferrer"
                title="Send WhatsApp Reminder"
                className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900/80 transition"
              >
                <MessageSquare className="w-4 h-4" />
              </a>

              {/* Direct Phone Call */}
              <a
                href={`tel:${cleanPhone}`}
                title="Call Member"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition"
              >
                <Phone className="w-4 h-4" />
              </a>
            </>
          )}

          {/* Delete Member Button */}
          <button
            onClick={() => setShowDeleteMemberConfirm(true)}
            title="Delete Member"
            className="p-2 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:text-rose-400 hover:bg-rose-950/30 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Balance Pill */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-right ${
              netBalance > 0
                ? 'bg-emerald-950/70 border-emerald-600/40 text-emerald-300'
                : netBalance < 0
                ? 'bg-rose-950/70 border-rose-600/40 text-rose-300'
                : 'bg-slate-850 border-slate-700 text-slate-300'
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider">
              {netBalance > 0 ? "You'll Get" : netBalance < 0 ? "You'll Give" : 'Settled'}
            </div>
            <div className="text-sm font-black">
              {formatCurrency(Math.abs(netBalance))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Member Confirmation Modal */}
      {showDeleteMemberConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Member?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{member.name}</strong>? All {memberHistory.length} transactions for this member will also be permanently deleted.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteMemberConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteMemberConfirm(false);
                  onDeleteMember(member.id);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions History Header & List */}
      <div className="flex-1 overflow-y-auto ledger-scroll px-4 py-3">
        {memberHistory.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-900/20">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Transactions Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Use the on-screen keypad below to enter an amount, type quick notes, and tap <strong className="text-emerald-400">+ GOT</strong> or <strong className="text-rose-400">- GAVE</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Date & Note</span>
              <div className="flex items-center space-x-8">
                <span>Amount</span>
                <span className="hidden sm:inline">Balance</span>
                <span>Action</span>
              </div>
            </div>

            {memberHistory.map((txn) => {
              const isGot = txn.type === 'GOT';
              const isConfirming = confirmDeleteId === txn.id;

              return (
                <div
                  key={txn.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isGot
                      ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
                  }`}
                >
                  {/* Left: Type Icon + Note + Exact Date & Time */}
                  <div className="flex items-start space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isGot
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/30'
                          : 'bg-rose-950 text-rose-400 border border-rose-600/30'
                      }`}
                    >
                      {isGot ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            isGot
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isGot ? '+ GOT (Received)' : '- GAVE (Given)'}
                        </span>
                        {txn.note && (
                          <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-md">
                            {txn.note}
                          </span>
                        )}
                      </div>

                      {/* Exact Date & Time down to the minute */}
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatExactDateTime(txn.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Running Balance & Delete Action */}
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-black ${
                          isGot ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isGot ? '+' : '-'} {formatCurrency(txn.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Bal:{' '}
                        <span
                          className={
                            txn.runningBalance > 0
                              ? 'text-emerald-400 font-semibold'
                              : txn.runningBalance < 0
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-400'
                          }
                        >
                          {formatCurrency(Math.abs(txn.runningBalance))}
                        </span>
                      </div>
                    </div>

                    {/* Delete Entry Button / Confirmation */}
                    {isConfirming ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onDeleteTransaction(txn.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition"
                        >
                          Del
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white text-[11px] rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(txn.id)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
