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

    if (existing) {
      // Update existing budget
      await ctx.db.patch(existing._id, {
        amount: args.amount,
      });
      return existing._id;
    } else {
      // Create new budget
      return await ctx.db.insert("budgets", {
        userId,
        categoryId: args.categoryId,
        amount: args.amount,
        month: args.month,
        spent: 0,
      });
    }
  },
});

export const updateSpent = mutation({
  args: {
    budgetId: v.id("budgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found");
    }

    await ctx.db.patch(args.budgetId, {
      spent: budget.spent + args.amount,
    });
  },
});
