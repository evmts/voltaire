/**
 * Transaction Serialization Example
 *
 * Demonstrates RLP encoding/decoding for:
 * - Legacy transaction serialization
 * - EIP-1559 transaction serialization
 * - Type detection from bytes
 * - Round-trip serialization
 */

import * as Transaction from '../../../src/primitives/Transaction/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';

console.log('=== Transaction Serialization Examples ===\n');

// Example 1: Serialize Legacy transaction
console.log('1. Legacy Transaction Serialization');
console.log('-'.repeat(50));

const legacyTx: Transaction.Legacy = {
  type: Transaction.Type.Legacy,
  nonce: 9n,
  gasPrice: 20_000_000_000n,
  gasLimit: 21000n,
  to: Address.from('0x3535353535353535353535353535353535353535'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  v: 37n,
  r: Hex.toBytes('0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276'),
  s: Hex.toBytes('0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83'),
};

console.log('Original Transaction:');
console.log('  Nonce:', legacyTx.nonce);
console.log('  Gas Price:', legacyTx.gasPrice / 1_000_000_000n, 'gwei');
console.log('  To:', Address.toHex(legacyTx.to));
console.log();

const legacySerialized = Transaction.serialize(legacyTx);
console.log('Serialized:');
console.log('  Bytes:', Hex.fromBytes(legacySerialized));
console.log('  Length:', legacySerialized.length, 'bytes');
console.log('  Format: RLP list (no type prefix for legacy)');
console.log();

// Deserialize back
const legacyDeserialized = Transaction.deserialize(legacySerialized);
console.log('Deserialized:');
console.log('  Type:', legacyDeserialized.type);
console.log('  Nonce:', legacyDeserialized.nonce);
console.log('  Match:', legacyDeserialized.nonce === legacyTx.nonce);
console.log();

// Example 2: Serialize EIP-1559 transaction
console.log('2. EIP-1559 Transaction Serialization');
console.log('-'.repeat(50));

const eip1559Tx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 42n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 30_000_000_000n,
  gasLimit: 21000n,
  to: Address.from('0x3535353535353535353535353535353535353535'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: Hex.toBytes('0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276'),
  s: Hex.toBytes('0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83'),
};

console.log('Original Transaction:');
console.log('  Type:', eip1559Tx.type, '(EIP-1559)');
console.log('  Chain ID:', eip1559Tx.chainId);
console.log('  Nonce:', eip1559Tx.nonce);
console.log();

const eip1559Serialized = Transaction.serialize(eip1559Tx);
console.log('Serialized:');
console.log('  Bytes:', Hex.fromBytes(eip1559Serialized));
console.log('  Length:', eip1559Serialized.length, 'bytes');
console.log('  Type Byte:', '0x' + eip1559Serialized[0].toString(16).padStart(2, '0'));
console.log('  Format: 0x02 || RLP([...])');
console.log();

const eip1559Deserialized = Transaction.deserialize(eip1559Serialized);
console.log('Deserialized:');
console.log('  Type:', eip1559Deserialized.type);
console.log('  Chain ID:', eip1559Deserialized.chainId);
console.log('  Nonce:', eip1559Deserialized.nonce);
console.log();

// Example 3: Type detection
console.log('3. Transaction Type Detection');
console.log('-'.repeat(50));

const transactions = [
  { name: 'Legacy', data: legacySerialized },
  { name: 'EIP-1559', data: eip1559Serialized },
];

for (const tx of transactions) {
  const detectedType = Transaction.detectType(tx.data);
  const firstByte = tx.data[0];

  console.log(`${tx.name} Transaction:`);
  console.log('  First Byte:', '0x' + firstByte.toString(16).padStart(2, '0'));
  console.log('  Detected Type:', detectedType);
  console.log('  Is Legacy:', detectedType === Transaction.Type.Legacy);
  console.log('  Is EIP-1559:', detectedType === Transaction.Type.EIP1559);
  console.log();
}

// Example 4: Transaction with access list
console.log('4. Access List Serialization');
console.log('-'.repeat(50));

const accessListTx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 5n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 30_000_000_000n,
  gasLimit: 50_000n,
  to: Address.from('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  value: 0n,
  data: Hex.toBytes('0xa9059cbb'),
  accessList: [
    {
      address: Address.from('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
      storageKeys: [
        Hash.from('0x0000000000000000000000000000000000000000000000000000000000000001'),
        Hash.from('0x0000000000000000000000000000000000000000000000000000000000000002'),
      ],
    },
  ],
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

console.log('Transaction with Access List:');
console.log('  Access List Items:', accessListTx.accessList.length);
console.log('  Storage Keys:', accessListTx.accessList[0].storageKeys.length);
console.log();

const accessListSerialized = Transaction.serialize(accessListTx);
console.log('Serialized:');
console.log('  Length:', accessListSerialized.length, 'bytes');
console.log('  (Larger due to access list data)');
console.log();

const accessListDeserialized = Transaction.deserialize(accessListSerialized);
if (Transaction.hasAccessList(accessListDeserialized)) {
  const deserializedAccessList = Transaction.getAccessList(accessListDeserialized);
  console.log('Deserialized Access List:');
  console.log('  Items:', deserializedAccessList.length);
  console.log('  Match:', deserializedAccessList.length === accessListTx.accessList.length);
}
console.log();

// Example 5: Round-trip verification
console.log('5. Round-trip Verification');
console.log('-'.repeat(50));

function verifyRoundTrip(tx: Transaction.Any, name: string): boolean {
  const serialized = Transaction.serialize(tx);
  const deserialized = Transaction.deserialize(serialized);
  const reserialized = Transaction.serialize(deserialized);

  // Compare bytes
  const match = Hex.fromBytes(serialized) === Hex.fromBytes(reserialized);

  console.log(`${name}:`);
  console.log('  Original → Serialized → Deserialized → Serialized');
  console.log('  Match:', match ? '✓' : '✗');
  console.log();

  return match;
}

verifyRoundTrip(legacyTx, 'Legacy Transaction');
verifyRoundTrip(eip1559Tx, 'EIP-1559 Transaction');
verifyRoundTrip(accessListTx, 'Access List Transaction');

// Example 6: Network transmission format
console.log('6. Network Transmission');
console.log('-'.repeat(50));

const txToSend = eip1559Tx;
const txHash = Transaction.hash(txToSend);
const serializedData = Transaction.serialize(txToSend);

console.log('Broadcasting Transaction:');
console.log('  Transaction Hash:', Hex.fromBytes(txHash));
console.log('  Serialized Size:', serializedData.length, 'bytes');
console.log('  Ready for:');
console.log('    - Gossip protocol (p2p broadcast)');
console.log('    - Block inclusion (by miners)');
console.log('    - RPC submission (eth_sendRawTransaction)');
console.log();

// Example 7: Storage format
console.log('7. Storage Optimization');
console.log('-'.repeat(50));

const storedTx = legacyTx;
const storedBytes = Transaction.serialize(storedTx);
const storedHex = Hex.fromBytes(storedBytes);

console.log('Storing Transaction:');
console.log('  Hex Format:', storedHex);
console.log('  Size:', storedBytes.length, 'bytes');
console.log('  Compact: RLP encoding minimizes size');
console.log();

console.log('Retrieving Transaction:');
const retrievedBytes = Hex.toBytes(storedHex);
const retrievedTx = Transaction.deserialize(retrievedBytes);
console.log('  Type:', retrievedTx.type);
console.log('  Nonce:', retrievedTx.nonce);
console.log('  Perfect recovery: ✓');
