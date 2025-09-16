import { Word } from '../types';

// Storage interface that can be implemented by different backends
export interface Storage {
  get(address: Uint8Array, slot: Word): Word;
  set(address: Uint8Array, slot: Word, value: Word): void;
  hasAccount(address: Uint8Array): boolean;
  getBalance(address: Uint8Array): Word;
  setBalance(address: Uint8Array, balance: Word): void;
  getCode(address: Uint8Array): Uint8Array;
  setCode(address: Uint8Array, code: Uint8Array): void;
  getNonce(address: Uint8Array): bigint;
  setNonce(address: Uint8Array, nonce: bigint): void;
  deleteAccount(address: Uint8Array): void;
  commit(): void;
  revert(): void;
}

// Simple in-memory storage implementation
export class InMemoryStorage implements Storage {
  private accounts: Map<string, AccountData> = new Map();
  private committed: Map<string, AccountData> = new Map();
  
  get(address: Uint8Array, slot: Word): Word {
    const key = this.addressKey(address);
    const account = this.accounts.get(key);
    if (!account) return 0n;
    return account.storage.get(slot.toString()) || 0n;
  }
  
  set(address: Uint8Array, slot: Word, value: Word): void {
    const key = this.addressKey(address);
    let account = this.accounts.get(key);
    if (!account) {
      account = this.createAccount();
      this.accounts.set(key, account);
    }
    
    if (value === 0n) {
      account.storage.delete(slot.toString());
    } else {
      account.storage.set(slot.toString(), value);
    }
  }
  
  hasAccount(address: Uint8Array): boolean {
    const key = this.addressKey(address);
    return this.accounts.has(key);
  }
  
  getBalance(address: Uint8Array): Word {
    const key = this.addressKey(address);
    const account = this.accounts.get(key);
    return account?.balance || 0n;
  }
  
  setBalance(address: Uint8Array, balance: Word): void {
    const key = this.addressKey(address);
    let account = this.accounts.get(key);
    if (!account) {
      account = this.createAccount();
      this.accounts.set(key, account);
    }
    account.balance = balance;
  }
  
  getCode(address: Uint8Array): Uint8Array {
    const key = this.addressKey(address);
    const account = this.accounts.get(key);
    return account?.code || new Uint8Array(0);
  }
  
  setCode(address: Uint8Array, code: Uint8Array): void {
    const key = this.addressKey(address);
    let account = this.accounts.get(key);
    if (!account) {
      account = this.createAccount();
      this.accounts.set(key, account);
    }
    account.code = code;
  }
  
  getNonce(address: Uint8Array): bigint {
    const key = this.addressKey(address);
    const account = this.accounts.get(key);
    return account?.nonce || 0n;
  }
  
  setNonce(address: Uint8Array, nonce: bigint): void {
    const key = this.addressKey(address);
    let account = this.accounts.get(key);
    if (!account) {
      account = this.createAccount();
      this.accounts.set(key, account);
    }
    account.nonce = nonce;
  }
  
  deleteAccount(address: Uint8Array): void {
    const key = this.addressKey(address);
    this.accounts.delete(key);
  }
  
  commit(): void {
    // Deep copy accounts to committed
    this.committed.clear();
    for (const [key, account] of this.accounts) {
      this.committed.set(key, {
        balance: account.balance,
        nonce: account.nonce,
        code: account.code,
        storage: new Map(account.storage)
      });
    }
  }
  
  revert(): void {
    // Restore from committed
    this.accounts.clear();
    for (const [key, account] of this.committed) {
      this.accounts.set(key, {
        balance: account.balance,
        nonce: account.nonce,
        code: account.code,
        storage: new Map(account.storage)
      });
    }
  }
  
  private addressKey(address: Uint8Array): string {
    return Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private createAccount(): AccountData {
    return {
      balance: 0n,
      nonce: 0n,
      code: new Uint8Array(0),
      storage: new Map()
    };
  }
}

interface AccountData {
  balance: Word;
  nonce: bigint;
  code: Uint8Array;
  storage: Map<string, Word>;
}