import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { eq, inArray } from "drizzle-orm"
import RequestLuarmorAPI from "../Utilities/RequestLuarmorAPI.ts"

export default async function Roll(Interaction: ChatInputCommandInteraction) {
    const Amount = Interaction.options.getNumber("amount") ?? 1
    const Keys = await Database.select().from(LuarmorUsers).where(eq(LuarmorUsers.status, "unused")).limit(Amount)

    const ImportKeysData = {
        users: Keys.map((Row) => ({
            user_key: Row.user_key,
        })),
    }

    const APIResponse = await RequestLuarmorAPI("users/import", "POST", ImportKeysData)

    if (APIResponse.status !== 200) {
        return await Interaction.editReply({
            content: `❌ Failed to import keys to Luarmor: HTTP error: ${APIResponse.statusText}.`,
        })
    }

    const ResponseJson = (await APIResponse.json()) as { success: boolean; message: string }
    if (!ResponseJson.success) {
        return await Interaction.editReply({
            content: `❌ Failed to import keys to Luarmor: ${
                ResponseJson.message ?? JSON.stringify(ResponseJson).slice(0, 3900)
            }.`,
        })
    }

    await Database.update(LuarmorUsers)
        .set({ status: "issued" })
        .where(
            inArray(
                LuarmorUsers.user_key,
                Keys.map((Key) => Key.user_key),
            ),
        )

    const KeysText = Keys.map((Row) => Row.user_key).join("\n") + "\n"

    await Interaction.editReply({
        content:
            Keys.length < Amount
                ? `⚠️ Expected **${Amount}** unused keys, but only **${Keys.length}** unused keys were found in the database.`
                : `Rolled **${Amount}** unused keys.`,
        files: [new AttachmentBuilder(Buffer.from(KeysText), { name: `${Amount}_unused_keys.txt` })],
    })
}
