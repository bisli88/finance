"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            console.error(error);
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "סיסמה לא נכונה. נסה שוב.";
            } else if (error.message.includes("already exists")) {
              toastTitle = "חשבון עם אימייל זה כבר קיים.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "לא הצלחנו להתחבר, האם התכוונת להירשם?"
                  : "לא הצלחנו להירשם, האם התכוונת להתחבר?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder='אימייל'
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder='סיסמה'
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "התחברות" : "הרשמה"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "אין לך חשבון? "
              : "כבר יש לך חשבון? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "הרשמה במקום" : "התחברות במקום"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">או</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn("anonymous")}>
        התחברות אנונימית
      </button>
    </div>
  );
}
