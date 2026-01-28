import { randomFillSync } from "crypto"

const Alphabets = Buffer.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
const Mask = 208 // 256 - (256 % Alphabets.length)

export function RandomAlphabetString(Length: number) {
    const Result = Buffer.allocUnsafe(Length)
    const EntropySource = Buffer.allocUnsafe(128)

    let Cursor = 0

    while (Cursor < Length) {
        randomFillSync(EntropySource)

        for (let Index = 0; Index < Length && Cursor < Length; Index++) {
            const Byte = EntropySource[Index]
            if (Byte < Mask) Result[Cursor++] = Alphabets[Byte % 52]
        }
    }

    return Result.toString("ascii")
}
