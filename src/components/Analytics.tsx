import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Target,
  ArrowRightLeft,
  PieChart,
  List,
  Receipt,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

function DynamicIcon({
  name,
  size = 18,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

// ── SVG Donut Pie Chart ──────────────────────────────────────────────────────
function PieChartSVG({
  data,
}: {
  data: { name: string; amount: number; percent: number; color: string }[];
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;
  const innerR = 54;

  let cumAngle = -Math.PI / 2;
  const slices = data.map((item) => {
    const angle = (item.percent / 100) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;

    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const ix1 = cx + innerR * Math.cos(start);
    const iy1 = cy + innerR * Math.sin(start);
    const ix2 = cx + innerR * Math.cos(end);
    const iy2 = cy + innerR * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");

    return { ...item, d };
  });

  const totalIncome = data.reduce((s, d) => s + d.amount, 0);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      {slices.map((slice, i) => (
        <path key={i} d={slice.d} fill={slice.color} stroke="white" strokeWidth="2.5" />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#94a3b8" letterSpacing="1">
        סה״כ הכנסות
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">
        ₪{totalIncome.toLocaleString()}
      </text>
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  const stats = useQuery(api.transactions.getMonthlyStats, { month: selectedMonth });
  const categoryBreakdown = useQuery(api.transactions.getCategoryBreakdown, { month: selectedMonth });
  const incomeBreakdown = useQuery(api.transactions.getIncomeCategoryBreakdown, { month: selectedMonth });
  const budgets = useQuery(api.budgets.list, { month: selectedMonth });

  const changeMonth = (delta: number) => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() + delta);
    setSelectedMonth(date.toISOString().substring(0, 7));
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    return date.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  };

  // Expenses — already filtered server-side by excludeFromAnalytics
  const filteredExpenses = categoryBreakdown ?? [];

  // Income pie data — already filtered server-side by excludeFromAnalytics
  const incomePieData = useMemo(() => {
    if (!incomeBreakdown) return [];
    const total = incomeBreakdown.reduce((sum, item) => sum + item.amount, 0);
    if (total === 0) return [];

    const fallback = [
      "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
      "#06b6d4", "#ec4899", "#14b8a6", "#f97316",
    ];
    return incomeBreakdown.map((item, i) => ({
      name: item.category?.name || "ללא קטגוריה",
      amount: item.amount,
      percent: (item.amount / total) * 100,
      color: item.category?.color || fallback[i % fallback.length],
    }));
  }, [incomeBreakdown]);

  if (stats === undefined || categoryBreakdown === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black" />
      </div>
    );
  }

  const total = stats.income + stats.expenses;
  const incomePercent = total > 0 ? (stats.income / total) * 100 : 0;
  const expensePercent = total > 0 ? (stats.expenses / total) * 100 : 0;

  return (
    <div className="space-y-8 pb-12">

      {/* ── Month Selector ── */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-600">
          <ChevronRight size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-blue-600" />
          <span className="font-bold text-slate-900">{formatMonth(selectedMonth)}</span>
        </div>
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-600">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight size={20} /></div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">סה"כ הכנסות</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₪{stats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight size={20} /></div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">סה"כ הוצאות</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₪{stats.expenses.toLocaleString()}</p>
        </div>

        <div className={`p-6 rounded-[2rem] border shadow-sm space-y-4 ${stats.net >= 0 ? "bg-blue-50/30 border-blue-100" : "bg-amber-50/30 border-amber-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${stats.net >= 0 ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
              <BarChart3 size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">יתרה נטו</span>
          </div>
          <p className={`text-3xl font-black ${stats.net >= 0 ? "text-blue-700" : "text-amber-700"}`}>
            ₪{stats.net.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Income vs Expenses Bar ── */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            יחס הכנסות מול הוצאות
          </h3>
          {!total && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">אין נתונים לחודש זה</span>
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
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">הכנסות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">הוצאות</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expense Breakdown — full-width list ── */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <List size={18} className="text-rose-500" />
          פירוט הוצאות לפי קטגוריה
        </h3>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-400">אין נתוני הוצאות לחודש זה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((item, index) => {
              const budget = budgets?.find((b) => b.categoryId === item.category?._id);
              const hasBudget = !!budget;
              const remaining = budget ? budget.amount - item.amount : 0;
              const percent = hasBudget
                ? (item.amount / budget.amount) * 100
                : (item.amount / stats.expenses) * 100;
              const isOver = hasBudget && item.amount > budget.amount;

              return (
                <div key={index} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 p-2.5 rounded-xl"
                    style={{ backgroundColor: `${item.category?.color}18`, color: item.category?.color }}
                  >
                    <DynamicIcon name={item.category?.icon || "Tag"} size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {/* Name + transaction count badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {item.category?.name}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 flex-shrink-0">
                          <Receipt size={9} />
                          {item.transactionCount} עסקאות
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-black text-slate-900">
                          ₪{item.amount.toLocaleString()}
                        </span>
                        {hasBudget && (
                          <span className="block text-[10px] font-semibold text-slate-400">
                            מתוך ₪{budget.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          backgroundColor: isOver ? "#f43f5e" : item.category?.color || "#94a3b8",
                        }}
                      />
                    </div>

                    {/* Budget label */}
                    {hasBudget && (
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${isOver ? "text-rose-500" : "text-slate-400"}`}>
                        {isOver
                          ? `חריגה ב-₪${Math.abs(remaining).toLocaleString()}`
                          : `נותר: ₪${remaining.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Income Pie Chart — separate full-width row ── */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <PieChart size={18} className="text-emerald-500" />
          הכנסות לפי קטגוריה
        </h3>

        {incomePieData.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-400">אין נתוני הכנסות לחודש זה</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Donut */}
            <div className="flex-shrink-0">
              <PieChartSVG data={incomePieData} />
            </div>

            {/* Legend */}
            <div className="flex-1 w-full space-y-3">
              {incomePieData.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-semibold text-slate-700 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-900">₪{item.amount.toLocaleString()}</span>
                      <span className="text-sm font-black w-12 text-right" style={{ color: item.color }}>
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Financial Insights ── */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
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

          {filteredExpenses.length > 0 && (
            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl h-fit">
                <TrendingDown size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">הוצאה עיקרית</p>
                <p className="text-sm leading-relaxed">
                  הקטגוריה עליה הוצאת הכי הרבה היא{" "}
                  <span className="text-amber-400 font-bold">{filteredExpenses[0].category.name}</span>
                  , עם סכום של ₪{filteredExpenses[0].amount.toLocaleString()}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}