/**
 * Factory: Encode struct data according to EIP-712.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(primaryType: string, types: import('./EIP712Type.js').TypeDefinitions) => import('../../primitives/Hash/index.js').HashType} deps.hashType - Hash type function
 * @param {(type: string, value: import('./EIP712Type.js').MessageValue, types: import('./EIP712Type.js').TypeDefinitions) => Uint8Array} deps.encodeValue - Encode value function
 * @returns {(primaryType: string, data: import('./EIP712Type.js').Message, types: import('./EIP712Type.js').TypeDefinitions) => Uint8Array} Function that encodes data
 * @throws {Eip712TypeNotFoundError} If primaryType is not found in types
 * @throws {Eip712InvalidMessageError} If required field is missing from data
 * @example
 * ```javascript
 * import { EncodeData } from './crypto/EIP712/encodeData.js';
 * import { HashType } from './hashType.js';
 * import { EncodeValue } from './encodeValue.js';
 * import { hash as keccak256 } from '../Keccak256/hash.js';
 * const hashType = HashType({ keccak256 });
 * const encodeValue = EncodeValue({ keccak256, hashStruct });
 * const encodeData = EncodeData({ hashType, encodeValue });
 * const types = { Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }] };
 * const encoded = encodeData('Person', { name: 'Alice', wallet: '0x...' }, types);
 * ```
 */
export function EncodeData({ hashType, encodeValue }: {
    hashType: (primaryType: string, types: import("./EIP712Type.js").TypeDefinitions) => import("../../primitives/Hash/index.js").HashType;
    encodeValue: (type: string, value: import("./EIP712Type.js").MessageValue, types: import("./EIP712Type.js").TypeDefinitions) => Uint8Array;
}): (primaryType: string, data: import("./EIP712Type.js").Message, types: import("./EIP712Type.js").TypeDefinitions) => Uint8Array;
//# sourceMappingURL=encodeData.d.ts.map