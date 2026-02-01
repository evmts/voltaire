const DECIMALS = 9; // Gwei has 9 decimal places relative to Wei
/**
 * Convert Gwei to Wei
 *
 * Parses decimal gwei string and converts to bigint wei value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei (string, supports decimals like "1.5")
 * @returns Amount in Wei (bigint)
 * @throws {Error} If gwei value has more than 9 decimal places
 * @example
 * ```typescript
 * const wei1 = Gwei.toWei(Gwei.from("5"));     // 5000000000n
 * const wei2 = Gwei.toWei(Gwei.from("1.5"));   // 1500000000n
 * const wei3 = Gwei.toWei(Gwei.from("0.001")); // 1000000n
 * ```
 */
export function toWei(gwei) {
    const str = gwei.toString();
    const [intPart, decPart = ""] = str.split(".");
    if (decPart.length > DECIMALS) {
        throw new Error(`Gwei value has too many decimal places (max ${DECIMALS}): ${gwei}`);
    }
    // Pad decimal part to 9 digits
    const paddedDec = decPart.padEnd(DECIMALS, "0");
    // Combine integer and decimal parts
    const combined = intPart + paddedDec;
    // Remove leading zeros and convert to bigint
    const wei = BigInt(combined.replace(/^0+/, "") || "0");
    return wei;
}
