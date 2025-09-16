import type { Word } from '../types';
import type { Address } from '../types_blockchain';
import { Account, createEmptyAccount, hashCode, EMPTY_CODE_HASH } from './account';

export interface StorageKey {
  address: Address;
  key: Word;
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export interface Snapshot {
  id: number;
  accounts: Map<string, Account>;
  storage: Map<string, Word>;
  transientStorage: Map<string, Word>;
}

export class Database {
  private accounts: Map<string, Account>;
  private storage: Map<string, Word>;
  private transientStorage: Map<string, Word>;
  private codeStorage: Map<string, Uint8Array>;
  private snapshots: Snapshot[];
  private nextSnapshotId: number;

  constructor() {
    this.accounts = new Map();
    this.storage = new Map();
    this.transientStorage = new Map();
    this.codeStorage = new Map();
    this.snapshots = [];
    this.nextSnapshotId = 0;
  }

  private storageKeyToString(address: Address, key: Word): string {
    return `${address.toString()}:${key.toString(16).padStart(64, '0')}`;
  }

  private codeHashToString(hash: Uint8Array): string {
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Account operations
  getAccount(address: Address): Account | null {
    const key = address.toString();
    return this.accounts.get(key) || null;
  }

  getAccountOrCreate(address: Address): Account {
    const key = address.toString();
    let account = this.accounts.get(key);
    if (!account) {
      account = createEmptyAccount();
      this.accounts.set(key, account);
    }
    return account;
  }

  setAccount(address: Address, account: Account): void {
    const key = address.toString();
    this.accounts.set(key, account);
  }

  accountExists(address: Address): boolean {
    const key = address.toString();
    const account = this.accounts.get(key);
    if (!account) return false;
    // Account exists if it has non-zero balance, nonce, or code
    return account.balance > 0n || account.nonce > 0n || 
           !account.codeHash.every((b, i) => b === EMPTY_CODE_HASH[i]);
  }

  // Balance operations
  getBalance(address: Address): Word {
    const account = this.getAccount(address);
    return account ? account.balance : 0n;
  }

  setBalance(address: Address, balance: Word): void {
    const account = this.getAccountOrCreate(address);
    account.balance = balance;
  }

  transferBalance(from: Address, to: Address, amount: Word): void {
    const fromAccount = this.getAccountOrCreate(from);
    if (fromAccount.balance < amount) {
      throw new DatabaseError('Insufficient balance');
    }
    const toAccount = this.getAccountOrCreate(to);
    fromAccount.balance -= amount;
    toAccount.balance += amount;
  }

  // Nonce operations
  getNonce(address: Address): bigint {
    const account = this.getAccount(address);
    return account ? account.nonce : 0n;
  }

  setNonce(address: Address, nonce: bigint): void {
    const account = this.getAccountOrCreate(address);
    account.nonce = nonce;
  }

  incrementNonce(address: Address): bigint {
    const account = this.getAccountOrCreate(address);
    const newNonce = account.nonce + 1n;
    account.nonce = newNonce;
    return newNonce;
  }

  // Code operations
  getCode(address: Address): Uint8Array {
    const account = this.getAccount(address);
    if (!account) return new Uint8Array();
    
    const hashStr = this.codeHashToString(account.codeHash);
    if (hashStr === this.codeHashToString(EMPTY_CODE_HASH)) {
      return new Uint8Array();
    }
    
    return this.codeStorage.get(hashStr) || new Uint8Array();
  }

  setCode(address: Address, code: Uint8Array): void {
    const account = this.getAccountOrCreate(address);
    const codeHash = hashCode(code);
    account.codeHash = codeHash;
    
    if (code.length > 0) {
      const hashStr = this.codeHashToString(codeHash);
      this.codeStorage.set(hashStr, code);
    }
  }

  getCodeHash(address: Address): Uint8Array {
    const account = this.getAccount(address);
    return account ? account.codeHash : EMPTY_CODE_HASH;
  }

  getCodeSize(address: Address): number {
    const code = this.getCode(address);
    return code.length;
  }

  // Storage operations
  getStorage(address: Address, key: Word): Word {
    const storageKey = this.storageKeyToString(address, key);
    return this.storage.get(storageKey) || 0n;
  }

  setStorage(address: Address, key: Word, value: Word): void {
    const storageKey = this.storageKeyToString(address, key);
    if (value === 0n) {
      this.storage.delete(storageKey);
    } else {
      this.storage.set(storageKey, value);
    }
  }

  // Transient storage operations (EIP-1153)
  getTransientStorage(address: Address, key: Word): Word {
    const storageKey = this.storageKeyToString(address, key);
    return this.transientStorage.get(storageKey) || 0n;
  }

  setTransientStorage(address: Address, key: Word, value: Word): void {
    const storageKey = this.storageKeyToString(address, key);
    if (value === 0n) {
      this.transientStorage.delete(storageKey);
    } else {
      this.transientStorage.set(storageKey, value);
    }
  }

  clearTransientStorage(): void {
    this.transientStorage.clear();
  }

  // Snapshot operations
  createSnapshot(): number {
    const id = this.nextSnapshotId++;
    const snapshot: Snapshot = {
      id,
      accounts: new Map(this.accounts),
      storage: new Map(this.storage),
      transientStorage: new Map(this.transientStorage)
    };
    
    // Deep copy accounts
    snapshot.accounts.forEach((account, key) => {
      snapshot.accounts.set(key, {
        balance: account.balance,
        nonce: account.nonce,
        storageRoot: new Uint8Array(account.storageRoot),
        codeHash: new Uint8Array(account.codeHash)
      });
    });
    
    this.snapshots.push(snapshot);
    return id;
  }

  revertToSnapshot(snapshotId: number): void {
    const snapshotIndex = this.snapshots.findIndex(s => s.id === snapshotId);
    if (snapshotIndex === -1) {
      throw new DatabaseError(`Snapshot ${snapshotId} not found`);
    }
    
    const snapshot = this.snapshots[snapshotIndex];
    this.accounts = snapshot.accounts;
    this.storage = snapshot.storage;
    this.transientStorage = snapshot.transientStorage;
    
    // Remove all snapshots after this one
    this.snapshots = this.snapshots.slice(0, snapshotIndex);
  }

  commitSnapshot(snapshotId: number): void {
    const snapshotIndex = this.snapshots.findIndex(s => s.id === snapshotId);
    if (snapshotIndex === -1) {
      throw new DatabaseError(`Snapshot ${snapshotId} not found`);
    }
    
    // Remove just this snapshot, keeping any after it
    this.snapshots.splice(snapshotIndex, 1);
  }

  // Utility methods
  clear(): void {
    this.accounts.clear();
    this.storage.clear();
    this.transientStorage.clear();
    this.codeStorage.clear();
    this.snapshots = [];
    this.nextSnapshotId = 0;
  }

  getAccountCount(): number {
    return this.accounts.size;
  }

  getStorageCount(): number {
    return this.storage.size;
  }
}