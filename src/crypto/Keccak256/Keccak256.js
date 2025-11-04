// @ts-nocheck
export * from "./constants.js";

import { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
import { contractAddress } from "./contractAddress.js";
import { create2Address } from "./create2Address.js";
import { hash } from "./hash.js";
import { hashHex } from "./hashHex.js";
import { hashMultiple } from "./hashMultiple.js";
import { hashString } from "./hashString.js";
import { selector } from "./selector.js";
import { topic } from "./topic.js";

// Export individual functions
export {
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
 * Keccak256 Hash Function
 *
 * Pure TypeScript Keccak256 implementation using @noble/hashes.
 * Data-first API following primitives pattern.
 *
 * @example
 * ```typescript
 * import { Keccak256 } from './Keccak256.js';
 *
 * // Hash bytes
 * const hash = Keccak256.hash(data);
 *
 * // Hash string
 * const hash = Keccak256.hashString('hello');
 *
 * // Hash hex
 * const hash = Keccak256.hashHex('0x1234...');
 * ```
 */
export const Keccak256 = {
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
};
