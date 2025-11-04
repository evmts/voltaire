/**
 * Ethereum State Primitives
 *
 * Constants and types for EVM state management, including storage keys,
 * empty code hash, and empty trie root.
 *
 * @module State
 */

import type { BrandedAddress } from "../Address/index.js";
import { Hash, type BrandedHash } from "../Hash/index.js";

/**
 * Hash of empty EVM bytecode (Keccak256 of empty bytes).
 *
 * This is a well-known constant in Ethereum representing the Keccak256 hash
 * of an empty byte array. It's used to identify accounts with no associated
 * contract code.
 *
 * Value: Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
 */
export const EMPTY_CODE_HASH: Hash = new Uint8Array([
	0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2, 0xdc,
	0xc7, 0x03, 0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b, 0x7b, 0xfa,
	0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
]) as BrandedHash;

/**
 * Root hash of an empty Merkle Patricia Trie.
 *
 * This is the root hash of an empty trie structure in Ethereum, used as
 * the initial value for account storage roots and state roots when they
 * contain no data.
 *
 * Value: Keccak256(RLP(null)) = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
 */
export const EMPTY_TRIE_ROOT: Hash = new Uint8Array([
	0x56, 0xe8, 0x1f, 0x17, 0x1b, 0xcc, 0x55, 0xa6, 0xff, 0x83, 0x45, 0xe6, 0x92,
	0xc0, 0xf8, 0x6e, 0x5b, 0x48, 0xe0, 0x1b, 0x99, 0x6c, 0xad, 0xc0, 0x01, 0x62,
	0x2f, 0xb5, 0xe3, 0x63, 0xb4, 0x21,
]) as BrandedHash;

/**
 * Composite key for EVM storage operations combining address and slot.
 *
 * The StorageKey uniquely identifies a storage location within the EVM by
 * combining a contract address with a 256-bit storage slot number. This is
 * fundamental to how the EVM organizes persistent contract storage.
 *
 * ## Design Rationale
 * Each smart contract has its own isolated storage space addressed by 256-bit
 * slots. To track storage across multiple contracts in a single VM instance,
 * we need a composite key that includes both the contract address and the
 * slot number.
 *
 * ## Storage Model
 * In the EVM:
 * - Each contract has 2^256 storage slots
 * - Each slot can store a 256-bit value
 * - Slots are initially zero and only consume gas when first written
 *
 * @example
 * ```typescript
 * const key: StorageKey = {
 *   address: myContractAddress,
 *   slot: 0n, // First storage slot
 * };
 *
 * // Use in maps for storage tracking
 * const storage = new Map<string, bigint>();
 * const keyStr = StorageKey.toString(key);
 * storage.set(keyStr, value);
 * ```
 */
export interface StorageKey {
	/**
	 * The contract address that owns this storage slot.
	 * Standard 20-byte Ethereum address.
	 */
	readonly address: BrandedAddress;

	/**
	 * The 256-bit storage slot number within the contract's storage space.
	 * Slots are sparsely allocated - most remain at zero value.
	 */
	readonly slot: bigint;
}

/**
 * Inputs that can be converted to StorageKey
 */
export type StorageKeyLike =
	| StorageKey
	| {
			address: BrandedAddress;
			slot: bigint;
	  };

/**
 * StorageKey namespace with utility functions
 */
export namespace StorageKey {
	/**
	 * Type guard to check if a value is a valid StorageKey
	 *
	 * @param value - Value to check
	 * @returns True if value is a valid StorageKey
	 *
	 * @example
	 * ```typescript
	 * const key = { address: addr, slot: 0n };
	 * if (StorageKey.is(key)) {
	 *   // key is StorageKey
	 * }
	 * ```
	 */
	export function is(value: unknown): value is StorageKey {
		if (typeof value !== "object" || value === null) return false;
		const obj = value as Record<string, unknown>;
		return (
			obj["address"] instanceof Uint8Array &&
			obj["address"].length === 20 &&
			typeof obj["slot"] === "bigint"
		);
	}

	/**
	 * Convert StorageKeyLike to StorageKey
	 *
	 * @param value - Value to convert
	 * @returns StorageKey
	 *
	 * @example
	 * ```typescript
	 * const key = StorageKey.from({ address: addr, slot: 0n });
	 * ```
	 */
	export function from(value: StorageKeyLike): StorageKey {
		return { address: value.address, slot: value.slot };
	}

	/**
	 * Create a new StorageKey
	 *
	 * @param address - Contract address
	 * @param slot - Storage slot number
	 * @returns A new StorageKey
	 *
	 * @example
	 * ```typescript
	 * const key = StorageKey.create(contractAddr, 0n);
	 * ```
	 */
	export function create(address: BrandedAddress, slot: bigint): StorageKey {
		return { address, slot };
	}

