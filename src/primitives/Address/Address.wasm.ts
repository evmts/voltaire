/**
 * WASM implementation of Address primitives
 * Uses WebAssembly bindings to Zig implementation for high-performance operations
 */

import * as loader from "../../wasm-loader/loader.js";
import type { BrandedAddress } from "./BrandedAddress/BrandedAddress.js";
import type { Checksummed } from "./BrandedAddress/ChecksumAddress.js";
import type { Lowercase } from "./BrandedAddress/LowercaseAddress.js";
import type { Uppercase } from "./BrandedAddress/UppercaseAddress.js";

/**
 * Create Address from hex string (WASM implementation)
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte Address
 * @throws {Error} If hex format is invalid
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export function fromHex(hex: string): BrandedAddress {
	return loader.addressFromHex(hex) as BrandedAddress;
}

/**
 * Convert Address to lowercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Lowercase hex string with 0x prefix
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const hex = Address.toHex(addr);
 * ```
 */
export function toHex(address: BrandedAddress): string {
	return loader.addressToHex(address);
}

/**
 * Convert Address to EIP-55 checksummed hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Checksummed hex string with 0x prefix
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const checksummed = Address.toChecksummed(addr);
 * ```
 */
export function toChecksummed(address: BrandedAddress): Checksummed {
	return loader.addressToChecksumHex(address) as Checksummed;
}

/**
 * Convert Address to lowercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Lowercase hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const lower = Address.toLowercase(addr);
 * ```
 */
export function toLowercase(address: BrandedAddress): Lowercase {
	return loader.addressToHex(address) as Lowercase;
}

/**
 * Convert Address to uppercase hex string
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns Uppercase hex string
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * const upper = Address.toUppercase(addr);
 * ```
 */
export function toUppercase(address: BrandedAddress): Uppercase {
	const hex = loader.addressToHex(address);
	return hex.toUpperCase() as Uppercase;
}

/**
 * Check if address is zero address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param address - 20-byte address
 * @returns true if address is 0x0000...0000
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isZero(addr)) { ... }
 * ```
 */
export function isZero(address: BrandedAddress): boolean {
	return loader.addressIsZero(address);
}

/**
 * Compare two addresses for equality
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param a - First address
 * @param b - Second address
 * @returns true if addresses are equal
 * @throws {never} Never throws
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.equals(addr1, addr2)) { ... }
 * ```
 */
export function equals(a: BrandedAddress, b: BrandedAddress): boolean {
	return loader.addressEquals(a, b);
}

/**
 * Validate EIP-55 checksum
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string to validate
 * @returns true if checksum is valid
 * @throws {never} Never throws - returns false on errors
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isValidChecksum('0x742d35Cc...')) { ... }
 * ```
 */
export function isValidChecksum(hex: string): boolean {
	return loader.addressValidateChecksum(hex);
}

/**
 * Validate address format
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.0.0
 * @param hex - Hex string to validate
 * @returns true if valid address format
 * @throws {never} Never throws - returns false on errors
 * @example
 * ```typescript
 * import * as Address from './primitives/Address/Address.wasm.js';
 * if (Address.isValid('0x742d35...')) { ... }
 * ```
 */
export function isValid(hex: string): boolean {
	try {
		loader.addressFromHex(hex);
		return true;
	} catch {
		return false;
	}
}

/**
 * Calculate CREATE address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Transaction nonce
 * @returns Contract address
 */
export function calculateCreateAddress(
	sender: BrandedAddress,
	nonce: bigint,
): BrandedAddress {
	return loader.calculateCreateAddress(sender, Number(nonce)) as BrandedAddress;
}

/**
 * Calculate CREATE2 address
 * @param sender - Sender address (20 bytes)
 * @param salt - 32-byte salt
 * @param initCode - Contract initialization code
 * @returns Contract address
 */
export function calculateCreate2Address(
	sender: BrandedAddress,
	salt: Uint8Array,
	initCode: Uint8Array,
): BrandedAddress {
	return loader.calculateCreate2Address(
		sender,
		salt,
		initCode,
	) as BrandedAddress;
}

/**
 * Create Address from bytes
 * @param bytes - 20-byte array
 * @returns Address
 */
export function fromBytes(bytes: Uint8Array): BrandedAddress {
	if (bytes.length !== 20) {
		throw new Error("Address must be exactly 20 bytes");
	}
	return new Uint8Array(bytes) as BrandedAddress;
}

/**
 * Create Address from number/bigint
 * @param value - Number or bigint value
 * @returns Address
 */
