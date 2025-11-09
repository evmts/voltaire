// @ts-nocheck
/**
 * WASM implementation of Ethereum Address type
 * Uses WebAssembly bindings to Zig implementation
 */

export * from "./errors.js";
export * from "./constants.js";
export * from "./BrandedAddress.js";
import * as Checksummed from "./ChecksumAddress.js";
export { Checksummed };
import * as Lowercase from "./LowercaseAddress.js";
export { Lowercase };
import * as Uppercase from "./UppercaseAddress.js";
export { Uppercase };

import * as loader from "../../wasm-loader/loader.js";
import { HEX_SIZE, SIZE } from "./constants.js";
import {
	InvalidAddressLengthError,
	InvalidHexFormatError,
	InvalidHexStringError,
	InvalidValueError,
} from "./errors.js";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
	toHexPolyfill,
} from "./polyfills.js";

/**
 * @typedef {import('./BrandedAddress.js').BrandedAddress} BrandedAddress
 * @typedef {import('./AddressConstructor.js').AddressConstructor} AddressConstructor
 */

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Universal factory for Address - accepts multiple input types
 *
 * @param {number | bigint | string | Uint8Array} value - Value to convert
 * @returns {BrandedAddress} Address bytes
 * @throws {InvalidValueError} If value type is unsupported
 *
 * @example
 * ```typescript
 * const addr1 = Address.from("0x742d35Cc...");
 * const addr2 = Address.from(new Uint8Array(20));
 * const addr3 = Address.from(123n);
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	if (typeof value === "number" || typeof value === "bigint") {
		return fromNumber(value);
	}
	throw new InvalidValueError();
}

/**
 * Parse hex string to Address (WASM accelerated)
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {BrandedAddress} Address bytes
 * @throws {InvalidHexFormatError} If invalid format or length
 * @throws {InvalidHexStringError} If hex contains invalid characters
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function fromHex(hex) {
	try {
		const bytes = loader.addressFromHex(hex);
		return /** @type {BrandedAddress} */ (bytes);
	} catch (e) {
		if (e.message.includes("Invalid hex")) {
			throw new InvalidHexStringError();
		}
		if (e.message.includes("Invalid length")) {
			throw new InvalidHexFormatError();
		}
		throw e;
	}
}

/**
 * Create Address from 20-byte buffer
 *
 * @param {Uint8Array} bytes - 20-byte buffer
 * @returns {BrandedAddress} Address bytes
 * @throws {InvalidAddressLengthError} If not exactly 20 bytes
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(20);
 * const addr = Address.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new InvalidAddressLengthError();
	}
	return /** @type {BrandedAddress} */ (new Uint8Array(bytes));
}

/**
 * Create Address from number or bigint (right-padded to 20 bytes)
 *
 * @param {number | bigint} value - Numeric value
 * @returns {BrandedAddress} Address bytes
 *
 * @example
 * ```typescript
 * const addr = Address.fromNumber(123n);
 * ```
 */
export function fromNumber(value) {
	const n = typeof value === "bigint" ? value : BigInt(value);
	const bytes = new Uint8Array(SIZE);
	let temp = n;
	for (let i = SIZE - 1; i >= 0; i--) {
		bytes[i] = Number(temp & 0xffn);
		temp >>= 8n;
	}
	return /** @type {BrandedAddress} */ (bytes);
}

/**
 * Derive Address from secp256k1 public key coordinates (keccak256(pubkey)[12:32])
 *
 * @param {bigint} x - X coordinate
 * @param {bigint} y - Y coordinate
 * @returns {BrandedAddress} Address bytes
 *
 * @example
 * ```typescript
 * const addr = Address.fromPublicKey(xCoord, yCoord);
 * ```
 */
export function fromPublicKey(x, y) {
	// Encode uncompressed public key (0x04 + x + y)
	const pubkey = new Uint8Array(65);
	pubkey[0] = 0x04;

	// Write x coordinate (32 bytes, big-endian)
	let tempX = x;
	for (let i = 32; i >= 1; i--) {
		pubkey[i] = Number(tempX & 0xffn);
		tempX >>= 8n;
	}

	// Write y coordinate (32 bytes, big-endian)
	let tempY = y;
	for (let i = 64; i >= 33; i--) {
		pubkey[i] = Number(tempY & 0xffn);
		tempY >>= 8n;
	}

	// Hash and take last 20 bytes
	const hash = loader.keccak256(pubkey);
	return /** @type {BrandedAddress} */ (hash.slice(12));
}

/**
 * Decode Address from ABI-encoded bytes (left-padded to 32 bytes)
 *
 * @param {Uint8Array} value - ABI-encoded address (32 bytes)
 * @returns {BrandedAddress} Address bytes
 * @throws {InvalidAddressLengthError} If not 32 bytes
 *
 * @example
 * ```typescript
 * const abiEncoded = new Uint8Array(32); // 12 zero bytes + 20 address bytes
 * const addr = Address.fromAbiEncoded(abiEncoded);
 * ```
 */
export function fromAbiEncoded(value) {
	if (value.length !== 32) {
		throw new InvalidAddressLengthError();
	}
	return /** @type {BrandedAddress} */ (value.slice(12));
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert Address to lowercase hex string (WASM accelerated)
 *
 * @param {BrandedAddress} address - Address to convert
 * @returns {import('../Hex/index.js').BrandedHex} Lowercase hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Address.toHex(addr);
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toHex(address) {
	return /** @type {import('../Hex/index.js').BrandedHex} */ (
		loader.addressToHex(address)
	);
}

/**
 * Convert Address to EIP-55 checksummed hex string (WASM accelerated)
 *
 * @param {BrandedAddress} address - Address to convert
 * @returns {import('./ChecksumAddress.js').ChecksumAddress} Checksummed hex string
 *
 * @example
 * ```typescript
 * const checksummed = Address.toChecksummed(addr);
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 */
export function toChecksummed(address) {
	return /** @type {import('./ChecksumAddress.js').ChecksumAddress} */ (
		loader.addressToChecksumHex(address)
	);
}

