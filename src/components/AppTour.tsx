import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface Step {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'center';
  tab?: string;
  actionDescription?: string;
}

const steps: Step[] = [
  {
    target: 'body',
    title: 'ברוכים הבאים ל-FinTrack!',
    content: 'בואו נלמד איך לנהל את הכספים שלכם ב-3 שלבים פשוטים. מוכנים להתחיל?',
    position: 'center',
    tab: 'home'
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'שלב 1: הגדרת חשבון',
    content: 'כדי להתחיל, אנחנו צריכים להגדיר מאיפה הכסף מגיע. בואו ניכנס להגדרות.',
    position: 'top',
    tab: 'home'
  },
  {
    target: '[data-tour="add-account-btn"]',
    title: 'יצירת חשבון חדש',
    content: 'לחצו כאן כדי להוסיף את חשבון הבנק או המזומן הראשון שלכם.',
    position: 'bottom',
    tab: 'settings',
    actionDescription: 'לחצו על "הוסף חשבון חדש"'
  },
  {
    target: '[data-tour="account-form"]',
    title: 'פרטי החשבון',
    content: 'מלאו את שם החשבון (למשל: "בנק לאומי") ואת היתרה הנוכחית שלכם, ואז לחצו על "צור חשבון".',
    position: 'top',
    tab: 'settings',
    actionDescription: 'מלאו את הטופס ולחצו על "צור חשבון"'
  },
  {
    target: '[data-tour="nav-transactions"]',
    title: 'שלב 2: תיעוד הוצאה',
    content: 'מעולה! עכשיו כשיש לנו חשבון, בואו נלמד איך מתעדים הוצאה ראשונה.',
    position: 'top',
    tab: 'settings'
  },
  {
    target: '[data-tour="add-transaction-btn"]',
    title: 'הוספת תנועה',
    content: 'לחצו על הכפתור הגדול כדי לפתוח את טופס התנועה החדשה.',
    position: 'bottom',
    tab: 'transactions',
    actionDescription: 'לחצו על "הוסף תנועה חדשה"'
  },
  {
    target: '[data-tour="transaction-form"]',
    title: 'פרטי התנועה',
    content: 'הזינו את הסכום, בחרו את החשבון שיצרתם, ותנו לה שם (למשל: "קניות לשבת"). לסיום לחצו על "שמור תנועה".',
    position: 'top',
    tab: 'transactions',
    actionDescription: 'מלאו את הפרטים ולחצו על "שמור תנועה"'
  },
  {
    target: '[data-tour="nav-home"]',
    title: 'שלב 3: צפייה בתוצאות',
    content: 'זהו! עכשיו בואו נחזור למסך הבית לראות איך הכל מתעדכן בזמן אמת.',
    position: 'top',
    tab: 'transactions'
  },
  {
    target: '[data-tour="balance-card"]',
    title: 'הכל מעודכן!',
    content: 'כאן תוכלו לראות את המאזן החדש שלכם. מזל טוב! אתם בדרך לשליטה פיננסית מלאה.',
    position: 'bottom',
    tab: 'home'
  },
];

interface AppTourProps {
  onNavigate?: (tabId: string) => void;
  activeTab?: string;
}

export function AppTour({ onNavigate, activeTab }: AppTourProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const startTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setCurrentStep(null);
    localStorage.setItem('hasCompletedTour', 'true');
  }, []);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedTour');
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  // Handle navigation
  useEffect(() => {
    if (currentStep !== null) {
      const step = steps[currentStep];
      if (step.tab && onNavigate && activeTab !== step.tab) {
        onNavigate(step.tab);
      }
    }
  }, [currentStep, onNavigate, activeTab]);

  const updateCoords = useCallback(() => {
    if (currentStep === null) return;
    const step = steps[currentStep];
    
    if (step.target === 'body') {
      setCoords({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const elements = document.querySelectorAll(step.target);
    let element: HTMLElement | null = null;
    
    for (const el of Array.from(elements)) {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0) {
        element = el as HTMLElement;
        break;
      }
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [currentStep]);

  // Update coords on scroll, resize or tab change
  useEffect(() => {
    updateCoords();
    window.addEventListener('scroll', updateCoords, true);
    window.addEventListener('resize', updateCoords);
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [updateCoords, activeTab]);

  // Scroll element into view when step changes
  useEffect(() => {
    if (currentStep !== null) {
      const step = steps[currentStep];
      if (step.target === 'body') return;

      const timer = setTimeout(() => {
        const elements = document.querySelectorAll(step.target);
        for (const el of Array.from(elements)) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && (el as HTMLElement).offsetWidth > 0) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }, 500); // Wait for tab transition
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  if (currentStep === null) return null;

  const step = steps[currentStep];

  const getTooltipStyle = (): React.CSSProperties => {
    if (step.target === 'body') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' };
    }

    const padding = 16;
    const tooltipWidth = Math.min(window.innerWidth - 32, 320);
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
    
    let left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, coords.left + coords.width / 2 - tooltipWidth / 2));
    let top = 0;

    // Determine if we should show above or below
    const spaceBelow = window.innerHeight - (coords.top + coords.height);
    const spaceAbove = coords.top;

    if (step.position === 'bottom') {
      if (spaceBelow < tooltipHeight + 20 && spaceAbove > tooltipHeight + 20) {
        top = coords.top - tooltipHeight - 12;
      } else {
        top = coords.top + coords.height + 12;
      }
    } else {
      if (spaceAbove < tooltipHeight + 20 && spaceBelow > tooltipHeight + 20) {
        top = coords.top + coords.height + 12;
      } else {
        top = coords.top - tooltipHeight - 12;
      }
    }

    // Final boundary check for top/bottom
    top = Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, top));

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans" dir="rtl">
      {/* Overlay with hole */}
      <div 
        className="absolute inset-0 bg-black/75 pointer-events-auto transition-all duration-500"
        style={{
          clipPath: step.target === 'body' 
            ? 'none' 
            : `polygon(0% 0%, 0% 100%, ${coords.left - 8}px 100%, ${coords.left - 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top - 8}px, ${coords.left + coords.width + 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px ${coords.top + coords.height + 8}px, ${coords.left - 8}px 100%, 100% 100%, 100% 0%)`
        }}
        onClick={endTour}
      >
        {/* Pulse effect for the highlighted area */}
        {step.target !== 'body' && (
          <div 
            className="absolute border-2 border-white/50 rounded-xl animate-ping opacity-75"
            style={{
              top: coords.top - 12,
              left: coords.left - 12,
              width: coords.width + 24,
              height: coords.height + 24,
            }}
          />
        )}
      </div>

      <div 
        ref={tooltipRef}
        className="absolute pointer-events-auto transition-all duration-300 ease-out"
        style={getTooltipStyle()}
      >
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-black" />
          
          <button 
            onClick={endTour}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-full transition-all"
          >
            <X size={18} />
          </button>

          <div className="mt-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-black text-white text-[10px] font-black rounded-full">
                {currentStep + 1}
              </span>
              <h4 className="font-black text-slate-900 text-lg tracking-tight">{step.title}</h4>
            </div>
            
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              {step.content}
            </p>

            {step.actionDescription && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <p className="text-xs font-black text-amber-700">{step.actionDescription}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all ${i === currentStep ? 'w-4 bg-black' : 'w-1 bg-slate-200'}`} 
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all border border-slate-100"
                >
                  <ChevronRight size={20} />
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg shadow-black/20 font-bold text-sm"
                >
                  הבא
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <button 
                  onClick={endTour}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-lg shadow-emerald-200 font-bold text-sm"
                >
                  סיום
                  <Check size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
