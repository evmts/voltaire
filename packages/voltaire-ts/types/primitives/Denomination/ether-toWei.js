const DECIMALS = 18;
/**
 * Convert Ether to Wei
 *
 * Parses decimal string and converts to bigint wei value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string, supports decimals like "1.5")
 * @returns Amount in Wei (bigint)
 * @throws {Error} If ether value has more than 18 decimal places
 * @example
 * ```typescript
 * const wei1 = Ether.toWei(Ether.from("1"));     // 1000000000000000000n
 * const wei2 = Ether.toWei(Ether.from("1.5"));   // 1500000000000000000n
 * const wei3 = Ether.toWei(Ether.from("0.001")); // 1000000000000000n
 * ```
 */
export function toWei(ether) {
    const str = ether.toString();
    const [intPart, decPart = ""] = str.split(".");
    if (decPart.length > DECIMALS) {
        throw new Error(`Ether value has too many decimal places (max ${DECIMALS}): ${ether}`);
    }
    // Pad decimal part to 18 digits
    const paddedDec = decPart.padEnd(DECIMALS, "0");
    // Combine integer and decimal parts
    const combined = intPart + paddedDec;
    // Remove leading zeros and convert to bigint
    const wei = BigInt(combined.replace(/^0+/, "") || "0");
    return wei;
}
