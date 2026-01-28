import { ChatInputCommandInteraction } from "discord.js"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { and, eq, ne } from "drizzle-orm"
import { IsUpdating, UpdateIssuedKey } from "../Utilities/UpdateIssuedKey.ts"

export default async function SetStatus(Interaction: ChatInputCommandInteraction) {
    const Key = Interaction.options.getString("key", true)
    const Status = Interaction.options.getString("status", true)

    if (!(Status === "used" || Status === "unused" || Status === "issued")) {
        return await Interaction.editReply({
            content: "❌ Invalid status to set.",
        })
    }

    if (IsUpdating()) {
        return await Interaction.editReply({
            content: "❌ The database is busy updating issued keys. Please wait a moment and try again.",
        })
    }

    await UpdateIssuedKey(Key)

    const Result = await Database.update(LuarmorUsers)
        .set({
            status: Status,
        })
        .where(and(eq(LuarmorUsers.user_key, Key), ne(LuarmorUsers.status, Status), ne(LuarmorUsers.status, "used")))

    if (Result.rowsAffected > 0) {
        await Interaction.editReply({
            content: `✅ Key status set to \`${Status}\`.`,
        })
    } else {
        await Interaction.editReply({
            content: "❓ No affected rows after setting status. Could because the key doesn't exist or already used.",
        })
    }
}
