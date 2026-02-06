export type { AddressType, AddressType as BrandedAddressType, } from "./AddressType.js";
export { From, IsValid } from "./ChecksumAddress.js";
export * from "./constants.js";
export * from "./errors.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };
export { CalculateCreate2Address } from "./calculateCreate2Address.js";
export { CalculateCreateAddress } from "./calculateCreateAddress.js";
export { FromPrivateKey } from "./fromPrivateKey.js";
export { FromPublicKey } from "./fromPublicKey.js";
export { IsContract } from "./isContract.js";
export { IsValidChecksum } from "./isValidChecksum.js";
export { ToChecksummed } from "./toChecksummed.js";
import { CalculateCreate2Address as CalculateCreate2AddressFactory } from "./calculateCreate2Address.js";
import { CalculateCreateAddress as CalculateCreateAddressFactory } from "./calculateCreateAddress.js";
import { FromPrivateKey as FromPrivateKeyFactory } from "./fromPrivateKey.js";
import { FromPublicKey as FromPublicKeyFactory } from "./fromPublicKey.js";
import { IsContract } from "./isContract.js";
import { IsValidChecksum as IsValidChecksumFactory } from "./isValidChecksum.js";
import { ToChecksummed as ToChecksummedFactory } from "./toChecksummed.js";
/**
 * Convert Address to EIP-55 checksummed hex string (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `ToChecksummed({ keccak256 })` factory
 */
export declare const toChecksummed: (address: import("./AddressType.js").AddressType) => import("./ChecksumAddress.js").Checksummed;
/**
 * Check if string has valid EIP-55 checksum (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `IsValidChecksum({ keccak256 })` factory
 */
export declare const isValidChecksum: (str: string) => boolean;
/**
 * Calculate CREATE contract address (with auto-injected keccak256 and rlpEncode)
 *
 * For tree-shakeable version without auto-injected crypto, use `CalculateCreateAddress({ keccak256, rlpEncode })` factory
 */
export declare const calculateCreateAddress: (address: import("./AddressType.js").AddressType, nonce: bigint) => import("./AddressType.js").AddressType;
/**
 * Calculate CREATE2 contract address (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `CalculateCreate2Address({ keccak256 })` factory
 */
export declare const calculateCreate2Address: (arg0: import("./AddressType.js").AddressType, arg1: import("../Hash/HashType.js").HashType, arg2: import("../Bytecode/BytecodeType.js").BrandedBytecode) => import("./AddressType.js").AddressType;
/**
 * Create Address from secp256k1 public key coordinates (with auto-injected keccak256)
 *
 * For tree-shakeable version without auto-injected crypto, use `FromPublicKey({ keccak256 })` factory
 */
export declare const fromPublicKey: (xOrPublicKey: bigint | Uint8Array, y?: bigint) => import("./AddressType.js").AddressType;
/**
 * Create Address from secp256k1 private key (with auto-injected crypto)
 *
 * For tree-shakeable version without auto-injected crypto, use `FromPrivateKey({ keccak256, derivePublicKey })` factory
 */
export declare const fromPrivateKey: (privateKey: any) => import("./AddressType.js").AddressType;
import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };
import { Assert } from "./assert.js";
import { clone } from "./clone.js";
import { compare } from "./compare.js";
import { SIZE } from "./constants.js";
import { deduplicateAddresses } from "./deduplicateAddresses.js";
import { equals } from "./equals.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBase64 } from "./fromBase64.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { greaterThan } from "./greaterThan.js";
import { is } from "./is.js";
import { isAddress } from "./isAddress.js";
import { isValid } from "./isValid.js";
import { isZero } from "./isZero.js";
import { lessThan } from "./lessThan.js";
import { sortAddresses } from "./sortAddresses.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toBytes } from "./toBytes.js";
import { toHex } from "./toHex.js";
import { toLowercase } from "./toLowercase.js";
import { toShortHex } from "./toShortHex.js";
import { toU256 } from "./toU256.js";
import { toUppercase } from "./toUppercase.js";
import { zero } from "./zero.js";
declare const assertWithKeccak: (value: string | Uint8Array, options?: {
    strict?: boolean;
}) => import("./AddressType.js").AddressType;
export { Assert };
export { from, fromHex, fromBase64, fromBytes, fromNumber, fromAbiEncoded, toHex, toBytes, toLowercase, toUppercase, toU256, toAbiEncoded, toShortHex, isZero, equals, isValid, is, isAddress, zero, clone, compare, lessThan, greaterThan, sortAddresses, deduplicateAddresses, SIZE, assertWithKeccak as assert, };
export declare const BrandedAddress: {
    from: typeof from;
    fromHex: typeof fromHex;
    fromBase64: typeof fromBase64;
    fromBytes: typeof fromBytes;
    fromNumber: typeof fromNumber;
    fromPublicKey: (xOrPublicKey: bigint | Uint8Array, y?: bigint) => import("./AddressType.js").AddressType;
    FromPublicKey: typeof FromPublicKeyFactory;
    fromPrivateKey: (privateKey: any) => import("./AddressType.js").AddressType;
    FromPrivateKey: typeof FromPrivateKeyFactory;
    fromAbiEncoded: typeof fromAbiEncoded;
    toHex: typeof toHex;
    toBytes: typeof toBytes;
    toChecksummed: (address: import("./AddressType.js").AddressType) => import("./ChecksumAddress.js").Checksummed;
    ToChecksummed: typeof ToChecksummedFactory;
    toLowercase: typeof toLowercase;
    toUppercase: typeof toUppercase;
    toU256: typeof toU256;
    toAbiEncoded: typeof toAbiEncoded;
    toShortHex: typeof toShortHex;
    isZero: typeof isZero;
    equals: typeof equals;
    isValid: typeof isValid;
    isValidChecksum: (str: string) => boolean;
    IsValidChecksum: typeof IsValidChecksumFactory;
    is: typeof is;
    isAddress: typeof isAddress;
    zero: typeof zero;
    clone: typeof clone;
    calculateCreateAddress: (address: import("./AddressType.js").AddressType, nonce: bigint) => import("./AddressType.js").AddressType;
    CalculateCreateAddress: typeof CalculateCreateAddressFactory;
    calculateCreate2Address: (arg0: import("./AddressType.js").AddressType, arg1: import("../Hash/HashType.js").HashType, arg2: import("../Bytecode/BytecodeType.js").BrandedBytecode) => import("./AddressType.js").AddressType;
    CalculateCreate2Address: typeof CalculateCreate2AddressFactory;
    IsContract: typeof IsContract;
    compare: typeof compare;
    lessThan: typeof lessThan;
    greaterThan: typeof greaterThan;
    sortAddresses: typeof sortAddresses;
    deduplicateAddresses: typeof deduplicateAddresses;
    SIZE: 20;
    Checksummed: typeof Checksummed;
    Lowercase: typeof Lowercase;
    Uppercase: typeof Uppercase;
    assert: (value: string | Uint8Array, options?: {
        strict?: boolean;
    }) => import("./AddressType.js").AddressType;
    Assert: typeof Assert;
};
//# sourceMappingURL=internal-index.d.ts.map