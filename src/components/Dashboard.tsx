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
  EyeOff
} from "lucide-react";

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

export function Dashboard() {
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
    <div className="space-y-10">
      {/* 1. Hero Balance Card */}
      <div className="bg-[#0f172a] rounded-2xl p-4 md:p-6 text-white shadow-xl relative overflow-hidden group border border-slate-800 min-h-[80px] md:min-h-[100px] flex flex-col justify-center">
        {/* Right side label */}
        <div className="absolute top-3 right-4 z-10">
          <span className="text-[10px] md:text-xs font-normal text-slate-400 uppercase tracking-wider">מזומן זמין</span>
        </div>

        {/* Left side privacy toggle */}
        <div className="absolute top-3 left-4 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); togglePrivacy(); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white flex items-center justify-center"
            title={isPrivate ? "בטל טשטוש" : "טשטש סכומים"}
          >
            {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <div className="relative z-10 flex items-center justify-center w-full mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg md:text-xl font-medium text-slate-500">₪</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white blur-amount">
              {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
        
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 2. Recent Transactions Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft size={20} />
              תנועות אחרונות
            </h3>
            <button className="text-xs font-bold text-slate-400 hover:text-black transition-colors flex items-center gap-1">
              לכל התנועות
              <ChevronLeft size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-slate-50 rounded-3xl p-10 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">אין עדיין תנועות במערכת</p>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600' : t.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {t.category?.icon ? <DynamicIcon name={t.category.icon} size={18} /> : <ArrowRightLeft size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t.account?.name} • {new Date(t.date).toLocaleDateString('he-IL')}</p>
                    </div>
                  </div>
                  <p className={`font-black text-sm blur-amount ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                    ₪{t.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Accounts Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Landmark size={20} />
              החשבונות שלי
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {accounts.slice(0, 3).map((acc) => (
              <div key={acc._id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{acc.name}</p>
                    <p className="text-2xl font-black text-slate-900 blur-amount">₪{acc.balance.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                    <CreditCard size={20} className="text-slate-400" />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl opacity-50 -z-0"></div>
              </div>
            ))}
            {accounts.length > 3 && (
              <button className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-100 text-slate-400 font-bold text-xs hover:bg-slate-50 transition-all">
                ועוד {accounts.length - 3} חשבונות נוספים
              </button>
            )}
            {accounts.length === 0 && (
              <button className="w-full py-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-all">
                <Plus size={20} />
                <span className="font-bold text-xs">הוסף חשבון ראשון</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
