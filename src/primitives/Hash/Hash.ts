/**
 * Hash Types and Utilities
 *
 * 32-byte hash values with encoding/decoding and comparison utilities.
 * Functions grouped via 'export * as Hash' in index.ts.
 *
 * @example
 * ```typescript
 * import { Hash } from './hash.js';
 *
 * // Create hash from hex
 * const hash = Hash.fromHex('0x1234...');
 *
 * // Convert to hex
 * const hex = Hash.toHex.call(hash);
 *
 * // Compare hashes
 * const same = Hash.equals.call(hash1, hash2);
 *
 * // Hash data with keccak256
 * const digest = Hash.keccak256(data);
 * ```
 */

import { keccak_256 } from "@noble/hashes/sha3.js";

// ============================================================================
// Core Types
// ============================================================================

/**
 * Brand symbol for type safety
 */
export const hashSymbol = Symbol("Hash");

/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;

/**
 * Zero hash constant (32 zero bytes)
 */
export const ZERO = new Uint8Array(SIZE) as Hash;

// ============================================================================
// Creation Functions
// ============================================================================

/**
 * Create Hash from hex string
 *
 * @param hex - Hex string with optional 0x prefix
 * @returns Hash bytes
 * @throws If hex is invalid or wrong length
 *
 * @example
 * ```typescript
 * const hash = Hash.fromHex('0x1234...');
 * const hash2 = Hash.fromHex('1234...'); // 0x prefix optional
 * ```
 */
