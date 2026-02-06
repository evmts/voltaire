/**
 * Get signing hash for authorization (EIP-7702).
 *
 * Per EIP-7702: keccak256(MAGIC || rlp([chain_id, address, nonce]))
 * MAGIC = 0x05
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to hash
 * @returns {import('../../Hash/index.js').HashType} Signing hash
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getSigningHash } from './primitives/Transaction/Authorization/getSigningHash.js';
 * const hash = getSigningHash(auth);
 * ```
 */
export function getSigningHash(auth: import("./BrandedAuthorization.js").BrandedAuthorization): import("../../Hash/index.js").HashType;
//# sourceMappingURL=getSigningHash.d.ts.map