/**
 * Ethereum address (20 bytes)
 *
 * Maps to C type: PrimitivesAddress
 * struct PrimitivesAddress { uint8_t bytes[20]; }
 */
export interface Address {
	/** Raw 20-byte address data */
	bytes: Uint8Array;
}

/**
 * Address as hex string (42 characters: "0x" + 40 hex)
 */
export type AddressHex = `0x${string}`;

/**
 * Address size in bytes
 */
export const ADDRESS_SIZE = 20;

/**
 * Address hex string length (with 0x prefix)
 */
export const ADDRESS_HEX_LENGTH = 42;

/**
 * Type guard: Check if string is valid address hex (42 chars)
 */
export function isAddressHex(value: unknown): value is AddressHex {
	return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
}

/**
 * Type guard: Check if value is Address
 */
export function isAddress(value: unknown): value is Address {
	return (
		typeof value === "object" &&
		value !== null &&
		"bytes" in value &&
		value.bytes instanceof Uint8Array &&
		value.bytes.length === 20
	);
}

/**
 * Create Address from bytes
 *
 * @param bytes 20-byte Uint8Array
 * @returns Address object
 * @throws Error if bytes length is not 20
 */
export function createAddress(bytes: Uint8Array): Address {
	if (bytes.length !== ADDRESS_SIZE) {
		throw new Error(
			`Address must be ${ADDRESS_SIZE} bytes, got ${bytes.length}`,
		);
	}
	return { bytes: new Uint8Array(bytes) };
}

/**
 * Zero address (0x0000000000000000000000000000000000000000)
 */
export const ZERO_ADDRESS: Address = {
	bytes: new Uint8Array(20),
};

/**
 * Check if address is zero address
 *
 * @param address Address to check
 * @returns true if all bytes are zero
 */
export function isZeroAddress(address: Address): boolean {
	return address.bytes.every((byte) => byte === 0);
}

/**
 * Compare two addresses for equality
 *
 * @param a First address
 * @param b Second address
 * @returns true if addresses are equal
 */
export function addressEquals(a: Address, b: Address): boolean {
	if (a.bytes.length !== b.bytes.length) {
		return false;
	}
	for (let i = 0; i < a.bytes.length; i++) {
		if (a.bytes[i] !== b.bytes[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Convert bytes to hex string with 0x prefix
 *
 * @param bytes Input bytes
 * @returns Hex string with 0x prefix
 */
function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert Address to hex string
 *
 * @param address Address object
 * @returns 42-character hex string
 */
export function addressToHex(address: Address): AddressHex {
	return bytesToHex(address.bytes) as AddressHex;
}