/**
 * Convert Address to lowercase hex string
 *
 * @param {BrandedAddress} address - Address to convert
 * @returns {import('./LowercaseAddress.js').LowercaseAddress} Lowercase hex string
 *
 * @example
 * ```typescript
 * const lower = Address.toLowercase(addr);
 * ```
 */
export function toLowercase(address) {
	return /** @type {import('./LowercaseAddress.js').LowercaseAddress} */ (
		loader.addressToHex(address)
	);
}

/**
 * Convert Address to uppercase hex string
 *
 * @param {BrandedAddress} address - Address to convert
 * @returns {import('./UppercaseAddress.js').UppercaseAddress} Uppercase hex string
 *
 * @example
 * ```typescript
 * const upper = Address.toUppercase(addr);
 * ```
 */
export function toUppercase(address) {
	return /** @type {import('./UppercaseAddress.js').UppercaseAddress} */ (
		loader.addressToHex(address).toUpperCase()
	);
}

/**
 * Convert Address to Uint256 representation (left-padded to 32 bytes)
 *
 * @param {BrandedAddress} address - Address to convert
 * @returns {import('../Uint/index.js').BrandedUint256} Uint256 bytes
 *
 * @example
 * ```typescript
 * const u256 = Address.toU256(addr);
 * ```
 */
export function toU256(address) {
	const bytes = new Uint8Array(32);
	bytes.set(address, 12); // Left-pad with 12 zero bytes
	return /** @type {import('../Uint/index.js').BrandedUint256} */ (bytes);
}

/**
 * Encode Address for ABI (left-padded to 32 bytes)
 *
 * @param {BrandedAddress} address - Address to encode
 * @returns {Uint8Array} ABI-encoded address (32 bytes)
 *
 * @example
 * ```typescript
 * const encoded = Address.toAbiEncoded(addr);
 * ```
 */
export function toAbiEncoded(address) {
	const bytes = new Uint8Array(32);
	bytes.set(address, 12); // Left-pad with 12 zero bytes
	return bytes;
}

/**
 * Convert Address to abbreviated hex string (0x1234...5678)
 *
 * @param {BrandedAddress} address - Address to format
 * @returns {string} Abbreviated hex string
 *
 * @example
 * ```typescript
 * const short = Address.toShortHex(addr);
 * // "0x742d...51e3"
 * ```
 */
export function toShortHex(address) {
	const hex = loader.addressToHex(address);
	return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
}

// ============================================================================
// Validation & Comparison Functions
// ============================================================================

/**
 * Check if Address is zero address (0x0000...0000) (WASM accelerated)
 *
 * @param {BrandedAddress} address - Address to check
 * @returns {boolean} True if zero address
 *
 * @example
 * ```typescript
 * if (Address.isZero(addr)) { ... }
 * ```
 */
export function isZero(address) {
	return loader.addressIsZero(address);
}

/**
 * Compare two addresses for equality (WASM accelerated)
 *
 * @param {BrandedAddress} a - First address
 * @param {BrandedAddress} b - Second address
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * if (Address.equals(addr1, addr2)) { ... }
 * ```
 */
export function equals(a, b) {
	return loader.addressEquals(a, b);
}

/**
 * Validate hex string format (40 hex chars, optional 0x prefix)
 *
 * @param {string} hex - Hex string to validate
 * @returns {boolean} True if valid format
 *
 * @example
 * ```typescript
 * if (Address.isValid("0x742d35...")) { ... }
 * ```
 */
export function isValid(hex) {
	if (hex.startsWith("0x")) {
		return hex.length === HEX_SIZE && /^0x[0-9a-fA-F]{40}$/.test(hex);
	}
	return hex.length === 40 && /^[0-9a-fA-F]{40}$/.test(hex);
}

