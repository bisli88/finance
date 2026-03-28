import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    accountId: v.optional(v.id("bankAccounts")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let transactions;
    
    if (args.accountId) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", args.accountId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 50);
    }

    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const account = await ctx.db.get(transaction.accountId);
        const category = transaction.categoryId ? await ctx.db.get(transaction.categoryId) : null;
        const transferToAccount = transaction.transferToAccountId ? await ctx.db.get(transaction.transferToAccountId) : null;
        
        return {
          ...transaction,
          account,
          category,
          transferToAccount,
        };
      })
    );

    return enrichedTransactions;
  },
});

export const create = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    title: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    date: v.string(),
    notes: v.optional(v.string()),
    transferToAccountId: v.optional(v.id("bankAccounts")),
    isRecurring: v.optional(v.boolean()),
    isDebt: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    const transactionId = await ctx.db.insert("transactions", {
      userId,
      accountId: args.accountId,
      categoryId: args.categoryId,
      title: args.title,
      amount: args.amount,
      type: args.type,
      date: args.date,
      notes: args.notes,
      transferToAccountId: args.transferToAccountId,
      isRecurring: args.isRecurring,
      isDebt: args.isDebt,
    });

    if (args.type === "income") {
      await ctx.db.patch(args.accountId, {
        balance: account.balance + args.amount,
      });
    } else if (args.type === "expense") {
      await ctx.db.patch(args.accountId, {
        balance: account.balance - args.amount,
      });
    } else if (args.type === "transfer" && args.transferToAccountId) {
      const toAccount = await ctx.db.get(args.transferToAccountId);
      if (toAccount && toAccount.userId === userId) {
        await ctx.db.patch(args.accountId, {
          balance: account.balance - args.amount,
        });
        await ctx.db.patch(args.transferToAccountId, {
          balance: toAccount.balance + args.amount,
        });
      }
    }

    if (args.type === "expense" && args.categoryId && !args.isDebt) {
      const currentMonth = args.date.substring(0, 7);
      const budget = await ctx.db
        .query("budgets")
        .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", currentMonth))
        .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
        .first();

      if (budget) {
        await ctx.db.patch(budget._id, {
          spent: budget.spent + args.amount,
        });
      }
    }

    return transactionId;
  },
});