export function fromNumber(value: number | bigint): BrandedAddress {
	const num = typeof value === "number" ? BigInt(value) : value;
	const bytes = new Uint8Array(20);
	let remaining = num;
	for (let i = 19; i >= 0; i--) {
		bytes[i] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return bytes as BrandedAddress;
}

/**
 * Create Address from public key coordinates
 * @param x - Public key X coordinate
 * @param y - Public key Y coordinate
 * @returns Address derived from public key
 */
export function fromPublicKey(x: bigint, y: bigint): BrandedAddress {
	// Pack public key coordinates into 64 bytes
	const pubkey = new Uint8Array(64);
	for (let i = 0; i < 32; i++) {
		pubkey[i] = Number((x >> BigInt((31 - i) * 8)) & 0xffn);
		pubkey[32 + i] = Number((y >> BigInt((31 - i) * 8)) & 0xffn);
	}

	// Hash and take last 20 bytes
	const hash = loader.keccak256(pubkey);
	return hash.slice(12, 32) as BrandedAddress;
}

/**
 * Convert Address to U256
 * @param address - 20-byte address
 * @returns U256 representation
 */
export function toU256(address: BrandedAddress): bigint {
	let result = 0n;
	for (let i = 0; i < 20; i++) {
		result = (result << 8n) | BigInt(address[i] ?? 0);
	}
	return result;
}

/**
 * Convert Address to ABI-encoded format (32 bytes, left-padded)
 * @param address - 20-byte address
 * @returns 32-byte ABI-encoded address
 */
export function toAbiEncoded(address: BrandedAddress): Uint8Array {
	const encoded = new Uint8Array(32);
	encoded.set(address, 12); // Left-pad with 12 zeros
	return encoded;
}

/**
 * Create Address from ABI-encoded format
 * @param encoded - 32-byte ABI-encoded address
 * @returns Address
 */
export function fromAbiEncoded(encoded: Uint8Array): BrandedAddress {
	if (encoded.length !== 32) {
		throw new Error("ABI-encoded address must be 32 bytes");
	}
	return encoded.slice(12, 32) as BrandedAddress;
}

/**
 * Convert Address to short hex format (0x1234...5678)
 * @param address - 20-byte address
 * @param sliceLength - Number of characters to show on each side (default: 4)
 * @returns Abbreviated hex string
 */
export function toShortHex(address: BrandedAddress, sliceLength = 4): string {
	const hex = loader.addressToHex(address);
	if (hex.length <= 2 + sliceLength * 2) {
		return hex;
	}
	return `${hex.slice(0, 2 + sliceLength)}...${hex.slice(-sliceLength)}`;
}

/**
 * Format Address for display (checksummed)
 * @param address - 20-byte address
 * @returns Checksummed hex string
 */
export function format(address: BrandedAddress): string {
	return loader.addressToChecksumHex(address);
}

/**
 * Lexicographic comparison of addresses
 * @param a - First address
 * @param b - Second address
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: BrandedAddress, b: BrandedAddress): number {
	for (let i = 0; i < 20; i++) {
		const aByte = a[i] ?? 0;
		const bByte = b[i] ?? 0;
		if (aByte < bByte) return -1;
		if (aByte > bByte) return 1;
	}
	return 0;
}

/**
 * Check if first address is less than second
 * @param a - First address
 * @param b - Second address
 * @returns true if a < b
 */
export function lessThan(a: BrandedAddress, b: BrandedAddress): boolean {
	return compare(a, b) < 0;
}

/**
 * Check if first address is greater than second
 * @param a - First address
 * @param b - Second address
 * @returns true if a > b
 */
export function greaterThan(a: BrandedAddress, b: BrandedAddress): boolean {
	return compare(a, b) > 0;
}

/**
 * Zero address constant
 */
export function zero(): BrandedAddress {
	return new Uint8Array(20) as BrandedAddress;
}

/**
 * General-purpose Address.from method
 * @param value - Number, bigint, string, or Uint8Array
 * @returns Address
 */
export function from(
	value: number | bigint | string | Uint8Array,
): BrandedAddress {
	if (typeof value === "string") {
		return fromHex(value);
	}
	if (typeof value === "number" || typeof value === "bigint") {
		return fromNumber(value);
	}
	return fromBytes(value);
}

// Named export for Address namespace
export const Address = {
	fromHex,
	fromBytes,
	fromNumber,
	fromPublicKey,
	fromAbiEncoded,
	from,
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
	calculateCreateAddress,
	calculateCreate2Address,
	compare,
	lessThan,
	greaterThan,
	zero,
};

// Re-export for convenience
export default Address;
