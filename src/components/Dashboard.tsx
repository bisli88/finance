import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { usePrivacy } from "../App";
import * as LucideIcons from "lucide-react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  ChevronLeft,
  CreditCard,
  Landmark,
  Plus,
  Eye,
  EyeOff,
  Tag,
  Target
} from "lucide-react";

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

export function Dashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const totalBalance = useQuery(api.accounts.getTotalBalance);
  const accounts = useQuery(api.accounts.list);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyStats = useQuery(api.transactions.getMonthlyStats, { month: currentMonth });
  const transactions = useQuery(api.transactions.list, { limit: 5 });

  if (totalBalance === undefined || monthlyStats === undefined || accounts === undefined || transactions === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 1. Hero Balance Card */}
      <div className="bg-[#020617] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-slate-800 flex flex-col items-center justify-center text-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-blue-500/20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500/10 rounded-full blur-[100px] -ml-32 -mb-32 transition-all group-hover:bg-slate-500/20"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">מזומן זמין</span>
            <div className="h-1 w-12 bg-blue-500 rounded-full mt-2 opacity-50"></div>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl md:text-3xl font-light text-slate-500">₪</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white blur-amount">
              {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); togglePrivacy(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-slate-400 hover:text-white text-xs font-bold mt-4"
          >
            {isPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
            {isPrivate ? "בטל טשטוש" : "טשטש סכומים"}
          </button>
        </div>
      </div>

      {/* 1b. Remaining Budget Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
            <Target size={16} className="text-blue-600 flex-shrink-0" />
            תקציב שנותר החודש
          </h3>
          <button 
            onClick={() => onNavigate?.("budgets")}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[10px] md:text-xs font-bold text-slate-600 rounded-lg transition-all flex items-center gap-1 border border-slate-100 whitespace-nowrap flex-shrink-0"
          >
            לכל התקציבים
            <ChevronLeft size={12} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BudgetSummary month={currentMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4">
        {/* 2. Recent Transactions Summary */}
        <div className="lg:col-span-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
              <ArrowRightLeft size={16} className="text-blue-600 flex-shrink-0" />
              תנועות אחרונות
            </h3>
            <button 
              onClick={() => onNavigate?.("transactions")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[10px] md:text-xs font-bold text-slate-600 rounded-lg transition-all flex items-center gap-1 border border-slate-100 whitespace-nowrap flex-shrink-0"
            >
              לכל התנועות
              <ChevronLeft size={12} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transactions.length === 0 ? (
              <div className="col-span-full bg-slate-50/50 rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">אין עדיין תנועות במערכת</p>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-blue-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: t.category?.color ? `${t.category.color}15` : '#f1f5f9',
                        color: t.category?.color || '#64748b'
                      }}
                    >
                      {t.category?.icon ? <DynamicIcon name={t.category.icon} size={20} /> : <ArrowRightLeft size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.account?.name} • {new Date(t.date).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-sm blur-amount ${t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                      ₪{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{t.type === 'income' ? 'הכנסה' : 'הוצאה'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetSummary({ month }: { month: string }) {
  const budgets = useQuery(api.budgets.list, { month });
  
  if (budgets === undefined) {
    return Array(4).fill(0).map((_, i) => (
      <div key={i} className="bg-slate-50 rounded-2xl h-28 animate-pulse border border-slate-100"></div>
    ));
  }

  if (budgets.length === 0) {
    return (
      <div className="col-span-full bg-slate-50/50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">לא הוגדרו תקציבים לחודש זה</p>
      </div>
    );
  }

  return (
    <>
      {budgets.slice(0, 4).map((budget) => {
        const remaining = budget.amount - (budget.spent || 0);
        const percent = Math.min(100, Math.max(0, ((budget.spent || 0) / budget.amount) * 100));
        const isOver = (budget.spent || 0) > budget.amount;

        return (
          <div key={budget._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group hover:shadow-md hover:border-blue-100 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: `${budget.category?.color}15`, color: budget.category?.color }}
                >
                  {budget.category?.icon ? <DynamicIcon name={budget.category.icon} size={16} /> : <Tag size={16} />}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[80px]">{budget.category?.name}</p>
              </div>
              <div className="text-left">
                <p className={`text-sm font-black ${isOver ? 'text-rose-500' : 'text-slate-900'} blur-amount leading-none`}>
                  ₪{remaining.toLocaleString()}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">נותר</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                <span className={isOver ? "text-rose-500" : "text-slate-400"}>
                  {percent.toFixed(0)}% נוצל
                </span>
                <span className="text-slate-300">
                  ₪{budget.amount.toLocaleString()} סה"כ
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-[1px]">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out shadow-inner"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: isOver ? '#f43f5e' : percent > 85 ? '#f59e0b' : budget.category?.color || '#000000'
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