export function fromHex(hex: string): Hash {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length !== SIZE * 2) {
		throw new Error(
			`Hash hex must be ${SIZE * 2} characters, got ${normalized.length}`,
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		throw new Error("Invalid hex string");
	}
	const bytes = new Uint8Array(SIZE);
	for (let i = 0; i < SIZE; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as Hash;
}

/**
 * Create Hash from raw bytes
 *
 * @param bytes - Raw bytes (must be 32 bytes)
 * @returns Hash bytes
 * @throws If bytes is wrong length
 *
 * @example
 * ```typescript
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): Hash {
	if (bytes.length !== SIZE) {
		throw new Error(`Hash must be ${SIZE} bytes, got ${bytes.length}`);
	}
	return new Uint8Array(bytes) as Hash;
}

/**
 * Create Hash from string or bytes
 *
 * @param value - Hex string with optional 0x prefix or Uint8Array
 * @returns Hash bytes
 *
 * @example
 * ```typescript
 * const hash = Hash.from('0x1234...');
 * const hash2 = Hash.from(new Uint8Array(32));
 * ```
 */
export function from(value: string | Uint8Array): Hash {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}

// ============================================================================
// Conversion Functions (Internal implementations with this: pattern)
// ============================================================================

/**
 * Convert Hash to hex string (internal)
 *
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Hash._toHex.call(hash);
 * // "0x1234..."
 * ```
 */
export function _toHex(this: Hash): string {
	return `0x${Array.from(this, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert Hash to raw bytes (internal)
 *
 * @returns Copy of hash bytes
 *
 * @example
 * ```typescript
 * const bytes = Hash._toBytes.call(hash);
 * ```
 */
export function _toBytes(this: Hash): Uint8Array {
	return new Uint8Array(this);
}

/**
 * Convert Hash to string (internal, alias for toHex)
 *
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const str = Hash._toString.call(hash);
 * ```
 */
export function _toString(this: Hash): string {
	return `0x${Array.from(this, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

// ============================================================================
// Comparison Functions (Internal implementations with this: pattern)
// ============================================================================

/**
 * Compare this hash with another for equality (internal)
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param other - Hash to compare with
 * @returns True if hashes are equal
 *
 * @example
 * ```typescript
 * const same = Hash._equals.call(hash1, hash2);
 * ```
 */
export function _equals(this: Hash, other: Hash): boolean {
	if (this.length !== other.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < this.length; i++) {
		result |= this[i]! ^ other[i]!;
	}
	return result === 0;
}

/**
 * Check if this hash is zero hash (internal)
 *
 * @returns True if hash is all zeros
 *
 * @example
 * ```typescript
 * const isZero = Hash._isZero.call(hash);
 * ```
 */
export function _isZero(this: Hash): boolean {
	if (this.length !== ZERO.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < this.length; i++) {
		result |= this[i]! ^ ZERO[i]!;
	}
	return result === 0;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if value is a valid Hash
 *
 * @param value - Value to check
 * @returns True if value is Hash type
 *
 * @example
 * ```typescript
 * if (Hash.isHash(value)) {
 *   // value is Hash
 * }
 * ```
 */
export function isHash(value: unknown): value is Hash {
	return value instanceof Uint8Array && value.length === SIZE;
}

/**
 * Validate hex string is valid hash format
 *
 * @param hex - Hex string to validate
 * @returns True if valid hash hex format
 *
 * @example
 * ```typescript
 * if (Hash.isValidHex('0x1234...')) {
 *   const hash = Hash.fromHex('0x1234...');
 * }
 * ```
 */
export function isValidHex(hex: string): boolean {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	return normalized.length === SIZE * 2 && /^[0-9a-fA-F]+$/.test(normalized);
}

/**
 * Assert value is a Hash, throws if not
 *
 * @param value - Value to assert
 * @param message - Optional error message
 * @throws If value is not a Hash
 *
 * @example
 * ```typescript
 * Hash.assert(value); // throws if not Hash
 * ```
 */
export function assert(
	value: unknown,
	message?: string,
): asserts value is Hash {
	if (!isHash(value)) {
		throw new Error(message ?? "Value is not a Hash");
	}
}

// ============================================================================
// Hashing Functions
// ============================================================================

/**
 * Hash data with Keccak-256
 *
 * @param data - Data to hash
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256(data);
 * ```
 */
export function keccak256(data: Uint8Array): Hash {
	return keccak_256(data) as Hash;
}

/**
 * Hash string with Keccak-256
 *
 * @param str - String to hash (UTF-8 encoded)
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256String('hello');
 * ```
 */
export function keccak256String(str: string): Hash {
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(str));
}

/**
 * Hash hex string with Keccak-256
 *
 * @param hex - Hex string to hash (with or without 0x prefix)
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256Hex('0x1234...');
 * ```
 */
export function keccak256Hex(hex: string): Hash {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length % 2 !== 0) {
		throw new Error("Hex string must have even length");
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return keccak256(bytes);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate random hash
 *
 * @returns Random 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.random();
 * ```
 */
export function random(): Hash {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const bytes = new Uint8Array(SIZE);
		crypto.getRandomValues(bytes);
		return bytes as Hash;
	}
	throw new Error("crypto.getRandomValues not available");
}

/**
 * Clone this hash (internal)
 *
 * @returns New hash with same value
 *
 * @example
 * ```typescript
 * const copy = Hash._clone.call(hash);
 * ```
 */
export function _clone(this: Hash): Hash {
	return new Uint8Array(this) as Hash;
}

/**
 * Get slice of this hash (internal)
 *
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive)
 * @returns Slice of hash bytes
 *
 * @example
 * ```typescript
 * const selector = Hash._slice.call(hash, 0, 4);
 * ```
 */
export function _slice(this: Hash, start?: number, end?: number): Uint8Array {
	return this.slice(start, end);
}

/**
 * Format this hash for display (internal, truncated)
 *
 * @param prefixLength - Number of chars to show at start (default 6)
 * @param suffixLength - Number of chars to show at end (default 4)
 * @returns Formatted string like "0x1234...5678"
 *
 * @example
 * ```typescript
 * const display = Hash._format.call(hash);
 * // "0x1234...5678"
 * ```
 */
export function _format(
	this: Hash,
	prefixLength = 6,
	suffixLength = 4,
): string {
	const hex = `0x${Array.from(this, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
	if (hex.length <= prefixLength + suffixLength + 2) {
		return hex;
	}
	return `${hex.slice(0, prefixLength + 2)}...${hex.slice(-suffixLength)}`;
}

// ============================================================================
// Type Definition
// ============================================================================

/**
 * Hash type: 32-byte hash value
 *
 * Branded type for type safety.
 */
export type Hash = Uint8Array & { __brand: typeof hashSymbol };

// ============================================================================
// Public Wrapper Functions (namespace+type overloading pattern)
// ============================================================================

/**
 * Convert Hash to hex string
 *
 * @param value - Value to convert to Hash first
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Hash.toHex("0x1234...");
 * // "0x1234..."
 * ```
 */
export function toHex(value: string | Uint8Array): string {
	return _toHex.call(from(value));
}

/**
 * Convert Hash to raw bytes
 *
 * @param value - Value to convert to Hash first
 * @returns Copy of hash bytes
 *
 * @example
 * ```typescript
 * const bytes = Hash.toBytes("0x1234...");
 * ```
 */
export function toBytes(value: string | Uint8Array): Uint8Array {
	return _toBytes.call(from(value));
}

/**
 * Convert Hash to string
 *
 * @param value - Value to convert to Hash first
 * @returns Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const str = Hash.toString("0x1234...");
 * ```
 */
export function toString(value: string | Uint8Array): string {
	return _toString.call(from(value));
}

/**
 * Compare two hashes for equality
 *
 * @param value - First hash value
 * @param other - Hash to compare with
 * @returns True if hashes are equal
 *
 * @example
 * ```typescript
 * const same = Hash.equals("0x1234...", hash2);
 * ```
 */
export function equals(value: string | Uint8Array, other: Hash): boolean {
	return _equals.call(from(value), other);
}

/**
 * Check if hash is zero hash
 *
 * @param value - Value to check
 * @returns True if hash is all zeros
 *
 * @example
 * ```typescript
 * const isZero = Hash.isZero("0x00...");
 * ```
 */
export function isZero(value: string | Uint8Array): boolean {
	return _isZero.call(from(value));
}

/**
 * Clone hash
 *
 * @param value - Value to clone
 * @returns New hash with same value
 *
 * @example
 * ```typescript
 * const copy = Hash.clone("0x1234...");
 * ```
 */
export function clone(value: string | Uint8Array): Hash {
	return _clone.call(from(value));
}

/**
 * Get slice of hash
 *
 * @param value - Hash value to slice
 * @param start - Start index (inclusive)
 * @param end - End index (exclusive)
 * @returns Slice of hash bytes
 *
 * @example
 * ```typescript
 * const selector = Hash.slice("0x1234...", 0, 4);
 * ```
 */
export function slice(
	value: string | Uint8Array,
	start?: number,
	end?: number,
): Uint8Array {
	return _slice.call(from(value), start, end);
}

/**
 * Format hash for display (truncated)
 *
 * @param value - Hash value to format
 * @param prefixLength - Number of chars to show at start (default 6)
 * @param suffixLength - Number of chars to show at end (default 4)
 * @returns Formatted string like "0x1234...5678"
 *
 * @example
 * ```typescript
 * const display = Hash.format("0x1234...");
 * // "0x1234...5678"
 * ```
 */
export function format(
	value: string | Uint8Array,
	prefixLength = 6,
	suffixLength = 4,
): string {
	return _format.call(from(value), prefixLength, suffixLength);
}
