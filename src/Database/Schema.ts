import { sql } from "drizzle-orm"
import { index, sqliteTable } from "drizzle-orm/sqlite-core"
import { text } from "drizzle-orm/sqlite-core"

export const LuarmorUsers = sqliteTable(
    "luarmor_users",
    {
        user_key: text("user_key").primaryKey(),
        status: text("status", { enum: ["unused", "used", "issued"] })
            .notNull()
            .default("unused"),
        note: text("note"),
    },
    (Table) => ({
        index_issued: index("index_issued")
            .on(Table.status)
            .where(sql`status = 'issued'`),
        index_unused: index("index_unused")
            .on(Table.status)
            .where(sql`status = 'unused'`),
        index_used: index("index_used")
            .on(Table.status)
            .where(sql`status = 'used'`),
    }),
)
