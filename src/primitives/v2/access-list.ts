/**
 * EIP-2930 Access List Types and Utilities
 *
 * Pre-declare accessed addresses and storage keys for gas optimization.
 * All types namespaced under AccessList for intuitive access.
 *
 * @example
 * ```typescript
 * import { AccessList } from './access-list.js';
 *
 * // Types
 * const item: AccessList.Item = { address, storageKeys: [] };
 * const list: AccessList = [item];
 *
 * // Standard form operations
 * const cost = AccessList.calculateGasCost(list);
 * const savings = AccessList.calculateGasSavings(list);
 *
 * // Convenience form with this:
 * const hasSavings = AccessList.hasSavings.call(list);
 * const deduplicated = AccessList.deduplicate.call(list);
 * ```
 */

import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// ============================================================================
// Main AccessList Namespace
// ============================================================================

export namespace AccessList {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Single access list entry
   * Contains address and its accessed storage keys
   */
  export type Item<
    TAddress extends Address = Address,
    TStorageKeys extends readonly Hash[] = readonly Hash[],
  > = {
    /** Contract address */
    address: TAddress;
    /** Storage keys accessed at this address */
    storageKeys: TStorageKeys;
  };

  // ==========================================================================
  // Gas Cost Constants (EIP-2930)
  // ==========================================================================

  /** Gas cost per address in access list */
  export const ADDRESS_COST = 2400n;

  /** Gas cost per storage key in access list */
  export const STORAGE_KEY_COST = 1900n;

  /** Gas cost for cold account access (without access list) */
  export const COLD_ACCOUNT_ACCESS_COST = 2600n;

  /** Gas cost for cold storage access (without access list) */
  export const COLD_STORAGE_ACCESS_COST = 2100n;

  /** Gas cost for warm storage access */
  export const WARM_STORAGE_ACCESS_COST = 100n;

  // ==========================================================================
  // Type Guards
  // ==========================================================================

  /**
   * Type guard: Check if value is AccessListItem
   *
   * @param value - Value to check
   * @returns true if value is AccessListItem
   *
   * @example
   * ```typescript
   * if (AccessList.isItem(value)) {
   *   console.log(value.address, value.storageKeys);
   * }
   * ```
   */
  export function isItem(value: unknown): value is Item {
    if (typeof value !== "object" || value === null) return false;
    const item = value as Partial<Item>;
    return (
      item.address instanceof Uint8Array &&
      item.address.length === 20 &&
      Array.isArray(item.storageKeys) &&
      item.storageKeys.every(
        (key) => key instanceof Uint8Array && key.length === 32,
      )
    );
  }

  /**
   * Type guard: Check if value is AccessList
   *
   * @param value - Value to check
   * @returns true if value is AccessList
   *
   * @example
   * ```typescript
   * if (AccessList.is(value)) {
   *   const cost = AccessList.calculateGasCost(value);
   * }
   * ```
   */
  export function is(value: unknown): value is AccessList {
    return Array.isArray(value) && value.every(isItem);
  }

  // ==========================================================================
  // Gas Cost Operations
  // ==========================================================================

  /**
   * Calculate total gas cost for access list (standard form)
   *
   * @param accessList - Access list to calculate cost for
   * @returns Total gas cost in wei
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1, key2] }];
   * const cost = AccessList.calculateGasCost(list);
   * // cost = ADDRESS_COST + (2 * STORAGE_KEY_COST)
   * ```
   */
  export function calculateGasCost(accessList: AccessList): bigint {
    let totalCost = 0n;
    for (const item of accessList) {
      totalCost += ADDRESS_COST;
      totalCost += STORAGE_KEY_COST * BigInt(item.storageKeys.length);
    }
    return totalCost;
  }

  /**
   * Calculate total gas cost for access list (convenience form with this:)
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1, key2] }];
   * const cost = AccessList.gasCost.call(list);
   * ```
   */
  export function gasCost(this: AccessList): bigint {
    return calculateGasCost(this);
  }

