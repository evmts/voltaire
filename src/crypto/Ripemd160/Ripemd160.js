// @ts-nocheck
import { CryptoError } from "../../primitives/errors/CryptoError.js";
import { SIZE } from "./constants.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";

export { SIZE };
export { hash };
export { hashString };

/**
 * Ripemd160 constructor - auto-detects input type (string or bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string | Uint8Array} data - Data to hash (auto-detects type)
 * @returns {Uint8Array} 20-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { Ripemd160 } from './crypto/Ripemd160/index.js';
 * const hash1 = Ripemd160("hello");        // String
 * const hash2 = Ripemd160(new Uint8Array([1, 2, 3])); // Bytes
 * console.log(hash1.length); // 20
 * ```
 */
export function Ripemd160(data) {
	return hash(data);
}

// Attach namespace methods for backward compatibility
Ripemd160.hash = hash;
Ripemd160.hashString = hashString;
Ripemd160.SIZE = SIZE;
