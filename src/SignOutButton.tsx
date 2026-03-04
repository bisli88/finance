"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-3 py-1.5 md:px-4 md:py-2 rounded bg-white text-secondary border border-gray-200 text-xs md:text-sm font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={() => void signOut()}
    >
      התנתקות
    </button>
  );
}
