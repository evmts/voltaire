# Merkle Patricia Trie - Examples

## Example 1: Simple Key-Value Store

```typescript
import { create } from '@tevm/primitives/trie';
import { hexToBytes, bytesToHex } from '@tevm/primitives/hex';

async function simpleKeyValue() {
  const trie = await create();

  // Store some data
  await trie.put(
    hexToBytes('0x1234'),
    hexToBytes('0xabcdef')
  );

  // Retrieve it
  const value = await trie.get(hexToBytes('0x1234'));
  console.log('Value:', bytesToHex(value!)); // 0xabcdef

  // Get root hash
  console.log('Root:', bytesToHex(trie.root!));
}
```

## Example 2: Ethereum Account State

```typescript
import { create } from '@tevm/primitives/trie';
import { keccak256 } from '@tevm/primitives/keccak';
import { encode } from '@tevm/primitives/rlp';

interface Account {
  nonce: bigint;
  balance: bigint;
  storageRoot: Uint8Array;
  codeHash: Uint8Array;
}

async function accountState() {
  const stateTrie = await create();

  // Create an account
  const address = new Uint8Array(20); // 20-byte address
  const account: Account = {
    nonce: 0n,
    balance: 100n * 10n ** 18n, // 100 ETH
    storageRoot: new Uint8Array(32),
    codeHash: keccak256(new Uint8Array(0)) // Empty code
  };

  // RLP encode account
  const accountRlp = encode([
    account.nonce,
    account.balance,
    account.storageRoot,
    account.codeHash
  ]);

  // Store in state trie (key = keccak256(address))
  const key = keccak256(address);
  await stateTrie.put(key, accountRlp);

  // Get state root
  const stateRoot = stateTrie.root;
  console.log('State root:', bytesToHex(stateRoot!));

  // Retrieve account
  const retrievedRlp = await stateTrie.get(key);
  console.log('Account retrieved:', retrievedRlp !== null);
}
```

## Example 3: Transaction Receipts Trie

```typescript
import { create } from '@tevm/primitives/trie';
import { encode } from '@tevm/primitives/rlp';

interface TransactionReceipt {
  status: number;
  gasUsed: bigint;
  logs: Array<{
    address: Uint8Array;
    topics: Uint8Array[];
    data: Uint8Array;
  }>;
}

async function receiptsTrie() {
  const trie = await create();

  // Add receipts for transactions in a block
  const receipts: TransactionReceipt[] = [
    {
      status: 1,
      gasUsed: 21000n,
      logs: []
    },
    {
      status: 1,
      gasUsed: 50000n,
      logs: [{
        address: new Uint8Array(20),
        topics: [new Uint8Array(32)],
        data: new Uint8Array(0)
      }]
    }
  ];

  // Store each receipt (key = transaction index)
  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i]!;
    const key = encode(i); // RLP-encoded index
    const value = encode([
      receipt.status,
      receipt.gasUsed,
      receipt.logs
    ]);
    await trie.put(key, value);
  }

  // Get receipts root for block header
  const receiptsRoot = trie.root;
  console.log('Receipts root:', bytesToHex(receiptsRoot!));
}
```

## Example 4: Merkle Proof for Light Clients

```typescript
import { create } from '@tevm/primitives/trie';
import { keccak256 } from '@tevm/primitives/keccak';

async function lightClientProof() {
  // Full node builds the trie
  const fullNodeTrie = await create();

  // Add 100 accounts
  for (let i = 0; i < 100; i++) {
    const address = new Uint8Array(20);
    address[0] = i;
    const key = keccak256(address);
    const value = new Uint8Array([i]);
    await fullNodeTrie.put(key, value);
  }

  // Light client wants to verify a specific account
  const targetAddress = new Uint8Array(20);
  targetAddress[0] = 42;
  const targetKey = keccak256(targetAddress);

  // Full node generates proof
  const proof = await fullNodeTrie.createProof(targetKey);
  const stateRoot = fullNodeTrie.root!;

  console.log('Proof size:', proof.length, 'nodes');
  console.log('Proof bytes:', proof.reduce((sum, p) => sum + p.data.length, 0));

  // Light client verifies proof (only needs proof + root)
  const verified = await fullNodeTrie.verifyProof(
    stateRoot,
    targetKey,
    proof
  );

  console.log('Proof verified:', verified !== null);
  console.log('Account value:', verified?.[0]); // 42
}
```

