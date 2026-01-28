import { randomBytes, randomFillSync } from "crypto"

const Alphabets = Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")

export function RandomAlphabetString(Length: number) {
    const Bytes = randomFillSync(Buffer.allocUnsafe(Length))
    const Result = Buffer.allocUnsafe(Length)

    for (let Index = 0; Index < Length; Index++) {
        let Byte = Bytes[Index]
        while (Byte >= 208) Byte = randomBytes(1)[0]

        Result[Index] = Alphabets[Byte % 52]
    }

    return Result.toString("ascii")
}
