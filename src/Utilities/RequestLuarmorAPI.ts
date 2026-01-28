// `api.luarmor.net` is not happy to see common user-agents, so we use some exploits' user-agent to bypass
// if they patch it, you have to whitelist your server's ip address.
const UserAgent = "Seliware"

export default async function RequestLuarmorAPI(Path: string, Method: "GET" | "POST" | "DELETE", Body?: any) {
    return await fetch(`https://api.luarmor.net/v3/projects/${process.env.LUARMOR_PROJECT_ID!}/${Path}`, {
        method: Method,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": UserAgent,
            Authorization: process.env.LUARMOR_API_KEY!,
        },
        body: Body ? JSON.stringify(Body) : undefined,
    })
}
