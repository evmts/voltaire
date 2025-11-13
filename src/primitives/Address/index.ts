import type { BrandedAddress as BrandedAddressType } from "./BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/BrandedHash/BrandedHash.js";
import type { BrandedBytecode } from "../Bytecode/BrandedBytecode/BrandedBytecode.js";
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
 * Crypto dependencies for Address operations
 */
export interface AddressCrypto {
	keccak256?: (data: Uint8Array) => Uint8Array;
	rlpEncode?: (items: unknown[]) => Uint8Array;
}

/**
 * Base Address type without crypto-dependent methods
 */
export interface BaseAddress extends BrandedAddressType {
	toHex(): string;
	toLowercase(): string;
	toUppercase(): string;
	toU256(): bigint;
	toAbiEncoded(): Uint8Array;
	toShortHex(startLength?: number, endLength?: number): string;
	isZero(): boolean;
	equals(other: BrandedAddressType): boolean;
	toBytes(): Uint8Array;
	clone(): BrandedAddressType;
	compare(other: BrandedAddressType): number;
	lessThan(other: BrandedAddressType): boolean;
	greaterThan(other: BrandedAddressType): boolean;
}

/**
 * Address with keccak256 support (enables checksum methods)
 */
export interface AddressWithKeccak extends BaseAddress {
	toChecksummed(): string;
	calculateCreate2Address(
		salt: Uint8Array,
		initCode: Uint8Array,
	): BrandedAddressType;
}

/**
 * Address with full crypto support (enables all contract address methods)
 */
export interface AddressWithFullCrypto extends AddressWithKeccak {
	calculateCreateAddress(nonce: bigint): BrandedAddressType;
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
export function Address(
	value: number | bigint | string | Uint8Array,
): BaseAddress;

/**
 * Creates Address with keccak256 support
 *
 * @param value - Value to convert
 * @param crypto - Crypto dependencies with keccak256
 * @returns Address with checksum methods
 */
export function Address(
	value: number | bigint | string | Uint8Array,
	crypto: { keccak256: (data: Uint8Array) => Uint8Array },
): AddressWithKeccak;

/**
 * Creates Address with full crypto support
 *
 * @param value - Value to convert
 * @param crypto - Crypto dependencies with keccak256 and rlpEncode
 * @returns Address with all contract address methods
 */
export function Address(
	value: number | bigint | string | Uint8Array,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
		rlpEncode: (items: unknown[]) => Uint8Array;
	},
): AddressWithFullCrypto;

export function Address(
	value: number | bigint | string | Uint8Array,
	crypto?: AddressCrypto,
): BrandedAddressType {
	const result = BrandedAddress.from(value);
	Object.setPrototypeOf(result, Address.prototype);
	// Store crypto deps on instance
	if (crypto) {
		Object.defineProperty(result, "_crypto", {
			value: crypto,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}
	return result;
}

// Alias for Address()
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
			{
				value: result,
				expected: `${BrandedAddress.SIZE} bytes`,
				context: { actualLength: result.length },
			},
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
	salt: BrandedHash,
	initCode: BrandedBytecode,
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
	const crypto = (this as any)._crypto;
	if (!crypto?.keccak256) {
		throw new Error(
			"keccak256 not provided to Address constructor. Pass { keccak256 } to enable toChecksummed()",
		);
	}
	const factory = BrandedAddress.ToChecksummed({ keccak256: crypto.keccak256 });
	return factory(this as BrandedAddressType);
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
	const crypto = (this as any)._crypto;
	if (crypto) {
		Object.defineProperty(result, "_crypto", {
			value: crypto,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}
	return result;
};
Address.prototype.calculateCreateAddress = function (
	nonce: bigint,
): BrandedAddressType {
	const crypto = (this as any)._crypto;
	if (!crypto?.keccak256) {
		throw new Error(
			"keccak256 not provided to Address constructor. Pass { keccak256, rlpEncode } to enable calculateCreateAddress()",
		);
	}
	if (!crypto?.rlpEncode) {
		throw new Error(
			"rlpEncode not provided to Address constructor. Pass { keccak256, rlpEncode } to enable calculateCreateAddress()",
		);
	}
	// Manual implementation using crypto deps
	const { InvalidValueError } = BrandedAddress;
	if (nonce < 0n) {
		throw new InvalidValueError("Nonce cannot be negative", {
			value: nonce,
		});
	}

	// Encode nonce
	function encodeNonce(num: bigint): Uint8Array {
		if (num === 0n) return new Uint8Array(0);
		let n = num;
		let byteCount = 0;
		while (n > 0n) {
			byteCount++;
			n >>= 8n;
		}
		const bytes = new Uint8Array(byteCount);
		n = num;
		for (let i = byteCount - 1; i >= 0; i--) {
			bytes[i] = Number(n & 0xffn);
			n >>= 8n;
		}
		return bytes;
	}

	const nonceBytes = encodeNonce(nonce);
	const encoded = crypto.rlpEncode([this, nonceBytes]);
	const hash = crypto.keccak256(encoded);
	const result = hash.slice(12) as BrandedAddressType;
	Object.setPrototypeOf(result, Address.prototype);
	Object.defineProperty(result, "_crypto", {
		value: crypto,
		writable: false,
		enumerable: false,
		configurable: false,
	});
	return result;
};
Address.prototype.calculateCreate2Address = function (
	salt: Uint8Array,
	initCode: Uint8Array,
): BrandedAddressType {
	const crypto = (this as any)._crypto;
	if (!crypto?.keccak256) {
		throw new Error(
			"keccak256 not provided to Address constructor. Pass { keccak256 } to enable calculateCreate2Address()",
		);
	}
	// Manual implementation using crypto deps
	const initCodeHash = crypto.keccak256(initCode);
	const data = new Uint8Array(1 + 20 + 32 + 32);
	data[0] = 0xff;
	data.set(this as BrandedAddressType, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);
	const hash = crypto.keccak256(data);
	const result = hash.slice(12) as BrandedAddressType;
	Object.setPrototypeOf(result, Address.prototype);
	Object.defineProperty(result, "_crypto", {
		value: crypto,
		writable: false,
		enumerable: false,
		configurable: false,
	});
	return result;
};