export const getMonthlyStats = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { income: 0, expenses: 0, net: 0 };

    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
          q.not(q.eq(q.field("isDebt"), true))
        )
      )
      .collect();

    const filteredTransactions = await Promise.all(
      transactions.map(async (t) => {
        if (!t.categoryId) return t;
        const category = await ctx.db.get(t.categoryId);
        if (category?.excludeFromAnalytics) return null;
        return t;
      })
    );

    const activeTransactions = filteredTransactions.filter((t): t is NonNullable<typeof t> => t !== null);

    const income = activeTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = activeTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transaction = await ctx.db.get(args.id);
    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found or unauthorized");
    }

    const account = await ctx.db.get(transaction.accountId);
    if (account) {
      if (transaction.type === "income") {
        await ctx.db.patch(transaction.accountId, { balance: account.balance - transaction.amount });
      } else if (transaction.type === "expense") {
        await ctx.db.patch(transaction.accountId, { balance: account.balance + transaction.amount });
      } else if (transaction.type === "transfer" && transaction.transferToAccountId) {
        const toAccount = await ctx.db.get(transaction.transferToAccountId);
        await ctx.db.patch(transaction.accountId, { balance: account.balance + transaction.amount });
        if (toAccount) {
          await ctx.db.patch(transaction.transferToAccountId, { balance: toAccount.balance - transaction.amount });
        }
      }
    }

    if (transaction.type === "expense" && transaction.categoryId && !transaction.isDebt) {
      const month = transaction.date.substring(0, 7);
      const budget = await ctx.db
        .query("budgets")
        .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", month))
        .filter((q) => q.eq(q.field("categoryId"), transaction.categoryId))
        .first();

      if (budget) {
        await ctx.db.patch(budget._id, { spent: Math.max(0, budget.spent - transaction.amount) });
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    accountId: v.id("bankAccounts"),
    categoryId: v.optional(v.id("categories")),
    title: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
    date: v.string(),
    notes: v.optional(v.string()),
    transferToAccountId: v.optional(v.id("bankAccounts")),
    isRecurring: v.optional(v.boolean()),
    isDebt: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const oldTransaction = await ctx.db.get(args.id);
    if (!oldTransaction || oldTransaction.userId !== userId) throw new Error("Unauthorized");

    const oldAccount = await ctx.db.get(oldTransaction.accountId);
    if (oldAccount) {
      if (oldTransaction.type === "income") await ctx.db.patch(oldTransaction.accountId, { balance: oldAccount.balance - oldTransaction.amount });
      else if (oldTransaction.type === "expense") await ctx.db.patch(oldTransaction.accountId, { balance: oldAccount.balance + oldTransaction.amount });
      else if (oldTransaction.type === "transfer" && oldTransaction.transferToAccountId) {
        const toAccount = await ctx.db.get(oldTransaction.transferToAccountId);
        await ctx.db.patch(oldTransaction.accountId, { balance: oldAccount.balance + oldTransaction.amount });
        if (toAccount) await ctx.db.patch(oldTransaction.transferToAccountId, { balance: toAccount.balance - oldTransaction.amount });
      }
    }
    if (oldTransaction.type === "expense" && oldTransaction.categoryId && !oldTransaction.isDebt) {
      const oldMonth = oldTransaction.date.substring(0, 7);
      const oldBudget = await ctx.db.query("budgets").withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", oldMonth)).filter((q) => q.eq(q.field("categoryId"), oldTransaction.categoryId)).first();
      if (oldBudget) await ctx.db.patch(oldBudget._id, { spent: Math.max(0, oldBudget.spent - oldTransaction.amount) });
    }

    const newAccount = await ctx.db.get(args.accountId);
    if (newAccount) {
      if (args.type === "income") await ctx.db.patch(args.accountId, { balance: newAccount.balance + args.amount });
      else if (args.type === "expense") await ctx.db.patch(args.accountId, { balance: newAccount.balance - args.amount });
      else if (args.type === "transfer" && args.transferToAccountId) {
        const toAccount = await ctx.db.get(args.transferToAccountId);
        await ctx.db.patch(args.accountId, { balance: newAccount.balance - args.amount });
        if (toAccount) await ctx.db.patch(args.transferToAccountId, { balance: toAccount.balance + args.amount });
      }
    }
    if (args.type === "expense" && args.categoryId && !args.isDebt) {
      const newMonth = args.date.substring(0, 7);
      const newBudget = await ctx.db.query("budgets").withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", newMonth)).filter((q) => q.eq(q.field("categoryId"), args.categoryId)).first();
      if (newBudget) await ctx.db.patch(newBudget._id, { spent: newBudget.spent + args.amount });
    }

    await ctx.db.patch(args.id, {
      accountId: args.accountId,
      categoryId: args.categoryId,
      title: args.title,
      amount: args.amount,
      type: args.type,
      date: args.date,
      notes: args.notes,
      transferToAccountId: args.transferToAccountId,
      isRecurring: args.isRecurring,
      isDebt: args.isDebt,
    });
  },
});

// ── UPDATED: added transactionCount to each category entry ──────────────────
export const getCategoryBreakdown = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
          q.eq(q.field("type"), "expense"),
          q.not(q.eq(q.field("isDebt"), true))
        )
      )
      .collect();

    const categoryTotals = new Map<string, { amount: number; transactionCount: number; category: any }>();

    for (const transaction of transactions) {
      if (transaction.categoryId) {
        const category = await ctx.db.get(transaction.categoryId);
        if (category && !category.excludeFromAnalytics) {
          const existing = categoryTotals.get(transaction.categoryId);
          categoryTotals.set(transaction.categoryId, {
            amount: (existing?.amount || 0) + transaction.amount,
            transactionCount: (existing?.transactionCount || 0) + 1,
            category,
          });
        }
      }
    }

    return Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount);
  },
});

// ── NEW: income breakdown by category (for pie chart) ───────────────────────
export const getIncomeCategoryBreakdown = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate),
          q.eq(q.field("type"), "income"),
          q.not(q.eq(q.field("isDebt"), true))
        )
      )
      .collect();

    const categoryTotals = new Map<string, { amount: number; transactionCount: number; category: any }>();

    for (const transaction of transactions) {
      if (transaction.categoryId) {
        const category = await ctx.db.get(transaction.categoryId);
        if (category && !category.excludeFromAnalytics) {
          const existing = categoryTotals.get(transaction.categoryId);
          categoryTotals.set(transaction.categoryId, {
            amount: (existing?.amount || 0) + transaction.amount,
            transactionCount: (existing?.transactionCount || 0) + 1,
            category,
          });
        }
      }
    }

    return Array.from(categoryTotals.values())
      .sort((a, b) => b.amount - a.amount);
  },
});