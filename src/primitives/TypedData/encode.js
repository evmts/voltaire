import * as Domain from "../Domain/index.js";

/**
 * Encode EIP-712 typed data message
 *
 * Returns the encoded message data (without domain separator)
 *
 * @param {import('./TypedDataType.js').TypedDataType} typedData - TypedData
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded message data
 * @example
 * ```javascript
 * const encoded = TypedData.encode(typedData, { keccak256 });
 * ```
 */
export function encode(typedData, crypto) {
	return Domain.encodeData(
		typedData.primaryType,
		typedData.message,
		typedData.types,
		crypto,
	);
}
