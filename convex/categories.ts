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
    icon: v.optional(v.string()),
    excludeFromAnalytics: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      type: args.type,
      color: args.color,
      icon: args.icon,
      excludeFromAnalytics: args.excludeFromAnalytics,
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
      { name: "משכורת", type: "income" as const, color: "#10b981", icon: "Banknote" },
      { name: "פרילאנס", type: "income" as const, color: "#059669", icon: "Briefcase" },
      { name: "מענקים", type: "income" as const, color: "#34d399", icon: "Gift" },
      { name: "אוכל ומסעדות", type: "expense" as const, color: "#ef4444", icon: "Utensils" },
      { name: "תחבורה", type: "expense" as const, color: "#f97316", icon: "Car" },
      { name: "קניות", type: "expense" as const, color: "#8b5cf6", icon: "ShoppingBag" },
      { name: "בילויים", type: "expense" as const, color: "#ec4899", icon: "Palmtree" },
      { name: "חשבונות ותשלומים", type: "expense" as const, color: "#6b7280", icon: "Receipt" },
      { name: "בריאות", type: "expense" as const, color: "#06b6d4", icon: "HeartPulse" },
      { name: "חינוך", type: "expense" as const, color: "#3b82f6", icon: "GraduationCap" },
      { name: "שכר דירה/משכנתא", type: "expense" as const, color: "#1e293b", icon: "Home" },
    ];

    for (const category of defaultCategories) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
      });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    color: v.string(),
    icon: v.optional(v.string()),
    excludeFromAnalytics: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
      icon: args.icon,
      excludeFromAnalytics: args.excludeFromAnalytics,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found or unauthorized");
    }

    // Note: We might want to handle transactions that use this category.
    // For now, they will just have a null category reference in enriched results.
    await ctx.db.delete(args.id);
  },
});
