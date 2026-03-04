import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { usePrivacy } from "../App";
import { Plus, Wallet, CreditCard, Landmark, MoreVertical, PlusCircle } from "lucide-react";

export function Accounts() {
  const accounts = useQuery(api.accounts.list);
  const createAccount = useMutation(api.accounts.create);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    balance: 0,
    currency: "ILS",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount(formData);
      setFormData({ name: "", balance: 0, currency: "ILS" });
      setShowForm(false);
      toast.success("החשבון נוצר בהצלחה");
    } catch (error) {
      toast.error("יצירת החשבון נכשלה");
    }
  };

  if (accounts === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">החשבונות שלי</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
        >
          <Plus size={18} />
          הוסף חשבון
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-xl">
              <PlusCircle className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold">הוספת חשבון חדש</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">שם החשבון</label>
                <input
                  type="text"
                  placeholder="בנק לאומי, מזומן..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">יתרה ראשונית</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₪</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="w-full sm:flex-1 bg-black text-white px-6 py-3.5 rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm"
              >
                צור חשבון
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full sm:px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold text-sm"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account._id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-slate-300 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-slate-100 transition-colors">
                <Landmark className="w-6 h-6 text-slate-700" />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">{account.name}</h3>
              <p className={`text-2xl font-black tracking-tight blur-amount ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                ₪{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                {account.currency}
              </span>
              <div className="flex -space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                  <CreditCard size={10} className="text-slate-400" />
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                  <Wallet size={10} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-100 hover:border-slate-300 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold mb-1">אין עדיין חשבונות</p>
            <p className="text-slate-400 text-sm">לחץ כאן כדי ליצור את החשבון הראשון שלך</p>
          </button>
        )}
      </div>
    </div>
  );
}
