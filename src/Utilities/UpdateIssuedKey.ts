import { and, eq, sql } from "drizzle-orm"
import { Database } from "../Database/index.ts"
import { LuarmorUsers } from "../Database/Schema.ts"
import RequestLuarmorAPI from "./RequestLuarmorAPI.ts"

let _IsUpdating = false

function CaseStatus(Status: "reset" | "active" | "banned", DiscordId: string): "used" | "unused" {
    switch (Status) {
        case "reset":
            return DiscordId.length === 0 ? "unused" : "used"
        case "active":
            return "used"
        case "banned":
            return "used"
        default:
            throw `Invalid key status: ${Status}`
    }
}

export async function UpdateIssuedKey(Key?: string) {
    if (_IsUpdating) return
    _IsUpdating = true

    try {
        const TargetUpdateKeys = await Database.select()
            .from(LuarmorUsers)
            .where(
                Key
                    ? and(eq(LuarmorUsers.user_key, Key), eq(LuarmorUsers.status, "issued"))
                    : eq(LuarmorUsers.status, "issued"),
            )

        if (TargetUpdateKeys.length === 0) return

        const APIResponse = await RequestLuarmorAPI(Key ? `users?user_key=${Key}` : "users", "GET")

        if (APIResponse.status !== 200) throw `Request Luarmor API failed: ${APIResponse.statusText}`

        const ResponseJson = (await APIResponse.json()) as {
            success: boolean
            message: string
            users: { user_key: string; status: "active" | "reset" | "banned"; note: string; discord_id: string }[]
        }

        if (!ResponseJson.success) throw `Luarmor API internal error: ${ResponseJson.message ?? ResponseJson}`

        const KeysMap = new Map<string, (typeof TargetUpdateKeys)[number]>()
        for (const Key of TargetUpdateKeys) KeysMap.set(Key.user_key, Key)

        const ChangedKeys = ResponseJson.users
            .map((User) => ({
                user_key: User.user_key,
                status: CaseStatus(User.status, User.discord_id),
                note: User.note.length === 0 ? undefined : User.note,
            }))
            .filter((Item) => {
                const ExistingKey = KeysMap.get(Item.user_key)
                return !ExistingKey || (ExistingKey.status === "issued" && Item.status === "used")
            })

        if (ChangedKeys.length > 0) {
            await Database.insert(LuarmorUsers)
                .values(ChangedKeys)
                .onConflictDoUpdate({
                    target: LuarmorUsers.user_key,
                    set: {
                        status: sql`excluded.status`,
                        note: sql`excluded.note`,
                    },
                    where: sql`luarmor_users.status IS NOT excluded.status OR luarmor_users.note IS NOT excluded.note`,
                })
        }
    } catch (Error) {
        console.error("Failed to update key status(es):", Error)
    } finally {
        _IsUpdating = false
    }
}

export const IsUpdating = () => _IsUpdating
