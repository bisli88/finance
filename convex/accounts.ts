import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    balance: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("bankAccounts", {
      userId,
      name: args.name,
      balance: args.balance,
      currency: args.currency,
    });
  },
});

export const updateBalance = mutation({
  args: {
    accountId: v.id("bankAccounts"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }

    await ctx.db.patch(args.accountId, {
      balance: account.balance + args.amount,
    });
  },
});

export const getTotalBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const accounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return accounts.reduce((total, account) => total + account.balance, 0);
  },
});
