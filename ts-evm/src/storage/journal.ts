import type { Word } from '../types';
import type { Address } from '../types_blockchain';
import type { Account } from './account';

export type JournalEntry = 
  | { type: 'AccountTouched'; address: Address }
  | { type: 'AccountLoaded'; address: Address; account: Account }
  | { type: 'StorageChanged'; address: Address; key: Word; oldValue: Word; newValue: Word }
  | { type: 'TransientStorageChanged'; address: Address; key: Word; oldValue: Word; newValue: Word }
  | { type: 'BalanceTransfer'; from: Address; to: Address; amount: Word }
  | { type: 'NonceChange'; address: Address; oldNonce: bigint; newNonce: bigint }
  | { type: 'CodeChange'; address: Address; oldCode: Uint8Array; newCode: Uint8Array }
  | { type: 'SelfDestruct'; address: Address; beneficiary: Address; balance: Word }
  | { type: 'ContractCreated'; address: Address; code: Uint8Array }
  | { type: 'Log'; address: Address; topics: Word[]; data: Uint8Array };

export interface Checkpoint {
  id: number;
  journalLength: number;
}

export class Journal {
  private entries: JournalEntry[];
  private checkpoints: Checkpoint[];
  private nextCheckpointId: number;
  private enabled: boolean;

  constructor() {
    this.entries = [];
    this.checkpoints = [];
    this.nextCheckpointId = 0;
    this.enabled = true;
  }

  // Enable/disable journaling
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Record state changes
  recordAccountTouched(address: Address): void {
    if (!this.enabled) return;
    this.entries.push({ type: 'AccountTouched', address });
  }

  recordAccountLoaded(address: Address, account: Account): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'AccountLoaded', 
      address,
      account: {
        balance: account.balance,
        nonce: account.nonce,
        storageRoot: new Uint8Array(account.storageRoot),
        codeHash: new Uint8Array(account.codeHash)
      }
    });
  }

  recordStorageChange(address: Address, key: Word, oldValue: Word, newValue: Word): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'StorageChanged', 
      address, 
      key, 
      oldValue, 
      newValue 
    });
  }

  recordTransientStorageChange(address: Address, key: Word, oldValue: Word, newValue: Word): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'TransientStorageChanged', 
      address, 
      key, 
      oldValue, 
      newValue 
    });
  }

  recordBalanceTransfer(from: Address, to: Address, amount: Word): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'BalanceTransfer', 
      from, 
      to, 
      amount 
    });
  }

  recordNonceChange(address: Address, oldNonce: bigint, newNonce: bigint): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'NonceChange', 
      address, 
      oldNonce, 
      newNonce 
    });
  }

  recordCodeChange(address: Address, oldCode: Uint8Array, newCode: Uint8Array): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'CodeChange', 
      address, 
      oldCode: new Uint8Array(oldCode), 
      newCode: new Uint8Array(newCode) 
    });
  }

  recordSelfDestruct(address: Address, beneficiary: Address, balance: Word): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'SelfDestruct', 
      address, 
      beneficiary, 
      balance 
    });
  }

  recordContractCreation(address: Address, code: Uint8Array): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'ContractCreated', 
      address, 
      code: new Uint8Array(code) 
    });
  }

  recordLog(address: Address, topics: Word[], data: Uint8Array): void {
    if (!this.enabled) return;
    this.entries.push({ 
      type: 'Log', 
      address, 
      topics: [...topics], 
      data: new Uint8Array(data) 
    });
  }

  // Checkpoint management
  createCheckpoint(): number {
    const id = this.nextCheckpointId++;
    this.checkpoints.push({
      id,
      journalLength: this.entries.length
    });
    return id;
  }

  revertToCheckpoint(checkpointId: number): JournalEntry[] {
    const checkpointIndex = this.checkpoints.findIndex(c => c.id === checkpointId);
    if (checkpointIndex === -1) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    const checkpoint = this.checkpoints[checkpointIndex];
    const revertedEntries = this.entries.slice(checkpoint.journalLength);
    
    // Revert journal to checkpoint state
    this.entries = this.entries.slice(0, checkpoint.journalLength);
    
    // Remove all checkpoints after this one
    this.checkpoints = this.checkpoints.slice(0, checkpointIndex);
    
    // Return reverted entries in reverse order for proper rollback
    return revertedEntries.reverse();
  }

  commitCheckpoint(checkpointId: number): void {
    const checkpointIndex = this.checkpoints.findIndex(c => c.id === checkpointId);
    if (checkpointIndex === -1) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    // Remove just this checkpoint, keeping any after it
    this.checkpoints.splice(checkpointIndex, 1);
  }

  // Get all entries since a checkpoint
  getEntriesSinceCheckpoint(checkpointId: number): JournalEntry[] {
    const checkpoint = this.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    return this.entries.slice(checkpoint.journalLength);
  }

  // Utility methods
  clear(): void {
    this.entries = [];
    this.checkpoints = [];
    this.nextCheckpointId = 0;
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  getCheckpointCount(): number {
    return this.checkpoints.length;
  }

  getAllEntries(): readonly JournalEntry[] {
    return this.entries;
  }

  getLastEntry(): JournalEntry | undefined {
    return this.entries[this.entries.length - 1];
  }
}