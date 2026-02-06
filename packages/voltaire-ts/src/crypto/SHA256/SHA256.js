// @ts-nocheck
export * from "./constants.js";

import { BLOCK_SIZE, OUTPUT_SIZE } from "./constants.js";
import { create } from "./create.js";
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";
import { hashString } from "./hashString.js";
import { toHex } from "./toHex.js";

// Export individual functions
export { from, hash, hashString, hashHex, toHex, create };

/**
 * SHA256Hash - Type-safe SHA256 hash namespace
 *
 * Pure TypeScript SHA256 implementation using @noble/hashes.
 * All methods return branded SHA256Hash type.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { SHA256Hash } from './crypto/SHA256/index.js';
 *
 * // Preferred: Type-safe constructors
 * const hash1 = SHA256Hash.from("0x1234");        // Hex string
 * const hash2 = SHA256Hash.fromString("hello");   // UTF-8 string
 * const hash3 = SHA256Hash.from(uint8array);      // Bytes
 *
 * // Also available: legacy method names
 * const hash4 = SHA256Hash.hash(data);
 * const hash5 = SHA256Hash.hashString('hello');
 * const hash6 = SHA256Hash.hashHex('0x1234');
 * ```
 */
export const SHA256Hash = Object.assign(from, {
	// Primary API (type-safe constructors)
	from,
	fromString: hashString,
	fromHex: hashHex,

	// Legacy API (kept for compatibility)
	hash,
	hashString,
	hashHex,

	// Utilities
	toHex,
	create,

	// Constants
	OUTPUT_SIZE,
	BLOCK_SIZE,
});

/**
 * @deprecated Use SHA256Hash instead
 * SHA256 alias maintained for backward compatibility
 */
export const SHA256 = SHA256Hash;
