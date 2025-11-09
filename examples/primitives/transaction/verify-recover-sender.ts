/**
 * Transaction Signature Verification and Sender Recovery Example
 *
 * Demonstrates:
 * - Recovering sender address from transaction signature
 * - Verifying transaction signatures
 * - Checking if transaction is signed
 * - Understanding signature components (r, s, yParity/v)
 * - Batch signature verification
 */

import * as Transaction from '../../../src/primitives/Transaction/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';

console.log('=== Transaction Signature Verification and Sender Recovery ===\n');

// Example 1: Check if transaction is signed
console.log('1. Checking Transaction Signature Status:');
console.log('-'.repeat(50));

const unsignedTx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: new Uint8Array(32),  // All zeros = unsigned
  s: new Uint8Array(32),  // All zeros = unsigned
};

const signedTx: Transaction.EIP1559 = {
  ...unsignedTx,
  r: Hex.toBytes('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  s: Hex.toBytes('0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'),
};

console.log('Unsigned transaction:');
console.log('  r:', Hex.fromBytes(unsignedTx.r));
console.log('  s:', Hex.fromBytes(unsignedTx.s));
console.log('  isSigned:', Transaction.isSigned(unsignedTx));
console.log();

console.log('Signed transaction:');
console.log('  r:', Hex.fromBytes(signedTx.r));
console.log('  s:', Hex.fromBytes(signedTx.s));
console.log('  isSigned:', Transaction.isSigned(signedTx));
console.log();

// Example 2: Asserting transaction is signed
console.log('2. Asserting Signature Presence:');
console.log('-'.repeat(50));

try {
  Transaction.assertSigned(unsignedTx);
  console.log('✓ Unsigned transaction passed assertion (should not happen!)');
} catch (error) {
  console.log('✗ Unsigned transaction failed assertion (expected):');
  console.log('  Error:', (error as Error).message);
}

try {
  Transaction.assertSigned(signedTx);
  console.log('✓ Signed transaction passed assertion (expected)');
} catch (error) {
  console.log('✗ Signed transaction failed assertion (should not happen!)');
}
console.log();

// Example 3: Recovering sender address (conceptual - actual recovery requires valid signature)
console.log('3. Sender Address Recovery:');
console.log('-'.repeat(50));
console.log('Note: This example shows the API. Real signatures require secp256k1.\n');

// In real usage, you'd have a properly signed transaction
const exampleSignedTx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: Hex.toBytes('0x' + '12'.repeat(32)),
  s: Hex.toBytes('0x' + 'fe'.repeat(32)),
};

console.log('Transaction details:');
console.log('  To:', Address.toHex(exampleSignedTx.to!));
console.log('  Value:', exampleSignedTx.value / 1_000_000_000_000_000_000n, 'ETH');
console.log('  yParity:', exampleSignedTx.yParity);
console.log('  r:', Hex.fromBytes(exampleSignedTx.r).slice(0, 20) + '...');
console.log('  s:', Hex.fromBytes(exampleSignedTx.s).slice(0, 20) + '...');
console.log();

// Note: In production, getSender() would perform ECDSA recovery
console.log('Sender recovery process:');
console.log('  1. Get signing hash (keccak256 of transaction data)');
console.log('  2. Recover public key using secp256k1.recover(hash, r, s, yParity)');
console.log('  3. Hash public key with keccak256');
console.log('  4. Take last 20 bytes as address');
console.log();

// Example 4: Signature components for different transaction types
console.log('4. Signature Components by Transaction Type:');
console.log('-'.repeat(50));

const legacyTx: Transaction.Legacy = {
  type: Transaction.Type.Legacy,
  nonce: 0n,
  gasPrice: 20_000_000_000n,
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  v: 37n,  // EIP-155: chainId=1, yParity=0
  r: Hex.toBytes('0x' + '12'.repeat(32)),
  s: Hex.toBytes('0x' + 'fe'.repeat(32)),
};

console.log('Legacy Transaction:');
console.log('  Signature format: v/r/s');
console.log('  v:', legacyTx.v, '(includes chain ID)');
console.log('  r:', Hex.fromBytes(legacyTx.r).slice(0, 20) + '...');
console.log('  s:', Hex.fromBytes(legacyTx.s).slice(0, 20) + '...');
console.log();

console.log('EIP-1559 Transaction:');
console.log('  Signature format: yParity/r/s');
console.log('  yParity:', exampleSignedTx.yParity, '(0 or 1 only)');
console.log('  r:', Hex.fromBytes(exampleSignedTx.r).slice(0, 20) + '...');
console.log('  s:', Hex.fromBytes(exampleSignedTx.s).slice(0, 20) + '...');
console.log();

// Example 5: Converting between v and yParity
console.log('5. Converting Between v and yParity:');
console.log('-'.repeat(50));

function extractYParityFromV(v: bigint, chainId: bigint): number {
  // For EIP-155: v = chainId * 2 + 35 + yParity
  // yParity = (v - 35 - chainId * 2)
  if (v === 27n || v === 28n) {
    // Pre-EIP-155
    return Number(v - 27n);
  }
  return Number((v - 35n - chainId * 2n));
}

