import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workspaceMembers = mysqlTable("workspaceMembers", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["viewer", "operator", "approver", "admin"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  vendor: varchar("vendor", { length: 255 }).notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", ["received", "extracting", "validated", "completed", "rejected", "failed"]).default("received").notNull(),
  sourceKey: varchar("sourceKey", { length: 512 }),
  extractedData: json("extractedData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pactlineRunSnapshots = mysqlTable("pactlineRunSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  workspaceKey: varchar("workspaceKey", { length: 128 }).notNull(),
  runKey: varchar("runKey", { length: 64 }).notNull().unique(),
  snapshot: json("snapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pactlineRuns = mysqlTable("pactlineRuns", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  runKey: varchar("runKey", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["running", "held", "approved", "rejected", "failed"]).default("running").notNull(),
  planId: varchar("planId", { length: 128 }),
  planHash: varchar("planHash", { length: 128 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pactlineActions = mysqlTable("pactlineActions", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  actionKey: varchar("actionKey", { length: 64 }).notNull(),
  toolName: varchar("toolName", { length: 128 }).notNull(),
  target: varchar("target", { length: 512 }).notNull(),
  decision: mysqlEnum("decision", ["allowed", "held", "blocked", "approved", "rejected", "executed", "failed"]).notNull(),
  reason: text("reason"),
  argumentsHash: varchar("argumentsHash", { length: 128 }),
  proofReference: varchar("proofReference", { length: 255 }),
  executed: boolean("executed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pactlineApprovals = mysqlTable("pactlineApprovals", {
  id: int("id").autoincrement().primaryKey(),
  actionId: int("actionId").notNull(),
  approverUserId: int("approverUserId").notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected"]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pactlineAuditEvents = mysqlTable("pactlineAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  workspaceId: int("workspaceId").notNull(),
  runId: int("runId"),
  actorUserId: int("actorUserId"),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  payload: json("payload"),
  previousHash: varchar("previousHash", { length: 128 }),
  eventHash: varchar("eventHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type PactlineRunSnapshot = typeof pactlineRunSnapshots.$inferSelect;
export type PactlineRun = typeof pactlineRuns.$inferSelect;
export type PactlineAction = typeof pactlineActions.$inferSelect;
export type PactlineApproval = typeof pactlineApprovals.$inferSelect;
export type PactlineAuditEvent = typeof pactlineAuditEvents.$inferSelect;