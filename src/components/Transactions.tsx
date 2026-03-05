import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { usePrivacy } from "../App";
import * as LucideIcons from "lucide-react";
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowRightLeft,
  RefreshCw, 
  Search, 
  Filter, 
  Calendar,
  Tag,
  FileText,
  ChevronRight,
  ChevronDown,
  X,
  Wallet,
  Repeat,
  Info,
  Edit2,
  Trash2
} from "lucide-react";

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

export function Transactions() {
  const transactions = useQuery(api.transactions.list, { limit: 100 });
  const accounts = useQuery(api.accounts.list);
  const categories = useQuery(api.categories.list);
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const removeTransaction = useMutation(api.transactions.remove);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountId: "",
    categoryId: "",
    title: "",
    amount: 0,
    type: "expense" as "income" | "expense" | "transfer",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    transferToAccountId: "",
    isRecurring: false,
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const resetForm = () => {
    setFormData({
      accountId: "",
      categoryId: "",
      title: "",
      amount: 0,
      type: "expense",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      transferToAccountId: "",
      isRecurring: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (transaction: any) => {
    setFormData({
      accountId: transaction.accountId,
      categoryId: transaction.categoryId || "",
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      notes: transaction.notes || "",
      transferToAccountId: transaction.transferToAccountId || "",
      isRecurring: transaction.isRecurring || false,
    });
    setEditingId(transaction._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תנועה זו? הפעולה תעדכן את היתרה ואת התקציב.")) return;
    try {
      await removeTransaction({ id });
      toast.success("התנועה נמחקה בהצלחה");
    } catch (error) {
      toast.error("מחיקת התנועה נכשלה");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        accountId: formData.accountId as any,
        categoryId: formData.categoryId ? (formData.categoryId as any) : undefined,
        title: formData.type === 'transfer' ? 'העברה' : formData.title,
        amount: formData.amount,
        type: formData.type,
        date: formData.date,
        notes: formData.type === 'transfer' ? undefined : (formData.notes || undefined),
        transferToAccountId: formData.transferToAccountId ? (formData.transferToAccountId as any) : undefined,
        isRecurring: formData.isRecurring,
      };

      if (editingId) {
        await updateTransaction({
          id: editingId as any,
          ...payload
        });
        toast.success("התנועה עודכנה בהצלחה");
      } else {
        await createTransaction(payload);
        toast.success("התנועה נוספה בהצלחה");
      }
      resetForm();
    } catch (error) {
      toast.error("הפעולה נכשלה");
    }
  };

  if (transactions === undefined || accounts === undefined || categories === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (t.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory = filterCategory === "all" || t.categoryId === filterCategory;
    const matchesAccount = filterAccount === "all" || t.accountId === filterAccount;
    
    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  const filteredCategoriesForForm = categories.filter(cat => {
    if (formData.type === "transfer") return false;
    return cat.type === formData.type;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto px-2">
        <button
          data-tour="add-transaction-btn"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full bg-black text-white px-6 py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 text-base font-black shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <Plus size={20} strokeWidth={3} />
          </div>
          הוסף תנועה חדשה
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="חפש תנועה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
              {[
                { id: "all", label: "הכל" },
                { id: "expense", label: "הוצאות" },
                { id: "income", label: "הכנסות" }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === type.id 
                      ? "bg-white text-black shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2.5 rounded-xl border transition-all ${
                showAdvancedFilters || filterCategory !== "all" || filterAccount !== "all"
                  ? "bg-black border-black text-white" 
                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
              }`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">לפי קטגוריה</label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-black outline-none appearance-none"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">לפי חשבון</label>
              <select 
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-black outline-none appearance-none"
              >
                <option value="all">כל החשבונות</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
            {(filterCategory !== "all" || filterAccount !== "all" || searchQuery !== "" || filterType !== "all") && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                  setFilterCategory("all");
                  setFilterAccount("all");
                }}
                className="sm:col-span-2 text-[10px] font-black text-red-500 hover:text-red-600 underline text-center pt-2"
              >
                נקה את כל המסננים
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div 
          data-tour="transaction-form"
          className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-12 animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto w-full mb-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -z-10 opacity-50"></div>
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-black rounded-2xl shadow-xl flex items-center justify-center rotate-3">
                <Plus size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingId ? "עריכת תנועה" : "תנועה חדשה"}
                </h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                  {editingId ? "עדכון פרטי הפעולה" : "תיעוד פעולה כספית"}
                </p>
              </div>
            </div>
            <button 
              onClick={resetForm}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-black hover:rotate-90 duration-300"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">סוג התנועה</label>
              <div className="flex p-1.5 bg-slate-100 rounded-[1.25rem] w-full">
                {[
                  { id: "expense", label: "הוצאה", color: "text-red-600", bg: "bg-white shadow-sm" },
                  { id: "income", label: "הכנסה", color: "text-green-600", bg: "bg-white shadow-sm" },
                  { id: "transfer", label: "העברה", color: "text-blue-600", bg: "bg-white shadow-sm" }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.id as any, categoryId: "" })}
                    className={`flex-1 py-3.5 px-4 rounded-[0.9rem] text-sm font-black transition-all duration-300 ${
                      formData.type === type.id 
                        ? `${type.bg} ${type.color}` 
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 text-center border border-slate-100 group focus-within:border-black/10 transition-all">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">כמה כסף?</label>
              <div className="relative inline-flex items-center">
                <span className="text-4xl font-black text-slate-300 mr-2 group-focus-within:text-black transition-colors">₪</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent border-none outline-none font-black text-6xl text-slate-900 w-48 text-center placeholder:text-slate-200"
                  placeholder="0.00"
                  autoFocus
                  required
                />
              </div>
            </div>

            {formData.type !== 'transfer' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">כותרת התנועה</label>
                <div className="relative group">
                  <Info size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" />
                  <input
                    type="text"
                    placeholder="למשל: קניות בסופר, משכורת מרץ..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full pr-12 pl-6 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    required={formData.type !== 'transfer'}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {formData.type !== "transfer" ? (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">קטגוריה</label>
                  <div className="relative">
                    <Tag size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full pr-12 pl-10 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer text-slate-900"
                    >
                      <option value="">בחר קטגוריה</option>
                      {filteredCategoriesForForm.map((category) => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">חשבון יעד</label>
                  <div className="relative">
                    <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select
                      value={formData.transferToAccountId}
                      onChange={(e) => setFormData({ ...formData, transferToAccountId: e.target.value })}
                      className="w-full pr-12 pl-10 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer text-slate-900"
                      required
                    >
                      <option value="">בחר חשבון יעד</option>
                      {accounts.filter(acc => acc._id !== formData.accountId).map((account) => (
                        <option key={account._id} value={account._id}>{account.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">חשבון מקור</label>
                <div className="relative">
                  <Wallet size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full pr-12 pl-10 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer text-slate-900"
                    required
                  >
                    <option value="">בחר חשבון</option>
                    {accounts.map((account) => (
                      <option key={account._id} value={account._id}>{account.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">מתי זה קרה?</label>
              <div className="relative group">
                <Calendar size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black transition-colors" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pr-12 pl-6 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-bold text-slate-900 cursor-pointer"
                  required
                />
              </div>
            </div>

            {formData.type !== 'transfer' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">הערות נוספות</label>
                <div className="relative group">
                  <FileText size={18} className="absolute right-5 top-5 text-slate-300 group-focus-within:text-black transition-colors" />
                  <textarea
                    placeholder="כתוב כאן משהו שיעזור לך לזכור..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full pr-12 pl-6 py-4 bg-white border-2 border-slate-100 focus:border-black rounded-2xl outline-none transition-all font-medium text-sm text-slate-900 resize-none h-24"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all ${formData.isRecurring ? 'bg-black text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                  <Repeat size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">תשלום קבוע</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">חזור על פעולה זו בכל חודש</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${formData.isRecurring ? 'bg-black' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isRecurring ? 'right-7' : 'right-1'}`}></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                className="flex-[2] bg-black text-white px-8 py-5 rounded-[1.25rem] hover:bg-slate-800 transition-all font-black text-xl shadow-xl hover:shadow-2xl active:scale-[0.98] tracking-tight"
              >
                {editingId ? "עדכן תנועה" : "שמור תנועה"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-8 py-5 bg-slate-100 text-slate-400 rounded-[1.25rem] hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">לא נמצאו תנועות</h3>
            <p className="text-slate-400 font-medium">נסה לשנות את מסנני החיפוש שלך</p>
          </div>
        ) : (
          Object.entries(
            filteredTransactions.reduce((groups: any, transaction) => {
              const date = transaction.date;
              if (!groups[date]) groups[date] = [];
              groups[date].push(transaction);
              return groups;
            }, {})
          )
          .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
          .map(([date, dateTransactions]: [string, any]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px bg-slate-100 flex-1"></div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                  {new Date(date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h4>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dateTransactions.map((transaction: any) => (
                  <div 
                    key={transaction._id} 
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-blue-100 transition-all group relative"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ 
                          backgroundColor: transaction.category?.color ? `${transaction.category.color}15` : '#f1f5f9',
                          color: transaction.category?.color || '#64748b'
                        }}
                      >
                        {transaction.category?.icon ? <DynamicIcon name={transaction.category.icon} size={20} /> : <ArrowRightLeft size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{transaction.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          {transaction.account?.name}
                          {transaction.category && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-medium lowercase tracking-normal">{transaction.category.name}</span>
                            </>
                          )}
                          {transaction.isRecurring && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-indigo-500">קבוע</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className={`font-black text-sm blur-amount ${transaction.type === 'income' ? 'text-emerald-600' : transaction.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                          ₪{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter text-left">
                          {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(transaction); }}
                          className="p-1.5 text-slate-300 hover:text-black hover:bg-slate-50 rounded-lg transition-all"
                          title="ערוך"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(transaction._id); }}
                          className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="מחק"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
