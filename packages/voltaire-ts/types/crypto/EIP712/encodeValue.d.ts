/**
 * Factory: Encode single value to 32 bytes according to EIP-712.
 *
 * Handles primitive types, arrays, strings, bytes, and custom structs.
 * Addresses must be pre-validated BrandedAddress types.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(type: string, data: import('./EIP712Type.js').Message, types: import('./EIP712Type.js').TypeDefinitions) => import('../../primitives/Hash/index.js').HashType} deps.hashStruct - Hash struct function
 * @returns {(type: string, value: import('./EIP712Type.js').MessageValue, types: import('./EIP712Type.js').TypeDefinitions) => Uint8Array} Function that encodes value
 * @throws {Eip712EncodingError} If type is unsupported or value format is invalid
 * @example
 * ```javascript
 * import { EncodeValue } from './crypto/EIP712/encodeValue.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * import { HashStruct } from './hashStruct.js';
 * const hashStruct = HashStruct({ keccak256, encodeData });
 * const encodeValue = EncodeValue({ keccak256, hashStruct });
 * const encoded = encodeValue('uint256', 42n, types);
 * ```
 */
export function EncodeValue({ keccak256, hashStruct }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    hashStruct: (type: string, data: import("./EIP712Type.js").Message, types: import("./EIP712Type.js").TypeDefinitions) => import("../../primitives/Hash/index.js").HashType;
}): (type: string, value: import("./EIP712Type.js").MessageValue, types: import("./EIP712Type.js").TypeDefinitions) => Uint8Array;
//# sourceMappingURL=encodeValue.d.ts.map