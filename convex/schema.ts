import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  bankAccounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    balance: v.number(),
    currency: v.string(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
    icon: v.optional(v.string()),
    excludeFromAnalytics: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
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
  })
    .index("by_user", ["userId"])
    .index("by_account", ["accountId"])
    .index("by_date", ["date"]),

  budgets: defineTable({
    userId: v.id("users"),
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.string(), // Format: "2024-01"
    spent: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_month", ["month"])
    .index("by_user_month", ["userId", "month"]),

  debts: defineTable({
    userId: v.id("users"),
    personName: v.string(),
    totalAmount: v.number(),
    amountPaid: v.number(),
    type: v.union(v.literal("they_owe_me"), v.literal("i_owe")),
    status: v.union(v.literal("pending"), v.literal("paid")),
    note: v.optional(v.string()),
    createdDate: v.string(),
    creationTransactionId: v.optional(v.id("transactions")),
  }).index("by_user", ["userId"]),

  debtPayments: defineTable({
    userId: v.id("users"),
    debtId: v.id("debts"),
    amount: v.number(),
    date: v.string(),
    transactionId: v.optional(v.id("transactions")),
  }).index("by_user", ["userId"]).index("by_debt", ["debtId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
