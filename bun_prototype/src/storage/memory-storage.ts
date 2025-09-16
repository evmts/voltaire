/**
 * In-memory storage implementation
 */

import { Account, Storage } from './types';
import { createHash } from 'crypto';

export class MemoryStorage implements Storage {
  private accounts = new Map<string, Account>();
  private storage = new Map<string, bigint>();
  private code = new Map<string, Uint8Array>();
  private snapshots = new Map<number, {
    accounts: Map<string, Account>;
    storage: Map<string, bigint>;
    code: Map<string, Uint8Array>;
  }>();
  private nextSnapshotId = 0;

  async getAccount(address: Uint8Array): Promise<Account | null> {
    const key = Buffer.from(address).toString('hex');
    return this.accounts.get(key) || null;
  }

  async setAccount(address: Uint8Array, account: Account): Promise<void> {
    const key = Buffer.from(address).toString('hex');
    this.accounts.set(key, account);
  }

  async deleteAccount(address: Uint8Array): Promise<void> {
    const key = Buffer.from(address).toString('hex');
    this.accounts.delete(key);
  }

  async accountExists(address: Uint8Array): Promise<boolean> {
    const key = Buffer.from(address).toString('hex');
    return this.accounts.has(key);
  }

  async getBalance(address: Uint8Array): Promise<bigint> {
    const account = await this.getAccount(address);
    return account?.balance ?? 0n;
  }

  async getStorage(address: Uint8Array, slot: bigint): Promise<bigint> {
    const key = `${Buffer.from(address).toString('hex')}:${slot.toString(16)}`;
    return this.storage.get(key) ?? 0n;
  }

  async setStorage(address: Uint8Array, slot: bigint, value: bigint): Promise<void> {
    const key = `${Buffer.from(address).toString('hex')}:${slot.toString(16)}`;
    if (value === 0n) {
      this.storage.delete(key);
    } else {
      this.storage.set(key, value);
    }
  }

  async getCode(codeHash: Uint8Array): Promise<Uint8Array> {
    const key = Buffer.from(codeHash).toString('hex');
    return this.code.get(key) ?? new Uint8Array();
  }

  async getCodeByAddress(address: Uint8Array): Promise<Uint8Array> {
    const account = await this.getAccount(address);
    if (!account) return new Uint8Array();
    return this.getCode(account.codeHash);
  }

  async setCode(code: Uint8Array): Promise<Uint8Array> {
    const hash = createHash('sha256').update(code).digest();
    const key = Buffer.from(hash).toString('hex');
    this.code.set(key, code);
    return hash;
  }

  async getStateRoot(): Promise<Uint8Array> {
    // Simplified - return a deterministic hash
    return new Uint8Array(32).fill(0xDE);
  }

  async commitChanges(): Promise<Uint8Array> {
    return this.getStateRoot();
  }

  async createSnapshot(): Promise<number> {
    const id = this.nextSnapshotId++;
    this.snapshots.set(id, {
      accounts: new Map(this.accounts),
      storage: new Map(this.storage),
      code: new Map(this.code),
    });
    return id;
  }

  async revertToSnapshot(id: number): Promise<void> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) throw new Error(`Snapshot ${id} not found`);
    
    this.accounts = new Map(snapshot.accounts);
    this.storage = new Map(snapshot.storage);
    this.code = new Map(snapshot.code);
    
    // Remove this and later snapshots
    for (const [snapId] of this.snapshots) {
      if (snapId >= id) {
        this.snapshots.delete(snapId);
      }
    }
  }

  async commitSnapshot(id: number): Promise<void> {
    // Just remove the snapshot
    this.snapshots.delete(id);
  }
}

export function createMemoryStorage(): Storage {
  return new MemoryStorage();
}