function calculateVFromYParity(yParity: number, chainId: bigint): bigint {
  // v = chainId * 2 + 35 + yParity
  return chainId * 2n + 35n + BigInt(yParity);
}

const chainId = 1n;
const yParity = 0;
const v = calculateVFromYParity(yParity, chainId);
const extractedYParity = extractYParityFromV(v, chainId);

console.log(`Chain ID: ${chainId}`);
console.log(`yParity: ${yParity}`);
console.log(`Calculated v: ${v}`);
console.log(`Extracted yParity: ${extractedYParity}`);
console.log();

// Example 6: Batch signature verification pattern
console.log('6. Batch Signature Verification:');
console.log('-'.repeat(50));

const transactions: Transaction.EIP1559[] = [
  exampleSignedTx,
  { ...exampleSignedTx, nonce: 1n },
  { ...exampleSignedTx, nonce: 2n },
];

console.log(`Verifying ${transactions.length} transactions:\n`);

let validCount = 0;
let invalidCount = 0;

for (let i = 0; i < transactions.length; i++) {
  const tx = transactions[i];
  const isSigned = Transaction.isSigned(tx);

  console.log(`Transaction ${i}:`);
  console.log(`  Nonce: ${tx.nonce}`);
  console.log(`  Signed: ${isSigned}`);

  if (isSigned) {
    validCount++;
  } else {
    invalidCount++;
  }
}

console.log();
console.log(`Summary:`);
console.log(`  Total: ${transactions.length}`);
console.log(`  Signed: ${validCount}`);
console.log(`  Unsigned: ${invalidCount}`);
console.log();

// Example 7: Signature malleability protection
console.log('7. Signature Malleability Protection:');
console.log('-'.repeat(50));

// secp256k1 curve order
const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const SECP256K1_N_DIV_2 = SECP256K1_N / 2n;

console.log('Ethereum requires s ≤ n/2 to prevent signature malleability.');
console.log();
console.log('secp256k1 curve order (n):');
console.log(`  0x${SECP256K1_N.toString(16)}`);
console.log();
console.log('Maximum allowed s (n/2):');
console.log(`  0x${SECP256K1_N_DIV_2.toString(16)}`);
console.log();
console.log('Why? For every (r, s), there exists (r, n - s) that validates.');
console.log('Requiring s ≤ n/2 makes signatures canonical (unique).');
console.log();

// Example 8: Authorization vs transaction signature
console.log('8. EIP-7702: Authorization vs Transaction Signature:');
console.log('-'.repeat(50));

const eip7702Tx: Transaction.EIP7702 = {
  type: Transaction.Type.EIP7702,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 100_000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 0n,
  data: new Uint8Array(),
  accessList: [],
  authorizationList: [
    {
      chainId: 1n,
      address: Address.from('0x1234567890123456789012345678901234567890'),
      nonce: 0n,
      yParity: 0,
      r: Hex.toBytes('0x' + 'aa'.repeat(32)),
      s: Hex.toBytes('0x' + 'bb'.repeat(32)),
    },
  ],
  yParity: 1,
  r: Hex.toBytes('0x' + 'cc'.repeat(32)),
  s: Hex.toBytes('0x' + 'dd'.repeat(32)),
};

console.log('EIP-7702 has TWO signatures:\n');
console.log('1. Authorization signature (signed by delegating EOA):');
console.log('   yParity:', eip7702Tx.authorizationList[0].yParity);
console.log('   r:', Hex.fromBytes(eip7702Tx.authorizationList[0].r).slice(0, 20) + '...');
console.log('   s:', Hex.fromBytes(eip7702Tx.authorizationList[0].s).slice(0, 20) + '...');
console.log();
console.log('2. Transaction signature (signed by transaction sender):');
console.log('   yParity:', eip7702Tx.yParity);
console.log('   r:', Hex.fromBytes(eip7702Tx.r).slice(0, 20) + '...');
console.log('   s:', Hex.fromBytes(eip7702Tx.s).slice(0, 20) + '...');
console.log();
console.log('Both must be valid for transaction to execute!');
console.log();

// Example 9: Practical sender recovery use case
console.log('9. Practical Use Cases:');
console.log('-'.repeat(50));

console.log('Transaction Pool Validation:');
console.log('  1. Verify signature is valid');
console.log('  2. Recover sender address');
console.log('  3. Check sender has sufficient balance');
console.log('  4. Check sender nonce matches transaction nonce');
console.log();

console.log('Replay Attack Protection:');
console.log('  1. Verify chain ID in transaction');
console.log('  2. Ensure chain ID matches current network');
console.log('  3. Check signature was created for this chain');
console.log();

console.log('Authorization Checking:');
console.log('  1. Recover sender from signature');
console.log('  2. Compare with expected sender');
console.log('  3. Reject if mismatch');
console.log();
