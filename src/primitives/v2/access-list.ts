/**
 * EIP-2930 Access List
 * Pre-declare accessed addresses and storage keys for gas optimization
 */

import type { Address } from "../address.js";
import type { Hash } from "../hash.js";

/**
 * Single access list entry
 * Contains address and its accessed storage keys
 */
export interface AccessListItem {
	/** Contract address */
	address: Address;
	/** Storage keys accessed at this address */
	storageKeys: Hash[];
}

/**
 * Access list: array of items
 */
export type AccessList = AccessListItem[];

/**
 * Type guard: Check if value is AccessListItem
 */
export function isAccessListItem(value: unknown): value is AccessListItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Partial<AccessListItem>;
	return (
		typeof item.address === "object" &&
		item.address !== null &&
		"bytes" in item.address &&
		Array.isArray(item.storageKeys) &&
		item.storageKeys.every(
			(key) =>
				typeof key === "object" && key !== null && "bytes" in key,
		)
	);
}

/**
 * Type guard: Check if value is AccessList
 */
export function isAccessList(value: unknown): value is AccessList {
	return Array.isArray(value) && value.every(isAccessListItem);
}

/**
 * Gas costs for EIP-2930
 */
export const ACCESS_LIST_ADDRESS_COST = 2400n;
export const ACCESS_LIST_STORAGE_KEY_COST = 1900n;
export const COLD_ACCOUNT_ACCESS_COST = 2600n;
export const COLD_STORAGE_ACCESS_COST = 2100n;
export const WARM_STORAGE_ACCESS_COST = 100n;

/**
 * Calculate total gas cost for access list
 *
 * @param accessList Access list to calculate cost for
 * @returns Total gas cost
 */
export function calculateGasCost(accessList: AccessList): bigint {
	let totalCost = 0n;
	for (const item of accessList) {
		totalCost += ACCESS_LIST_ADDRESS_COST;
		totalCost += ACCESS_LIST_STORAGE_KEY_COST * BigInt(item.storageKeys.length);
	}
	return totalCost;
}

/**
 * Calculate gas savings from using access list
 *
 * @param accessList Access list
 * @returns Estimated gas savings
 */
export function calculateGasSavings(accessList: AccessList): bigint {
	let savings = 0n;
	for (const item of accessList) {
		// Save on cold account access
		savings += COLD_ACCOUNT_ACCESS_COST - ACCESS_LIST_ADDRESS_COST;

		// Save on cold storage access
		for (const _ of item.storageKeys) {
			savings += COLD_STORAGE_ACCESS_COST - ACCESS_LIST_STORAGE_KEY_COST;
		}
	}
	return savings;
}

/**
 * Check if address is in access list
 *
 * @param accessList Access list to search
 * @param address Address to find
 * @returns true if address is in access list
 */
export function isAddressInAccessList(
	accessList: AccessList,
	address: Address,
): boolean {
	for (const item of accessList) {
		if (addressEquals(item.address, address)) {
			return true;
		}
	}
	return false;
}

/**
 * Check if storage key is in access list for given address
 *
 * @param accessList Access list to search
 * @param address Address to check
 * @param storageKey Storage key to find
 * @returns true if storage key is accessible
 */
export function isStorageKeyInAccessList(
	accessList: AccessList,
	address: Address,
	storageKey: Hash,
): boolean {
	for (const item of accessList) {
		if (addressEquals(item.address, address)) {
			for (const key of item.storageKeys) {
				if (hashEquals(key, storageKey)) {
					return true;
				}
			}
		}
	}
	return false;
}

/**
 * Deduplicate access list entries
 * Merges duplicate addresses and removes duplicate storage keys
 *
 * @param accessList Access list with potential duplicates
 * @returns Deduplicated access list
 */
export function deduplicate(accessList: AccessList): AccessList {
	const result: AccessList = [];

	for (const item of accessList) {
		// Find existing entry with same address
		let existing = result.find((r) => addressEquals(r.address, item.address));

		if (existing) {
			// Merge storage keys, avoiding duplicates
			for (const newKey of item.storageKeys) {
				const isDuplicate = existing.storageKeys.some((existingKey) =>
					hashEquals(existingKey, newKey)
				);
				if (!isDuplicate) {
					existing.storageKeys.push(newKey);
				}
			}
		} else {
			// Create new entry
			result.push({
				address: item.address,
				storageKeys: [...item.storageKeys],
			});
		}
	}

	return result;
}

/**
 * Encode access list to RLP (stub)
 *
 * @param accessList Access list to encode
 * @returns RLP-encoded bytes
 */
export function encode(accessList: AccessList): Uint8Array {
	// TODO: Implement RLP encoding
	// Format: [[address, [storageKey1, storageKey2, ...]], ...]
	throw new Error("AccessList.encode() not yet implemented");
}

/**
 * Decode RLP bytes to access list (stub)
 *
 * @param bytes RLP-encoded access list
 * @returns Decoded access list
 */
export function decode(bytes: Uint8Array): AccessList {
	// TODO: Implement RLP decoding
	throw new Error("AccessList.decode() not yet implemented");
}

/**
 * Validate access list structure
 *
 * @param accessList Access list to validate
 * @throws Error if invalid
 */
export function validate(accessList: AccessList): void {
	if (!Array.isArray(accessList)) {
		throw new Error("Access list must be an array");
	}

	for (const item of accessList) {
		if (!isAccessListItem(item)) {
			throw new Error("Invalid access list item");
		}

		// Validate address
		if (!item.address.bytes || item.address.bytes.length !== 20) {
			throw new Error("Invalid address in access list");
		}

		// Validate storage keys
		for (const key of item.storageKeys) {
			if (!key.bytes || key.bytes.length !== 32) {
				throw new Error("Invalid storage key in access list");
			}
		}
	}
}

// Helper functions for comparison

function addressEquals(a: Address, b: Address): boolean {
	if (a.bytes.length !== b.bytes.length) return false;
	for (let i = 0; i < a.bytes.length; i++) {
		if (a.bytes[i] !== b.bytes[i]) return false;
	}
	return true;
}

function hashEquals(a: Hash, b: Hash): boolean {
	if (a.bytes.length !== b.bytes.length) return false;
	for (let i = 0; i < a.bytes.length; i++) {
		if (a.bytes[i] !== b.bytes[i]) return false;
	}
	return true;
}
