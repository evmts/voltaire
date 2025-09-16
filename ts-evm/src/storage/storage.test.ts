import { test, expect } from "bun:test";
import { Database } from "./database";
import { Journal } from "./journal";
import { AccessList } from "./access_list";
import { createEmptyAccount } from "./account";

test("Database: account operations", () => {
  const db = new Database();
  const address = 0x1234567890123456789012345678901234567890n;
  
  // Initially no account exists
  expect(db.getAccount(address)).toBeNull();
  expect(db.accountExists(address)).toBe(false);
  
  // Create account with balance
  db.setBalance(address, 1000n);
  expect(db.getBalance(address)).toBe(1000n);
  expect(db.accountExists(address)).toBe(true);
  
  // Set nonce
  db.setNonce(address, 5n);
  expect(db.getNonce(address)).toBe(5n);
  
  // Increment nonce
  const newNonce = db.incrementNonce(address);
  expect(newNonce).toBe(6n);
  expect(db.getNonce(address)).toBe(6n);
});

test("Database: storage operations", () => {
  const db = new Database();
  const address = 0x1234567890123456789012345678901234567890n;
  const key = 0x42n;
  
  // Initially storage is zero
  expect(db.getStorage(address, key)).toBe(0n);
  
  // Set storage value
  db.setStorage(address, key, 0xDEADBEEFn);
  expect(db.getStorage(address, key)).toBe(0xDEADBEEFn);
  
  // Clear storage by setting to zero
  db.setStorage(address, key, 0n);
  expect(db.getStorage(address, key)).toBe(0n);
});

test("Database: code operations", () => {
  const db = new Database();
  const address = 0x1234567890123456789012345678901234567890n;
  const code = new Uint8Array([0x60, 0x00, 0x60, 0x00]);
  
  // Initially no code
  expect(db.getCode(address)).toEqual(new Uint8Array());
  expect(db.getCodeSize(address)).toBe(0);
  
  // Set code
  db.setCode(address, code);
  expect(db.getCode(address)).toEqual(code);
  expect(db.getCodeSize(address)).toBe(4);
});

test("Database: balance transfers", () => {
  const db = new Database();
  const from = 0x1111111111111111111111111111111111111111n;
  const to = 0x2222222222222222222222222222222222222222n;
  
  // Set initial balance
  db.setBalance(from, 1000n);
  db.setBalance(to, 500n);
  
  // Transfer
  db.transferBalance(from, to, 300n);
  expect(db.getBalance(from)).toBe(700n);
  expect(db.getBalance(to)).toBe(800n);
  
  // Transfer failure - insufficient balance
  expect(() => db.transferBalance(from, to, 800n)).toThrow();
});

test("Database: snapshots", () => {
  const db = new Database();
  const address = 0x1234567890123456789012345678901234567890n;
  
  // Initial state
  db.setBalance(address, 1000n);
  db.setStorage(address, 0x1n, 0xABCn);
  
  // Create snapshot
  const snapshot1 = db.createSnapshot();
  
  // Modify state
  db.setBalance(address, 2000n);
  db.setStorage(address, 0x1n, 0xDEFn);
  db.setStorage(address, 0x2n, 0x123n);
  
  expect(db.getBalance(address)).toBe(2000n);
  expect(db.getStorage(address, 0x1n)).toBe(0xDEFn);
  
  // Revert to snapshot
  db.revertToSnapshot(snapshot1);
  
  expect(db.getBalance(address)).toBe(1000n);
  expect(db.getStorage(address, 0x1n)).toBe(0xABCn);
  expect(db.getStorage(address, 0x2n)).toBe(0n);
});

test("Journal: recording changes", () => {
  const journal = new Journal();
  const address = 0x1234567890123456789012345678901234567890n;
  
  // Record various changes
  journal.recordAccountTouched(address);
  journal.recordStorageChange(address, 0x1n, 0n, 100n);
  journal.recordBalanceTransfer(address, 0x9999n, 50n);
  
  expect(journal.getEntryCount()).toBe(3);
  
  const entries = journal.getAllEntries();
  expect(entries[0].type).toBe('AccountTouched');
  expect(entries[1].type).toBe('StorageChanged');
  expect(entries[2].type).toBe('BalanceTransfer');
});

test("Journal: checkpoints and rollback", () => {
  const journal = new Journal();
  const address = 0x1234567890123456789012345678901234567890n;
  
  // Initial entries
  journal.recordStorageChange(address, 0x1n, 0n, 100n);
  
  // Create checkpoint
  const checkpoint = journal.createCheckpoint();
  
  // Add more entries
  journal.recordStorageChange(address, 0x2n, 0n, 200n);
  journal.recordBalanceTransfer(address, 0x9999n, 50n);
  
  expect(journal.getEntryCount()).toBe(3);
  
  // Revert to checkpoint
  const reverted = journal.revertToCheckpoint(checkpoint);
  
  expect(reverted.length).toBe(2); // Two entries were reverted
  expect(journal.getEntryCount()).toBe(1); // Back to 1 entry
});

test("AccessList: account access", () => {
  const accessList = new AccessList();
  const address = 0x1234567890123456789012345678901234567890n;
  
  // First access is cold
  const cost1 = accessList.accessAccount(address);
  expect(cost1).toBe(2600);
  
  // Second access is warm
  const cost2 = accessList.accessAccount(address);
  expect(cost2).toBe(100);
  
  expect(accessList.containsAddress(address)).toBe(true);
});

test("AccessList: storage access", () => {
  const accessList = new AccessList();
  const address = 0x1234567890123456789012345678901234567890n;
  const key = 0x42n;
  
  // First access is cold
  const cost1 = accessList.accessStorage(address, key);
  expect(cost1).toBe(2100);
  
  // Second access is warm
  const cost2 = accessList.accessStorage(address, key);
  expect(cost2).toBe(100);
  
  expect(accessList.containsStorage(address, key)).toBe(true);
  expect(accessList.containsAddress(address)).toBe(true);
});

test("AccessList: transaction initialization", () => {
  const accessList = new AccessList();
  
  // Initialize with transaction access list
  accessList.initializeFromTransaction([
    {
      address: 0x1111n,
      storageKeys: new Set(['0000000000000000000000000000000000000000000000000000000000000001'])
    },
    {
      address: 0x2222n,
      storageKeys: new Set()
    }
  ]);
  
  // Check addresses are warm
  expect(accessList.containsAddress(0x1111n)).toBe(true);
  expect(accessList.containsAddress(0x2222n)).toBe(true);
  expect(accessList.containsStorage(0x1111n, 0x1n)).toBe(true);
});