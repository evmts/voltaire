import { HEX_BYTE_TABLE } from "../Hex/hexLookup.js";

/**
 * Convert BlockHash to hex string
 *
 * @param {import('./BlockHashType.js').BlockHashType} hash
 * @returns {string}
 */
export function toHex(hash) {
	let result = "0x";
	for (let i = 0; i < hash.length; i++) {
		const val = /** @type {number} */ (hash[i]);
		result += HEX_BYTE_TABLE[val];
	}
	return result;
}
