import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MemberCarousel } from './components/MemberCarousel';
import { LedgerDetail } from './components/LedgerDetail';
import { Keypad } from './components/Keypad';
import { AddMemberModal } from './components/AddMemberModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { khataService } from './services/storageService';
import { authService } from './services/authService';
import { 
  calculateMemberBalance, 
  calculateOverallSummary 
} from './utils/formatters';

export function App() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'GET' | 'GIVE'
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(authService.isUnlocked());

  // Modals
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load data from Supabase or LocalStorage
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedMembers, fetchedTxns] = await Promise.all([
        khataService.getMembers(),
        khataService.getTransactions(),
      ]);
      setMembers(fetchedMembers || []);
      setTransactions(fetchedTxns || []);

      // If no member is currently selected, select the first member
      setSelectedMemberId((prev) => {
        if (prev && fetchedMembers.some((m) => m.id === prev)) {
          return prev;
        }
        return fetchedMembers.length > 0 ? fetchedMembers[0].id : null;
      });
    } catch (err) {
      console.error('Error loading khata data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Overall summary metrics across all members
  const summary = useMemo(() => {
    return calculateOverallSummary(members, transactions);
  }, [members, transactions]);

  // Real-time filtered members based on search and status tabs
  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      // 1. Search Query Filter (name or phone)
      const matchesSearch =
        !query ||
        (member.name && member.name.toLowerCase().includes(query)) ||
        (member.phone && member.phone.replace(/[^0-9]/g, '').includes(query));

      if (!matchesSearch) return false;

      // 2. Status Filter Tab
      if (activeFilter === 'ALL') return true;

      const { netBalance } = calculateMemberBalance(member.id, transactions);
      if (activeFilter === 'GET') {
        return netBalance > 0;
      }
      if (activeFilter === 'GIVE') {
        return netBalance < 0;
      }

      return true;
    });
  }, [members, transactions, searchQuery, activeFilter]);

  // Auto-select first matching member if current selection is filtered out
  useEffect(() => {
    if (filteredMembers.length > 0) {
      const isCurrentInFiltered = filteredMembers.some((m) => m.id === selectedMemberId);
      if (!isCurrentInFiltered) {
        setSelectedMemberId(filteredMembers[0].id);
      }
    } else {
      setSelectedMemberId(null);
    }
  }, [filteredMembers, selectedMemberId]);

  // Find currently selected member object
  const activeMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Create new member handler
  const handleAddMember = async ({ name, phone, openingBalance, openingType }) => {
    const createdMember = await khataService.createMember({ name, phone });
    
    // If opening balance was specified, create opening transaction
    if (openingBalance && openingBalance > 0) {
      await khataService.createTransaction({
        member_id: createdMember.id,
        amount: openingBalance,
        type: openingType || 'GAVE',
        note: 'Opening Balance',
        timestamp: new Date().toISOString(),
      });
    }

    await loadData();
    setSelectedMemberId(createdMember.id);
  };

  // Delete member handler
  const handleDeleteMember = async (memberId) => {
    await khataService.deleteMember(memberId);
    await loadData();
  };

  // Add transaction handler from on-screen keypad
  const handleSubmitTransaction = async ({ member_id, amount, type, note, timestamp }) => {
    await khataService.createTransaction({
      member_id,
      amount,
      type,
      note,
      timestamp,
    });
    // Refresh transactions
    const updatedTxns = await khataService.getTransactions();
    setTransactions(updatedTxns || []);
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (txnId) => {
    await khataService.deleteTransaction(txnId);
    const updatedTxns = await khataService.getTransactions();
    setTransactions(updatedTxns || []);
  };

  // Export handlers
  const handleExportJSON = () => {
    khataService.exportToJSON(members, transactions);
  };

  const handleExportCSV = () => {
    khataService.exportToCSV(members, transactions);
  };

  const handleResetDemoData = async () => {
    await khataService.resetToDemoData();
    await loadData();
  };

  const handleClearAllData = async () => {
    await khataService.clearAllData();
    await loadData();
  };

  const isCloud = khataService.isCloudMode();

  const handleLock = () => {
    authService.lock();
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return <AuthScreen onUnlock={() => setIsUnlocked(true)} isCloud={isCloud} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. TOP BAR (Header, Search, Summary Banner, Filters) */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        summary={summary}
        filteredCount={filteredMembers.length}
        totalCount={members.length}
        isCloud={isCloud}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExport={handleExportCSV}
        onLock={handleLock}
      />

      {/* 2. MIDDLE SECTION (Member Cards Carousel / Grid) */}
      <MemberCarousel
        members={filteredMembers}
        transactions={transactions}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
      />

      {/* 3. DETAILED LEDGER HISTORY (Scrollable) */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Loading Khata records...
          </div>
        ) : (
          <LedgerDetail
            member={activeMember}
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteMember={handleDeleteMember}
          />
        )}
      </main>

      {/* 4. BOTTOM SECTION (Fixed On-Screen Virtual Numeric Keypad & Touch Actions) */}
      <Keypad
        activeMember={activeMember}
        onSubmitTransaction={handleSubmitTransaction}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
      />

      {/* Settings & Database Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isCloud={isCloud}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
        onRefreshData={loadData}
      />
    </div>
  );
}

export default App;
