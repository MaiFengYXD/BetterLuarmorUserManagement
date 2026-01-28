import { ChatInputCommandInteraction } from "discord.js"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import { eq } from "drizzle-orm"
import CreateConfirmation from "../Utilities/CreateConfirmation.ts"

export default async function DeleteUnused(Interaction: ChatInputCommandInteraction) {
    const [Confirmed, ButtonInteraction] = await CreateConfirmation(
        Interaction,
        "Are you sure you want to delete all unused keys? This action is irreversible.",
    )

    if (!Confirmed) return

    const Result = await Database.delete(LuarmorUsers).where(eq(LuarmorUsers.status, "unused"))

    if (Result.rowsAffected > 0) {
        await ButtonInteraction.update({
            content: "✅ Unused keys deleted.",
            components: [],
        })
    } else {
        await ButtonInteraction.update({
            content: "❓ No affected rows after deletion. Please check if there are any unused keys.",
            components: [],
        })
    }
}
