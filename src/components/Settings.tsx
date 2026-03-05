import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
import { Accounts } from "./Accounts";
import { useState } from "react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  LogOut, 
  Info,
  Tag,
  Palette,
  ChevronDown,
  Wallet,
  Target,
  Calendar,
  PieChart
} from "lucide-react";

const ICON_OPTIONS = [
  "ShoppingBag", "Utensils", "Car", "Home", "HeartPulse", "GraduationCap", 
  "Palmtree", "Receipt", "Gift", "Briefcase", "Banknote", "Smartphone", 
  "Gamepad2", "Dumbbell", "Dog", "Plane", "Music", "Coffee", "Beer",
  "Zap", "Wifi", "Scissors", "Trash2", "Shield", "Search", "Settings"
];

function DynamicIcon({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Tag;
  return <IconComponent size={size} className={className} />;
}

export function Settings() {
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const categories = useQuery(api.categories.list);
  const budgets = useQuery(api.budgets.list, { month: selectedMonth });

  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const deleteCategory = useMutation(api.categories.remove);

  const createBudget = useMutation(api.budgets.create);
  const updateBudgetAmount = useMutation(api.budgets.updateAmount);
  const removeBudget = useMutation(api.budgets.remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "", icon: "Tag" });
  const [activeCategoryType, setActiveCategoryType] = useState<"expense" | "income">("expense");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newCategory, setNewCategory] = useState({ 
    name: "", 
    type: "expense" as "income" | "expense", 
    color: "#000000",
    icon: "Tag"
  });

  const [showIconPicker, setShowIconPicker] = useState<string | null>(null);

  // Budget states
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<number>(0);
  const [budgetFormData, setBudgetFormData] = useState({
    categoryId: "",
    amount: 0,
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory({ ...newCategory, type: activeCategoryType });
      setNewCategory({ ...newCategory, name: "", icon: "Tag" });
      setShowAddForm(false);
      toast.success("קטגוריה נוספה בהצלחה");
    } catch (error) {
      toast.error("הוספת קטגוריה נכשלה");
    }
  };

  const handleUpdateCategory = async (id: any) => {
    try {
      await updateCategory({ id, ...editForm });
      setEditingId(null);
      toast.success("קטגוריה עודכנה");
    } catch (error) {
      toast.error("עדכון קטגוריה נכשל");
    }
  };

  const handleDeleteCategory = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק קטגוריה זו? תנועות המשויכות אליה יישארו ללא קטגוריה.")) return;
    try {
      await deleteCategory({ id });
      toast.success("קטגוריה נמחקה");
    } catch (error) {
      toast.error("מחיקת קטגוריה נכשלה");
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBudget({
        categoryId: budgetFormData.categoryId as any,
        amount: budgetFormData.amount,
        month: selectedMonth,
      });
      setBudgetFormData({ categoryId: "", amount: 0 });
      setShowBudgetForm(false);
      toast.success("התקציב נוצר בהצלחה");
    } catch (error) {
      toast.error("יצירת התקציב נכשלה");
    }
  };

  const handleUpdateBudget = async (id: any) => {
    try {
      await updateBudgetAmount({ id, amount: editBudgetAmount });
      setEditingBudgetId(null);
      toast.success("התקציב עודכן בהצלחה");
    } catch (error) {
      toast.error("עדכון התקציב נכשל");
    }
  };

  const handleDeleteBudget = async (id: any) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תקציב זה?")) return;
    try {
      await removeBudget({ id });
      toast.success("התקציב נמחק בהצלחה");
    } catch (error) {
      toast.error("מחיקת התקציב נכשלה");
    }
  };

  if (categories === undefined || budgets === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  const filteredCategories = categories.filter(c => c.type === activeCategoryType);
  const expenseCategories = categories.filter(cat => cat.type === "expense");
  const availableCategoriesForBudget = expenseCategories.filter(cat => 
    !budgets.some(budget => budget.categoryId === cat._id)
  );

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* Category Management */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Tag size={20} className="text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">ניהול קטגוריות</h3>
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveCategoryType("expense");
                setShowAddForm(false);
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategoryType === "expense" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              הוצאות
            </button>
            <button
              onClick={() => {
                setActiveCategoryType("income");
                setShowAddForm(false);
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategoryType === "income" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              הכנסות
            </button>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-8">
          {/* Add New Category Toggle */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              הוספת קטגוריית {activeCategoryType === "expense" ? "הוצאה" : "הכנסה"} חדשה
            </button>
          ) : (
            <form onSubmit={handleCreateCategory} className="space-y-5 bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-slate-900" />
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    קטגוריית {activeCategoryType === "expense" ? "הוצאה" : "הכנסה"} חדשה
                  </h4>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="שם הקטגוריה"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all font-medium md:col-span-2"
                  required
                />
                
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-full h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(showIconPicker === 'new' ? null : 'new')}
                    className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl hover:border-black transition-all"
                  >
                    <DynamicIcon name={newCategory.icon} />
                  </button>
                </div>

                <button
                  type="submit"
                  className="bg-black text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-sm"
                >
                  הוסף
                </button>
              </div>

              {showIconPicker === 'new' && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => {
                          setNewCategory({ ...newCategory, icon });
                          setShowIconPicker(null);
                        }}
                        className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${newCategory.icon === icon ? 'bg-black text-white' : 'text-slate-600'}`}
                      >
                        <DynamicIcon name={icon} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Categories List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className={`w-2 h-2 rounded-full ${activeCategoryType === "expense" ? "bg-red-500" : "bg-emerald-500"}`}></div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {activeCategoryType === "expense" ? "קטגוריות הוצאה" : "קטגוריות הכנסה"}
              </h4>
              <span className="text-[10px] font-bold text-slate-400 mr-auto bg-slate-50 px-2 py-0.5 rounded-lg">{filteredCategories.length}</span>
            </div>
            
            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">אין קטגוריות להצגה</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredCategories.map(cat => (
                  <CategoryItem 
                    key={cat._id}
                    category={cat}
                    isEditing={editingId === cat._id}
                    editForm={editForm}
                    onEditFormChange={setEditForm}
                    onStartEdit={() => {
                      setEditingId(cat._id);
                      setEditForm({ name: cat.name, color: cat.color, icon: cat.icon || "Tag" });
                    }}
                    onCancelEdit={() => setEditingId(null)}
                    onUpdate={() => handleUpdateCategory(cat._id)}
                    onDelete={() => handleDeleteCategory(cat._id)}
                    showIconPicker={showIconPicker === cat._id}
                    onToggleIconPicker={() => setShowIconPicker(showIconPicker === cat._id ? null : cat._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Management */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Target size={20} className="text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">ניהול תקציבים</h3>
          </div>
          
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-bold text-xs"
            />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {availableCategoriesForBudget.length > 0 && !showBudgetForm && (
            <button
              onClick={() => setShowBudgetForm(true)}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              הגדר תקציב חדש לחודש זה
            </button>
          )}

          {showBudgetForm && (
            <form onSubmit={handleCreateBudget} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase">הגדרת תקציב</h4>
                <button type="button" onClick={() => setShowBudgetForm(false)} className="p-1 hover:bg-slate-200 rounded-full">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={budgetFormData.categoryId}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, categoryId: e.target.value })}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {availableCategoriesForBudget.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₪</span>
                  <input
                    type="number"
                    placeholder="סכום תקציב"
                    value={budgetFormData.amount || ""}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-2.5 rounded-xl font-bold text-sm">
                שמור תקציב
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 gap-3">
            {budgets.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-400">אין תקציבים מוגדרים לחודש זה</p>
              </div>
            ) : (
              budgets.map(budget => (
                <div key={budget._id} className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" 
                      style={{ backgroundColor: `${budget.category?.color}15`, color: budget.category?.color }}
                    >
                      <DynamicIcon name={budget.category?.icon || "PieChart"} size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{budget.category?.name}</p>
                      {editingBudgetId === budget._id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="number" 
                            value={editBudgetAmount}
                            onChange={(e) => setEditBudgetAmount(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-xs font-black"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateBudget(budget._id)} className="p-1 bg-black text-white rounded-lg"><Check size={12}/></button>
                          <button onClick={() => setEditingBudgetId(null)} className="p-1 bg-slate-100 text-slate-500 rounded-lg"><X size={12}/></button>
                        </div>
                      ) : (
                        <p className="text-xs font-black text-slate-400">₪{budget.amount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingBudgetId(budget._id); setEditBudgetAmount(budget.amount); }}
                      className="p-2 text-slate-400 hover:text-black rounded-xl transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteBudget(budget._id)} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <Wallet size={20} className="text-slate-700" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">ניהול חשבונות</h3>
        </div>
        <div className="p-6 md:p-8">
          <Accounts />
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <SettingsIcon size={20} className="text-slate-700" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">הגדרות חשבון</h3>
        </div>
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">התנתקות מהמערכת</h4>
            <p className="text-sm text-slate-500">
              לחץ כאן כדי לסיים את הסשן הנוכחי ולהתנתק מהחשבון שלך.
            </p>
          </div>
          <div className="flex justify-start">
            <div className="group relative">
               <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-slate-300">
        <div className="h-px bg-slate-100 flex-1"></div>
        <div className="flex items-center gap-2">
           <Info size={14} />
           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">FinTrack v1.0.0</span>
        </div>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>
    </div>
  );
}

function CategoryItem({ 
  category, 
  isEditing, 
  editForm, 
  onEditFormChange, 
  onStartEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete,
  showIconPicker,
  onToggleIconPicker
}: any) {
  if (isEditing) {
    return (
      <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-black/10 animate-in fade-in zoom-in duration-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={editForm.name}
            onChange={(e) => onEditFormChange({ ...editForm, name: e.target.value })}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/5 focus:border-black font-medium"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editForm.color}
              onChange={(e) => onEditFormChange({ ...editForm, color: e.target.value })}
              className="w-10 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer flex-shrink-0"
            />
            <button
              type="button"
              onClick={onToggleIconPicker}
              className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl hover:border-black transition-all flex-shrink-0"
            >
              <DynamicIcon name={editForm.icon} size={18} />
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={onUpdate}
                className="p-2.5 bg-black text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex-shrink-0"
                title="שמור"
              >
                <Check size={18} />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex-shrink-0"
                title="ביטול"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {showIconPicker && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onEditFormChange({ ...editForm, icon });
                    onToggleIconPicker();
                  }}
                  className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${editForm.icon === icon ? 'bg-black text-white' : 'text-slate-600'}`}
                >
                  <DynamicIcon name={icon} size={16} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all duration-300">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" 
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <DynamicIcon name={category.icon || "Tag"} size={18} />
        </div>
        <span className="text-sm font-bold text-slate-700 truncate">{category.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onStartEdit}
          className="p-2 text-slate-400 hover:text-black hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="ערוך"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
          title="מחק"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
