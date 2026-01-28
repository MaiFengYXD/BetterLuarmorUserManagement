import { ChatInputCommandInteraction } from "discord.js"
import { RandomAlphabetString } from "../Utilities/Random.ts"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"

export default async function Generate(Interaction: ChatInputCommandInteraction) {
    const Amount = Math.max(Interaction.options.getNumber("amount") ?? 1, 1)
    const Note = Interaction.options.getString("note")?.slice(0, 255)

    const GeneratedKeys = Array.from({ length: Amount }, () => RandomAlphabetString(32))

    const Result = await Database.insert(LuarmorUsers)
        .values(
            GeneratedKeys.map((Key) => ({
                user_key: Key,
                note: Note,
            })),
        )
        .onConflictDoNothing()

    if (Result.rowsAffected > 0) {
        await Interaction.editReply({
            content:
                Result.rowsAffected < Amount
                    ? `⚠️ Generated **${Amount}** keys but only **${Result.rowsAffected}** were unique! Which is a 1/52³² chance of collision BRO UDD🤯🤯.\nPlease regenerate if needed.`
                    : `✅ Generated **${Amount}** keys.`,
        })
    } else {
        await Interaction.editReply({
            content: "❓ No affected rows after generation. Maybe some HTTP requests failed. Please try again.",
        })
    }
}
