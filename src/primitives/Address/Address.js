// @ts-nocheck
import * as BrandedAddress from "./BrandedAddress/index.ts";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
	toHexPolyfill,
} from "./BrandedAddress/polyfills.js";

/**
 * Factory function for creating Address instances
 */
export function Address(value) {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
}

// Static constructors
Address.from = (value) => {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.from.prototype = Address.prototype;

Address.fromBase64 = (value) => {
	const result = BrandedAddress.fromBase64(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromBase64.prototype = Address.prototype;

Address.fromHex = (value) => {
	const result = BrandedAddress.fromHex(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromHex.prototype = Address.prototype;

Address.fromBytes = (value) => {
	const result = BrandedAddress.fromBytes(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromBytes.prototype = Address.prototype;

Address.fromNumber = (value) => {
	const result = BrandedAddress.fromNumber(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromNumber.prototype = Address.prototype;

Address.fromPublicKey = (x, y) => {
	const result = BrandedAddress.fromPublicKey(x, y);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromPublicKey.prototype = Address.prototype;

Address.fromAbiEncoded = (value) => {
	const result = BrandedAddress.fromAbiEncoded(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromAbiEncoded.prototype = Address.prototype;

// Static utility methods (don't return Address instances)
Address.toHex = BrandedAddress.toHex;
Address.toChecksummed = BrandedAddress.toChecksummed;
Address.toLowercase = BrandedAddress.toLowercase;
Address.toUppercase = BrandedAddress.toUppercase;
Address.toU256 = BrandedAddress.toU256;
Address.toAbiEncoded = BrandedAddress.toAbiEncoded;
Address.toShortHex = BrandedAddress.toShortHex;
Address.format = BrandedAddress.format;
Address.isZero = BrandedAddress.isZero;
Address.equals = BrandedAddress.equals;
Address.isValid = BrandedAddress.isValid;
Address.isValidChecksum = BrandedAddress.isValidChecksum;
Address.is = BrandedAddress.is;

Address.zero = () => {
	const result = BrandedAddress.zero();
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.compare = BrandedAddress.compare;
Address.lessThan = BrandedAddress.lessThan;
Address.greaterThan = BrandedAddress.greaterThan;

Address.calculateCreateAddress = (address, nonce) => {
	const result = BrandedAddress.calculateCreateAddress(address, nonce);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.calculateCreate2Address = (address, salt, initCode) => {
	const result = BrandedAddress.calculateCreate2Address(
		address,
		salt,
		initCode,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.SIZE = BrandedAddress.SIZE;

// Set up Address.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Address.prototype, Uint8Array.prototype);

// Instance methods
Address.prototype.toBase64 = Uint8Array.prototype.toBase64 ?? toBase64Polyfill;
Address.prototype.setFromBase64 =
	Uint8Array.prototype.setFromBase64 ?? setFromBase64Polyfill;
Address.prototype.toHex = BrandedAddress.toHex.call.bind(BrandedAddress.toHex);
Address.prototype.setFromHex =
	Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
Address.prototype.toChecksummed = BrandedAddress.toChecksummed.call.bind(
	BrandedAddress.toChecksummed,
);
Address.prototype.toLowercase = BrandedAddress.toLowercase.call.bind(
	BrandedAddress.toLowercase,
);
Address.prototype.toUppercase = BrandedAddress.toUppercase.call.bind(
	BrandedAddress.toUppercase,
);
Address.prototype.toU256 = BrandedAddress.toU256.call.bind(
	BrandedAddress.toU256,
);
Address.prototype.toAbiEncoded = BrandedAddress.toAbiEncoded.call.bind(
	BrandedAddress.toAbiEncoded,
);
Address.prototype.toShortHex = BrandedAddress.toShortHex.call.bind(
	BrandedAddress.toShortHex,
);
Address.prototype.format = BrandedAddress.format.call.bind(
	BrandedAddress.format,
);
Address.prototype.compare = BrandedAddress.compare.call.bind(
	BrandedAddress.compare,
);
Address.prototype.lessThan = BrandedAddress.lessThan.call.bind(
	BrandedAddress.lessThan,
);
Address.prototype.greaterThan = BrandedAddress.greaterThan.call.bind(
	BrandedAddress.greaterThan,
);
Address.prototype.isZero = BrandedAddress.isZero.call.bind(
	BrandedAddress.isZero,
);
Address.prototype.equals = BrandedAddress.equals.call.bind(
	BrandedAddress.equals,
);
Address.prototype.calculateCreateAddress = function (nonce) {
	const result = BrandedAddress.calculateCreateAddress(this, nonce);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.prototype.calculateCreate2Address = function (salt, initCode) {
	const result = BrandedAddress.calculateCreate2Address(this, salt, initCode);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
