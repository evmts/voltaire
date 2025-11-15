// @ts-nocheck
export * from "./constants.js";

import { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
import { contractAddress } from "./contractAddress.js";
import { create2Address } from "./create2Address.js";
import { from } from "./from.js";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";
import { hashMultiple } from "./hashMultiple.js";
import { hashString } from "./hashString.js";
import { selector } from "./selector.js";
import { topic } from "./topic.js";

// Export individual functions
export {
	from,
	hash,
	hashString,
	hashHex,
	hashMultiple,
	selector,
	topic,
	contractAddress,
	create2Address,
};

/**
 * Keccak256 Hash Function (Constructor Pattern)
 *
 * Pure TypeScript Keccak256 implementation using @noble/hashes.
 * Auto-detects input type and hashes accordingly.
 *
 * @example
 * ```typescript
 * import { Keccak256 } from './Keccak256.js';
 *
 * // Constructor pattern (auto-detect)
 * const hash1 = Keccak256("0x1234");      // Hex
 * const hash2 = Keccak256("hello");       // String
 * const hash3 = Keccak256(uint8array);    // Bytes
 *
 * // Namespace pattern (legacy - still supported)
 * const hash4 = Keccak256.hash(data);
 * const hash5 = Keccak256.hashString('hello');
 * const hash6 = Keccak256.hashHex('0x1234...');
 * ```
 */
export const Keccak256 = Object.assign(from, {
	hash,
	hashString,
	hashHex,
	hashMultiple,
	selector,
	topic,
	contractAddress,
	create2Address,
	DIGEST_SIZE,
	RATE,
	STATE_SIZE,
});
