/**
 * Factory: Hash EIP-712 domain separator.
 *
 * Only includes fields that are defined in the domain object.
 * Validates that all fields have correct types per EIP-712 spec.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(primaryType: string, data: import('../EIP712Type.js').Message, types: import('../EIP712Type.js').TypeDefinitions) => import('../../../primitives/Hash/index.js').HashType} deps.hashStruct - Hash struct function
 * @returns {(domain: import('../EIP712Type.js').Domain) => import('../../../primitives/Hash/index.js').HashType} Function that hashes domain
 * @throws {Eip712InvalidDomainError} If domain field has invalid type
 * @throws {Eip712TypeNotFoundError} If domain type encoding fails
 * @example
 * ```javascript
 * import { Hash as HashDomain } from './crypto/EIP712/Domain/hash.js';
 * import { HashStruct } from '../hashStruct.js';
 * import { hash as keccak256 } from '../../Keccak256/hash.js';
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const hashDomain = HashDomain({ hashStruct });
 * const domain = { name: 'MyApp', version: '1', chainId: 1n };
 * const domainHash = hashDomain(domain);
 * ```
 */
export function Hash({ hashStruct }: {
    hashStruct: (primaryType: string, data: import("../EIP712Type.js").Message, types: import("../EIP712Type.js").TypeDefinitions) => import("../../../primitives/Hash/index.js").HashType;
}): (domain: import("../EIP712Type.js").Domain) => import("../../../primitives/Hash/index.js").HashType;
//# sourceMappingURL=hash.d.ts.map