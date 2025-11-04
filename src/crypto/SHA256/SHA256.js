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
 * Factory function for creating SHA256 hash
 *
 * @param {Uint8Array} data - Data to hash
 * @returns {Uint8Array} 32-byte hash
 */
export function SHA256(data) {
	return hash(data);
}

SHA256.hash = hash;
SHA256.hashString = hashString;
SHA256.hashHex = hashHex;
SHA256.toHex = toHex;
SHA256.create = create;
SHA256.OUTPUT_SIZE = OUTPUT_SIZE;
SHA256.BLOCK_SIZE = BLOCK_SIZE;
