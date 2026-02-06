const SHIFT = 9; // Ether to Gwei: shift decimal 9 places right
/**
 * Convert Ether to Gwei
 *
 * Converts ether string to gwei string (multiplies by 10^9).
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string)
 * @returns Amount in Gwei (string)
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Ether.toGwei(Ether.from("1"));   // "1000000000"
 * const gwei2 = Ether.toGwei(Ether.from("1.5")); // "1500000000"
 * const gwei3 = Ether.toGwei(Ether.from("0.000000001")); // "1"
 * ```
 */
export function toGwei(ether) {
    const str = ether.toString();
    const [intPart, decPart = ""] = str.split(".");
    if (decPart.length <= SHIFT) {
        // Shift right by adding zeros
        const padded = decPart.padEnd(SHIFT, "0");
        const result = (intPart + padded).replace(/^0+/, "") || "0";
        return result;
    }
    // decPart is longer than SHIFT, so we have a decimal result
    const newIntPart = intPart + decPart.slice(0, SHIFT);
    const newDecPart = decPart.slice(SHIFT);
    // Remove leading zeros from int part and trailing zeros from dec part
    const cleanInt = newIntPart.replace(/^0+/, "") || "0";
    const cleanDec = newDecPart.replace(/0+$/, "");
    if (cleanDec === "") {
        return cleanInt;
    }
    return `${cleanInt}.${cleanDec}`;
}
