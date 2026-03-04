import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    month: v.string(), // Format: "2024-01"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .collect();

    // Get category details
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        return {
          ...budget,
          category,
        };
      })
    );

    return enrichedBudgets;
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if budget already exists for this category and month
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .first();

    // Calculate current spent amount from existing transactions
    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("categoryId"), args.categoryId),
          q.eq(q.field("type"), "expense"),
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    const currentSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const roundedAmount = Math.round(args.amount * 100) / 100;

    if (existing) {
      // Update existing budget
      await ctx.db.patch(existing._id, {
        amount: roundedAmount,
        spent: currentSpent,
      });
      return existing._id;
    } else {
      // Create new budget
      return await ctx.db.insert("budgets", {
        userId,
        categoryId: args.categoryId,
        amount: roundedAmount,
        month: args.month,
        spent: currentSpent,
      });
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.id);
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const updateAmount = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.id);
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }

    const roundedAmount = Math.round(args.amount * 100) / 100;

    await ctx.db.patch(args.id, {
      amount: roundedAmount,
    });
  },
});