	// ============================================================================
	// Internal methods (with this: parameter)
	// ============================================================================

	/**
	 * Internal: Check equality with another storage key
	 *
	 * @this StorageKey
	 * @param other - Storage key to compare with
	 * @returns True if keys are equal
	 */
	export function _equals(this: StorageKey, other: StorageKey): boolean {
		if (this.slot !== other.slot) return false;
		if (this.address.length !== other.address.length) return false;
		for (let i = 0; i < this.address.length; i++) {
			if ((this.address[i] ?? 0) !== (other.address[i] ?? 0)) return false;
		}
		return true;
	}

	/**
	 * Internal: Convert to string representation
	 *
	 * @this StorageKey
	 * @returns String representation
	 */
	export function _toString(this: StorageKey): string {
		const addrHex = Array.from(this.address)
			.map((b) => (b ?? 0).toString(16).padStart(2, "0"))
			.join("");
		const slotHex = this.slot.toString(16).padStart(64, "0");
		return `${addrHex}_${slotHex}`;
	}

	/**
	 * Internal: Compute hash code
	 *
	 * @this StorageKey
	 * @returns Hash code
	 */
	export function _hashCode(this: StorageKey): number {
		let hash = 0;
		// Hash address bytes
		for (let i = 0; i < this.address.length; i++) {
			hash = ((hash << 5) - hash + (this.address[i] ?? 0)) | 0;
		}
		// Hash slot (convert to bytes)
		const slotLow = Number(this.slot & 0xffffffffn);
		const slotHigh = Number((this.slot >> 32n) & 0xffffffffn);
		hash = ((hash << 5) - hash + slotLow) | 0;
		hash = ((hash << 5) - hash + slotHigh) | 0;
		return hash;
	}

	// ============================================================================
	// Public wrapper functions
	// ============================================================================

	/**
	 * Check equality between two storage keys.
	 *
	 * Two storage keys are equal if and only if both their address and
	 * slot number match exactly.
	 *
	 * @param a - First storage key
	 * @param b - Second storage key
	 * @returns True if both address and slot match
	 *
	 * @example
	 * ```typescript
	 * const key1: StorageKey = { address: addr, slot: 0n };
	 * const key2: StorageKey = { address: addr, slot: 0n };
	 * StorageKey.equals(key1, key2); // true
	 * ```
	 */
	export function equals(a: StorageKeyLike, b: StorageKeyLike): boolean {
		return _equals.call(from(a), from(b));
	}

	/**
	 * Convert StorageKey to a string representation for use as Map key
	 *
	 * The string format is: address_hex + "_" + slot_hex
	 *
	 * @param key - Storage key to convert
	 * @returns String representation
	 *
	 * @example
	 * ```typescript
	 * const key: StorageKey = { address: addr, slot: 42n };
	 * const str = StorageKey.toString(key);
	 * // Use as Map key
	 * map.set(str, value);
	 * ```
	 */
	export function toString(key: StorageKeyLike): string {
		return _toString.call(from(key));
	}

	/**
	 * Parse a StorageKey from its string representation
	 *
	 * @param str - String representation from toString()
	 * @returns Parsed StorageKey or undefined if invalid
	 *
	 * @example
	 * ```typescript
	 * const key = StorageKey.fromString(str);
	 * if (key) {
	 *   // Use key
	 * }
	 * ```
	 */
	export function fromString(str: string): StorageKey | undefined {
		const parts = str.split("_");
		if (parts.length !== 2) return undefined;

		const addrHex = parts[0];
		const slotHex = parts[1];
		if (!addrHex || !slotHex) return undefined;
		if (addrHex.length !== 40 || slotHex.length !== 64) return undefined;

		// Validate hex characters
		if (!/^[0-9a-fA-F]+$/.test(addrHex) || !/^[0-9a-fA-F]+$/.test(slotHex)) {
			return undefined;
		}

		try {
			const address = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				address[i] = Number.parseInt(addrHex.slice(i * 2, i * 2 + 2), 16);
			}

			const slot = BigInt("0x" + slotHex);

			return { address: address as Address, slot };
		} catch {
			return undefined;
		}
	}

	/**
	 * Compute a hash code for the storage key for use in hash-based collections
	 *
	 * @param key - Storage key to hash
	 * @returns Hash code as a number
	 *
	 * @example
	 * ```typescript
	 * const hash = StorageKey.hashCode(key);
	 * ```
	 */
	export function hashCode(key: StorageKeyLike): number {
		return _hashCode.call(from(key));
	}
}
