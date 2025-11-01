/**
 * EIP-2930 Access List Types and Utilities
 *
 * Pre-declare accessed addresses and storage keys for gas optimization.
 * All types namespaced under AccessList for intuitive access.
 *
 * @example
 * ```typescript
 * import { AccessList } from './AccessList.js';
 *
 * // Types
 * const item: AccessList.Item = { address, storageKeys: [] };
 * const list: AccessList = [item];
 *
 * // All operations use this: pattern
 * const cost = AccessList.gasCost.call(list);
 * const savings = AccessList.gasSavings.call(list);
 * const hasSavings = AccessList.hasSavings.call(list);
 * const deduplicated = AccessList.deduplicate.call(list);
 * ```
 */

import type { Address } from "./Address/index.js";
import type { Hash } from "./Hash/index.js";
import { Rlp } from "./Rlp/index.js";

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
   *   const cost = AccessList.gasCost.call(value);
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
   * Calculate total gas cost for access list
   *
   * @returns Total gas cost in wei
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1, key2] }];
   * const cost = AccessList.gasCost.call(list);
   * // cost = ADDRESS_COST + (2 * STORAGE_KEY_COST)
   * ```
   */
  export function gasCost(this: AccessList): bigint {
    let totalCost = 0n;
    for (const item of this) {
      totalCost += ADDRESS_COST;
      totalCost += STORAGE_KEY_COST * BigInt(item.storageKeys.length);
    }
    return totalCost;
  }

  /**
   * Calculate gas savings from using access list
   *
   * Compares cold access costs vs access list costs.
   *
   * @returns Estimated gas savings (can be negative if not beneficial)
   *
   * @example
   * ```typescript
   * const list: AccessList = [{ address, storageKeys: [key1] }];
   * const savings = AccessList.gasSavings.call(list);
   * if (savings > 0n) {
   *   console.log('Access list saves gas:', savings);
   * }
   * ```
   */
  export function gasSavings(this: AccessList): bigint {
    let savings = 0n;
    for (const item of this) {
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
   * Check if access list provides net gas savings
   *
   * @returns true if access list saves gas overall
   *
   * @example
   * ```typescript
   * if (AccessList.hasSavings.call(list)) {
   *   // Use the access list in transaction
   * }
   * ```
   */
  export function hasSavings(this: AccessList): boolean {
    return gasSavings.call(this) > 0n;
  }

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Check if address is in access list
   *
   * @param address - Address to find
   * @returns true if address is in access list
   *
   * @example
   * ```typescript
   * const hasAddress = AccessList.includesAddress.call(list, address);
   * ```
   */
  export function includesAddress(this: AccessList, address: Address): boolean {
    for (const item of this) {
      if (addressEquals(item.address, address)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if storage key is in access list for given address
   *
   * @param address - Address to check
   * @param storageKey - Storage key to find
   * @returns true if storage key is accessible
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
    for (const item of this) {
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
   * Get all storage keys for an address
   *
   * @param address - Address to get keys for
   * @returns Array of storage keys, or undefined if address not found
   *
   * @example
   * ```typescript
   * const keys = AccessList.keysFor.call(list, address);
   * if (keys) {
   *   console.log(`Found ${keys.length} storage keys`);
   * }
   * ```
   */
  export function keysFor(this: AccessList, address: Address): readonly Hash[] | undefined {
    for (const item of this) {
      if (addressEquals(item.address, address)) {
        return item.storageKeys;
      }
    }
    return undefined;
  }

  // ==========================================================================
  // Transformation Operations
  // ==========================================================================

  /**
   * Deduplicate access list entries
   *
   * Merges duplicate addresses and removes duplicate storage keys.
   *
   * @returns Deduplicated access list
   *
   * @example
   * ```typescript
   * const list: AccessList = [
   *   { address: addr1, storageKeys: [key1] },
   *   { address: addr1, storageKeys: [key2, key1] },
   * ];
   * const deduped = AccessList.deduplicate.call(list);
   * // Result: [{ address: addr1, storageKeys: [key1, key2] }]
   * ```
   */
  export function deduplicate(this: AccessList): AccessList {
    const result: Item[] = [];

    for (const item of this) {
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
   * Add address to access list
   *
   * Creates new entry if address doesn't exist, otherwise returns original list.
   *
   * @param address - Address to add
   * @returns New access list with address added
   *
   * @example
   * ```typescript
   * const newList = AccessList.withAddress.call(list, address);
   * ```
   */
  export function withAddress(this: AccessList, address: Address): AccessList {
    if (includesAddress.call(this, address)) {
      return this;
    }
    return [...this, { address, storageKeys: [] }];
  }

  /**
   * Add storage key to access list for address
   *
   * Adds address if it doesn't exist, then adds storage key if not already present.
   *
   * @param address - Address to add key for
   * @param storageKey - Storage key to add
   * @returns New access list with storage key added
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
    const result: Item[] = [];
    let found = false;

    for (const item of this) {
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
   * Merge multiple access lists
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
    return deduplicate.call(combined);
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate access list structure
   *
   * @throws Error if invalid
   *
   * @example
   * ```typescript
   * try {
   *   AccessList.assertValid.call(list);
   *   console.log('Valid access list');
   * } catch (err) {
   *   console.error('Invalid:', err.message);
   * }
   * ```
   */
  export function assertValid(this: AccessList): void {
    if (!Array.isArray(this)) {
      throw new Error("Access list must be an array");
    }

    for (const item of this) {
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

  // ==========================================================================
  // Encoding/Decoding
  // ==========================================================================

  /**
   * Encode access list to RLP
   *
   * @returns RLP-encoded bytes
   *
   * Format: [[address, [storageKey1, storageKey2, ...]], ...]
   *
   * @example
   * ```typescript
   * const encoded = AccessList.toBytes.call(list);
   * ```
   */
  export function toBytes(this: AccessList): Uint8Array {
    // Format: [[address, [storageKey1, storageKey2, ...]], ...]
    const encoded = this.map((item) => [
      item.address,
      item.storageKeys.map((key) => key as Uint8Array),
    ]);
    return Rlp.encode.call(encoded);
  }

  /**
   * Decode RLP bytes to access list
   *
   * @param bytes - RLP-encoded access list
   * @returns Decoded access list
   *
   * @example
   * ```typescript
   * const list = AccessList.fromBytes(bytes);
   * ```
   */
  export function fromBytes(bytes: Uint8Array): AccessList {
    const decoded = Rlp.decode.call(bytes);

    if (decoded.data.type !== "list") {
      throw new Error("Invalid access list: expected list");
    }

    const result: Item[] = [];

    for (const itemData of decoded.data.value) {
      if (itemData.type !== "list" || itemData.value.length !== 2) {
        throw new Error("Invalid access list item: expected [address, keys]");
      }

      const addressData = itemData.value[0];
      const keysData = itemData.value[1];

      if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
        throw new Error("Invalid access list address");
      }

      if (keysData?.type !== "list") {
        throw new Error("Invalid access list storage keys");
      }

      const address = addressData.value as Address;
      const storageKeys: Hash[] = [];

      for (const keyData of keysData.value) {
        if (keyData.type !== "bytes" || keyData.value.length !== 32) {
          throw new Error("Invalid storage key");
        }
        storageKeys.push(keyData.value as Hash);
      }

      result.push({ address, storageKeys });
    }

    return result;
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Count total addresses in access list
   *
   * @returns Number of unique addresses
   *
   * @example
   * ```typescript
   * const count = AccessList.addressCount.call(list);
   * ```
   */
  export function addressCount(this: AccessList): number {
    return this.length;
  }

  /**
   * Count total storage keys across all addresses
   *
   * @returns Total number of storage keys
   *
   * @example
   * ```typescript
   * const keyCount = AccessList.storageKeyCount.call(list);
   * ```
   */
  export function storageKeyCount(this: AccessList): number {
    let count = 0;
    for (const item of this) {
      count += item.storageKeys.length;
    }
    return count;
  }

  /**
   * Check if access list is empty
   *
   * @returns true if empty
   *
   * @example
   * ```typescript
   * if (AccessList.isEmpty.call(list)) {
   *   console.log('No access list entries');
   * }
   * ```
   */
  export function isEmpty(this: AccessList): boolean {
    return this.length === 0;
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

export namespace AccessList {
  export type Type = AccessList;
}

// Re-export namespace as default
export default AccessList;
