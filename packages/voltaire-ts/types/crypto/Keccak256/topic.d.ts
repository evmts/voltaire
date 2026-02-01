/**
 * Compute event topic (32-byte Keccak-256 hash)
 *
 * Used for Ethereum event signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} signature - Event signature string
 * @returns {import('./Keccak256HashType.js').Keccak256Hash} 32-byte topic
 * @throws {never}
 * @example
 * ```javascript
 * import { Keccak256Hash } from './crypto/Keccak256/index.js';
 * const topic = Keccak256Hash.fromTopic('Transfer(address,address,uint256)');
 * ```
 */
export function topic(signature: string): import("./Keccak256HashType.js").Keccak256Hash;
//# sourceMappingURL=topic.d.ts.map