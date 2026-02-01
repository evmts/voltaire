import * as Keccak256 from "../../crypto/Keccak256/index.js";
/**
 * Compute Selector from function signature
 *
 * Computes the 4-byte function selector as the first 4 bytes of keccak256(signature).
 * Signature must use canonical type names (uint256 not uint, no spaces).
 *
 * @param {string} signature - Function signature (e.g., "transfer(address,uint256)")
 * @returns {import('./SelectorType.js').SelectorType} 4-byte selector
 * @throws {never}
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const sel = Selector.fromSignature('transfer(address,uint256)');
 * // 0xa9059cbb
 * ```
 */
export function fromSignature(signature) {
    const hash = Keccak256.hashString(signature);
    return /** @type {import('./SelectorType.js').SelectorType} */ (hash.slice(0, 4));
}
