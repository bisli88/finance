import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return debts;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { theyOweMe: 0, iOwe: 0, net: 0 };

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let theyOweMe = 0;
    let iOwe = 0;

    for (const debt of debts) {
      const remaining = debt.totalAmount - debt.amountPaid;
      if (debt.type === "they_owe_me") {
        theyOweMe += remaining;
      } else {
        iOwe += remaining;
      }
    }

    return {
      theyOweMe,
      iOwe,
      net: theyOweMe - iOwe,
    };
  },
});

export const create = mutation({
  args: {
    personName: v.string(),
    totalAmount: v.number(),
    type: v.union(v.literal("they_owe_me"), v.literal("i_owe")),
    note: v.optional(v.string()),
    createdDate: v.string(),
    accountId: v.optional(v.id("bankAccounts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let creationTransactionId;
    if (args.type === "they_owe_me" && args.accountId) {
      const account = await ctx.db.get(args.accountId);
      if (!account || account.userId !== userId) throw new Error("Account not found");

      // Update balance
      await ctx.db.patch(args.accountId, {
        balance: account.balance - args.totalAmount,
      });

      // Create transaction WITHOUT categoryId so it doesn't affect budget
      creationTransactionId = await ctx.db.insert("transactions", {
        userId,
        accountId: args.accountId,
        title: `הלוואה ל${args.personName}`,
        amount: args.totalAmount,
        type: "expense",
        date: args.createdDate,
        notes: `חוב שנוצר עבור ${args.personName}`,
        isDebt: true,
      });
    }

    return await ctx.db.insert("debts", {
      userId,
      personName: args.personName,
      totalAmount: args.totalAmount,
      amountPaid: 0,
      type: args.type,
      status: "pending",
      note: args.note,
      createdDate: args.createdDate,
      creationTransactionId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("debts"),
    personName: v.string(),
    totalAmount: v.number(),
    type: v.union(v.literal("they_owe_me"), v.literal("i_owe")),
    note: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("paid")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await ctx.db.get(args.id);
    if (!debt || debt.userId !== userId) throw new Error("Unauthorized");

    // If there's a linked creation transaction, sync the amount and balance
    if (debt.creationTransactionId && args.totalAmount !== debt.totalAmount) {
      const transaction = await ctx.db.get(debt.creationTransactionId);
      if (transaction && transaction.userId === userId) {
        const diff = args.totalAmount - debt.totalAmount;
        
        // Update transaction amount
        await ctx.db.patch(debt.creationTransactionId, {
          amount: args.totalAmount
        });

        // Update account balance (since it's a loan out, more debt = less money in account)
        const account = await ctx.db.get(transaction.accountId);
        if (account && account.userId === userId) {
          await ctx.db.patch(transaction.accountId, {
            balance: account.balance - diff
          });
        }
      }
    }

    await ctx.db.patch(args.id, {
      personName: args.personName,
      totalAmount: args.totalAmount,
      type: args.type,
      note: args.note,
      status: args.status,
    });
  },
});

async function revertTransaction(ctx: any, userId: string, transactionId: any) {
  const transaction = await ctx.db.get(transactionId);
  if (!transaction || transaction.userId !== userId) return;

  const account = await ctx.db.get(transaction.accountId);
  if (account && account.userId === userId) {
    // Revert balance
    const newBalance = transaction.type === "income" 
      ? account.balance - transaction.amount 
      : account.balance + transaction.amount;
    
    await ctx.db.patch(transaction.accountId, { balance: newBalance });
  }

  await ctx.db.delete(transactionId);
}

export const remove = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await ctx.db.get(args.id);
    if (!debt || debt.userId !== userId) throw new Error("Unauthorized");

    // 1. Revert the creation transaction if exists
    if (debt.creationTransactionId) {
      await revertTransaction(ctx, userId, debt.creationTransactionId);
    }

    // 2. Find and revert all payments
    const payments = await ctx.db
      .query("debtPayments")
      .withIndex("by_debt", (q) => q.eq("debtId", args.id))
      .collect();

    for (const payment of payments) {
      if (payment.transactionId) {
        await revertTransaction(ctx, userId, payment.transactionId);
      }
      await ctx.db.delete(payment._id);
    }

    // 3. Delete the debt
    await ctx.db.delete(args.id);
  },
});

export const recordPayment = mutation({
  args: {
    debtId: v.id("debts"),
    amount: v.number(),
    date: v.string(),
    createTransaction: v.boolean(),
    accountId: v.optional(v.id("bankAccounts")),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await ctx.db.get(args.debtId);
    if (!debt || debt.userId !== userId) throw new Error("Unauthorized");

    const newAmountPaid = debt.amountPaid + args.amount;
    const isFullyPaid = newAmountPaid >= debt.totalAmount;

    await ctx.db.patch(args.debtId, {
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "paid" : "pending",
    });

    let transactionId;
    if (args.createTransaction && args.accountId) {
      const type = debt.type === "they_owe_me" ? "income" : "expense";
      
      const account = await ctx.db.get(args.accountId);
      if (!account || account.userId !== userId) throw new Error("Account not found");

      transactionId = await ctx.db.insert("transactions", {
        userId,
        accountId: args.accountId,
        categoryId: args.categoryId,
        title: `תשלום חוב ל${debt.personName}`,
        amount: args.amount,
        type,
        date: args.date,
        notes: `תשלום עבור חוב מקורי של ${debt.totalAmount}`,
        isDebt: true,
      });

      // Update account balance
      if (type === "income") {
        await ctx.db.patch(args.accountId, { balance: account.balance + args.amount });
      } else {
        await ctx.db.patch(args.accountId, { balance: account.balance - args.amount });
      }
    }

    await ctx.db.insert("debtPayments", {
      userId,
      debtId: args.debtId,
      amount: args.amount,
      date: args.date,
      transactionId,
    });

    return { success: true, isFullyPaid };
  },
});

export const markAsPaid = mutation({
  args: { id: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const debt = await ctx.db.get(args.id);
    if (!debt || debt.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      status: "paid",
      amountPaid: debt.totalAmount,
    });
  },
});
