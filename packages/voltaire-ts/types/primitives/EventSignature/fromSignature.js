import * as Keccak256 from "../../crypto/Keccak256/index.js";
/**
 * Compute EventSignature from event signature string
 *
 * Computes the 32-byte event signature as keccak256(signature).
 * Used as topic[0] in Ethereum event logs.
 * Signature must use canonical type names (uint256 not uint, no spaces).
 *
 * @param {string} signature - Event signature (e.g., "Transfer(address,address,uint256)")
 * @returns {import('./EventSignatureType.js').EventSignatureType} 32-byte event signature
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventSignature from './primitives/EventSignature/index.js';
 * const sig = EventSignature.fromSignature('Transfer(address,address,uint256)');
 * // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 * ```
 */
export function fromSignature(signature) {
    const hash = Keccak256.hashString(signature);
    return /** @type {import('./EventSignatureType.js').EventSignatureType} */ (
    /** @type {unknown} */ (hash));
}
