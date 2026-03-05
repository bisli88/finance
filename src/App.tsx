import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, createContext, useContext, useRef } from "react";
import { Dashboard } from "./components/Dashboard";
import { Accounts } from "./components/Accounts";
import { Transactions } from "./components/Transactions";
import { Debts } from "./components/Debts";
import { Settings } from "./components/Settings";
import { Analytics } from "./components/Analytics";
import { AppTour } from "./components/AppTour";
import { useMutation } from "convex/react";
import { 
  Home as HomeIcon, 
  Wallet, 
  ArrowRightLeft, 
  Settings as SettingsIcon,
  ChevronLeft,
  BarChart3,
  Banknote
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
      <div className={`min-h-screen flex flex-col bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-500 pb-20 md:pb-0 font-sans text-slate-900 ${isPrivate ? 'privacy-active' : ''}`}>
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

  // Drag-to-switch states
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragTargetTab, setDragTargetTab] = useState<string | null>(null);
  const dragTargetTabRef = useRef<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<any>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const blockClicksRef = useRef(false);

  const tabs = [
    { id: "home", label: "בית", icon: HomeIcon, tourId: "nav-home" },
    { id: "analytics", label: "ניתוח", icon: BarChart3, tourId: "nav-analytics" },
    { id: "transactions", label: "תנועות", icon: ArrowRightLeft, tourId: "nav-transactions" },
    { id: "debts", label: "חובות", icon: Banknote, tourId: "nav-debts" },
    { id: "settings", label: "הגדרות", icon: SettingsIcon, tourId: "nav-settings" },
  ];

  const handleTouchStart = (e: React.TouchEvent, tabId: string) => {
    if (tabId !== activeTab) return;
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true);
      isDraggingRef.current = true;
      blockClicksRef.current = true;
      
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        setDragX(x);
        
        // Initialize target immediately
        const tabWidth = rect.width / tabs.length;
        const visualIndexFromLeft = Math.floor(x / tabWidth);
        const logicalIndex = tabs.length - 1 - visualIndexFromLeft;
        const clampedIndex = Math.max(0, Math.min(logicalIndex, tabs.length - 1));
        const targetId = tabs[clampedIndex].id;
        setDragTargetTab(targetId);
        dragTargetTabRef.current = targetId;
      }
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 400); // 400ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    
    if (!isDraggingRef.current) {
      const dist = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.current.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.current.y, 2)
      );
      
      if (dist > 15) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    
    if (!navRef.current) return;
    
    const rect = navRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setDragX(x);

    // Calculate target tab index (Reversed for RTL)
    const tabWidth = rect.width / tabs.length;
    const visualIndexFromLeft = Math.floor(x / tabWidth);
    const logicalIndex = tabs.length - 1 - visualIndexFromLeft;
    const clampedIndex = Math.max(0, Math.min(logicalIndex, tabs.length - 1));
    const targetId = tabs[clampedIndex].id;
    setDragTargetTab(targetId);
    dragTargetTabRef.current = targetId;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDraggingRef.current) {
      if (dragTargetTabRef.current) {
        setActiveTab(dragTargetTabRef.current);
      }
      if (e.cancelable) e.preventDefault();
      
      // Clear visual dragging state IMMEDIATELY to hide the bubble
      setIsDragging(false);
      setDragTargetTab(null);
      
      // Keep blocking clicks for a short duration to prevent mis-clicks
      setTimeout(() => {
        isDraggingRef.current = false;
        dragTargetTabRef.current = null;
        blockClicksRef.current = false;
      }, 150);
    } else {
      // Normal tap - clear everything
      setIsDragging(false);
      isDraggingRef.current = false;
      setDragTargetTab(null);
      dragTargetTabRef.current = null;
      blockClicksRef.current = false;
    }
  };

  const handleTabClick = (tabId: string) => {
    if (blockClicksRef.current) return;
    setActiveTab(tabId);
  };
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

  return (
    <div className="flex flex-col">
      <Authenticated>
        <AppTour onNavigate={setActiveTab} activeTab={activeTab} />
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
                      data-tour={tab.tourId}
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
              <p className="text-white/90 mt-1 font-medium">
                {activeTab === "analytics" && "ניתוח מעמיק של ההכנסות וההוצאות שלך"}
                {activeTab === "transactions" && "עקוב אחר כל ההכנסות וההוצאות שלך"}
                {activeTab === "debts" && "נהל את החובות שלך ומעקב אחר תשלומים"}
                {activeTab === "settings" && "התאם אישית את הגדרות האפליקציה ונהל חשבונות"}
              </p>
            </div>
          )}
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "home" && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === "analytics" && <Analytics />}
            {activeTab === "transactions" && <Transactions />}
            {activeTab === "debts" && <Debts />}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>

        {/* Mobile Bottom Navigation - Perfect Modern Design */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <nav 
            ref={navRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="relative flex justify-around items-center h-[64px] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl rounded-[2rem] px-1.5 border border-white/10 touch-none select-none"
          >
            {/* Animated Drag Bubble */}
            {isDragging && (
              <div 
                className="absolute bg-white/30 rounded-full pointer-events-none z-0 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                style={{ 
                  top: '6px',
                  bottom: '6px',
                  width: `${100 / tabs.length - 2}%`,
                  left: '0',
                  transform: `translateX(${dragX - (navRef.current?.getBoundingClientRect().width || 0) / (tabs.length * 2)}px) scale(1.2)`,
                  transition: 'transform 0.05s linear',
                  marginLeft: '1%'
                }}
              />
            )}

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isBeingTargeted = isDragging && dragTargetTab === tab.id;
              
              // Only show the expanded "pill" state when NOT dragging
              const showAsExpanded = !isDragging && isActive;
              // Icon should be bright if it's the active tab (when not dragging) OR the target of a drag
              const isIconActive = showAsExpanded || isBeingTargeted;
              
              return (
                <button
                  key={tab.id}
                  data-tour={tab.tourId}
                  onClick={() => handleTabClick(tab.id)}
                  onTouchStart={(e) => handleTouchStart(e, tab.id)}
                  className={`
                    relative flex items-center justify-center transition-all duration-500 ease-out z-10
                    ${showAsExpanded ? "flex-[2] bg-white/15 rounded-full h-[48px] mx-1" : "flex-1 h-[48px]"}
                  `}
                >
                  <div className={`flex items-center justify-center gap-2 ${showAsExpanded ? "px-3" : ""}`}>
                    <Icon 
                      size={showAsExpanded ? 20 : 24} 
                      className={`transition-all duration-300 ${isIconActive ? "text-white" : "text-white/40"}`}
                      strokeWidth={isIconActive ? 2.5 : 2}
                    />
                    
                    {showAsExpanded && (
                      <span className="text-xs font-black text-white whitespace-nowrap animate-in fade-in zoom-in duration-300">
                        {tab.label}
                      </span>
                    )}
                  </div>
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
