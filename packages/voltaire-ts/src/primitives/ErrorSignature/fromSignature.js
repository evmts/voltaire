import * as Keccak256 from "../../crypto/Keccak256/index.js";

/**
 * Compute ErrorSignature from error signature string
 *
 * Computes the 4-byte error signature as the first 4 bytes of keccak256(signature).
 * Used in Ethereum revert data.
 * Signature must use canonical type names (uint256 not uint, no spaces).
 *
 * @param {string} signature - Error signature (e.g., "InsufficientBalance(uint256,uint256)")
 * @returns {import('./ErrorSignatureType.js').ErrorSignatureType} 4-byte error signature
 * @throws {never}
 * @example
 * ```javascript
 * import * as ErrorSignature from './primitives/ErrorSignature/index.js';
 * const sig = ErrorSignature.fromSignature('InsufficientBalance(uint256,uint256)');
 * // 0xcf479181
 * ```
 */
export function fromSignature(signature) {
	const hash = Keccak256.hashString(signature);
	return /** @type {import('./ErrorSignatureType.js').ErrorSignatureType} */ (
		hash.slice(0, 4)
	);
}
