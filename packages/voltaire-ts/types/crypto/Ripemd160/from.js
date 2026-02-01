import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
/**
 * Hash input with RIPEMD160 (constructor pattern)
 *
 * Auto-detects input type and hashes accordingly:
 * - Uint8Array: hash directly
 * - string: UTF-8 encode then hash
 *
 * @see https://voltaire.tevm.sh/crypto/ripemd160 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array | string} input - Data to hash
 * @returns {import('./Ripemd160HashType.js').Ripemd160Hash} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160Hash } from './crypto/Ripemd160/index.js';
 *
 * const hash1 = Ripemd160Hash.from("hello");           // String
 * const hash2 = Ripemd160Hash.from(uint8array);        // Bytes
 * ```
 */
export function from(input) {
    if (input instanceof Uint8Array) {
        return hash(input);
    }
    if (typeof input === "string") {
        return hashString(input);
    }
    throw new TypeError(`Invalid input type. Expected Uint8Array or string, got ${typeof input}`);
}
