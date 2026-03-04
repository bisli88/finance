import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, createContext, useContext } from "react";
import { Dashboard } from "./components/Dashboard";
import { Accounts } from "./components/Accounts";
import { Transactions } from "./components/Transactions";
import { Budgets } from "./components/Budgets";
import { Settings } from "./components/Settings";
import { Analytics } from "./components/Analytics";
import { useMutation } from "convex/react";
import { 
  Home as HomeIcon, 
  Wallet, 
  ArrowRightLeft, 
  CalendarDays, 
  Settings as SettingsIcon,
  ChevronLeft,
  BarChart3
} from "lucide-react";

// Privacy Context
const PrivacyContext = createContext({
  isPrivate: false,
  togglePrivacy: () => {},
});

export const usePrivacy = () => useContext(PrivacyContext);

export default function App() {
  const [isPrivate, setIsPrivate] = useState(false);
  const togglePrivacy = () => setIsPrivate(!isPrivate);

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      <div className={`min-h-screen flex flex-col bg-[#f8fafc] pb-20 md:pb-0 font-sans text-slate-900 ${isPrivate ? 'privacy-active' : ''}`}>
        <main className="flex-1">
          <Content />
        </main>
        <Toaster position="top-center" richColors />
      </div>
    </PrivacyContext.Provider>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState("home");
  const createDefaults = useMutation(api.categories.createDefaults);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (loggedInUser) {
      createDefaults();
    }
  }, [loggedInUser, createDefaults]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#f8fafc]">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl animate-pulse">
          <Wallet className="w-8 h-8 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-black"></div>
          <span className="text-sm font-bold text-slate-500 tracking-wide">טוען את המידע שלך...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "home", label: "בית", icon: HomeIcon },
    { id: "analytics", label: "ניתוח", icon: BarChart3 },
    { id: "transactions", label: "תנועות", icon: ArrowRightLeft },
    { id: "budgets", label: "תקציבים", icon: CalendarDays },
    { id: "settings", label: "הגדרות", icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col">
      <Authenticated>
        {/* Desktop Navigation */}
        <div className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 ml-8">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">FinTrack</h2>
              </div>
              <nav className="flex space-x-1 space-x-reverse">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-5 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? "border-black text-black"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
          {activeTab !== "home" && (
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 mt-1">
                {activeTab === "analytics" && "ניתוח מעמיק של ההכנסות וההוצאות שלך"}
                {activeTab === "transactions" && "עקוב אחר כל ההכנסות וההוצאות שלך"}
                {activeTab === "budgets" && "תכנן את ההוצאות שלך ועמוד ביעדים"}
                {activeTab === "settings" && "התאם אישית את הגדרות האפליקציה ונהל חשבונות"}
              </p>
            </div>
          )}
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "home" && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "transactions" && <Transactions />}
            {activeTab === "budgets" && <Budgets />}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
          <nav className="flex justify-around items-center h-16">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-black"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute top-0 w-8 h-1 bg-black rounded-b-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen py-4 md:py-8">
          <div className="w-full max-w-md mx-auto px-6 text-center">
            <div className="mb-6">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3">
                <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">FinTrack</h1>
              <p className="text-sm text-slate-500 font-medium">נהלו את הכספים בצורה חכמה</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100">
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
