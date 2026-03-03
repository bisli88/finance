import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      type: args.type,
      color: args.color,
    });
  },
});

export const createDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (existingCategories.length > 0) return;

    const defaultCategories = [
      { name: "Salary", type: "income" as const, color: "#10b981" },
      { name: "Freelance", type: "income" as const, color: "#059669" },
      { name: "Food & Dining", type: "expense" as const, color: "#ef4444" },
      { name: "Transportation", type: "expense" as const, color: "#f97316" },
      { name: "Shopping", type: "expense" as const, color: "#8b5cf6" },
      { name: "Entertainment", type: "expense" as const, color: "#ec4899" },
      { name: "Bills & Utilities", type: "expense" as const, color: "#6b7280" },
      { name: "Healthcare", type: "expense" as const, color: "#06b6d4" },
    ];

    for (const category of defaultCategories) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
      });
    }
  },
});
