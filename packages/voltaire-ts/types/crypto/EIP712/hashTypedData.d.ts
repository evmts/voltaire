/**
 * Factory: Hash typed data according to EIP-712 specification.
 *
 * Computes: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(domain: import('./EIP712Type.js').Domain) => import('../../primitives/Hash/index.js').HashType} deps.hashDomain - Hash domain function
 * @param {(primaryType: string, data: import('./EIP712Type.js').Message, types: import('./EIP712Type.js').TypeDefinitions) => import('../../primitives/Hash/index.js').HashType} deps.hashStruct - Hash struct function
 * @returns {(typedData: import('./EIP712Type.js').TypedData) => import('../../primitives/Hash/index.js').HashType} Function that hashes typed data
 * @throws {Eip712TypeNotFoundError} If types are not found
 * @throws {Eip712InvalidMessageError} If message data is invalid
 * @example
 * ```javascript
 * import { HashTypedData } from './crypto/EIP712/hashTypedData.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { Hash as HashDomain } from './Domain/hash.js';
 * import { HashStruct } from './hashStruct.js';
 * const hashDomain = HashDomain({ hashStruct });
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
 * const hash = hashTypedData(typedData);
 * ```
 */
export function HashTypedData({ keccak256, hashDomain, hashStruct }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    hashDomain: (domain: import("./EIP712Type.js").Domain) => import("../../primitives/Hash/index.js").HashType;
    hashStruct: (primaryType: string, data: import("./EIP712Type.js").Message, types: import("./EIP712Type.js").TypeDefinitions) => import("../../primitives/Hash/index.js").HashType;
}): (typedData: import("./EIP712Type.js").TypedData) => import("../../primitives/Hash/index.js").HashType;
//# sourceMappingURL=hashTypedData.d.ts.map