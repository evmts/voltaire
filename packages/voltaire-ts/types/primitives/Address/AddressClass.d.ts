import type { AddressType } from "./AddressType.js";
import type { compare } from "./compare.js";
import type { SIZE } from "./constants.js";
import type { equals } from "./equals.js";
import type { greaterThan } from "./greaterThan.js";
import type { calculateCreate2Address, calculateCreateAddress, fromPublicKey, isValidChecksum, toChecksummed } from "./internal-index.js";
import type { is } from "./is.js";
import type { isValid } from "./isValid.js";
import type { isZero } from "./isZero.js";
import type { lessThan } from "./lessThan.js";
import type { toAbiEncoded } from "./toAbiEncoded.js";
import type { toBytes } from "./toBytes.js";
import type { toHex } from "./toHex.js";
import type { toLowercase } from "./toLowercase.js";
import type { toShortHex } from "./toShortHex.js";
import type { toU256 } from "./toU256.js";
import type { toUppercase } from "./toUppercase.js";
/**
 * Address instance type - a branded Uint8Array with instance methods
 * Similar to how BigInt interface defines instance methods
 */
export interface Address extends AddressType {
    toBase64: typeof Uint8Array.prototype.toBase64;
    setFromBase64: typeof Uint8Array.prototype.setFromBase64;
    toHex(): ReturnType<typeof toHex>;
    setFromHex: typeof Uint8Array.prototype.setFromHex;
    toChecksummed(): ReturnType<typeof toChecksummed>;
    toLowercase(): ReturnType<typeof toLowercase>;
    toUppercase(): ReturnType<typeof toUppercase>;
    toU256(): ReturnType<typeof toU256>;
    toShortHex(): ReturnType<typeof toShortHex>;
    toBytes(): ReturnType<typeof toBytes>;
    toAbiEncoded(): ReturnType<typeof toAbiEncoded>;
    clone(): Address;
    compare(other: AddressType): ReturnType<typeof compare>;
    lessThan(other: AddressType): ReturnType<typeof lessThan>;
    greaterThan(other: AddressType): ReturnType<typeof greaterThan>;
    isZero(): ReturnType<typeof isZero>;
    equals(other: AddressType): ReturnType<typeof equals>;
    calculateCreateAddress(nonce: Parameters<typeof calculateCreateAddress>[1]): Address;
    calculateCreate2Address(salt: Parameters<typeof calculateCreate2Address>[1], initCode: Parameters<typeof calculateCreate2Address>[2]): Address;
    toString(): string;
}
/**
 * Address constructor - callable without new keyword
 * Similar to how BigIntConstructor defines the callable signature and static methods
 */
export interface AddressConstructor {
    (value: number | bigint | string | Uint8Array): Address;
    readonly prototype: Address;
    from(value: number | bigint | string | Uint8Array): Address;
    fromBase64(value: string): Address;
    fromHex(value: string): Address;
    fromBytes(value: Uint8Array): Address;
    fromNumber(value: number | bigint): Address;
    fromPublicKey: typeof fromPublicKey;
    fromPrivateKey(value: Uint8Array): Address;
    fromAbiEncoded(value: Uint8Array): Address;
    of(...items: number[]): Address;
    zero(): Address;
    clone(address: AddressType): Address;
    toHex: typeof toHex;
    toBytes: typeof toBytes;
    toChecksummed: typeof toChecksummed;
    toLowercase: typeof toLowercase;
    toUppercase: typeof toUppercase;
    toU256: typeof toU256;
    toAbiEncoded: typeof toAbiEncoded;
    toShortHex: typeof toShortHex;
    isZero: typeof isZero;
    equals: typeof equals;
    isValid: typeof isValid;
    isValidChecksum: typeof isValidChecksum;
    is: typeof is;
    compare: typeof compare;
    lessThan: typeof lessThan;
    greaterThan: typeof greaterThan;
    calculateCreateAddress(address: AddressType, nonce: bigint): Address;
    calculateCreate2Address(address: AddressType, salt: Parameters<typeof calculateCreate2Address>[1], initCode: Parameters<typeof calculateCreate2Address>[2]): Address;
    sortAddresses(addresses: AddressType[]): Address[];
    deduplicateAddresses(addresses: AddressType[]): Address[];
    SIZE: typeof SIZE;
}
export declare const Address: AddressConstructor;
//# sourceMappingURL=AddressClass.d.ts.map