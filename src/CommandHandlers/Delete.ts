import { ChatInputCommandInteraction } from "discord.js"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { eq } from "drizzle-orm"
import RequestLuarmorAPI from "../Utilities/RequestLuarmorAPI.ts"

export default async function Delete(Interaction: ChatInputCommandInteraction) {
    const Key = Interaction.options.getString("key", true)!
    const KeyData = await Database.select().from(LuarmorUsers).where(eq(LuarmorUsers.user_key, Key)).limit(1)

    const FoundKey = KeyData[0]
    if (!FoundKey) {
        return await Interaction.editReply({
            content: "❌ Key not found.",
        })
    }

    let DeletedFromLuarmor = false

    if (FoundKey.status !== "unused") {
        const APIResponse = await RequestLuarmorAPI(`users/${FoundKey.user_key}`, "DELETE")

        if (APIResponse.status !== 200) {
            return await Interaction.editReply({
                content: `❌ Failed to delete key from Luarmor: HTTP error: ${APIResponse.statusText}.`,
            })
        }

        const ResponseJson = (await APIResponse.json()) as { success: boolean; message: string }
        if (!ResponseJson.success) {
            return await Interaction.editReply({
                content: `❌ Failed to delete key from Luarmor: ${
                    ResponseJson.message ?? JSON.stringify(ResponseJson).slice(0, 3900)
                }.`,
            })
        }

        DeletedFromLuarmor = true
    }

    const Result = await Database.delete(LuarmorUsers).where(eq(LuarmorUsers.user_key, Key))

    if (Result.rowsAffected > 0) {
        await Interaction.editReply({
            content: "✅ Key deleted.",
        })
    } else {
        await Interaction.editReply({
            content: `❓ No affected rows after deleting the key.${
                DeletedFromLuarmor ? " But it was deleted successfully from Luarmor." : ""
            }`,
        })
    }
}
