import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Edit2, 
  Trash2, 
  X, 
  PlusCircle, 
  CheckCircle2 
} from "lucide-react";

export function Accounts() {
  const accounts = useQuery(api.accounts.list);
  const createAccount = useMutation(api.accounts.create);
  const updateAccount = useMutation(api.accounts.update);
  const removeAccount = useMutation(api.accounts.remove);
  const toggleExclude = useMutation(api.accounts.toggleExcludeFromBalance);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  const [formData, setFormData] = useState({
    name: "",
    balance: 0,
    currency: "ILS",
  });

  const resetForm = () => {
    setFormData({ name: "", balance: 0, currency: "ILS" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      balance: account.balance,
      currency: account.currency,
    });
    setEditingId(account._id);
    setShowForm(true);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק חשבון זה? כל התנועות המשויכות אליו יישארו במערכת אך ללא שיוך לחשבון.")) return;
    try {
      await removeAccount({ id });
      toast.success("החשבון נמחק בהצלחה");
    } catch (error) {
      toast.error("מחיקת החשבון נכשלה");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAccount({
          id: editingId as any,
          ...formData,
        });
        toast.success("החשבון עודכן בהצלחה");
      } else {
        await createAccount(formData);
        toast.success("החשבון נוצר בהצלחה");
      }
      resetForm();
    } catch (error) {
      toast.error("הפעולה נכשלה");
    }
  };

  if (accounts === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={resetForm} />
          <div 
            data-tour="account-form"
            className="bg-white rounded-[2.5rem] border border-slate-200 p-6 md:p-8 animate-in zoom-in slide-in-from-bottom-4 duration-500 shadow-2xl max-w-lg w-full relative"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl shadow-sm">
                  {editingId ? <Edit2 className="w-5 h-5 text-slate-700" /> : <PlusCircle className="w-5 h-5 text-slate-700" />}
                </div>
                <h3 className="text-lg font-bold">{editingId ? "עריכת חשבון" : "הוספת חשבון חדש"}</h3>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">שם החשבון</label>
                  <input
                    type="text"
                    placeholder="בנק לאומי, מזומן..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-medium"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">יתרה התחלתית</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₪</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm font-black"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg active:scale-[0.98]"
                >
                  {editingId ? "עדכן חשבון" : "צור חשבון"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <div key={account._id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                  <Landmark className="w-5 h-5 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{account.name}</h3>
                  <p className={`text-lg font-black tracking-tight blur-amount ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    ₪{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(account)}
                  className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-50 rounded-lg transition-all"
                  title="ערוך"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(account._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="מחק"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {account.currency}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExclude({ id: account._id });
                  }}
                  title={account.excludeFromBalance ? "כלול בסכום הכולל" : "החרג מהסכום הכולל"}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border touch-manipulation ${
                    account.excludeFromBalance
                      ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <Wallet size={9} />
                  {account.excludeFromBalance ? "מוחרג" : "כלול"}
                </button>
                <div className="flex -space-x-1.5 space-x-reverse opacity-40">
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center">
                  <CreditCard size={8} className="text-slate-400" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center">
                  <Wallet size={8} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        ))}

        {!showForm && (
          <button 
            data-tour="add-account-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center justify-center py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-100 hover:border-slate-300 transition-all group gap-3"
          >
            <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold text-xs">הוסף חשבון חדש</p>
          </button>
        )}
      </div>
    </div>
  );
}
