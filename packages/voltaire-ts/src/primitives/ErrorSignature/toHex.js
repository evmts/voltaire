import * as Hex from "../Hex/index.js";

/**
 * Convert ErrorSignature to hex string
 *
 * @param {import('./ErrorSignatureType.js').ErrorSignatureType} signature - 4-byte error signature
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const hex = ErrorSignature.toHex(signature);
 * // '0xcf479181'
 * ```
 */
export function toHex(signature) {
	return Hex.fromBytes(signature);
}
