import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Target,
  ArrowRightLeft
} from "lucide-react";
import * as LucideIcons from "lucide-react";

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

export function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const stats = useQuery(api.transactions.getMonthlyStats, { month: selectedMonth });
  const categoryBreakdown = useQuery(api.transactions.getCategoryBreakdown, { month: selectedMonth });
  const budgets = useQuery(api.budgets.list, { month: selectedMonth });

  const changeMonth = (delta: number) => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() + delta);
    setSelectedMonth(date.toISOString().substring(0, 7));
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  };

  if (stats === undefined || categoryBreakdown === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  const total = stats.income + stats.expenses;
  const incomePercent = total > 0 ? (stats.income / total) * 100 : 0;
  const expensePercent = total > 0 ? (stats.expenses / total) * 100 : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button 
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-600"
        >
          <ChevronRight size={20} />
        </button>
        
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-blue-600" />
          <span className="font-bold text-slate-900">{formatMonth(selectedMonth)}</span>
        </div>

        <button 
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">סה"כ הכנסות</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₪{stats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">סה"כ הוצאות</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₪{stats.expenses.toLocaleString()}</p>
        </div>

        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-4 ${stats.net >= 0 ? 'bg-blue-50/30 border-blue-100' : 'bg-amber-50/30 border-amber-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${stats.net >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              <BarChart3 size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">יתרה נטו</span>
          </div>
          <p className={`text-3xl font-black ${stats.net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>₪{stats.net.toLocaleString()}</p>
        </div>
      </div>

      {/* Visual Comparison Bar */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            יחס הכנסות מול הוצאות
          </h3>
          {!total && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              אין נתונים לחודש זה
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="w-full h-12 bg-slate-100 rounded-2xl overflow-hidden flex p-1 gap-1">
            <div 
              className="h-full bg-emerald-500 rounded-xl transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-black text-white"
              style={{ width: `${incomePercent}%` }}
            >
              {incomePercent > 10 && `${incomePercent.toFixed(0)}%`}
            </div>
            <div 
              className="h-full bg-rose-500 rounded-xl transition-all duration-1000 ease-out flex items-center justify-center text-[10px] font-black text-white"
              style={{ width: `${expensePercent}%` }}
            >
              {expensePercent > 10 && `${expensePercent.toFixed(0)}%`}
            </div>
          </div>
          
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">הכנסות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">הוצאות</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <PieChart size={18} className="text-blue-600" />
            הוצאות לפי קטגוריה
          </h3>
          
          <div className="space-y-6">
            {categoryBreakdown.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">אין נתוני הוצאות לחודש זה</p>
              </div>
            ) : (
              categoryBreakdown.map((item, index) => {
                const budget = budgets?.find(b => b.categoryId === item.category?._id);
                const hasBudget = !!budget;
                const remaining = budget ? budget.amount - item.amount : 0;
                const percent = budget ? (item.amount / budget.amount) * 100 : (item.amount / stats.expenses) * 100;
                const isOver = budget && item.amount > budget.amount;

                return (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${item.category?.color}15`, color: item.category?.color }}
                        >
                          <DynamicIcon name={item.category?.icon || "Tag"} size={14} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">{item.category?.name}</span>
                          {hasBudget && (
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                              {isOver ? `חריגה ב-₪${Math.abs(remaining).toLocaleString()}` : `נותר: ₪${remaining.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-slate-900 block">₪{item.amount.toLocaleString()}</span>
                        {hasBudget && (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                            מתוך ₪{budget.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ 
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: isOver ? '#f43f5e' : (item.category?.color || '#000000')
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
           <h3 className="font-bold flex items-center gap-2 relative z-10">
            <Target size={18} className="text-blue-400" />
            תובנות פיננסיות
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl h-fit">
                <ArrowRightLeft size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">מצב הנטו</p>
                <p className="text-sm leading-relaxed">
                  {stats.net > 0 
                    ? `החודש הכנסת ₪${stats.net.toLocaleString()} יותר משהוצאת. עבודה טובה!` 
                    : stats.net < 0 
                    ? `החודש הוצאת ₪${Math.abs(stats.net).toLocaleString()} יותר ממה שהכנסת. כדאי לבדוק איפה אפשר לצמצם.`
                    : "החודש ההוצאות וההכנסות שלך מאוזנות לחלוטין."}
                </p>
              </div>
            </div>

            {categoryBreakdown.length > 0 && (
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl h-fit">
                  <TrendingDown size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">הוצאה עיקרית</p>
                  <p className="text-sm leading-relaxed">
                    הקטגוריה עליה הוצאת הכי הרבה היא <span className="text-amber-400 font-bold">{categoryBreakdown[0].category.name}</span>, עם סכום של ₪{categoryBreakdown[0].amount.toLocaleString()}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