  /**
   * Calculate gas savings from using access list (standard form)
   *
   * Compares cold access costs vs access list costs.
   *
   * @param accessList - Access list
   * @returns Estimated gas savings (can be negative if not beneficial)
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1] }];
   * const savings = AccessList.calculateGasSavings(list);
   * if (savings > 0n) {
   *   console.log('Access list saves gas:', savings);
   * }
   * ```
   */
  export function calculateGasSavings(accessList: AccessList): bigint {
    let savings = 0n;
    for (const item of accessList) {
      // Save on cold account access
      savings += COLD_ACCOUNT_ACCESS_COST - ADDRESS_COST;

      // Save on cold storage access
      for (const _ of item.storageKeys) {
        savings += COLD_STORAGE_ACCESS_COST - STORAGE_KEY_COST;
      }
    }
    return savings;
  }

  /**
   * Calculate gas savings from using access list (convenience form with this:)
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1] }];
   * const savings = AccessList.gasSavings.call(list);
   * ```
   */
  export function gasSavings(this: AccessList): bigint {
    return calculateGasSavings(this);
  }

  /**
   * Check if access list provides net gas savings (standard form)
   *
   * @param accessList - Access list
   * @returns true if access list saves gas overall
   *
   * @example
   * ```typescript
   * if (AccessList.hasSavings(list)) {
   *   // Use the access list in transaction
   * }
   * ```
   */
  export function calculateHasSavings(accessList: AccessList): boolean {
    return calculateGasSavings(accessList) > 0n;
  }

