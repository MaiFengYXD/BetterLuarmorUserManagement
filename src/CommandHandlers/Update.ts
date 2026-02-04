import { ChatInputCommandInteraction } from "discord.js"
import { IsUpdating, UpdateIssuedKey } from "../Utilities/UpdateIssuedKey.ts"

export default async function Update(Interaction: ChatInputCommandInteraction) {
    if (IsUpdating()) {
        return await Interaction.editReply({
            content: "❌ The database is busy updating issued keys. Please wait a moment and try again.",
        })
    }

    await UpdateIssuedKey(Interaction.options.getString("key") ?? undefined)
    await Interaction.editReply({
        content: "✅ Updated issued keys.",
    })
}
