/**
 * Convert PrivateKey to hex string
 *
 * @param this - Private key
 * @returns Hex string
 *
 * @example
 * ```typescript
 * const hex = PrivateKey._toHex.call(pk);
 * ```
 */
export function toHex() {
    return `0x${Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
