import React from 'react';
import { 
  Search, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Cloud, 
  HardDrive, 
  Download, 
  Settings, 
  UserPlus,
  Scale
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const Header = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  summary,
  filteredCount,
  totalCount,
  isCloud,
  onOpenAddMember,
  onOpenSettings,
  onExport,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
      {/* Brand & Sync Status Bar */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
            ₹
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
              KhataBook
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Digital Business Ledger</p>
          </div>
        </div>

        {/* Sync Badge & Actions */}
        <div className="flex items-center space-x-2">
          {/* Cloud / Local Storage Mode Badge */}
          <button
            onClick={onOpenSettings}
            title={isCloud ? 'Connected to Supabase PostgreSQL' : 'Using Local Storage (Offline Ready)'}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              isCloud
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-600/40 hover:bg-amber-900/50'
            }`}
          >
            {isCloud ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Supabase Cloud</span>
                <span className="sm:hidden">Cloud</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Local Storage</span>
                <span className="sm:hidden">Local</span>
              </>
            )}
          </button>

          {/* Export Quick Button */}
          <button
            onClick={onExport}
            title="Export Khata Backup (JSON/CSV)"
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Database & App Settings"
            className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Add Member Top Shortcut */}
          <button
            onClick={onOpenAddMember}
            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Member</span>
          </button>
        </div>
      </div>

      {/* Real-time Member Search Input */}
      <div className="max-w-7xl mx-auto px-4 py-1.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            id="member-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by name or phone..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Summary Banner: You'll Get vs You'll Give vs Net */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 shadow-inner">
          {/* You'll Get (Green) */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
              You'll Get
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 truncate">
              {formatCurrency(summary.totalYouWillGet)}
            </span>
          </div>

          {/* You'll Give (Red) */}
          <div className="flex flex-col border-l border-slate-800 pl-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-400" />
              You'll Give
            </span>
            <span className="text-sm sm:text-base font-bold text-rose-400 truncate">
              {formatCurrency(summary.totalYouWillGive)}
            </span>
          </div>

          {/* Total Net Balance across all members */}
          <div className="flex flex-col border-l border-slate-800 pl-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Scale className="w-3 h-3 text-cyan-400" />
              Net Balance
            </span>
            <span
              className={`text-sm sm:text-base font-bold truncate ${
                summary.netTotal > 0
                  ? 'text-emerald-400'
                  : summary.netTotal < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {summary.netTotal > 0 ? '+' : summary.netTotal < 0 ? '-' : ''}
              {formatCurrency(Math.abs(summary.netTotal))}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Status Filter Tabs: All, You'll Get (Green), You'll Give (Red) */}
      <div className="max-w-7xl mx-auto px-4 pb-2.5 flex items-center space-x-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
            activeFilter === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700/80 text-slate-200">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('GET')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
            activeFilter === 'GET'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 shadow-sm shadow-emerald-950'
              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>You'll Get</span>
        </button>

        <button
          onClick={() => setActiveFilter('GIVE')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
            activeFilter === 'GIVE'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60 shadow-sm shadow-rose-950'
              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>You'll Give</span>
        </button>
      </div>
    </header>
  );
};