/**
 * Validate EIP-55 checksum (WASM accelerated)
 *
 * @param {string} hex - Hex string to validate
 * @returns {boolean} True if checksum is valid
 *
 * @example
 * ```typescript
 * if (Address.isValidChecksum("0x742d35Cc...")) { ... }
 * ```
 */
export function isValidChecksum(hex) {
	try {
		return loader.addressValidateChecksum(hex);
	} catch {
		return false;
	}
}

/**
 * Type guard for Address
 *
 * @param {unknown} value - Value to check
 * @returns {value is BrandedAddress} True if valid Address
 *
 * @example
 * ```typescript
 * if (Address.is(value)) { ... }
 * ```
 */
export function is(value) {
	return value instanceof Uint8Array && value.length === SIZE;
}

/**
 * Lexicographic comparison of two addresses
 *
 * @param {BrandedAddress} a - First address
 * @param {BrandedAddress} b - Second address
 * @returns {-1 | 0 | 1} -1 if a < b, 0 if equal, 1 if a > b
 *
 * @example
 * ```typescript
 * const result = Address.compare(addr1, addr2);
 * ```
 */
export function compare(a, b) {
	for (let i = 0; i < SIZE; i++) {
		if (a[i] < b[i]) return -1;
		if (a[i] > b[i]) return 1;
	}
	return 0;
}

/**
 * Check if first address is less than second
 *
 * @param {BrandedAddress} a - First address
 * @param {BrandedAddress} b - Second address
 * @returns {boolean} True if a < b
 *
 * @example
 * ```typescript
 * if (Address.lessThan(addr1, addr2)) { ... }
 * ```
 */
export function lessThan(a, b) {
	return compare(a, b) === -1;
}

/**
 * Check if first address is greater than second
 *
 * @param {BrandedAddress} a - First address
 * @param {BrandedAddress} b - Second address
 * @returns {boolean} True if a > b
 *
 * @example
 * ```typescript
 * if (Address.greaterThan(addr1, addr2)) { ... }
 * ```
 */
export function greaterThan(a, b) {
	return compare(a, b) === 1;
}

// ============================================================================
// Contract Address Calculation
// ============================================================================

/**
 * Calculate CREATE contract address (WASM accelerated)
 * Formula: keccak256(rlp([sender, nonce]))[12:32]
 *
 * @param {BrandedAddress} sender - Deployer address
 * @param {number} nonce - Account nonce
 * @returns {BrandedAddress} Computed contract address
 *
 * @example
 * ```typescript
 * const contractAddr = Address.calculateCreateAddress(sender, 42);
 * ```
 */
export function calculateCreateAddress(sender, nonce) {
	const bytes = loader.calculateCreateAddress(sender, nonce);
	return /** @type {BrandedAddress} */ (bytes);
}

/**
 * Calculate CREATE2 contract address (WASM accelerated)
 * Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]
 *
 * @param {BrandedAddress} sender - Deployer address
 * @param {Uint8Array} salt - 32-byte salt
 * @param {Uint8Array} initCode - Contract initialization code
 * @returns {BrandedAddress} Computed contract address
 *
 * @example
 * ```typescript
 * const salt = new Uint8Array(32);
 * const initCode = new Uint8Array([0x60, 0x80, ...]);
 * const contractAddr = Address.calculateCreate2Address(sender, salt, initCode);
 * ```
 */
export function calculateCreate2Address(sender, salt, initCode) {
	const bytes = loader.calculateCreate2Address(sender, salt, initCode);
	return /** @type {BrandedAddress} */ (bytes);
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Zero address constant
 *
 * @returns {BrandedAddress} Zero address (0x0000...0000)
 *
 * @example
 * ```typescript
 * const zeroAddr = Address.zero();
 * ```
 */
export function zero() {
	return /** @type {BrandedAddress} */ (new Uint8Array(SIZE));
}

// ============================================================================
// Constructor Function
// ============================================================================

/**
 * Factory function for creating Address instances
 *
 * @type {AddressConstructor}
 */
export function Address(value) {
	return from(value);
}

// Static factory methods
Address.from = (value) => from(value);

Address.fromBase64 = (value) => Uint8Array.fromBase64(value);

Address.fromHex = (value) => fromHex(value);

Address.fromBytes = (value) => fromBytes(value);

Address.fromNumber = (value) => fromNumber(value);

Address.fromPublicKey = (x, y) => fromPublicKey(x, y);

Address.fromAbiEncoded = (value) => fromAbiEncoded(value);

// Static utility methods
Address.toHex = toHex;
Address.toChecksummed = toChecksummed;
Address.toLowercase = toLowercase;
Address.toUppercase = toUppercase;
Address.toU256 = toU256;
Address.toAbiEncoded = toAbiEncoded;
Address.toShortHex = toShortHex;
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

// Prototype methods
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
