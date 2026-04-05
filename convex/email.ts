import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendPasswordResetEmail = action({
  args: { 
    email: v.string(),
    resetToken: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY לא מוגדר בסביבה");
    }

    // החלף את ה-URL בכתובת האתר שלך
    const resetLink = `https://your-app.com/reset-password?token=${args.resetToken}`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@your-domain.com", // ✅ החלף בדומיין שלך
        to: args.email,
        subject: "איפוס סיסמה",
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>איפוס סיסמה</h2>
            <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
            <p>
              <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                לחץ כאן כדי לאפס את הסיסמה
              </a>
            </p>
            <p style="color: #666; font-size: 12px;">
              אם לא ביקשת זאת, תוכל להתעלם מהודעה זו.
            </p>
            <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;" />
            <p style="color: #999; font-size: 11px;">
              הודעה זו נשלחה אליך כי קשורה לחשבון שלך באפליקציה שלנו.
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Resend error: ${result.message}`);
    }

    return result;
  },
});