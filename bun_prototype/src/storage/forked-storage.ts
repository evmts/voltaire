/**
 * Forked storage implementation with RPC backend
 */

import { Account, Storage, ForkedStorageOptions, CacheStats } from './types';
import { createHash } from 'crypto';

interface RpcClient {
  getBalance(address: string, block?: string): Promise<string>;
  getNonce(address: string, block?: string): Promise<string>;
  getCode(address: string, block?: string): Promise<string>;
  getStorageAt(address: string, slot: string, block?: string): Promise<string>;
  getProof(address: string, storageKeys: string[], block?: string): Promise<{
    balance: string;
    nonce: string;
    codeHash: string;
    storageHash: string;
  }>;
}

class SimpleRpcClient implements RpcClient {
  constructor(private rpcUrl: string) {}

  private async request(method: string, params: any[]): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      }),
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }

  async getBalance(address: string, block = 'latest'): Promise<string> {
    return this.request('eth_getBalance', [address, block]);
  }

  async getNonce(address: string, block = 'latest'): Promise<string> {
    return this.request('eth_getTransactionCount', [address, block]);
  }

  async getCode(address: string, block = 'latest'): Promise<string> {
    return this.request('eth_getCode', [address, block]);
  }

  async getStorageAt(address: string, slot: string, block = 'latest'): Promise<string> {
    return this.request('eth_getStorageAt', [address, slot, block]);
  }

  async getProof(address: string, storageKeys: string[], block = 'latest') {
    const result = await this.request('eth_getProof', [address, storageKeys, block]);
    return {
      balance: result.balance,
      nonce: result.nonce,
      codeHash: result.codeHash,
      storageHash: result.storageHash,
    };
  }
}

export class ForkedStorage implements Storage {
  private rpc: RpcClient;
  private blockTag: string;
  
  // Three-tier cache
  private hotCache = {
    accounts: new Map<string, Account>(),
    storage: new Map<string, bigint>(),
    code: new Map<string, Uint8Array>(),
  };
  
