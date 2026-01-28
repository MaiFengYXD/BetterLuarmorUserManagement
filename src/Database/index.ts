import { drizzle } from "drizzle-orm/libsql"

export const Database = drizzle({
    connection: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN!,
    },
})