## Example 5: State Rollback with Checkpoints

```typescript
import { create } from '@tevm/primitives/trie';

async function stateRollback() {
  const trie = await create({ useCheckpoints: true });

  // Initial state
  await trie.put(new Uint8Array([1]), new Uint8Array([100]));
  console.log('Initial balance:', (await trie.get(new Uint8Array([1])))?.[0]);

  // Start transaction
  trie.checkpoint();

  // Make changes
  await trie.put(new Uint8Array([1]), new Uint8Array([50])); // Debit
  await trie.put(new Uint8Array([2]), new Uint8Array([50])); // Credit

  console.log('During tx balance 1:', (await trie.get(new Uint8Array([1])))?.[0]);
  console.log('During tx balance 2:', (await trie.get(new Uint8Array([2])))?.[0]);

  // Transaction fails - rollback
  trie.revert();

  console.log('After rollback balance 1:', (await trie.get(new Uint8Array([1])))?.[0]);
  console.log('After rollback balance 2:', await trie.get(new Uint8Array([2]))); // null
}
```

## Example 6: Proof of Non-Existence

```typescript
import { create } from '@tevm/primitives/trie';

async function proofOfNonExistence() {
  const trie = await create();

  // Add some keys
  await trie.put(new Uint8Array([0x10]), new Uint8Array([1]));
  await trie.put(new Uint8Array([0x20]), new Uint8Array([2]));
  await trie.put(new Uint8Array([0x30]), new Uint8Array([3]));

  // Prove that 0x15 doesn't exist
  const missingKey = new Uint8Array([0x15]);
  const proof = await trie.createProof(missingKey);

  // Verify non-existence
  const result = await trie.verifyProof(trie.root!, missingKey, proof);

  console.log('Key 0x15 exists:', result !== null); // false
  console.log('Proof of non-existence verified');
}
```

## Example 7: Storage Trie for Contract

```typescript
import { create } from '@tevm/primitives/trie';
import { keccak256 } from '@tevm/primitives/keccak';

async function contractStorage() {
  const storageTrie = await create();

  // Contract storage slots
  const slots = new Map<bigint, bigint>([
    [0n, 123456789n],  // slot 0: some value
    [1n, 987654321n],  // slot 1: another value
    [42n, 999n],       // slot 42: random slot
  ]);

  // Store each slot (key = keccak256(slot))
  for (const [slot, value] of slots) {
    // Convert slot to 32-byte key
    const slotBytes = new Uint8Array(32);
    const slotBigInt = BigInt(slot);
    for (let i = 0; i < 32; i++) {
      slotBytes[31 - i] = Number((slotBigInt >> BigInt(i * 8)) & 0xffn);
    }
    const key = keccak256(slotBytes);

    // Convert value to bytes
    const valueBytes = new Uint8Array(32);
    const valueBigInt = BigInt(value);
    for (let i = 0; i < 32; i++) {
      valueBytes[31 - i] = Number((valueBigInt >> BigInt(i * 8)) & 0xffn);
    }

    await storageTrie.put(key, valueBytes);
  }

  // Storage root goes in account
  const storageRoot = storageTrie.root!;
  console.log('Storage root:', bytesToHex(storageRoot));

  // Verify storage slot
  const slot0Key = keccak256(new Uint8Array(32)); // slot 0
  const slot0Value = await storageTrie.get(slot0Key);
  console.log('Slot 0 value:', slot0Value !== null);
}
```

## Example 8: Deterministic Root Hash