  private forkCache = {
    accounts: new Map<string, Account>(),
    storage: new Map<string, bigint>(),
    code: new Map<string, Uint8Array>(),
  };
  
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    rpcCalls: 0,
  };

  constructor(options: ForkedStorageOptions) {
    this.rpc = new SimpleRpcClient(options.rpcUrl);
    this.blockTag = options.blockNumber ? `0x${options.blockNumber.toString(16)}` : 'latest';
  }

  private addressToHex(address: Uint8Array): string {
    return '0x' + Buffer.from(address).toString('hex');
  }

  private hexToBytes(hex: string): Uint8Array {
    return Buffer.from(hex.slice(2), 'hex');
  }

  private hexToBigInt(hex: string): bigint {
    return BigInt(hex);
  }

  async getAccount(address: Uint8Array): Promise<Account | null> {
    const key = Buffer.from(address).toString('hex');
    
    // Check hot cache
    if (this.hotCache.accounts.has(key)) {
      this.stats.hits++;
      return this.hotCache.accounts.get(key)!;
    }
    
    // Check fork cache
    if (this.forkCache.accounts.has(key)) {
      this.stats.hits++;
      const account = this.forkCache.accounts.get(key)!;
      this.hotCache.accounts.set(key, account);
      return account;
    }
    
    // Fetch from RPC
    this.stats.misses++;
    this.stats.rpcCalls++;
    
    const addressHex = this.addressToHex(address);
    const proof = await this.rpc.getProof(addressHex, [], this.blockTag);
    
    const account: Account = {
      balance: this.hexToBigInt(proof.balance),
      nonce: this.hexToBigInt(proof.nonce),
      codeHash: this.hexToBytes(proof.codeHash),
      storageRoot: this.hexToBytes(proof.storageHash),
    };
    
    // Cache the account
    this.hotCache.accounts.set(key, account);
    this.forkCache.accounts.set(key, account);
    
    // Fetch and cache code if it's a contract
    const emptyHash = new Uint8Array(32);
    if (!account.codeHash.every((b, i) => b === emptyHash[i])) {
      const codeHex = await this.rpc.getCode(addressHex, this.blockTag);
      const code = this.hexToBytes(codeHex);
      const codeKey = Buffer.from(account.codeHash).toString('hex');
      this.hotCache.code.set(codeKey, code);
      this.forkCache.code.set(codeKey, code);
    }
    
    return account;
  }

  async setAccount(address: Uint8Array, account: Account): Promise<void> {
    const key = Buffer.from(address).toString('hex');
    this.hotCache.accounts.set(key, account);
  }

  async deleteAccount(address: Uint8Array): Promise<void> {
    const key = Buffer.from(address).toString('hex');
    this.hotCache.accounts.delete(key);
  }

  async accountExists(address: Uint8Array): Promise<boolean> {
    const account = await this.getAccount(address);
    return account !== null;
  }

  async getBalance(address: Uint8Array): Promise<bigint> {
    const account = await this.getAccount(address);
    return account?.balance ?? 0n;
  }

  async getStorage(address: Uint8Array, slot: bigint): Promise<bigint> {
    const key = `${Buffer.from(address).toString('hex')}:${slot.toString(16)}`;
    
    // Check hot cache
    if (this.hotCache.storage.has(key)) {
      this.stats.hits++;
      return this.hotCache.storage.get(key)!;
    }
    
    // Check fork cache
    if (this.forkCache.storage.has(key)) {
      this.stats.hits++;
      const value = this.forkCache.storage.get(key)!;
      this.hotCache.storage.set(key, value);
      return value;
    }
    
    // Fetch from RPC
    this.stats.misses++;
    this.stats.rpcCalls++;
    
    const addressHex = this.addressToHex(address);
    const slotHex = '0x' + slot.toString(16).padStart(64, '0');
    const valueHex = await this.rpc.getStorageAt(addressHex, slotHex, this.blockTag);
    const value = this.hexToBigInt(valueHex);
    
    // Cache the value
    this.hotCache.storage.set(key, value);
    this.forkCache.storage.set(key, value);
    
    return value;
  }

  async setStorage(address: Uint8Array, slot: bigint, value: bigint): Promise<void> {
    const key = `${Buffer.from(address).toString('hex')}:${slot.toString(16)}`;
    this.hotCache.storage.set(key, value);
  }

  async getCode(codeHash: Uint8Array): Promise<Uint8Array> {
    const key = Buffer.from(codeHash).toString('hex');
    
    if (this.hotCache.code.has(key)) {
      this.stats.hits++;
      return this.hotCache.code.get(key)!;
    }
    
    if (this.forkCache.code.has(key)) {
      this.stats.hits++;
      const code = this.forkCache.code.get(key)!;
      this.hotCache.code.set(key, code);
      return code;
    }
    
    return new Uint8Array();
  }

  async getCodeByAddress(address: Uint8Array): Promise<Uint8Array> {
    const account = await this.getAccount(address);
    if (!account) return new Uint8Array();
    return this.getCode(account.codeHash);
  }

  async setCode(code: Uint8Array): Promise<Uint8Array> {
    const hash = createHash('sha256').update(code).digest();
    const key = Buffer.from(hash).toString('hex');
    this.hotCache.code.set(key, code);
    return hash;
  }

  async getStateRoot(): Promise<Uint8Array> {
    return new Uint8Array(32).fill(0xFF); // Fork mode marker
  }

  async commitChanges(): Promise<Uint8Array> {
    return this.getStateRoot();
  }

  async createSnapshot(): Promise<number> {
    // TODO: Implement snapshots
    return 0;
  }

  async revertToSnapshot(id: number): Promise<void> {
    // TODO: Implement snapshots
  }

  async commitSnapshot(id: number): Promise<void> {
    // TODO: Implement snapshots
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}

export async function createForkedStorage(options: ForkedStorageOptions): Promise<Storage> {
  return new ForkedStorage(options);
}