import { SIZE } from "./constants.js";
import { InvalidBytes32ValueError } from "./errors.js";
/**
 * Max value for Bytes32 (2^256 - 1)
 */
const MAX_U256 = (1n << 256n) - 1n;
/**
 * Create Bytes32 from bigint (big-endian)
 *
 * @param {bigint} value - Bigint to convert (must fit in 256 bits)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidBytes32ValueError} If value is negative or exceeds 256 bits
 *
 * @example
 * ```typescript
 * const b32 = Bytes32.fromBigint(0x123456789abcdef0n);
 * ```
 */
export function fromBigint(value) {
    if (value < 0n) {
        throw new InvalidBytes32ValueError("Value cannot be negative", {
            value,
        });
    }
    if (value > MAX_U256) {
        throw new InvalidBytes32ValueError("Value exceeds 256 bits", {
            value,
            expected: `0 <= value <= ${MAX_U256}`,
        });
    }
    const result = new Uint8Array(SIZE);
    let n = value;
    for (let i = SIZE - 1; i >= 0; i--) {
        result[i] = Number(n & 0xffn);
        n >>= 8n;
    }
    return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (result);
}
