// Format currency with Indian Rupee symbol and commas
export const formatCurrency = (amount) => {
  const num = Math.abs(Number(amount) || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};

// Exact date down to minute
export const formatExactDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Relative/friendly card timestamp
export const formatCardTimestamp = (dateString) => {
  if (!dateString) return 'No transactions';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Compute individual member balances
// When user GAVE goods/cash -> Customer owes user (+ positive = "You'll Get")
// When user GOT cash -> Customer paid user (- reduces balance)
export const calculateMemberBalance = (memberId, transactions = []) => {
  const memberTxns = transactions.filter((t) => t.member_id === memberId);
  
  let netBalance = 0;
  let lastTxnTimestamp = null;

  for (const txn of memberTxns) {
    const amount = Number(txn.amount) || 0;
    if (txn.type === 'GAVE') {
      netBalance += amount;
    } else if (txn.type === 'GOT') {
      netBalance -= amount;
    }

    if (!lastTxnTimestamp || new Date(txn.timestamp) > new Date(lastTxnTimestamp)) {
      lastTxnTimestamp = txn.timestamp;
    }
  }

  return {
    netBalance,
    lastTxnTimestamp,
    txnCount: memberTxns.length,
    status: netBalance > 0 ? 'GET' : netBalance < 0 ? 'GIVE' : 'SETTLED',
  };
};

// Compute overall summary across all members
export const calculateOverallSummary = (members = [], transactions = []) => {
  let totalYouWillGet = 0;
  let totalYouWillGive = 0;

  members.forEach((member) => {
    const { netBalance } = calculateMemberBalance(member.id, transactions);
    if (netBalance > 0) {
      totalYouWillGet += netBalance;
    } else if (netBalance < 0) {
      totalYouWillGive += Math.abs(netBalance);
    }
  });

  const netTotal = totalYouWillGet - totalYouWillGive;

  return {
    totalYouWillGet,
    totalYouWillGive,
    netTotal,
    status: netTotal > 0 ? 'GET' : netTotal < 0 ? 'GIVE' : 'SETTLED',
  };
};

// Generate avatar initials and gradient
const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-700',
  'from-blue-500 to-indigo-700',
  'from-purple-500 to-violet-700',
  'from-amber-500 to-orange-700',
  'from-rose-500 to-pink-700',
  'from-cyan-500 to-blue-700',
];

export const getAvatarMeta = (name = '') => {
  const cleanName = (name || '').trim();
  if (!cleanName) return { initials: '?', gradient: AVATAR_GRADIENTS[0] };

  const parts = cleanName.split(/\s+/);
  const initials = parts.length > 1 
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : cleanName.slice(0, 2).toUpperCase();

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;

  return {
    initials,
    gradient: AVATAR_GRADIENTS[index],
  };
};
