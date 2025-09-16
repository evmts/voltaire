/**
 * Storage interface types for the Bun EVM
 */

export interface Account {
  balance: bigint;
  nonce: bigint;
  codeHash: Uint8Array;
  storageRoot: Uint8Array;
}

export interface Storage {
  // Account operations
  getAccount(address: Uint8Array): Promise<Account | null>;
  setAccount(address: Uint8Array, account: Account): Promise<void>;
  deleteAccount(address: Uint8Array): Promise<void>;
  accountExists(address: Uint8Array): Promise<boolean>;
  getBalance(address: Uint8Array): Promise<bigint>;
  
  // Storage operations
  getStorage(address: Uint8Array, key: bigint): Promise<bigint>;
  setStorage(address: Uint8Array, key: bigint, value: bigint): Promise<void>;
  
  // Code operations
  getCode(codeHash: Uint8Array): Promise<Uint8Array>;
  getCodeByAddress(address: Uint8Array): Promise<Uint8Array>;
  setCode(code: Uint8Array): Promise<Uint8Array>; // Returns hash
  
  // State operations
  getStateRoot(): Promise<Uint8Array>;
  commitChanges(): Promise<Uint8Array>;
  
  // Snapshot operations
  createSnapshot(): Promise<number>;
  revertToSnapshot(id: number): Promise<void>;
  commitSnapshot(id: number): Promise<void>;
}

export interface ForkedStorageOptions {
  rpcUrl: string;
  blockNumber?: bigint;
  cacheSize?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  rpcCalls: number;
}