  /**
   * Check if access list provides net gas savings (convenience form with this:)
   *
   * @example
   * ```typescript
   * if (AccessList.hasSavings.call(list)) {
   *   // Use the access list in transaction
   * }
   * ```
   */
  export function hasSavings(this: AccessList): boolean {
    return calculateHasSavings(this);
  }

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Check if address is in access list (standard form)
   *
   * @param accessList - Access list to search
   * @param address - Address to find
   * @returns true if address is in access list
   *
   * @example
   * ```typescript
   * const hasAddress = AccessList.hasAddress(list, address);
   * ```
   */
  export function hasAddress(accessList: AccessList, address: Address): boolean {
    for (const item of accessList) {
      if (addressEquals(item.address, address)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if address is in access list (convenience form with this:)
   *
   * @example
   * ```typescript
   * const hasAddress = AccessList.hasAddress.call(list, address);
   * ```
   */
  export function includesAddress(this: AccessList, address: Address): boolean {
    return hasAddress(this, address);
  }

  /**
   * Check if storage key is in access list for given address (standard form)
   *
   * @param accessList - Access list to search
   * @param address - Address to check
   * @param storageKey - Storage key to find
   * @returns true if storage key is accessible
   *
   * @example
   * ```typescript
   * const isAccessible = AccessList.hasStorageKey(list, address, key);
   * ```
   */
  export function hasStorageKey(
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
   * Check if storage key is in access list for given address (convenience form with this:)
   *
   * @example
   * ```typescript
   * const isAccessible = AccessList.includesStorageKey.call(list, address, key);
   * ```
   */
  export function includesStorageKey(
    this: AccessList,
    address: Address,
    storageKey: Hash,
  ): boolean {
    return hasStorageKey(this, address, storageKey);
  }

  /**
   * Get all storage keys for an address (standard form)
   *
   * @param accessList - Access list to search
   * @param address - Address to get keys for
   * @returns Array of storage keys, or undefined if address not found
   *
   * @example
   * ```typescript
   * const keys = AccessList.getStorageKeys(list, address);
   * if (keys) {
   *   console.log(`Found ${keys.length} storage keys`);
   * }
   * ```
   */
  export function getStorageKeys(
    accessList: AccessList,
    address: Address,
  ): readonly Hash[] | undefined {
    for (const item of accessList) {
      if (addressEquals(item.address, address)) {
        return item.storageKeys;
      }
    }
    return undefined;
  }

  /**
   * Get all storage keys for an address (convenience form with this:)
   *
   * @example
   * ```typescript
   * const keys = AccessList.getStorageKeys.call(list, address);
   * ```
   */
  export function keysFor(this: AccessList, address: Address): readonly Hash[] | undefined {
    return getStorageKeys(this, address);
  }

  // ==========================================================================
  // Transformation Operations
  // ==========================================================================

  /**
   * Deduplicate access list entries (standard form)
   *
   * Merges duplicate addresses and removes duplicate storage keys.
   *
   * @param accessList - Access list with potential duplicates
   * @returns Deduplicated access list
   *
   * @example
   * ```typescript
   * const list: AccessList = [
   *   { address: addr1, storageKeys: [key1] },
   *   { address: addr1, storageKeys: [key2, key1] },
   * ];
   * const deduped = AccessList.deduplicate(list);
   * // Result: [{ address: addr1, storageKeys: [key1, key2] }]
   * ```
   */
  export function deduplicateAccessList(accessList: AccessList): AccessList {
    const result: Item[] = [];

    for (const item of accessList) {
      // Find existing entry with same address
      const existing = result.find((r) => addressEquals(r.address, item.address));

      if (existing) {
        // Merge storage keys, avoiding duplicates
        const existingKeys = existing.storageKeys as Hash[];
        for (const newKey of item.storageKeys) {
          const isDuplicate = existingKeys.some((existingKey) =>
            hashEquals(existingKey, newKey),
          );
          if (!isDuplicate) {
            existingKeys.push(newKey);
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
   * Deduplicate access list entries (convenience form with this:)
   *
   * @example
   * ```typescript
   * const deduped = AccessList.deduplicate.call(list);
   * ```
   */
  export function deduplicate(this: AccessList): AccessList {
    return deduplicateAccessList(this);
  }

  /**
   * Add address to access list (standard form)
   *
   * Creates new entry if address doesn't exist, otherwise returns original list.
   *
   * @param accessList - Access list
   * @param address - Address to add
   * @returns New access list with address added
   *
   * @example
   * ```typescript
   * const newList = AccessList.addAddress(list, address);
   * ```
   */
  export function addAddress(accessList: AccessList, address: Address): AccessList {
    if (hasAddress(accessList, address)) {
      return accessList;
    }
    return [...accessList, { address, storageKeys: [] }];
  }

  /**
   * Add address to access list (convenience form with this:)
   *
   * @example
   * ```typescript
   * const newList = AccessList.addAddress.call(list, address);
   * ```
   */
  export function withAddress(this: AccessList, address: Address): AccessList {
    return addAddress(this, address);
  }

  /**
   * Add storage key to access list for address (standard form)
   *
   * Adds address if it doesn't exist, then adds storage key if not already present.
   *
   * @param accessList - Access list
   * @param address - Address to add key for
   * @param storageKey - Storage key to add
   * @returns New access list with storage key added
   *
   * @example
   * ```typescript
   * const newList = AccessList.addStorageKey(list, address, key);
   * ```
   */
  export function addStorageKey(
    accessList: AccessList,
    address: Address,
    storageKey: Hash,
  ): AccessList {
    const result: Item[] = [];
    let found = false;

    for (const item of accessList) {
      if (addressEquals(item.address, address)) {
        found = true;
        // Check if key already exists
        const hasKey = item.storageKeys.some((k) => hashEquals(k, storageKey));
        if (hasKey) {
          result.push(item);
        } else {
          result.push({
            address: item.address,
            storageKeys: [...item.storageKeys, storageKey],
          });
        }
      } else {
        result.push(item);
      }
    }

    // If address not found, add new entry
    if (!found) {
      result.push({ address, storageKeys: [storageKey] });
    }

    return result;
  }

  /**
   * Add storage key to access list for address (convenience form with this:)
   *
   * @example
   * ```typescript
   * const newList = AccessList.withStorageKey.call(list, address, key);
   * ```
   */
  export function withStorageKey(
    this: AccessList,
    address: Address,
    storageKey: Hash,
  ): AccessList {
    return addStorageKey(this, address, storageKey);
  }

  /**
   * Merge multiple access lists (standard form)
   *
   * Combines multiple access lists and deduplicates.
   *
   * @param accessLists - Access lists to merge
   * @returns Merged and deduplicated access list
   *
   * @example
   * ```typescript
   * const merged = AccessList.merge([list1, list2, list3]);
   * ```
   */
  export function merge(...accessLists: AccessList[]): AccessList {
    const combined: Item[] = [];
    for (const list of accessLists) {
      combined.push(...list);
    }
    return deduplicateAccessList(combined);
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate access list structure (standard form)
   *
   * @param accessList - Access list to validate
   * @throws Error if invalid
   *
   * @example
   * ```typescript
   * try {
   *   AccessList.validate(list);
   *   console.log('Valid access list');
   * } catch (err) {
   *   console.error('Invalid:', err.message);
   * }
   * ```
   */
  export function validate(accessList: AccessList): void {
    if (!Array.isArray(accessList)) {
      throw new Error("Access list must be an array");
    }

    for (const item of accessList) {
      if (!isItem(item)) {
        throw new Error("Invalid access list item");
      }

      // Validate address
      if (!(item.address instanceof Uint8Array) || item.address.length !== 20) {
        throw new Error("Invalid address in access list");
      }

      // Validate storage keys
      for (const key of item.storageKeys) {
        if (!(key instanceof Uint8Array) || key.length !== 32) {
          throw new Error("Invalid storage key in access list");
        }
      }
    }
  }

  /**
   * Validate access list structure (convenience form with this:)
   *
   * @example
   * ```typescript
   * AccessList.validate.call(list);
   * ```
   */
  export function assertValid(this: AccessList): void {
    validate(this);
  }

  // ==========================================================================
  // Encoding/Decoding
  // ==========================================================================

  /**
   * Encode access list to RLP (standard form)
   *
   * @param accessList - Access list to encode
   * @returns RLP-encoded bytes
   *
   * TODO: Implement RLP encoding
   * Format: [[address, [storageKey1, storageKey2, ...]], ...]
   *
   * @example
   * ```typescript
   * const encoded = AccessList.encode(list);
   * ```
   */
  export function encode(_accessList: AccessList): Uint8Array {
    // TODO: Implement RLP encoding
    // Format: [[address, [storageKey1, storageKey2, ...]], ...]
    throw new Error("Not implemented");
  }

  /**
   * Encode access list to RLP (convenience form with this:)
   *
   * @example
   * ```typescript
   * const encoded = AccessList.encode.call(list);
   * ```
   */
  export function toBytes(this: AccessList): Uint8Array {
    return encode(this);
  }

  /**
   * Decode RLP bytes to access list (standard form)
   *
   * @param bytes - RLP-encoded access list
   * @returns Decoded access list
   *
   * TODO: Implement RLP decoding
   *
   * @example
   * ```typescript
   * const list = AccessList.decode(bytes);
   * ```
   */
  export function decode(_bytes: Uint8Array): AccessList {
    // TODO: Implement RLP decoding
    throw new Error("Not implemented");
  }

  /**
   * Decode RLP bytes to access list (convenience form)
   *
   * @example
   * ```typescript
   * const list = AccessList.fromBytes(bytes);
   * ```
   */
  export function fromBytes(bytes: Uint8Array): AccessList {
    return decode(bytes);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Count total addresses in access list (standard form)
   *
   * @param accessList - Access list
   * @returns Number of unique addresses
   *
   * @example
   * ```typescript
   * const count = AccessList.countAddresses(list);
   * ```
   */
  export function countAddresses(accessList: AccessList): number {
    return accessList.length;
  }

  /**
   * Count total storage keys across all addresses (standard form)
   *
   * @param accessList - Access list
   * @returns Total number of storage keys
   *
   * @example
   * ```typescript
   * const keyCount = AccessList.countStorageKeys(list);
   * ```
   */
  export function countStorageKeys(accessList: AccessList): number {
    let count = 0;
    for (const item of accessList) {
      count += item.storageKeys.length;
    }
    return count;
  }

  /**
   * Check if access list is empty (standard form)
   *
   * @param accessList - Access list
   * @returns true if empty
   *
   * @example
   * ```typescript
   * if (AccessList.isEmpty(list)) {
   *   console.log('No access list entries');
   * }
   * ```
   */
  export function isEmpty(accessList: AccessList): boolean {
    return accessList.length === 0;
  }

  /**
   * Check if access list is empty (convenience form with this:)
   *
   * @example
   * ```typescript
   * if (AccessList.isEmpty.call(list)) {
   *   console.log('No access list entries');
   * }
   * ```
   */
  export function empty(this: AccessList): boolean {
    return isEmpty(this);
  }

  /**
   * Create empty access list
   *
   * @returns Empty access list
   *
   * @example
   * ```typescript
   * const list = AccessList.create();
   * ```
   */
  export function create(): AccessList {
    return [];
  }

  // ==========================================================================
  // Internal Helper Functions
  // ==========================================================================

  /**
   * Compare two addresses for equality (byte-by-byte)
   */
  function addressEquals(a: Address, b: Address): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Compare two hashes for equality (byte-by-byte)
   */
  function hashEquals(a: Hash, b: Hash): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

/**
 * Access list: array of items (EIP-2930)
 *
 * Uses TypeScript declaration merging - AccessList is both a namespace and a type.
 */
export type AccessList = readonly AccessList.Item[];

// Re-export namespace as default
export default AccessList;
