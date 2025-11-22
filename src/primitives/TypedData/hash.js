import * as Domain from "../Domain/index.js";
import * as Hash from "../Hash/index.js";

/**
 * Compute EIP-712 typed data hash for signing
 *
 * hash = keccak256("\x19\x01" || domainSeparator || messageHash)
 *
 * @param {import('./TypedDataType.js').TypedDataType} typedData - TypedData
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {import('../Hash/HashType.js').HashType} Hash for signing
 * @example
 * ```javascript
 * import { keccak256 } from './crypto/Keccak256/index.js';
 * const hash = TypedData.hash(typedData, { keccak256 });
 * const signature = await wallet.signMessage(hash);
 * ```
 */
export function hash(typedData, crypto) {
	// Compute domain separator hash
	const domainSeparator = Domain.toHash(typedData.domain, crypto);

	// Compute message hash
	const messageHash = Domain.encodeData(
		typedData.primaryType,
		typedData.message,
		typedData.types,
		crypto,
	);
	const messageHashBytes = crypto.keccak256(messageHash);

	// Concatenate: "\x19\x01" || domainSeparator || messageHash
	const data = new Uint8Array(2 + 32 + 32);
	data[0] = 0x19;
	data[1] = 0x01;
	data.set(domainSeparator, 2);
	data.set(messageHashBytes, 34);

	// Hash the concatenated data
	const result = crypto.keccak256(data);
	return /** @type {import('../Hash/HashType.js').HashType} */ (result);
}
