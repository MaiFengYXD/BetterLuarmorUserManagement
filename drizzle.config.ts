import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    out: "./drizzle",
    schema: "./src/Database/Schema.ts",
    dialect: "turso",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN!,
    },
})
