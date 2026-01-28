import { ChatInputCommandInteraction } from "discord.js"
import { Database } from "../Database/index.ts"
import { UpdateIssuedKey, IsUpdating } from "../Utilities/UpdateIssuedKey.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { eq } from "drizzle-orm"

const InfoTemplate = `
# 🔑 Key Information

**User Key**: \`{user_key}\`
**Status**: \`{status}\`
**Note**: \`{note}\``

export default async function Query(Interaction: ChatInputCommandInteraction) {
    if (IsUpdating()) {
        return await Interaction.editReply({
            content: "❌ The database is busy updating issued keys. Please wait a moment and try again.",
        })
    }

    const Key = Interaction.options.getString("key", true)
    await UpdateIssuedKey(Key)

    const Result = await Database.select().from(LuarmorUsers).where(eq(LuarmorUsers.user_key, Key))
    const KeyData = Result[0]

    if (!KeyData) {
        return await Interaction.editReply({
            content: "❌ Key not found.",
        })
    }

    await Interaction.editReply({
        content: InfoTemplate.replace("{user_key}", KeyData.user_key)
            .replace("{status}", KeyData.status)
            .replace("{note}", KeyData.note ?? "(none)"),
    })
}
