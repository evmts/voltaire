// @ts-nocheck
export * from "./constants.js";

import { BLOCK_SIZE, OUTPUT_SIZE } from "./constants.js";
import { create } from "./create.js";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";
import { hashString } from "./hashString.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { hash, hashString, hashHex, toHex, create };

/**
 * SHA256 constructor - auto-detects input type (string, hex, or bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string | Uint8Array} data - Data to hash (auto-detects type)
 * @returns {Uint8Array} 32-byte hash
 * @throws {never}
 * @example
 * ```javascript
 * import { SHA256 } from './crypto/SHA256/index.js';
 * const hash1 = SHA256("hello");           // String
 * const hash2 = SHA256("0xdeadbeef");      // Hex
 * const hash3 = SHA256(new Uint8Array([1, 2, 3])); // Bytes
 * ```
 */
export function SHA256(data) {
	if (typeof data === "string") {
		if (data.startsWith("0x") || /^[0-9a-fA-F]+$/.test(data)) {
			return hashHex(data);
		}
		return hashString(data);
	}
	return hash(data);
}

SHA256.hash = hash;
SHA256.hashString = hashString;
SHA256.hashHex = hashHex;
SHA256.toHex = toHex;
SHA256.create = create;
SHA256.OUTPUT_SIZE = OUTPUT_SIZE;
SHA256.BLOCK_SIZE = BLOCK_SIZE;
