import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  HardDrive, 
  Download, 
  RotateCcw, 
  Trash2, 
  Check, 
  ExternalLink, 
  Database,
  FileCode2,
  FileText
} from 'lucide-react';
import { getSupabaseConfig, getSupabase } from '../services/supabaseClient';

export const SettingsModal = ({
  isOpen,
  onClose,
  isCloud,
  onExportJSON,
  onExportCSV,
  onResetDemoData,
  onClearAllData,
  onRefreshData,
}) => {
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('khata_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('khata_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSaveCredentials = async () => {
    localStorage.setItem('khata_supabase_url', supabaseUrl.trim());
    localStorage.setItem('khata_supabase_key', supabaseKey.trim());
    await onRefreshData();
    setTestResult({ success: true, message: 'Settings saved! Attempting sync...' });
  };

  const handleClearCredentials = async () => {
    localStorage.removeItem('khata_supabase_url');
    localStorage.removeItem('khata_supabase_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    await onRefreshData();
    setTestResult({ success: false, message: 'Switched back to local storage.' });
  };

  const testSupabaseConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const client = getSupabase();
      if (!client) {
        throw new Error('Supabase URL or Key is missing / invalid.');
      }
      const { data, error } = await client.from('members').select('id').limit(1);
      if (error) {
        throw error;
      }
      setTestResult({
        success: true,
        message: 'Successfully connected to Supabase PostgreSQL database!',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Check URL/Key or table schema.'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto ledger-scroll">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Data & Storage Settings</h3>
            <p className="text-xs text-slate-400">Configure PostgreSQL cloud sync or export offline backups</p>
          </div>
        </div>

        {/* Current Mode Badge */}
        <div
          className={`p-3 rounded-xl border mb-4 flex items-center space-x-3 ${
            isCloud
              ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
          }`}
        >
          {isCloud ? (
            <Cloud className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <HardDrive className="w-5 h-5 text-amber-400 flex-shrink-0" />
          )}
          <div className="text-xs">
            <span className="font-bold">
              {isCloud ? 'Connected to Supabase PostgreSQL' : 'Local Storage Fallback Active'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isCloud
                ? 'All your Khata transactions and members are synchronized in realtime with Supabase.'
                : 'Using browser localStorage. Enter your Supabase credentials below to sync with PostgreSQL.'}
            </p>
          </div>
        </div>

        {/* Supabase Connection Setup */}
        <div className="space-y-3 mb-5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              Supabase PostgreSQL Config
            </span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              Get free DB <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {testResult && (
            <div
              className={`p-2 rounded-lg text-[11px] border ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-600/50 text-rose-300'
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleSaveCredentials}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
            <button
              onClick={testSupabaseConnection}
              disabled={isTesting}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {(supabaseUrl || supabaseKey) && (
              <button
                onClick={handleClearCredentials}
                title="Disconnect & clear"
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-xs transition"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            Tip: Run <code className="text-slate-300 font-mono">supabase_schema.sql</code> in your Supabase SQL editor to create the required tables.
          </div>
        </div>

        {/* Backup & Export Options */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-bold text-slate-300 block">
            One-Tap Backup & Export
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onExportCSV();
                onClose();
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-2 transition"
            >
              <FileSpreadsheetIcon className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                onExportJSON();
                onClose();
              }}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-2 transition"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Database Management & Demo Reset */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Reset to initial sample demo data? Any unsaved local edits will be replaced.')) {
                onResetDemoData();
                onClose();
              }
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => {
              if (confirm('WARNING: Are you sure you want to clear ALL members and transactions?')) {
                onClearAllData();
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function FileSpreadsheetIcon(props) {
  return <FileText {...props} />;
}
