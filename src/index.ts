import "dotenv/config"

import {
    Client,
    Events,
    GatewayIntentBits,
    GuildMemberRoleManager,
    MessageFlags,
    PermissionFlagsBits,
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder,
} from "discord.js"
import CommandHandlers from "./CommandHandlers/index.ts"

const DiscordClient = new Client({
    intents: [GatewayIntentBits.Guilds],
})

const Rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)

const StatusChoices = [
    {
        name: "used",
        value: "used",
    },
    {
        name: "unused",
        value: "unused",
    },
    {
        name: "issued",
        value: "issued",
    },
]

const Commands = [
    new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete a key")
        .addStringOption((Option) => Option.setName("key").setDescription("The key to delete").setRequired(true)),
    new SlashCommandBuilder().setName("delete_unused").setDescription("Delete all unused keys"),
    new SlashCommandBuilder()
        .setName("generate")
        .setDescription("Generate some keys")
        .addNumberOption((Option) =>
            Option.setName("amount")
                .setDescription("The amount of keys to generate (default: 1)")
                .setRequired(false)
                .setMaxValue(1000)
                .setMinValue(1),
        )
        .addStringOption((Option) =>
            Option.setName("note")
                .setDescription("The note to add (default: null)")
                .setRequired(false)
                .setMaxLength(255),
        ),
    new SlashCommandBuilder()
        .setName("list")
        .setDescription("Get keys of the specified status")
        .addStringOption((Option) =>
            Option.setName("status")
                .setDescription("The status to list")
                .setRequired(true)
                .addChoices(...StatusChoices),
        ),
    new SlashCommandBuilder()
        .setName("query")
        .setDescription("Query a key's information")
        .addStringOption((Option) => Option.setName("key").setDescription("The key to query").setRequired(true)),
    new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Get some unused keys")
        .addNumberOption((Option) =>
            Option.setName("amount")
                .setDescription("The amount of keys to roll (default: 1)")
                .setRequired(false)
                .setMaxValue(1000)
                .setMinValue(1),
        )
        .addStringOption((Option) =>
            Option.setName("note")
                .setDescription("The note to filter by (default: null)")
                .setRequired(false)
                .setMaxLength(255),
        ),
    new SlashCommandBuilder()
        .setName("set_status")
        .setDescription("Set a key's status. Used keys cannot be reset to unused.")
        .addStringOption((Option) => Option.setName("key").setDescription("The key to set status").setRequired(true))
        .addStringOption((Option) =>
            Option.setName("status")
                .setDescription("The status to set")
                .setRequired(true)
                .addChoices(...StatusChoices),
        ),
].map((Command) => Command.toJSON())

DiscordClient.once(Events.ClientReady, async () => {
    try {
        await Rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), {
            body: Commands,
        })
        console.log("Client ready!")
    } catch (Error) {
        console.error(Error)
        process.exit(1)
    }
})

DiscordClient.on(Events.InteractionCreate, async (Interaction) => {
    if (!Interaction.isChatInputCommand()) return
    if (Interaction.guildId !== process.env.GUILD_ID!) return

    try {
        const Member = Interaction.member
        if (!Member) return

        let AccessAllowed = false

        const Roles = Member.roles
        if (Roles instanceof GuildMemberRoleManager) {
            AccessAllowed = Roles.cache.has(process.env.LUARMOR_MANAGER_ROLE_ID!)
        } else {
            AccessAllowed = Roles.includes(process.env.LUARMOR_MANAGER_ROLE_ID!)
        }

        if (!AccessAllowed) {
            const Permissions = Member.permissions
            if (Permissions instanceof PermissionsBitField) {
                AccessAllowed = Permissions.has(PermissionFlagsBits.Administrator)
            } else {
                AccessAllowed = new PermissionsBitField(BigInt(Permissions as string)).has(
                    PermissionFlagsBits.Administrator,
                )
            }

            if (!AccessAllowed) {
                return await Interaction.reply({
                    content: "❌ You do not have permission to use this bot.",
                    flags: MessageFlags.Ephemeral,
                })
            }
        }

        const CommandHandler = CommandHandlers[Interaction.commandName as keyof typeof CommandHandlers]
        if (CommandHandler) {
            await Interaction.reply({
                content: "⏳ Processing...",
                flags: MessageFlags.Ephemeral,
            })

            await CommandHandler(Interaction)
        } else {
            await Interaction.reply({
                content: "❌ Unknown command.",
                flags: MessageFlags.Ephemeral,
            })
        }
    } catch (Error) {
        console.error(Error)
    }
})

DiscordClient.login(process.env.DISCORD_TOKEN!)
