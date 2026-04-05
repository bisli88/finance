"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, LogIn, UserPlus, Fingerprint, Eye, EyeOff, Mail, Key, ArrowRight } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const sendEmail = useMutation(api.email.sendPasswordResetEmail);
  const [flow, setFlow] = useState<"signIn" | "signUp" | "reset" | "reset-verification">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleResetPassword = async (userEmail: string) => {
    try {
      setSubmitting(true);
      // צור token לאיפוס (בעתיד תוכל לשמור זאת בבסיס הנתונים)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // שלח אימייל
      await sendEmail({ email: userEmail, resetToken });
      
      setFlow("reset-verification");
      toast.success("קוד אימות נשלח למייל שלך!");
      setSubmitting(false);
    } catch (error) {
      console.error("Email error:", error);
      toast.error("לא הצלחנו לשלוח אימייל. וודא שהמייל תקין ונסה שוב.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {flow !== "reset" && flow !== "reset-verification" && (
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
      )}

      {(flow === "reset" || flow === "reset-verification") && (
        <button
          onClick={() => setFlow("signIn")}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-[11px] font-bold mb-2"
        >
          <ArrowRight size={14} />
          חזרה להתחברות
        </button>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          
          if (flow === "reset") {
            // כשלוחצים "שלח קוד אימות"
            handleResetPassword(email);
            return;
          }
          
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          
          signIn("password", formData)
            .then(() => {
              if (flow === "reset-verification") {
                setFlow("signIn");
                setEmail("");
                toast.success("הסיסמה שונתה בהצלחה! כעת ניתן להתחבר.");
              } else {
                toast.success(flow === "signIn" ? "התחברת בהצלחה!" : "נרשמת בהצלחה!");
              }
              setSubmitting(false);
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
              } else if (msg.includes("Invalid code")) {
                errorMessage = "קוד אימות שגוי. נסה שוב.";
              } else {
                errorMessage = flow === "signIn" 
                  ? "לא הצלחנו להתחבר. וודא שנרשמת קודם או נסה שוב." 
                  : "משהו השתבש. נסה שוב מאוחר יותר.";
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='your@email.com'
              required
              readOnly={flow === "reset-verification"}
            />
          </div>

          {flow === "reset-verification" && (
            <div className="space-y-1 text-right">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">קוד אימות</label>
              <div className="relative">
                <input
                  className="auth-input-field !py-2.5 pr-10"
                  type="text"
                  name="code"
                  placeholder='123456'
                  required
                />
                <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          )}

          {(flow === "signIn" || flow === "signUp" || flow === "reset-verification") && (
            <div className="space-y-1 text-right">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">
                {flow === "reset-verification" ? "סיסמה חדשה" : "סיסמה"}
              </label>
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
          )}

          {flow === "signIn" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setFlow("reset")}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
              >
                שכחת סיסמה?
              </button>
            </div>
          )}
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
              {flow === "signIn" && "התחבר עכשיו"}
              {flow === "signUp" && "צור חשבון חדש"}
              {flow === "reset" && "שלח קוד אימות"}
              {flow === "reset-verification" && "אפס סיסמה"}
              {flow === "signIn" || flow === "signUp" ? (
                <Fingerprint size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              ) : flow === "reset" ? (
                <Mail size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              ) : (
                <Key size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </>
          )}
        </button>
      </form>
    </div>
  );
}