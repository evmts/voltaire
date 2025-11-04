// @ts-nocheck
export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedAddress.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };
import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };

import { calculateCreate2Address } from "./calculateCreate2Address.js";
import { calculateCreateAddress } from "./calculateCreateAddress.js";
import { compare } from "./compare.js";
import { SIZE } from "./constants.js";
import { equals } from "./equals.js";
import { format } from "./format.js";
import { from } from "./from.js";
import { fromAbiEncoded } from "./fromAbiEncoded.js";
import { fromBase64 } from "./fromBase64.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { fromNumber } from "./fromNumber.js";
import { fromPublicKey } from "./fromPublicKey.js";
import { greaterThan } from "./greaterThan.js";
import { is } from "./is.js";
import { isValid } from "./isValid.js";
import { isValidChecksum } from "./isValidChecksum.js";
import { isZero } from "./isZero.js";
import { lessThan } from "./lessThan.js";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
	toHexPolyfill,
} from "./polyfills.js";
import { toAbiEncoded } from "./toAbiEncoded.js";
import { toChecksummed } from "./toChecksummed.js";
import { toHex } from "./toHex.js";
import { toLowercase } from "./toLowercase.js";
import { toShortHex } from "./toShortHex.js";
import { toU256 } from "./toU256.js";
import { toUppercase } from "./toUppercase.js";
import { zero } from "./zero.js";

// Export individual functions
export {
	from,
	fromHex,
	fromBase64,
	fromBytes,
	fromNumber,
	fromPublicKey,
	fromAbiEncoded,
	toHex,
	toChecksummed,
	toLowercase,
	toUppercase,
	toU256,
	toAbiEncoded,
	toShortHex,
	format,
	isZero,
	equals,
	isValid,
	isValidChecksum,
	is,
	zero,
	calculateCreateAddress,
	calculateCreate2Address,
	compare,
	lessThan,
	greaterThan,
};

/**
 * @typedef {import('./BrandedAddress.js').BrandedAddress} BrandedAddress
 * @typedef {import('./AddressConstructor.js').AddressConstructor} AddressConstructor
 */

/**
 * Factory function for creating Address instances
 *
 * @type {AddressConstructor}
 */
export function Address(value) {
	return from(value);
}

Address.from = function (value) {
	return from(value);
};
Address.from.prototype = Address.prototype;
Address.fromBase64 = function (value) {
	return fromBase64(value);
};
Address.fromBase64.prototype = Address.prototype;
Address.fromHex = function (value) {
	return fromHex(value);
};
Address.fromHex.prototype = Address.prototype;
Address.fromBytes = function (value) {
	return fromBytes(value);
};
Address.fromBytes.prototype = Address.prototype;
Address.fromNumber = function (value) {
	return fromNumber(value);
};
Address.fromNumber.prototype = Address.prototype;
Address.fromPublicKey = function (x, y) {
	return fromPublicKey(x, y);
};
Address.fromPublicKey.prototype = Address.prototype;
Address.fromAbiEncoded = function (value) {
	return fromAbiEncoded(value);
};
Address.fromAbiEncoded.prototype = Address.prototype;

Address.toHex = toHex;
Address.toChecksummed = toChecksummed;
Address.toLowercase = toLowercase;
Address.toUppercase = toUppercase;
Address.toU256 = toU256;
Address.toAbiEncoded = toAbiEncoded;
Address.toShortHex = toShortHex;
Address.format = format;
Address.isZero = isZero;
Address.equals = equals;
Address.isValid = isValid;
Address.isValidChecksum = isValidChecksum;
Address.is = is;
Address.zero = zero;
Address.compare = compare;
Address.lessThan = lessThan;
Address.greaterThan = greaterThan;
Address.calculateCreateAddress = calculateCreateAddress;
Address.calculateCreate2Address = calculateCreate2Address;
Address.SIZE = SIZE;

Address.prototype.toBase64 = Uint8Array.prototype.toBase64 ?? toBase64Polyfill;
Address.prototype.setFromBase64 =
	Uint8Array.prototype.setFromBase64 ?? setFromBase64Polyfill;
Address.prototype.toHex = Function.prototype.call.bind(toHex);
Address.prototype.setFromHex =
	Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
Address.prototype.toChecksummed = Function.prototype.call.bind(toChecksummed);
Address.prototype.toLowercase = Function.prototype.call.bind(toLowercase);
Address.prototype.toUppercase = Function.prototype.call.bind(toUppercase);
Address.prototype.toU256 = Function.prototype.call.bind(toU256);
Address.prototype.toAbiEncoded = Function.prototype.call.bind(toAbiEncoded);
Address.prototype.toShortHex = Function.prototype.call.bind(toShortHex);
Address.prototype.format = Function.prototype.call.bind(format);
Address.prototype.compare = Function.prototype.call.bind(compare);
Address.prototype.lessThan = Function.prototype.call.bind(lessThan);
Address.prototype.greaterThan = Function.prototype.call.bind(greaterThan);
Address.prototype.isZero = Function.prototype.call.bind(isZero);
Address.prototype.equals = Function.prototype.call.bind(equals);
Address.prototype.calculateCreateAddress = Function.prototype.call.bind(
	calculateCreateAddress,
);
Address.prototype.calculateCreate2Address = Function.prototype.call.bind(
	calculateCreate2Address,
);
