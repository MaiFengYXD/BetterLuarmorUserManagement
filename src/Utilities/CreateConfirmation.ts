import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
} from "discord.js"

export default async function CreateConfirmation(
    Interaction: ChatInputCommandInteraction,
    Content: string,
): Promise<[true, ButtonInteraction] | [false, undefined]> {
    const Row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("confirm").setLabel("Confirm").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    )

    const Response = await Interaction.editReply({
        content: Content,
        components: [Row],
    })

    return new Promise((Resolve) => {
        const Collector = Response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        })

        Collector.on("collect", (ButtonInteraction) => {
            Collector.stop("collected")
            Resolve(ButtonInteraction.customId === "confirm" ? [true, ButtonInteraction] : [false, undefined])
        })

        Collector.on("end", (_, Reason) => {
            if (Reason === "collected") return

            Interaction.editReply({
                content: "⌛ Confirmation timed out. Please run the command again.",
                components: [],
            }).catch(() => {})

            Resolve([false, undefined])
        })
    })
}
