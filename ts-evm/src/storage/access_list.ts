import type { Word } from '../types';
import type { Address } from '../types_blockchain';

// EIP-2929 gas costs
export const GAS_COSTS = {
  COLD_ACCOUNT_ACCESS: 2600,
  WARM_ACCOUNT_ACCESS: 100,
  COLD_SLOAD: 2100,
  WARM_SLOAD: 100,
  COLD_ACCOUNT_ACCESS_PRECOMPILE: 2600,
  WARM_ACCOUNT_ACCESS_PRECOMPILE: 100
} as const;

export interface AccessListEntry {
  address: Address;
  storageKeys: Set<string>;
}

export class AccessList {
  private addresses: Set<string>;
  private storage: Map<string, Set<string>>;

  constructor() {
    this.addresses = new Set();
    this.storage = new Map();
  }

  // Initialize from transaction access list (EIP-2930)
  initializeFromTransaction(accessList: AccessListEntry[]): void {
    this.clear();
    
    for (const entry of accessList) {
      const addressKey = entry.address.toString();
      this.addresses.add(addressKey);
      
      if (entry.storageKeys.size > 0) {
        const storageSet = new Set<string>();
        for (const key of entry.storageKeys) {
          storageSet.add(key);
        }
        this.storage.set(addressKey, storageSet);
      }
    }
  }

  // Account access
  addAddress(address: Address): void {
    this.addresses.add(address.toString());
  }

  containsAddress(address: Address): boolean {
    return this.addresses.has(address.toString());
  }

  // Access an account and return the gas cost
  accessAccount(address: Address): number {
    const addressKey = address.toString();
    if (this.addresses.has(addressKey)) {
      return GAS_COSTS.WARM_ACCOUNT_ACCESS;
    } else {
      this.addresses.add(addressKey);
      return GAS_COSTS.COLD_ACCOUNT_ACCESS;
    }
  }

  // Storage access
  private getStorageKey(key: Word): string {
    return key.toString(16).padStart(64, '0');
  }

  addStorage(address: Address, key: Word): void {
    const addressKey = address.toString();
    const storageKey = this.getStorageKey(key);
    
    // Add address if not present
    this.addresses.add(addressKey);
    
    // Add storage key
    let storageSet = this.storage.get(addressKey);
    if (!storageSet) {
      storageSet = new Set();
      this.storage.set(addressKey, storageSet);
    }
    storageSet.add(storageKey);
  }

  containsStorage(address: Address, key: Word): boolean {
    const addressKey = address.toString();
    const storageKey = this.getStorageKey(key);
    
    const storageSet = this.storage.get(addressKey);
    return storageSet ? storageSet.has(storageKey) : false;
  }

  // Access storage and return the gas cost
  accessStorage(address: Address, key: Word): number {
    const addressKey = address.toString();
    const storageKey = this.getStorageKey(key);
    
    // Add address if not present
    this.addresses.add(addressKey);
    
    // Check if storage key is warm
    let storageSet = this.storage.get(addressKey);
    if (!storageSet) {
      storageSet = new Set();
      this.storage.set(addressKey, storageSet);
    }
    
    if (storageSet.has(storageKey)) {
      return GAS_COSTS.WARM_SLOAD;
    } else {
      storageSet.add(storageKey);
      return GAS_COSTS.COLD_SLOAD;
    }
  }

  // Precompile access (special handling for precompiled contracts)
  accessPrecompile(address: Address): number {
    const addressKey = address.toString();
    if (this.addresses.has(addressKey)) {
      return GAS_COSTS.WARM_ACCOUNT_ACCESS_PRECOMPILE;
    } else {
      this.addresses.add(addressKey);
      return GAS_COSTS.COLD_ACCOUNT_ACCESS_PRECOMPILE;
    }
  }

  // Merge another access list into this one
  merge(other: AccessList): void {
    // Merge addresses
    for (const address of other.addresses) {
      this.addresses.add(address);
    }
    
    // Merge storage
    for (const [address, storageKeys] of other.storage) {
      let existingStorage = this.storage.get(address);
      if (!existingStorage) {
        existingStorage = new Set();
        this.storage.set(address, existingStorage);
      }
      for (const key of storageKeys) {
        existingStorage.add(key);
      }
    }
  }

  // Create a copy
  clone(): AccessList {
    const copy = new AccessList();
    copy.addresses = new Set(this.addresses);
    copy.storage = new Map();
    
    for (const [address, keys] of this.storage) {
      copy.storage.set(address, new Set(keys));
    }
    
    return copy;
  }

  // Clear the access list
  clear(): void {
    this.addresses.clear();
    this.storage.clear();
  }

  // Get statistics
  getStats(): {
    addressCount: number;
    storageKeyCount: number;
    storageByAddress: Map<string, number>;
  } {
    const storageByAddress = new Map<string, number>();
    let totalStorageKeys = 0;
    
    for (const [address, keys] of this.storage) {
      const keyCount = keys.size;
      storageByAddress.set(address, keyCount);
      totalStorageKeys += keyCount;
    }
    
    return {
      addressCount: this.addresses.size,
      storageKeyCount: totalStorageKeys,
      storageByAddress
    };
  }

  // Export to EIP-2930 format
  toTransactionFormat(): AccessListEntry[] {
    const result: AccessListEntry[] = [];
    
    for (const addressStr of this.addresses) {
      const storageKeys = this.storage.get(addressStr);
      result.push({
        address: BigInt('0x' + addressStr),
        storageKeys: storageKeys || new Set()
      });
    }
    
    return result;
  }
}