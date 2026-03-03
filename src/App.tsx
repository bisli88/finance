import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { Accounts } from "./components/Accounts";
import { Transactions } from "./components/Transactions";
import { Budgets } from "./components/Budgets";
import { useMutation } from "convex/react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Finance Tracker</h2>
        <SignOutButton />
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [activeTab, setActiveTab] = useState("dashboard");
  const createDefaults = useMutation(api.categories.createDefaults);

  useEffect(() => {
    if (loggedInUser) {
      createDefaults();
    }
  }, [loggedInUser, createDefaults]);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      <Authenticated>
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "accounts", label: "Accounts" },
                { id: "transactions", label: "Transactions" },
                { id: "budgets", label: "Budgets" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "accounts" && <Accounts />}
          {activeTab === "transactions" && <Transactions />}
          {activeTab === "budgets" && <Budgets />}
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">Finance Tracker</h1>
              <p className="text-xl text-secondary">Track your finances with ease</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
