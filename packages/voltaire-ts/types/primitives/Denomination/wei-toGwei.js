const DECIMALS = 9; // Gwei has 9 decimal places relative to Wei
/**
 * Convert Wei to Gwei
 *
 * Converts bigint wei to decimal string gwei value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Gwei (string with decimal precision)
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Wei.toGwei(Wei.from(5000000000n)); // "5"
 * const gwei2 = Wei.toGwei(Wei.from(1500000000n)); // "1.5"
 * const gwei3 = Wei.toGwei(Wei.from(1000000n));    // "0.001"
 * ```
 */
export function toGwei(wei) {
    const weiStr = wei.toString().padStart(DECIMALS + 1, "0");
    const intPart = weiStr.slice(0, -DECIMALS) || "0";
    const decPart = weiStr.slice(-DECIMALS);
    // Remove trailing zeros from decimal part
    const trimmedDec = decPart.replace(/0+$/, "");
    if (trimmedDec === "") {
        return intPart;
    }
    return `${intPart}.${trimmedDec}`;
}
