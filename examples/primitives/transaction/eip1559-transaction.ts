/**
 * EIP-1559 Transaction Example
 *
 * Demonstrates EIP-1559 (Type 2) transactions with:
 * - Dynamic fee market mechanics
 * - Base fee + priority fee
 * - Access lists for gas optimization
 * - Effective gas price calculation
 */

import * as Transaction from '../../../src/primitives/Transaction/index.js';
import * as Address from '../../../src/primitives/Address/index.js';
import * as Hex from '../../../src/primitives/Hex/index.js';
import * as Hash from '../../../src/primitives/Hash/index.js';

// Example 1: Basic EIP-1559 transaction
const basicTx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2_000_000_000n,  // 2 gwei tip
  maxFeePerGas: 30_000_000_000n,         // 30 gwei max
  gasLimit: 21000n,
  to: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  value: 1_000_000_000_000_000_000n,  // 1 ETH
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: Hex.toBytes('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  s: Hex.toBytes('0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'),
};

console.log('Basic EIP-1559 Transaction:');
console.log('  Type:', basicTx.type, '(EIP-1559)');
console.log('  Chain ID:', basicTx.chainId);
console.log('  Nonce:', basicTx.nonce);
console.log('  Max Priority Fee:', basicTx.maxPriorityFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Max Fee Per Gas:', basicTx.maxFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Gas Limit:', basicTx.gasLimit);
console.log('  To:', Address.toHex(basicTx.to));
console.log('  Value:', basicTx.value / 1_000_000_000_000_000_000n, 'ETH');
console.log('  yParity:', basicTx.yParity);
console.log();

// Example 2: Effective gas price calculation
console.log('Effective Gas Price Examples:');
console.log('Transaction: maxFee=30 gwei, priority=2 gwei');
console.log();

const scenarios = [
  { baseFee: 15_000_000_000n, description: 'Normal block' },
  { baseFee: 25_000_000_000n, description: 'Busy block' },
  { baseFee: 28_000_000_000n, description: 'Very busy (near max)' },
  { baseFee: 30_000_000_000n, description: 'At max fee' },
];

for (const scenario of scenarios) {
  const effectiveGasPrice = Transaction.EIP1559.getEffectiveGasPrice(basicTx, scenario.baseFee);
  const actualPriority = effectiveGasPrice - scenario.baseFee;

  console.log(`  ${scenario.description}:`);
  console.log(`    Base Fee: ${scenario.baseFee / 1_000_000_000n} gwei`);
  console.log(`    Effective Gas Price: ${effectiveGasPrice / 1_000_000_000n} gwei`);
  console.log(`    Actual Priority: ${actualPriority / 1_000_000_000n} gwei`);
  console.log(`    Formula: min(${scenario.baseFee / 1_000_000_000n} + 2, 30) = ${effectiveGasPrice / 1_000_000_000n}`);
  console.log();
}

