import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  X,
  Wallet,
  Info,
  Edit2,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  CheckCircle2,
  MoreVertical,
  Banknote
} from "lucide-react";

export function Debts() {
  const debts = useQuery(api.debts.list);
  const stats = useQuery(api.debts.getStats);
  const accounts = useQuery(api.accounts.list);
  const categories = useQuery(api.categories.list);
  
  const createDebt = useMutation(api.debts.create);
  const updateDebt = useMutation(api.debts.update);
  const removeDebt = useMutation(api.debts.remove);
  const recordPayment = useMutation(api.debts.recordPayment);
  const markAsPaid = useMutation(api.debts.markAsPaid);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showForm || showPaymentForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm, showPaymentForm]);
  
  const [formData, setFormData] = useState({
    personName: "",
    totalAmount: 0,
    type: "they_owe_me" as "they_owe_me" | "i_owe",
    note: "",
    createdDate: new Date().toISOString().split('T')[0],
    accountId: "",
    deductFromAccount: false,
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    createTransaction: false,
    accountId: "",
    categoryId: "",
  });

  const resetForm = () => {
    setFormData({
      personName: "",
      totalAmount: 0,
      type: "they_owe_me",
      note: "",
      createdDate: new Date().toISOString().split('T')[0],
      accountId: "",
      deductFromAccount: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      createTransaction: false,
      accountId: "",
      categoryId: "",
    });
    setShowPaymentForm(null);
  };

  const handleEdit = (debt: any) => {
    setFormData({
      personName: debt.personName,
      totalAmount: debt.totalAmount,
      type: debt.type,
      note: debt.note || "",
      createdDate: debt.createdDate,
    });
    setEditingId(debt._id);
    setShowForm(true);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק חוב זה?")) return;
    try {
      await removeDebt({ id });
      toast.success("החוב נמחק בהצלחה");
    } catch (error) {
      toast.error("מחיקת החוב נכשלה");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDebt({
          id: editingId as any,
          personName: formData.personName,
          totalAmount: formData.totalAmount,
          type: formData.type,
          note: formData.note,
          status: "pending"
        });
        toast.success("החוב עודכן בהצלחה");
      } else {
        await createDebt({
          personName: formData.personName,
          totalAmount: formData.totalAmount,
          type: formData.type,
          note: formData.note,
          createdDate: formData.createdDate,
          accountId: formData.deductFromAccount ? (formData.accountId as any) : undefined,
        });
        toast.success("החוב נוסף בהצלחה");
      }
      resetForm();
    } catch (error) {
      toast.error("הפעולה נכשלה");
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentForm) return;
    
    try {
      await recordPayment({
        debtId: showPaymentForm as any,
        amount: paymentData.amount,
        date: paymentData.date,
        createTransaction: paymentData.createTransaction,
        accountId: paymentData.accountId ? (paymentData.accountId as any) : undefined,
        categoryId: paymentData.categoryId ? (paymentData.categoryId as any) : undefined,
      });
      toast.success("התשלום נרשם בהצלחה");
      resetPaymentForm();
    } catch (error) {
      toast.error("רישום התשלום נכשל");
    }
  };

  if (debts === undefined || stats === undefined || accounts === undefined || categories === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-2">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">חייבים לי</span>
          </div>
          <p className="text-2xl font-black text-slate-900">₪{stats.theyOweMe.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">אני חייב</span>
          </div>
          <p className="text-2xl font-black text-slate-900">₪{stats.iOwe.toLocaleString()}</p>
        </div>
        <div className="bg-black p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 text-white rounded-xl">
              <Wallet size={20} />
            </div>
            <span className="text-sm font-bold text-slate-300">מאזן נטו</span>
          </div>
          <p className="text-2xl font-black text-white">₪{stats.net.toLocaleString()}</p>
        </div>
      </div>

      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="w-full bg-black text-white px-6 py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 text-base font-black shadow-lg"
      >
        <Plus size={20} strokeWidth={3} />
        הוסף חוב חדש
      </button>

      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={resetForm} />
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-10 animate-in zoom-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-2xl shadow-xl flex items-center justify-center rotate-3">
                  <Banknote size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {editingId ? "עריכת חוב" : "חוב חדש"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {editingId ? "עדכון פרטי החוב" : "תיעוד חוב חדש במערכת"}
                  </p>
                </div>
              </div>
              <button onClick={resetForm} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-black">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">סוג החוב</label>
                <div className="flex p-1 bg-slate-100 rounded-[1rem] w-full">
                  {[
                    { id: "they_owe_me", label: "חייבים לי", color: "text-green-600" },
                    { id: "i_owe", label: "אני חייב", color: "text-red-600" }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id as any })}
                      className={`flex-1 py-3 px-4 rounded-[0.75rem] text-xs font-black transition-all ${
                        formData.type === type.id 
                          ? `bg-white shadow-sm ${type.color}` 
                          : "text-slate-400"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">שם האדם</label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black transition-all font-bold text-sm"
                    placeholder="למשל: ישראל ישראלי"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">סכום כולל</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₪</span>
                    <input
                      type="number"
                      value={formData.totalAmount || ""}
                      onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full pr-10 pl-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black transition-all font-black text-base"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">תאריך יצירה</label>
                <input
                  type="date"
                  value={formData.createdDate}
                  onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black transition-all font-bold text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-1">הערה (אופציונלי)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black transition-all font-medium h-24 resize-none text-sm"
                  placeholder="למה החוב הזה קיים?"
                />
              </div>

              {formData.type === "they_owe_me" && !editingId && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setFormData({...formData, deductFromAccount: !formData.deductFromAccount})}>
                    <input
                      type="checkbox"
                      checked={formData.deductFromAccount}
                      onChange={(e) => setFormData({ ...formData, deductFromAccount: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                    />
                    <label className="text-xs font-bold text-slate-700 cursor-pointer">
                      הורד סכום זה מחשבון קיים (לא ישפיע על התקציב)
                    </label>
                  </div>

                  {formData.deductFromAccount && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">בחר חשבון</label>
                      <select
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-black font-bold text-xs"
                        required={formData.deductFromAccount}
                      >
                        <option value="">בחר חשבון</option>
                        {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl font-black text-base shadow-lg hover:bg-slate-800 transition-all">
                  {editingId ? "עדכן חוב" : "שמור חוב"}
                </button>
                <button type="button" onClick={resetForm} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Debt List */}
      <div className="grid grid-cols-1 gap-6">
        {debts.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center">
            <Banknote className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900">אין חובות פעילים</h3>
            <p className="text-slate-400">כל החובות שלך יופיעו כאן</p>
          </div>
        ) : (
          debts.map((debt) => {
            const remaining = debt.totalAmount - debt.amountPaid;
            const progress = (debt.amountPaid / debt.totalAmount) * 100;
            const isOwedToMe = debt.type === "they_owe_me";
            
            return (
              <div key={debt._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${isOwedToMe ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isOwedToMe ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{debt.personName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            debt.status === 'paid' ? 'bg-slate-100 text-slate-500' : 
                            isOwedToMe ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {debt.status === 'paid' ? 'שולם' : isOwedToMe ? 'חייבים לי' : 'אני חייב'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{debt.createdDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(debt)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(debt._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">נותר לתשלום</p>
                        <p className="text-2xl font-black text-slate-900">₪{remaining.toLocaleString()}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">מתוך</p>
                        <p className="text-sm font-bold text-slate-500">₪{debt.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`h-full transition-all duration-1000 ${isOwedToMe ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      ></div>
                    </div>
                    {debt.amountPaid > 0 && (
                      <p className="text-[10px] font-bold text-slate-400 mt-2">
                        שולמו ₪{debt.amountPaid.toLocaleString()} ({Math.round(progress)}%)
                      </p>
                    )}
                  </div>

                  {debt.note && (
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                      <p className="text-sm text-slate-600 font-medium">{debt.note}</p>
                    </div>
                  )}

                  {debt.status !== 'paid' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button 
                        onClick={() => {
                          setPaymentData({ ...paymentData, amount: remaining });
                          setShowPaymentForm(debt._id);
                        }}
                        className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-black transition-all"
                      >
                        <CreditCard size={16} />
                        רישום תשלום
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("לסמן כחוב שנסגר במלואו?")) markAsPaid({ id: debt._id });
                        }}
                        className="px-4 py-3 bg-white border-2 border-slate-100 text-slate-900 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:border-black transition-all"
                      >
                        <CheckCircle2 size={16} className="text-green-500" />
                        סגור חוב
                      </button>
                    </div>
                  )}
                </div>

                {showPaymentForm === debt._id && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={resetPaymentForm} />
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-6 md:p-10 animate-in zoom-in slide-in-from-bottom-4 duration-500 max-w-xl w-full relative">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h5 className="text-xl font-black text-slate-900 tracking-tight">רישום תשלום</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">עבור {debt.personName}</p>
                        </div>
                        <button onClick={resetPaymentForm} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-black">
                          <X size={24} />
                        </button>
                      </div>
                      
                      <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סכום התשלום</label>
                            <input
                              type="number"
                              max={remaining}
                              value={paymentData.amount || ""}
                              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black font-black text-base"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך</label>
                            <input
                              type="date"
                              value={paymentData.date}
                              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-black font-bold text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <input
                            type="checkbox"
                            id="createTransaction"
                            checked={paymentData.createTransaction}
                            onChange={(e) => setPaymentData({ ...paymentData, createTransaction: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black"
                          />
                          <label htmlFor="createTransaction" className="text-xs font-bold text-slate-700 cursor-pointer">
                            צור תנועה בחשבון הבנק (מעדכן יתרה)
                          </label>
                        </div>

                        {paymentData.createTransaction && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חשבון</label>
                              <select
                                value={paymentData.accountId}
                                onChange={(e) => setPaymentData({ ...paymentData, accountId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-black font-bold text-xs"
                                required
                              >
                                <option value="">בחר חשבון</option>
                                {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">קטגוריה</label>
                              <select
                                value={paymentData.categoryId}
                                onChange={(e) => setPaymentData({ ...paymentData, categoryId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-black font-bold text-xs"
                              >
                                <option value="">בחר קטגוריה (אופציונלי)</option>
                                {categories.filter(c => c.type === (isOwedToMe ? 'income' : 'expense')).map(cat => (
                                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black shadow-md hover:bg-slate-800 transition-all">
                          אשר תשלום
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
