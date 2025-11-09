import type { BrandedAddress as BrandedAddressType } from "./BrandedAddress/BrandedAddress.js";
import { InvalidAddressLengthError } from "./BrandedAddress/errors.js";
import * as BrandedAddress from "./BrandedAddress/index.js";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
} from "./BrandedAddress/polyfills.js";

// Re-export BrandedAddress type and errors
export type { BrandedAddress } from "./BrandedAddress/index.js";
export * from "./BrandedAddress/errors.js";
export * from "./BrandedAddress/constants.js";

/**
 * Factory function for creating Address instances
 */
export function Address(
	value: number | bigint | string | Uint8Array,
): BrandedAddressType {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
}

// Static constructors
Address.from = (
	value: number | bigint | string | Uint8Array,
): BrandedAddressType => {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.from.prototype = Address.prototype;

Address.fromBase64 = (value: string): BrandedAddressType => {
	const result = BrandedAddress.fromBase64(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromBase64.prototype = Address.prototype;

Address.fromHex = (value: string): BrandedAddressType => {
	const result = BrandedAddress.fromHex(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromHex.prototype = Address.prototype;

Address.fromBytes = (value: Uint8Array): BrandedAddressType => {
	const result = BrandedAddress.fromBytes(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromBytes.prototype = Address.prototype;

Address.fromNumber = (value: number | bigint): BrandedAddressType => {
	const result = BrandedAddress.fromNumber(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromNumber.prototype = Address.prototype;

Address.fromPublicKey = (x: bigint, y: bigint): BrandedAddressType => {
	const result = BrandedAddress.fromPublicKey(x, y);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromPublicKey.prototype = Address.prototype;

export const fromPublicKey = Address.fromPublicKey;

Address.fromPrivateKey = (value: Uint8Array): BrandedAddressType => {
	const result = BrandedAddress.fromPrivateKey(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromPrivateKey.prototype = Address.prototype;

Address.fromAbiEncoded = (value: Uint8Array): BrandedAddressType => {
	const result = BrandedAddress.fromAbiEncoded(value);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.fromAbiEncoded.prototype = Address.prototype;

// Static utility methods (don't return Address instances)
Address.toHex = BrandedAddress.toHex;
Address.toBytes = BrandedAddress.toBytes;
Address.toChecksummed = BrandedAddress.toChecksummed;
Address.toLowercase = BrandedAddress.toLowercase;
Address.toUppercase = BrandedAddress.toUppercase;
Address.toU256 = BrandedAddress.toU256;
Address.toAbiEncoded = BrandedAddress.toAbiEncoded;
Address.toShortHex = BrandedAddress.toShortHex;
Address.isZero = BrandedAddress.isZero;
Address.equals = BrandedAddress.equals;
Address.isValid = BrandedAddress.isValid;
Address.isValidChecksum = BrandedAddress.isValidChecksum;
Address.is = BrandedAddress.is;

Address.zero = (): BrandedAddressType => {
	const result = BrandedAddress.zero();
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.of = (...items: number[]): BrandedAddressType => {
	const result = Uint8Array.of(...items);
	if (result.length !== BrandedAddress.SIZE) {
		throw new InvalidAddressLengthError(
			`Address must be ${BrandedAddress.SIZE} bytes, got ${result.length}`,
		);
	}
	Object.setPrototypeOf(result, Address.prototype);
	return result as BrandedAddressType;
};

Address.compare = BrandedAddress.compare;
Address.lessThan = BrandedAddress.lessThan;
Address.greaterThan = BrandedAddress.greaterThan;

Address.sortAddresses = (
	addresses: BrandedAddressType[],
): BrandedAddressType[] => {
	return BrandedAddress.sortAddresses(addresses).map((addr) => {
		Object.setPrototypeOf(addr, Address.prototype);
		return addr;
	});
};

Address.deduplicateAddresses = (
	addresses: BrandedAddressType[],
): BrandedAddressType[] => {
	return BrandedAddress.deduplicateAddresses(addresses).map((addr) => {
		Object.setPrototypeOf(addr, Address.prototype);
		return addr;
	});
};

Address.clone = (address: BrandedAddressType): BrandedAddressType => {
	const result = BrandedAddress.clone(address);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.calculateCreateAddress = (
	address: BrandedAddressType,
	nonce: bigint,
): BrandedAddressType => {
	const result = BrandedAddress.calculateCreateAddress(address, nonce);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};

Address.calculateCreate2Address = (
	address: BrandedAddressType,
	salt: Uint8Array,
	initCode: Uint8Array,
): BrandedAddressType => {
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
Address.prototype.toHex = function () {
	return BrandedAddress.toHex(this);
};
Address.prototype.setFromHex =
	Uint8Array.prototype.setFromHex ?? setFromHexPolyfill;
Address.prototype.toChecksummed = function () {
	return BrandedAddress.toChecksummed(this);
};
Address.prototype.toLowercase = function () {
	return BrandedAddress.toLowercase(this);
};
Address.prototype.toUppercase = function () {
	return BrandedAddress.toUppercase(this);
};
Address.prototype.toU256 = function () {
	return BrandedAddress.toU256(this);
};
Address.prototype.toAbiEncoded = function () {
	return BrandedAddress.toAbiEncoded(this);
};
Address.prototype.toShortHex = function () {
	return BrandedAddress.toShortHex(this);
};
Address.prototype.compare = function (other: BrandedAddressType): number {
	return BrandedAddress.compare(this as BrandedAddressType, other);
};
Address.prototype.lessThan = function (other: BrandedAddressType): boolean {
	return BrandedAddress.lessThan(this as BrandedAddressType, other);
};
Address.prototype.greaterThan = function (other: BrandedAddressType): boolean {
	return BrandedAddress.greaterThan(this as BrandedAddressType, other);
};
Address.prototype.isZero = function (): boolean {
	return BrandedAddress.isZero(this as BrandedAddressType);
};
Address.prototype.equals = function (other: BrandedAddressType): boolean {
	return BrandedAddress.equals(this as BrandedAddressType, other);
};
Address.prototype.toBytes = function (): Uint8Array {
	return BrandedAddress.toBytes(this as BrandedAddressType);
};
Address.prototype.clone = function (): BrandedAddressType {
	const result = BrandedAddress.clone(this as BrandedAddressType);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.prototype.calculateCreateAddress = function (
	nonce: bigint,
): BrandedAddressType {
	const result = BrandedAddress.calculateCreateAddress(
		this as BrandedAddressType,
		nonce,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
Address.prototype.calculateCreate2Address = function (
	salt: Uint8Array,
	initCode: Uint8Array,
): BrandedAddressType {
	const result = BrandedAddress.calculateCreate2Address(
		this as BrandedAddressType,
		salt,
		initCode,
	);
	Object.setPrototypeOf(result, Address.prototype);
	return result;
};
