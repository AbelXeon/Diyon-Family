import { pgTable, pgEnum, uuid, text, timestamp, numeric, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { STATUS_VALUES } from "../status";

export const roleEnum = pgEnum("role", ["owner", "helper"]);
export const statusEnum = pgEnum("payout_status", STATUS_VALUES);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("owner"),
  ownerId: uuid("owner_id"), // for helpers: the owner's id
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    appId: text("app_id").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("members_owner_idx").on(t.ownerId), uniqueIndex("members_owner_app_idx").on(t.ownerId, t.appId)]
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // "YYYY-MM"
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: statusEnum("status").notNull().default("in_progress"),
    paidAt: timestamp("paid_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("payouts_member_month_idx").on(t.memberId, t.month)]
);


export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    actorName: text("actor_name").notNull(),
    type: text("type").notNull(), // member_added | member_updated | member_deleted | status_changed
    subject: text("subject").notNull(), // the member's name
    detail: text("detail"), // for status changes: the new status
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("activity_owner_created_idx").on(t.ownerId, t.createdAt)]
);