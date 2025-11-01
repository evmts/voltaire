export * from "./errors.js";
export * from "./constants.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };
import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };

// Import all methods
export { from } from "./from.js";
export { fromHex } from "./fromHex.js";
export { fromBytes } from "./fromBytes.js";
export { fromNumber } from "./fromNumber.js";
export { fromPublicKey } from "./fromPublicKey.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { toHex } from "./toHex.js";
export { toChecksummed } from "./toChecksummed.js";
export { toLowercase } from "./toLowercase.js";
export { toUppercase } from "./toUppercase.js";
export { toU256 } from "./toU256.js";
export { toAbiEncoded } from "./toAbiEncoded.js";
export { toShortHex } from "./toShortHex.js";
export { format } from "./format.js";
export { isZero } from "./isZero.js";
export { equals } from "./equals.js";
export { isValid } from "./isValid.js";
export { isValidChecksum } from "./isValidChecksum.js";
export { is } from "./is.js";
export { zero } from "./zero.js";
export { calculateCreateAddress } from "./calculateCreateAddress.js";
export { calculateCreate2Address } from "./calculateCreate2Address.js";
export { compare } from "./compare.js";
export { lessThan } from "./lessThan.js";
export { greaterThan } from "./greaterThan.js";

import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { fromBytes } from "./fromBytes.js";
import { fromNumber } from "./fromNumber.js";
import { fromPublicKey } from "./fromPublicKey.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { toChecksummed } from "./toChecksummed.js";
import { toLowercase } from "./toLowercase.js";
import { toUppercase } from "./toUppercase.js";
import { toU256 } from "./toU256.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toShortHex } from "./toShortHex.js";
import { format } from "./format.js";
import { isZero } from "./isZero.js";
import { equals } from "./equals.js";
import { isValid } from "./isValid.js";
import { isValidChecksum } from "./isValidChecksum.js";
import { is } from "./is.js";
import { zero } from "./zero.js";
import { calculateCreateAddress } from "./calculateCreateAddress.js";
import { calculateCreate2Address } from "./calculateCreate2Address.js";
import { compare } from "./compare.js";
import { lessThan } from "./lessThan.js";
import { greaterThan } from "./greaterThan.js";
import { SIZE } from "./constants.js";

export type Address = Uint8Array & { readonly __tag: "Address" };

export interface AddressConstructor {
  new(value: number | bigint | string | Uint8Array): Address;
  (value: number | bigint | string | Uint8Array): Address;
  prototype: Address & {
    toBase64: typeof Uint8Array.prototype.toBase64;
    setFromBase64: typeof Uint8Array.prototype.setFromBase64;
    toHex: typeof Uint8Array.prototype.toHex;
    setFromHex: typeof Uint8Array.prototype.setFromHex;
    toChecksummed: typeof toChecksummed;
    toLowercase: typeof toLowercase;
    toUppercase: typeof toUppercase;
    toU256: typeof toU256;
    toShortHex: typeof toShortHex;
    format: typeof format;
    compare: typeof compare;
    lessThan: typeof lessThan;
    greaterThan: typeof greaterThan;
    isZero: typeof isZero;
    equals: typeof equals;
    toAbiEncoded: typeof toAbiEncoded;
    calculateCreateAddress: typeof calculateCreateAddress;
    calculateCreate2Address: typeof calculateCreate2Address;
  };
  fromBase64: typeof Uint8Array.fromBase64;
  fromHex: typeof Uint8Array.fromHex & typeof fromHex;
  from: typeof from;
  fromBytes: typeof fromBytes;
  fromNumber: typeof fromNumber;
  fromPublicKey: typeof fromPublicKey;
  fromAbiEncoded: typeof fromAbiEncoded;
  isValid: typeof isValid;
  isValidChecksum: typeof isValidChecksum;
  is: typeof is;
  zero: typeof zero;
  SIZE: typeof SIZE;
}

export const AddressClass = function AddressClass(
  this: Address | void,
  value: number | bigint | string | Uint8Array,
): Address {
  return from(value);
} as AddressConstructor;

// ============================================================================
// Address Type
// ============================================================================
if (!("toBase64" in Uint8Array.prototype)) {
  AddressClass.prototype.toBase64 = (Uint8Array.prototype as any).toBase64;
}
if (!("setFromBase64" in Uint8Array.prototype)) {
  AddressClass.prototype.setFromBase64 = (Uint8Array.prototype as any).setFromBase64;
}
if (!("toHex" in Uint8Array.prototype)) {
  AddressClass.prototype.toHex = (Uint8Array.prototype as any).toHex;
}
if (!("setFromHex" in Uint8Array.prototype)) {
  AddressClass.prototype.setFromHex = (Uint8Array.prototype as any).setFromHex;
}

AddressClass.prototype.toChecksummed = toChecksummed;
AddressClass.prototype.toLowercase = toLowercase;
AddressClass.prototype.toUppercase = toUppercase;
AddressClass.prototype.toU256 = toU256;
AddressClass.prototype.toShortHex = toShortHex;
AddressClass.prototype.format = format;
AddressClass.prototype.compare = compare;
AddressClass.prototype.lessThan = lessThan;
AddressClass.prototype.greaterThan = greaterThan;
AddressClass.prototype.isZero = isZero;
AddressClass.prototype.equals = equals;
AddressClass.prototype.toAbiEncoded = toAbiEncoded;
AddressClass.prototype.calculateCreateAddress = calculateCreateAddress;
AddressClass.prototype.calculateCreate2Address = calculateCreate2Address;

if (!("fromBase64" in Uint8Array)) {
  AddressClass.fromBase64 = (Uint8Array as any).fromBase64;
}
if (!("fromHex" in Uint8Array)) {
  AddressClass.fromHex = fromHex as any;
} else {
  AddressClass.fromHex = fromHex as any;
}

AddressClass.from = from;
AddressClass.fromBytes = fromBytes;
AddressClass.fromNumber = fromNumber;
AddressClass.fromPublicKey = fromPublicKey;
AddressClass.fromAbiEncoded = fromAbiEncoded;
AddressClass.isValid = isValid;
AddressClass.isValidChecksum = isValidChecksum;
AddressClass.is = is;
AddressClass.zero = zero;
AddressClass.SIZE = SIZE;

// Export as Address.Class
export const Class = AddressClass;

// Factory method
export const newAddress = (
  value: number | bigint | string | Uint8Array,
): Address => new AddressClass(value);
