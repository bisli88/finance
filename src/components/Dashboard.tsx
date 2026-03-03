import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Dashboard() {
  const totalBalance = useQuery(api.accounts.getTotalBalance);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyStats = useQuery(api.transactions.getMonthlyStats, { month: currentMonth });
  const categoryBreakdown = useQuery(api.transactions.getCategoryBreakdown, { month: currentMonth });

  if (totalBalance === undefined || monthlyStats === undefined || categoryBreakdown === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Balance</h3>
          <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalBalance.toFixed(2)}
          </p>
        </div>

        {/* Monthly Income */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Income</h3>
          <p className="text-3xl font-bold text-green-600">
            ${monthlyStats.income.toFixed(2)}
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Expenses</h3>
          <p className="text-3xl font-bold text-red-600">
            ${monthlyStats.expenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Net Income */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Net Income This Month</h3>
        <p className={`text-2xl font-bold ${monthlyStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${monthlyStats.net.toFixed(2)}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown by Category</h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-gray-500">No expenses this month</p>
        ) : (
          <div className="space-y-4">
            {categoryBreakdown.map((item, index) => {
              const percentage = monthlyStats.expenses > 0 ? (item.amount / monthlyStats.expenses) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.category.color }}
                    ></div>
                    <span className="font-medium">{item.category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${item.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
