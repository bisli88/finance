"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, LogIn, UserPlus, Fingerprint, Eye, EyeOff } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-4">
      <div className="flex p-1 bg-slate-100 rounded-xl w-full mb-1">
        <button
          onClick={() => setFlow("signIn")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            flow === "signIn" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <LogIn size={12} />
          התחברות
        </button>
        <button
          onClick={() => setFlow("signUp")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
            flow === "signUp" ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <UserPlus size={12} />
          הרשמה
        </button>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          
          signIn("password", formData)
            .then(() => {
              toast.success(flow === "signIn" ? "התחברת בהצלחה!" : "נרשמת בהצלחה!");
            })
            .catch((error) => {
              console.error("Auth error:", error);
              let errorMessage = "";
              
              const msg = error.message || "";
              if (msg.includes("Invalid password") || msg.includes("Incorrect account identifier")) {
                errorMessage = "פרטי התחברות שגויים. בדוק את המייל והסיסמה.";
              } else if (msg.includes("already exists")) {
                errorMessage = "משתמש עם המייל הזה כבר קיים במערכת.";
              } else if (msg.includes("Password too short")) {
                errorMessage = "הסיסמה קצרה מדי. לפחות 8 תווים.";
              } else {
                errorMessage = flow === "signIn" 
                  ? "לא הצלחנו להתחבר. וודא שנרשמת קודם או נסה שוב." 
                  : "לא הצלחנו להירשם. ייתכן והפרטים לא תקינים.";
              }
              
              toast.error(errorMessage, {
                icon: <AlertCircle className="text-red-500" size={18} />
              });
              setSubmitting(false);
            });
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1 text-right">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">אימייל</label>
            <input
              className="auth-input-field !py-2.5"
              type="email"
              name="email"
              placeholder='your@email.com'
              required
            />
          </div>
          <div className="space-y-1 text-right">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">סיסמה</label>
            <div className="relative">
              <input
                className="auth-input-field !py-2.5 pr-5 pl-10"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder='••••••••'
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button 
          className="auth-button mt-1 !py-3 flex items-center justify-center gap-2 group" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              {flow === "signIn" ? "התחבר עכשיו" : "צור חשבון חדש"}
              <Fingerprint size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
