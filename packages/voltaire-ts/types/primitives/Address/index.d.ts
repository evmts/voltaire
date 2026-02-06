import type { BrandedBytecode } from "../Bytecode/BytecodeType.js";
import type { HashType } from "../Hash/HashType.js";
import type { AddressType } from "./AddressType.js";
import * as BrandedAddress from "./internal-index.js";
export type { AddressType, AddressType as BrandedAddress, } from "./AddressType.js";
export * from "./constants.js";
export * from "./errors.js";
/**
 * Crypto dependencies for Address operations
 */
export interface AddressCrypto {
    keccak256?: (data: Uint8Array) => Uint8Array;
    rlpEncode?: (items: unknown[]) => Uint8Array;
}
/**
 * Base Address type without crypto-dependent methods
 */
export interface BaseAddress extends AddressType {
    toHex(): string;
    toLowercase(): string;
    toUppercase(): string;
    toU256(): bigint;
    toAbiEncoded(): Uint8Array;
    toShortHex(startLength?: number, endLength?: number): string;
    isZero(): boolean;
    equals(other: AddressType): boolean;
    toBytes(): Uint8Array;
    clone(): AddressType;
    compare(other: AddressType): number;
    lessThan(other: AddressType): boolean;
    greaterThan(other: AddressType): boolean;
}
/**
 * Address with keccak256 support (enables checksum methods)
 */
export interface AddressWithKeccak extends BaseAddress {
    toChecksummed(): string;
    calculateCreate2Address(salt: HashType, initCode: BrandedBytecode): AddressType;
}
/**
 * Address with full crypto support (enables all contract address methods)
 */
export interface AddressWithFullCrypto extends AddressWithKeccak {
    calculateCreateAddress(nonce: bigint): AddressType;
}
/**
 * Creates Address instances with prototype chain
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param value - Value to convert (hex string, bytes, or number)
 * @returns Address instance with prototype methods
 * @throws {Error} If value format is invalid
 * @example
 * ```typescript
 * import { Address } from './primitives/Address/index.js';
 * const addr = Address('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * console.log(addr.toHex());
 * ```
 */
export declare function Address(value: number | bigint | string | Uint8Array): BaseAddress;
/**
 * Creates Address with keccak256 support
 *
 * @param value - Value to convert
 * @param crypto - Crypto dependencies with keccak256
 * @returns Address with checksum methods
 */
export declare function Address(value: number | bigint | string | Uint8Array, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): AddressWithKeccak;
/**
 * Creates Address with full crypto support
 *
 * @param value - Value to convert
 * @param crypto - Crypto dependencies with keccak256 and rlpEncode
 * @returns Address with all contract address methods
 */
export declare function Address(value: number | bigint | string | Uint8Array, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (items: unknown[]) => Uint8Array;
}): AddressWithFullCrypto;
export declare namespace Address {
    var from: (value: number | bigint | string | Uint8Array) => AddressType;
    var fromBase64: (value: string) => AddressType;
    var fromHex: (value: string, crypto?: AddressCrypto) => AddressType;
    var fromBytes: (value: Uint8Array) => AddressType;
    var fromNumber: (value: number | bigint) => AddressType;
    var fromPublicKey: {
        (x: bigint, y: bigint): AddressType;
        (publicKey: Uint8Array): AddressType;
    };
    var fromPrivateKey: (value: Uint8Array) => AddressType;
    var fromAbiEncoded: (value: Uint8Array) => AddressType;
    var toHex: typeof BrandedAddress.toHex;
    var toBytes: typeof BrandedAddress.toBytes;
    var toChecksummed: (address: import("./AddressType.js").AddressType) => import("./ChecksumAddress.js").Checksummed;
    var toLowercase: typeof BrandedAddress.toLowercase;
    var toUppercase: typeof BrandedAddress.toUppercase;
    var toU256: typeof BrandedAddress.toU256;
    var toAbiEncoded: typeof BrandedAddress.toAbiEncoded;
    var toShortHex: typeof BrandedAddress.toShortHex;
    var isZero: typeof BrandedAddress.isZero;
    var equals: typeof BrandedAddress.equals;
    var isValid: typeof BrandedAddress.isValid;
    var isValidChecksum: (str: string) => boolean;
    var is: typeof BrandedAddress.is;
    var zero: () => AddressType;
    var of: (...items: number[]) => AddressType;
    var compare: typeof BrandedAddress.compare;
    var lessThan: typeof BrandedAddress.lessThan;
    var greaterThan: typeof BrandedAddress.greaterThan;
    var sortAddresses: (addresses: AddressType[]) => AddressType[];
    var deduplicateAddresses: (addresses: AddressType[]) => AddressType[];
    var clone: (address: AddressType) => AddressType;
    var calculateCreateAddress: (address: AddressType, nonce: bigint) => AddressType;
    var calculateCreate2Address: (address: AddressType, salt: HashType, initCode: BrandedBytecode) => AddressType;
    var SIZE: 20;
    var assert: (value: string | Uint8Array, options?: {
        strict?: boolean;
    }) => AddressType;
    var Assert: typeof BrandedAddress.Assert;
    var IsContract: typeof BrandedAddress.IsContract;
}
export declare const fromPublicKey: {
    (x: bigint, y: bigint): AddressType;
    (publicKey: Uint8Array): AddressType;
};
/**
 * Sort array of addresses lexicographically
 * @param addresses - Array to sort
 * @returns New sorted array
 */
export declare const sortAddresses: (addresses: AddressType[]) => AddressType[];
/**
 * Remove duplicate addresses from array
 * @param addresses - Array with potential duplicates
 * @returns New array with duplicates removed
 */
export declare const deduplicateAddresses: (addresses: AddressType[]) => AddressType[];
export declare const toHex: typeof BrandedAddress.toHex;
export declare const fromHex: (value: string, crypto?: AddressCrypto) => AddressType;
export declare const equals: typeof BrandedAddress.equals;
export default Address;
//# sourceMappingURL=index.d.ts.map