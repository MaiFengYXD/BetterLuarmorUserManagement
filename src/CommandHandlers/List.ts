import { ChatInputCommandInteraction, AttachmentBuilder } from "discord.js"
import { Database } from "../Database/index.ts"
import { UpdateIssuedKey, IsUpdating } from "../Utilities/UpdateIssuedKey.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { eq } from "drizzle-orm"

export default async function List(Interaction: ChatInputCommandInteraction) {
    const Status = Interaction.options.getString("status", true)

    if (!(Status === "used" || Status === "unused" || Status === "issued")) {
        return await Interaction.editReply({
            content: "❌ Invalid status to list.",
        })
    }

    if (Status === "issued") {
        if (IsUpdating()) {
            return await Interaction.editReply({
                content: "❌ The database is busy updating issued keys. Please wait a moment and try again.",
            })
        }

        await UpdateIssuedKey()
    }

    const Keys = await Database.select().from(LuarmorUsers).where(eq(LuarmorUsers.status, Status))
    const KeysText = Keys.map((Row) => Row.user_key).join("\n") + "\n"

    await Interaction.editReply({
        content: `📒 Found **${Keys.length}** keys.`,
        files: [new AttachmentBuilder(Buffer.from(KeysText), { name: `${Status}_keys.txt` })],
    })
}
