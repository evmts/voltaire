import { InvalidBytes32ValueError } from "./errors.js";
import { toBigint } from "./toBigint.js";
/**
 * Max safe integer as bigint
 */
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
/**
 * Convert Bytes32 to number (big-endian)
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to convert
 * @returns {number} Number representation
 * @throws {InvalidBytes32ValueError} If value exceeds Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Bytes32.toNumber(b32);
 * ```
 */
export function toNumber(bytes32) {
    const bigValue = toBigint(bytes32);
    if (bigValue > MAX_SAFE) {
        throw new InvalidBytes32ValueError("Value exceeds Number.MAX_SAFE_INTEGER, use toBigint instead", {
            value: bigValue,
            expected: `<= ${Number.MAX_SAFE_INTEGER}`,
        });
    }
    return Number(bigValue);
}
