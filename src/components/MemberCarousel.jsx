import React, { useRef } from 'react';
import { 
  UserPlus, 
  Phone, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2 
} from 'lucide-react';
import { 
  formatCurrency, 
  formatCardTimestamp, 
  calculateMemberBalance, 
  getAvatarMeta 
} from '../utils/formatters';

export const MemberCarousel = ({
  members,
  transactions,
  selectedMemberId,
  onSelectMember,
  onOpenAddMember,
}) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative py-3 border-b border-slate-800/80 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title with Navigation Helpers */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Members & Customers
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              ({members.length} total)
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="hidden md:flex p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="hidden md:flex p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAddMember}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New</span>
            </button>
          </div>
        </div>

        {/* Horizontal Swipeable Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-3 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory"
        >
          {/* Add New Member Quick Card */}
          <button
            onClick={onOpenAddMember}
            className="flex-shrink-0 w-36 sm:w-44 h-[124px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/40 hover:bg-emerald-950/20 p-3 flex flex-col items-center justify-center text-center transition group active:scale-95 snap-start"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-emerald-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center transition-colors mb-2 shadow-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-300">
              Add Member
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Unlimited entries
            </span>
          </button>

          {/* Member Cards */}
          {members.map((member) => {
            const isSelected = member.id === selectedMemberId;
            const { netBalance, lastTxnTimestamp } = calculateMemberBalance(member.id, transactions);
            const { initials, gradient } = getAvatarMeta(member.name);

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className={`flex-shrink-0 w-56 sm:w-64 h-[124px] rounded-2xl p-3 cursor-pointer transition-all duration-150 snap-start relative flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-slate-800/95 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Active Indicator Pin */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active</span>
                  </div>
                )}

                {/* Top Row: Avatar & Name */}
                <div className="flex items-start space-x-2.5 pr-14">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-md`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate leading-snug">
                      {member.name}
                    </h3>
                    <div className="flex items-center text-[11px] text-slate-400 mt-0.5 truncate">
                      {member.phone ? (
                        <>
                          <Phone className="w-2.5 h-2.5 mr-1 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{member.phone}</span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic">No phone added</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Balance & Last Activity */}
                <div className="pt-2 border-t border-slate-800/80 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-0.5">
                      {netBalance > 0 ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">You'll Get</span>
                        </>
                      ) : netBalance < 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 text-rose-400" />
                          <span className="text-rose-400">You'll Give</span>
                        </>
                      ) : (
                        <span className="text-slate-400">Settled</span>
                      )}
                    </div>
                    <div
                      className={`text-sm sm:text-base font-extrabold ${
                        netBalance > 0
                          ? 'text-emerald-400'
                          : netBalance < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatCurrency(Math.abs(netBalance))}
                    </div>
                  </div>

                  {/* Last Activity Timestamp */}
                  <div className="text-right text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatCardTimestamp(lastTxnTimestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