// Example 3: Transaction with access list
const accessListTx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 5n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 30_000_000_000n,
  gasLimit: 50_000n,
  to: Address.from('0x6B175474E89094C44Da98b954EedeAC495271d0F'),  // DAI
  value: 0n,
  data: Hex.toBytes('0xa9059cbb' + '00'.repeat(64)),  // transfer() call
  accessList: [
    {
      address: Address.from('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
      storageKeys: [
        Hash.from('0x0000000000000000000000000000000000000000000000000000000000000001'),
        Hash.from('0x0000000000000000000000000000000000000000000000000000000000000002'),
      ],
    },
    {
      address: Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
      storageKeys: [
        Hash.from('0x0000000000000000000000000000000000000000000000000000000000000003'),
      ],
    },
  ],
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

console.log('Transaction with Access List:');
console.log('  Has Access List:', Transaction.hasAccessList(accessListTx));
console.log('  Access List Items:', accessListTx.accessList.length);
for (let i = 0; i < accessListTx.accessList.length; i++) {
  const item = accessListTx.accessList[i];
  console.log(`  Item ${i + 1}:`);
  console.log(`    Address: ${Address.toHex(item.address)}`);
  console.log(`    Storage Keys: ${item.storageKeys.length}`);
}
console.log();

// Example 4: Fee estimation strategy
console.log('Fee Estimation Strategies:');
console.log();

const currentBaseFee = 15_000_000_000n;  // 15 gwei

// Conservative (cheaper, slower)
const conservative: Transaction.EIP1559 = {
  ...basicTx,
  maxPriorityFeePerGas: 1_000_000_000n,  // 1 gwei tip
  maxFeePerGas: currentBaseFee + 5_000_000_000n,  // base + 5 gwei buffer
};

console.log('Conservative Strategy:');
console.log('  Max Priority Fee:', conservative.maxPriorityFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Max Fee:', conservative.maxFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Expected Inclusion: Next few blocks');
console.log();

// Standard (balanced)
const standard: Transaction.EIP1559 = {
  ...basicTx,
  maxPriorityFeePerGas: 2_000_000_000n,  // 2 gwei tip
  maxFeePerGas: currentBaseFee * 2n,  // 2x base fee
};

console.log('Standard Strategy:');
console.log('  Max Priority Fee:', standard.maxPriorityFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Max Fee:', standard.maxFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Expected Inclusion: Next block (likely)');
console.log();

// Aggressive (faster, more expensive)
const aggressive: Transaction.EIP1559 = {
  ...basicTx,
  maxPriorityFeePerGas: 5_000_000_000n,  // 5 gwei tip
  maxFeePerGas: currentBaseFee * 3n,  // 3x base fee
};

console.log('Aggressive Strategy:');
console.log('  Max Priority Fee:', aggressive.maxPriorityFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Max Fee:', aggressive.maxFeePerGas / 1_000_000_000n, 'gwei');
console.log('  Expected Inclusion: Next block (high priority)');
console.log();

// Example 5: Cost calculation
console.log('Transaction Cost Calculation:');
const baseFee = 15_000_000_000n;
const gasUsed = 21000n;
const effectiveGasPrice = Transaction.EIP1559.getEffectiveGasPrice(basicTx, baseFee);

const maxPossibleCost = basicTx.maxFeePerGas * basicTx.gasLimit + basicTx.value;
const actualCost = effectiveGasPrice * gasUsed + basicTx.value;
const refund = (basicTx.maxFeePerGas - effectiveGasPrice) * gasUsed;

console.log('  Gas Used:', gasUsed);
console.log('  Base Fee:', baseFee / 1_000_000_000n, 'gwei');
console.log('  Effective Gas Price:', effectiveGasPrice / 1_000_000_000n, 'gwei');
console.log();
console.log('  Maximum Possible Cost:', maxPossibleCost / 1_000_000_000_000_000_000n, 'ETH');
console.log('  Actual Cost:', actualCost / 1_000_000_000_000_000_000n, 'ETH');
console.log('  Refund:', refund / 1_000_000_000_000_000_000n, 'ETH');
console.log();

// Example 6: Benefits over legacy
console.log('EIP-1559 vs Legacy Benefits:');
console.log('  ✓ Predictable fees (base fee adjusts automatically)');
console.log('  ✓ No overpaying (pay actual, refund excess)');
console.log('  ✓ Faster inclusion (priority fee to miners)');
console.log('  ✓ ETH burn (base fee burned, reduces supply)');
console.log('  ✓ Better UX (set max, pay actual)');
console.log();

// Example 7: Contract deployment with EIP-1559
const deployment: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 30_000_000_000n,
  gasLimit: 500_000n,  // High for deployment
  to: null,  // null = contract creation
  value: 0n,
  data: Hex.toBytes('0x608060405234801561001057600080fd5b50'),  // Bytecode
  accessList: [],
  yParity: 0,
  r: Hex.toBytes('0x' + '00'.repeat(32)),
  s: Hex.toBytes('0x' + '00'.repeat(32)),
};

console.log('Contract Deployment with EIP-1559:');
console.log('  To:', deployment.to === null ? 'null (contract creation)' : 'address');
console.log('  Gas Limit:', deployment.gasLimit);
console.log('  Bytecode Length:', deployment.data.length, 'bytes');
console.log('  Is Contract Creation:', Transaction.isContractCreation(deployment));
