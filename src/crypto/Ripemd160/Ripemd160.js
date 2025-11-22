// @ts-nocheck
export { SIZE, HEX_SIZE } from "./constants.js";

import { HEX_SIZE, SIZE } from "./constants.js";
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";
import { hashString } from "./hashString.js";

// Export individual functions
export { from, hash, hashHex, hashString };

/**
 * Ripemd160Hash - Type-safe RIPEMD160 hash namespace
 *
 * Pure TypeScript RIPEMD160 implementation using @noble/hashes.
 * All methods return branded Ripemd160Hash type.
 *
 * @example
 * ```typescript
 * import { Ripemd160Hash } from './Ripemd160.js';
 *
 * // Preferred: Type-safe constructors
 * const hash1 = Ripemd160Hash.from("hello");           // String
 * const hash2 = Ripemd160Hash.fromString("hello");     // String
 * const hash3 = Ripemd160Hash.from(uint8array);        // Bytes
 *
 * // Also available: legacy method names
 * const hash4 = Ripemd160Hash.hash(data);
 * const hash5 = Ripemd160Hash.hashString('hello');
 * ```
 */
export const Ripemd160Hash = Object.assign(from, {
	// Primary API (type-safe constructors)
	from,
	fromString: hashString,
	fromHex: hashHex,

	// Legacy API (kept for compatibility)
	hash,
	hashString,
	hashHex,

	// Constants
	SIZE,
	HEX_SIZE,
});

/**
 * @deprecated Use Ripemd160Hash instead
 * Ripemd160 alias maintained for backward compatibility
 */
export const Ripemd160 = Ripemd160Hash;
