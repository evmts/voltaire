/**
 * Create Domain from object
 *
 * @param {object} domain - Domain object
 * @param {string} [domain.name] - dApp name
 * @param {string} [domain.version] - Domain version
 * @param {import('../ChainId/ChainIdType.js').ChainIdType | number} [domain.chainId] - EIP-155 chain ID
 * @param {import('../Address/AddressType.js').AddressType | string} [domain.verifyingContract] - Contract address
 * @param {import('../Hash/HashType.js').HashType | string} [domain.salt] - Salt for disambiguation
 * @returns {import('./DomainType.js').DomainType} Domain
 * @throws {InvalidDomainError} If domain has no fields
 * @example
 * ```javascript
 * import * as Domain from './primitives/Domain/index.js';
 * const domain = Domain.from({
 *   name: 'MyDApp',
 *   version: '1',
 *   chainId: 1,
 *   verifyingContract: '0x123...'
 * });
 * ```
 */
export function from(domain: {
    name?: string | undefined;
    version?: string | undefined;
    chainId?: number | ChainId.ChainIdType | undefined;
    verifyingContract?: string | BrandedAddress.AddressType | undefined;
    salt?: string | Hash.HashType | undefined;
}): import("./DomainType.js").DomainType;
import * as ChainId from "../ChainId/index.js";
import * as BrandedAddress from "../Address/internal-index.js";
import * as Hash from "../Hash/index.js";
//# sourceMappingURL=from.d.ts.map