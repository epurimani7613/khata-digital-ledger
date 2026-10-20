import { getSupabase, getSupabaseConfig } from './supabaseClient';

const LOCAL_STORAGE_MEMBERS_KEY = 'khata_members_v1';
const LOCAL_STORAGE_TXNS_KEY = 'khata_transactions_v1';

// Seed demo data for initial out-of-the-box delight
const INITIAL_DEMO_MEMBERS = [
  {
    id: 'demo-1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    name: 'Priya Patel',
    phone: '+91 98234 56789',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    name: 'Ramesh Kirana Store',
    phone: '+91 97123 45678',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    name: 'Amit Verma',
    phone: '+91 99887 76655',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-5',
    name: 'Sneha Kulkarni',
    phone: '+91 91234 56780',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const INITIAL_DEMO_TRANSACTIONS = [
  {
    id: 'txn-1',
    member_id: 'demo-1',
    amount: 2500,
    type: 'GAVE', // User gave goods/money on credit -> User will get 2500
    note: 'Wholesale grains & dairy',
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'txn-2',
    member_id: 'demo-1',
    amount: 1000,
    type: 'GOT', // Rahul paid 1000 -> User will get 1500
    note: 'UPI partial payment',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'txn-3',
    member_id: 'demo-2',
    amount: 850,
    type: 'GAVE',
    note: 'Cosmetics & essentials',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'txn-4',
    member_id: 'demo-3',
    amount: 4200,
    type: 'GOT', // Received advance from Ramesh -> User will give goods or owes
    note: 'Advance for next shipment',
    timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'txn-5',
    member_id: 'demo-3',
    amount: 1200,
    type: 'GAVE',
    note: 'Snacks and oils',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'txn-6',
    member_id: 'demo-4',
    amount: 3100,
    type: 'GAVE',
    note: 'Hardware tools',
    timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
];

// Initialize localStorage with demo data if empty
export const initializeLocalStorage = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(INITIAL_DEMO_MEMBERS));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_TXNS_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(INITIAL_DEMO_TRANSACTIONS));
  }
};

export const khataService = {
  isCloudMode() {
    return getSupabaseConfig().isConfigured && getSupabase() !== null;
  },

  async getMembers() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          // Cache in local storage for offline fallback
          localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch members failed, falling back to localStorage:', err.message);
      }
    }

    // Fallback: LocalStorage
    initializeLocalStorage();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return INITIAL_DEMO_MEMBERS;
    }
  },

  async createMember({ name, phone }) {
    const newMember = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}`,
      name: name.trim(),
      phone: (phone || '').trim(),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([
            {
              id: newMember.id,
              name: newMember.name,
              phone: newMember.phone,
              created_at: newMember.created_at,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Also sync to local cache
          const members = await this.getLocalMembers();
          localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify([data, ...members]));
          return data;
        }
      } catch (err) {
        console.warn('Supabase insert member failed, saving to localStorage:', err.message);
      }
    }

    // Save to local storage
    const members = await this.getLocalMembers();
    const updated = [newMember, ...members];
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updated));
    return newMember;
  },

  async deleteMember(memberId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Due to cascade in Postgres, transactions are removed
        await supabase.from('transactions').delete().eq('member_id', memberId);
        const { error } = await supabase.from('members').delete().eq('id', memberId);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete member failed:', err.message);
      }
    }

    // Local storage clean
    const members = await this.getLocalMembers();
    const updatedMembers = members.filter((m) => m.id !== memberId);
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updatedMembers));

    const txns = await this.getLocalTransactions();
    const updatedTxns = txns.filter((t) => t.member_id !== memberId);
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(updatedTxns));

    return true;
  },

  async getTransactions(memberId = null) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('transactions')
          .select('*')
          .order('timestamp', { ascending: false });

        if (memberId) {
          query = query.eq('member_id', memberId);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetch transactions failed, using localStorage:', err.message);
      }
    }

    // LocalStorage fallback
    initializeLocalStorage();
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TXNS_KEY);
      const allTxns = stored ? JSON.parse(stored) : [];
      if (memberId) {
        return allTxns
          .filter((t) => t.member_id === memberId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return allTxns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch {
      return INITIAL_DEMO_TRANSACTIONS;
    }
  },

  async createTransaction({ member_id, amount, type, note = '', timestamp = null }) {
    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Please enter a valid amount greater than 0');
    }

    const newTxn = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `txn_${Date.now()}`,
      member_id,
      amount: parsedAmount,
      type: type === 'GOT' ? 'GOT' : 'GAVE',
      note: (note || '').trim(),
      timestamp: timestamp || new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([newTxn])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Sync local storage
          const txns = await this.getLocalTransactions();
          localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify([data, ...txns]));
          return data;
        }
      } catch (err) {
        console.warn('Supabase insert transaction failed, writing to localStorage:', err.message);
      }
    }

    // LocalStorage fallback
    const txns = await this.getLocalTransactions();
    const updated = [newTxn, ...txns];
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(updated));
    return newTxn;
  },

  async deleteTransaction(txnId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', txnId);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete transaction failed:', err.message);
      }
    }

    const txns = await this.getLocalTransactions();
    const updated = txns.filter((t) => t.id !== txnId);
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(updated));
    return true;
  },

  async getLocalMembers() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async getLocalTransactions() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TXNS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async resetToDemoData() {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(INITIAL_DEMO_MEMBERS));
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify(INITIAL_DEMO_TRANSACTIONS));
    return true;
  },

  async clearAllData() {
    localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_TXNS_KEY, JSON.stringify([]));
    return true;
  },

  exportToJSON(members, transactions) {
    const exportObject = {
      appName: 'KhataBook Digital Ledger',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      totalMembers: members.length,
      totalTransactions: transactions.length,
      members,
      transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `khata_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportToCSV(members, transactions) {
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const headers = ['Transaction ID', 'Member Name', 'Member Phone', 'Type', 'Amount (INR)', 'Note', 'Date & Time'];
    const rows = transactions.map((t) => {
      const member = memberMap.get(t.member_id) || { name: 'Unknown', phone: '' };
      return [
        `"${t.id}"`,
        `"${(member.name || '').replace(/"/g, '""')}"`,
        `"${member.phone || ''}"`,
        `"${t.type}"`,
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        `"${new Date(t.timestamp).toLocaleString()}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `khata_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