```typescript
import { create } from '@tevm/primitives/trie';

async function deterministicRoot() {
  // Create two independent tries
  const trie1 = await create();
  const trie2 = await create();

  // Add same data in different order
  const data = [
    [new Uint8Array([1, 2]), new Uint8Array([0xa])],
    [new Uint8Array([3, 4]), new Uint8Array([0xb])],
    [new Uint8Array([5, 6]), new Uint8Array([0xc])],
  ] as const;

  // Trie 1: forward order
  for (const [key, value] of data) {
    await trie1.put(key, value);
  }

  // Trie 2: reverse order
  for (let i = data.length - 1; i >= 0; i--) {
    const [key, value] = data[i]!;
    await trie2.put(key, value);
  }

  // Same root hash despite different insertion order
  console.log('Trie 1 root:', bytesToHex(trie1.root!));
  console.log('Trie 2 root:', bytesToHex(trie2.root!));
  console.log('Roots match:', bytesToHex(trie1.root!) === bytesToHex(trie2.root!));
}
```

## Example 9: Large Dataset

```typescript
import { create } from '@tevm/primitives/trie';

async function largeDataset() {
  const trie = await create();
  const startTime = Date.now();

  // Insert 10,000 entries
  for (let i = 0; i < 10000; i++) {
    const key = new Uint8Array(4);
    key[0] = (i >> 24) & 0xff;
    key[1] = (i >> 16) & 0xff;
    key[2] = (i >> 8) & 0xff;
    key[3] = i & 0xff;

    const value = new Uint8Array(32);
    value[0] = i & 0xff;

    await trie.put(key, value);

    if (i % 1000 === 0) {
      console.log(`Inserted ${i} entries...`);
    }
  }

  const insertTime = Date.now() - startTime;
  console.log(`Inserted 10,000 entries in ${insertTime}ms`);

  // Verify random entries
  const verifyStart = Date.now();
  for (let i = 0; i < 100; i++) {
    const randomIndex = Math.floor(Math.random() * 10000);
    const key = new Uint8Array(4);
    key[0] = (randomIndex >> 24) & 0xff;
    key[1] = (randomIndex >> 16) & 0xff;
    key[2] = (randomIndex >> 8) & 0xff;
    key[3] = randomIndex & 0xff;

    const value = await trie.get(key);
    if (value?.[0] !== (randomIndex & 0xff)) {
      throw new Error('Verification failed!');
    }
  }
  const verifyTime = Date.now() - verifyStart;
  console.log(`Verified 100 random entries in ${verifyTime}ms`);

  console.log('Final root:', bytesToHex(trie.root!));
}
```

## Example 10: Custom Persistent Database

```typescript
import { create, type TrieDB, type Bytes } from '@tevm/primitives/trie';
import { Database } from 'bun:sqlite';

class SQLiteTrieDB implements TrieDB {
  private db: Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS trie_nodes (
        key BLOB PRIMARY KEY,
        value BLOB NOT NULL
      )
    `);
  }

  async get(key: Bytes): Promise<Bytes | null> {
    const row = this.db.query('SELECT value FROM trie_nodes WHERE key = ?')
      .get(key) as { value: Uint8Array } | null;
    return row?.value || null;
  }

  async put(key: Bytes, value: Bytes): Promise<void> {
    this.db.run('INSERT OR REPLACE INTO trie_nodes (key, value) VALUES (?, ?)',
      [key, value]);
  }

  async del(key: Bytes): Promise<void> {
    this.db.run('DELETE FROM trie_nodes WHERE key = ?', [key]);
  }

  async batch(ops: Array<{ type: 'put' | 'del'; key: Bytes; value?: Bytes }>): Promise<void> {
    const tx = this.db.transaction(() => {
      for (const op of ops) {
        if (op.type === 'put' && op.value) {
          this.db.run('INSERT OR REPLACE INTO trie_nodes (key, value) VALUES (?, ?)',
            [op.key, op.value]);
        } else if (op.type === 'del') {
          this.db.run('DELETE FROM trie_nodes WHERE key = ?', [op.key]);
        }
      }
    });
    tx();
  }

  close() {
    this.db.close();
  }
}

async function persistentTrie() {
  const db = new SQLiteTrieDB('trie.db');
  const trie = await create({ db });

  // Add data
  await trie.put(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]));

  console.log('Root:', bytesToHex(trie.root!));

  // Data persists across restarts
  db.close();
}
```

## Running Examples

```bash
# Run any example
bun run examples/trie-example.ts
```
