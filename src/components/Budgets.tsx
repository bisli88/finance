import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { usePrivacy } from "../App";
import * as LucideIcons from "lucide-react";
import { 
  Plus, 
  Calendar, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  PieChart,
  Edit2,
  Trash2,
  X,
  Check,
  Tag
} from "lucide-react";

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || Tag;
  return <IconComponent size={size} className={className} />;
}

export function Budgets() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const budgets = useQuery(api.budgets.list, { month: selectedMonth });
  const categories = useQuery(api.categories.list);
  const createBudget = useMutation(api.budgets.create);
  const updateBudgetAmount = useMutation(api.budgets.updateAmount);
  const removeBudget = useMutation(api.budgets.remove);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBudget({
        categoryId: formData.categoryId as any,
        amount: formData.amount,
        month: selectedMonth,
      });
      setFormData({ categoryId: "", amount: 0 });
      setShowForm(false);
      toast.success("התקציב נוצר בהצלחה");
    } catch (error) {
      toast.error("יצירת התקציב נכשלה");
    }
  };

  const handleUpdate = async (id: any) => {
    try {
      await updateBudgetAmount({ id, amount: editAmount });
      setEditingId(null);
      toast.success("התקציב עודכן בהצלחה");
    } catch (error) {
      toast.error("עדכון התקציב נכשל");
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תקציב זה?")) return;
    try {
      await removeBudget({ id });
      toast.success("התקציב נמחק בהצלחה");
    } catch (error) {
      toast.error("מחיקת התקציב נכשלה");
    }
  };

  if (budgets === undefined || categories === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  const expenseCategories = categories.filter(cat => cat.type === "expense");
  const availableCategories = expenseCategories.filter(cat => 
    !budgets.some(budget => budget.categoryId === cat._id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-auto pr-9 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-bold text-sm"
            />
          </div>
        </div>
        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto bg-black text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm"
          >
            <Plus size={18} />
            צור תקציב
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl">
              <Target className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold">הגדרת תקציב חדש</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">קטגוריה</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {availableCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">סכום יעד</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₪</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-black text-white px-6 py-3 rounded-2xl hover:bg-slate-800 transition-all font-bold"
              >
                שמור תקציב
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          const isOverBudget = budget.spent > budget.amount;
          const remaining = Math.max(0, budget.amount - budget.spent);
          const isEditing = editingId === budget._id;
          
          return (
            <div key={budget._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6 duration-300"
                    style={{ backgroundColor: `${budget.category?.color}15`, color: budget.category?.color }}
                  >
                    <DynamicIcon name={budget.category?.icon || "PieChart"} size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight truncate">{budget.category?.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">תקציב חודשי</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={() => {
                      setEditingId(budget._id);
                      setEditAmount(budget.amount);
                    }}
                    className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(budget._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {isEditing ? (
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 border border-slate-100">
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₪</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(budget._id)}
                        className="flex-1 bg-black text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> שמור
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <X size={14} /> בטל
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-baseline">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">נוצל</p>
                        <p className={`text-xl font-black blur-amount ${isOverBudget ? 'text-red-600' : 'text-slate-900'}`}>
                          ₪{budget.spent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-left space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">מתוך</p>
                        <p className="text-xl font-black text-slate-400 blur-amount">
                          ₪{budget.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className={isOverBudget ? "text-red-600" : "text-slate-500"}>
                          {percentage.toFixed(0)}% הושלם
                        </span>
                        <span className={`blur-amount ${isOverBudget ? "text-red-600" : "text-slate-500"}`}>
                          ₪{remaining.toLocaleString()} נותר
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            isOverBudget ? "bg-red-500" : percentage > 90 ? "bg-amber-500" : "bg-black"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-500 font-bold mb-1">אין תקציבים לחודש זה</p>
          <p className="text-slate-400 text-sm mb-6">הגדר תקציבים לקטגוריות כדי לשלוט בהוצאות שלך</p>
          {availableCategories.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-black text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-bold text-sm"
            >
              הגדר את התקציב הראשון
            </button>
          )}
        </div>
      )}
    </div>
  );
}
