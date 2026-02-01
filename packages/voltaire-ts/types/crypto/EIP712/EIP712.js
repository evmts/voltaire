// @ts-nocheck
export * from "./EIP712Type.js";
export * from "./errors.js";
import { from as privateKeyFrom } from "../../primitives/PrivateKey/from.js";
// Import crypto dependencies
import { hash as keccak256 } from "../Keccak256/hash.js";
import { recoverPublicKey as secp256k1RecoverPublicKey } from "../Secp256k1/recoverPublicKey.js";
import { sign as secp256k1Sign } from "../Secp256k1/sign.js";
// Import factories
import { Hash as HashDomain } from "./Domain/hash.js";
import { EncodeData } from "./encodeData.js";
import { encodeType } from "./encodeType.js";
import { EncodeValue } from "./encodeValue.js";
import { format } from "./format.js";
import { HashStruct } from "./hashStruct.js";
import { HashType } from "./hashType.js";
import { HashTypedData } from "./hashTypedData.js";
import { RecoverAddress } from "./recoverAddress.js";
import { SignTypedData } from "./signTypedData.js";
import { validate } from "./validate.js";
import { VerifyTypedData } from "./verifyTypedData.js";
// Export factories (tree-shakeable)
export { HashDomain, EncodeData, encodeType, EncodeValue, format, HashStruct, HashType, HashTypedData, RecoverAddress, SignTypedData, validate, VerifyTypedData, };
// Create interdependent instances (bottom-up)
const hashType = HashType({ keccak256 });
// Circular dependency: encodeValue needs hashStruct, hashStruct needs encodeData, encodeData needs encodeValue
// Solution: Create them in order with forward references
let hashStruct;
const encodeValue = EncodeValue({
    keccak256,
    hashStruct: (...args) => hashStruct(...args),
});
const encodeData = EncodeData({ hashType, encodeValue });
hashStruct = HashStruct({ keccak256, encodeData });
const hashDomain = HashDomain({ hashStruct });
const hashTypedData = HashTypedData({ keccak256, hashDomain, hashStruct });
// Adapter for secp256k1 recoverPublicKey to match factory signature
const recoverPublicKey = (compactSig, hash, recoveryBit) => {
    const signature = {
        r: compactSig.slice(0, 32),
        s: compactSig.slice(32, 64),
        v: recoveryBit, // Use raw recovery bit (0 or 1)
    };
    return secp256k1RecoverPublicKey(signature, hash);
};
const recoverAddress = RecoverAddress({
    keccak256,
    recoverPublicKey,
    hashTypedData,
});
const _signTypedData = SignTypedData({ hashTypedData, sign: secp256k1Sign });
const verifyTypedData = VerifyTypedData({ recoverAddress });
// Wrapper for signTypedData to accept string or Uint8Array private keys
function signTypedData(typedData, privateKey) {
    const privateKeyBytes = typeof privateKey === "string" ? privateKeyFrom(privateKey) : privateKey;
    return _signTypedData(typedData, privateKeyBytes);
}
// Export convenience wrappers with auto-injected crypto
export { encodeData, encodeValue, hashDomain, hashStruct, hashType, hashTypedData, recoverAddress, signTypedData, verifyTypedData, _signTypedData, };
/**
 * @typedef {import('./EIP712Type.js').TypedData} TypedData
 * @typedef {import('./EIP712Type.js').Domain} Domain
 * @typedef {import('./EIP712Type.js').TypeProperty} TypeProperty
 * @typedef {import('./EIP712Type.js').TypeDefinitions} TypeDefinitions
 * @typedef {import('./EIP712Type.js').Message} Message
 * @typedef {import('./EIP712Type.js').MessageValue} MessageValue
 * @typedef {import('./EIP712Type.js').Signature} Signature
 * @typedef {import('./EIP712Type.js').BrandedEIP712} BrandedEIP712
 */
/**
 * EIP-712 Typed Data Signing
 *
 * Complete implementation of EIP-712 typed structured data hashing and signing.
 *
 * @example
 * ```typescript
 * import { EIP712 } from './EIP712.js';
 *
 * // Define typed data
 * const typedData = {
 *   domain: {
 *     name: 'MyApp',
 *     version: '1',
 *     chainId: 1n,
 *     verifyingContract: contractAddress,
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: { name: 'Alice', wallet: '0x...' },
 *     to: { name: 'Bob', wallet: '0x...' },
 *     contents: 'Hello!',
 *   },
 * };
 *
 * // Hash typed data
 * const hash = EIP712.hashTypedData(typedData);
 *
 * // Sign typed data
 * const signature = EIP712.signTypedData(typedData, privateKey);
 *
 * // Verify signature
 * const valid = EIP712.verifyTypedData(signature, typedData, address);
 * ```
 */
export const EIP712 = {
    // Factories (for custom crypto)
    HashDomain,
    EncodeData,
    EncodeValue,
    HashStruct,
    HashType,
    HashTypedData,
    RecoverAddress,
    SignTypedData,
    VerifyTypedData,
    // Convenience methods (with auto-injected crypto)
    Domain: {
        hash: hashDomain,
    },
    encodeType,
    hashType,
    encodeValue,
    encodeData,
    hashStruct,
    hashTypedData,
    signTypedData,
    recoverAddress,
    verifyTypedData,
    format,
    validate,
};
