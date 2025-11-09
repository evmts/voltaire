/**
 * Gas Calculations Example
 *
 * Demonstrates gas calculations for all transaction types:
 * - Legacy fixed gas price
 * - EIP-1559 effective gas price
 * - EIP-4844 blob gas costs
 * - Total cost estimation
 */

import * as Transaction from '../../../src/primitives/Transaction/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';

console.log('=== Transaction Gas Calculations ===\n');

// Example 1: Legacy transaction gas cost
console.log('1. Legacy Transaction Gas Cost');
console.log('-'.repeat(50));

const legacyTx: Transaction.Legacy = {
  type: Transaction.Type.Legacy,
  nonce: 0n,
  gasPrice: 20_000_000_000n,  // 20 gwei
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  v: 37n,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

const legacyGasUsed = 21000n;
const legacyGasCost = legacyTx.gasPrice * legacyGasUsed;
const legacyTotalCost = legacyGasCost + legacyTx.value;

console.log('Legacy Transaction:');
console.log('  Gas Price:', legacyTx.gasPrice / 1_000_000_000n, 'gwei');
console.log('  Gas Limit:', legacyTx.gasLimit);
console.log('  Gas Used:', legacyGasUsed);
console.log();
console.log('  Gas Cost:', legacyGasCost, 'wei');
console.log('  Transfer Value:', legacyTx.value, 'wei');
console.log('  Total Cost:', legacyTotalCost, 'wei');
console.log('  In ETH:', legacyTotalCost / 1_000_000_000_000_000_000n, 'ETH');
console.log();

// Example 2: EIP-1559 effective gas price
console.log('2. EIP-1559 Effective Gas Price');
console.log('-'.repeat(50));

const eip1559Tx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2_000_000_000n,  // 2 gwei tip
  maxFeePerGas: 30_000_000_000n,         // 30 gwei max
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

const baseFee = 15_000_000_000n;  // 15 gwei
const eip1559EffectivePrice = Transaction.EIP1559.getEffectiveGasPrice(eip1559Tx, baseFee);
const eip1559GasUsed = 21000n;

const eip1559MaxCost = eip1559Tx.maxFeePerGas * eip1559Tx.gasLimit + eip1559Tx.value;
const eip1559ActualCost = eip1559EffectivePrice * eip1559GasUsed + eip1559Tx.value;
const refund = (eip1559Tx.maxFeePerGas - eip1559EffectivePrice) * eip1559GasUsed;

console.log('EIP-1559 Transaction:');
console.log('  Base Fee:', baseFee / 1_000_000_000n, 'gwei');
console.log('  Max Priority Fee:', eip1559Tx.maxPriorityFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Max Fee:', eip1559Tx.maxFeePerGas / 1_000_000_000n, 'gwei');
console.log();
console.log('  Effective Gas Price:', eip1559EffectivePrice / 1_000_000_000n, 'gwei');
console.log('  Formula: baseFee + min(priorityFee, maxFee - baseFee)');
console.log('  = 15 + min(2, 30 - 15) = 15 + 2 = 17 gwei');
console.log();
console.log('  Maximum Possible Cost:', eip1559MaxCost, 'wei');
console.log('  Actual Cost:', eip1559ActualCost, 'wei');
console.log('  Refund:', refund, 'wei');
console.log();

// Example 3: EIP-4844 blob gas costs
console.log('3. EIP-4844 Blob Gas Costs');
console.log('-'.repeat(50));

const blobTx: Transaction.EIP4844 = {
  type: Transaction.Type.EIP4844,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 100_000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 0n,
  data: new Uint8Array(),
  accessList: [],
  maxFeePerBlobGas: 2_000_000_000n,
  blobVersionedHashes: [
    Hash.from('0x0100000000000000000000000000000000000000000000000000000000000001'),
    Hash.from('0x0100000000000000000000000000000000000000000000000000000000000002'),
    Hash.from('0x0100000000000000000000000000000000000000000000000000000000000003'),
  ],
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

const blobBaseFee = 1n;  // 1 wei per blob gas
const blobGasUsed = 50_000n;

const execEffectivePrice = Transaction.EIP4844.getEffectiveGasPrice(blobTx, baseFee);
const execCost = execEffectivePrice * blobGasUsed;
const blobCost = Transaction.EIP4844.getBlobGasCost(blobTx, blobBaseFee);
const totalBlobTxCost = execCost + blobCost + blobTx.value;

console.log('EIP-4844 Blob Transaction:');
console.log('  Blob Count:', Transaction.getBlobCount(blobTx));
console.log('  Blob Gas per Blob: 131,072');
console.log('  Total Blob Gas:', Transaction.getBlobCount(blobTx) * 131_072);
console.log();
console.log('Execution Gas:');
console.log('  Base Fee:', baseFee / 1_000_000_000n, 'gwei');
console.log('  Effective Price:', execEffectivePrice / 1_000_000_000n, 'gwei');
console.log('  Gas Used:', blobGasUsed);
console.log('  Execution Cost:', execCost, 'wei');
console.log();
console.log('Blob Gas:');
console.log('  Blob Base Fee:', blobBaseFee, 'wei');
console.log('  Blob Cost:', blobCost, 'wei');
console.log('  Formula:', Transaction.getBlobCount(blobTx), '× 131,072 ×', blobBaseFee, '=', blobCost);
console.log();
console.log('Total Cost:');
console.log('  Execution:', execCost, 'wei');
console.log('  Blobs:', blobCost, 'wei');
console.log('  Value:', blobTx.value, 'wei');
console.log('  Total:', totalBlobTxCost, 'wei');
console.log();

// Example 4: Gas price helpers
console.log('4. Gas Price Helper Functions');
console.log('-'.repeat(50));

const transactions: Transaction.Any[] = [legacyTx, eip1559Tx, blobTx];

for (const tx of transactions) {
  const gasPrice = Transaction.getGasPrice(tx, baseFee);

  console.log(`${tx.type === Transaction.Type.Legacy ? 'Legacy' : tx.type === Transaction.Type.EIP1559 ? 'EIP-1559' : 'EIP-4844'}:`);
  console.log('  Gas Price:', gasPrice / 1_000_000_000n, 'gwei');
  console.log('  Method: Transaction.getGasPrice()');
  console.log();
}

// Example 5: Fee estimation
console.log('5. Fee Estimation Strategy');
console.log('-'.repeat(50));

const currentBaseFee = 15_000_000_000n;

console.log('Current Block:');
console.log('  Base Fee:', currentBaseFee / 1_000_000_000n, 'gwei');
console.log();

console.log('Conservative (next few blocks):');
console.log('  Max Priority Fee: 1 gwei');
console.log('  Max Fee:', (currentBaseFee + 5_000_000_000n) / 1_000_000_000n, 'gwei (base + 5)');
console.log();

console.log('Standard (next block likely):');
console.log('  Max Priority Fee: 2 gwei');
console.log('  Max Fee:', (currentBaseFee * 2n) / 1_000_000_000n, 'gwei (2× base)');
console.log();

console.log('Aggressive (next block priority):');
console.log('  Max Priority Fee: 5 gwei');
console.log('  Max Fee:', (currentBaseFee * 3n) / 1_000_000_000n, 'gwei (3× base)');
console.log();

// Example 6: Cost breakdown
console.log('6. Complete Cost Breakdown');
console.log('-'.repeat(50));

function formatCost(wei: bigint): string {
  const eth = wei / 1_000_000_000_000_000_000n;
  const gwei = wei / 1_000_000_000n;
  return `${wei} wei (${gwei} gwei, ${eth} ETH)`;
}

console.log('Legacy Transaction:');
console.log('  Gas:', formatCost(legacyGasCost));
console.log('  Value:', formatCost(legacyTx.value));
console.log('  Total:', formatCost(legacyTotalCost));
console.log();

console.log('EIP-1559 Transaction:');
console.log('  Gas (max):', formatCost(eip1559MaxCost - eip1559Tx.value));
console.log('  Gas (actual):', formatCost(eip1559ActualCost - eip1559Tx.value));
console.log('  Refund:', formatCost(refund));
console.log('  Value:', formatCost(eip1559Tx.value));
console.log('  Total:', formatCost(eip1559ActualCost));
console.log();

console.log('EIP-4844 Transaction:');
console.log('  Execution Gas:', formatCost(execCost));
console.log('  Blob Gas:', formatCost(blobCost));
console.log('  Value:', formatCost(blobTx.value));
console.log('  Total:', formatCost(totalBlobTxCost));
