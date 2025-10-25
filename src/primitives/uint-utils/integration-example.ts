/**
 * Integration example showing interop between Uint256 and existing U256 type
 */

import type { U256 } from '../../types';
import { createU256, ZERO_U256, u256Equals } from '../../types';
import * as Uint256 from './uint256';
import * as U256Compat from './u256-compat';

console.log('=== Uint256 and U256 Integration Example ===\n');

// ==============================================================================
// SCENARIO 1: Working with C API (U256) and converting to Uint256 for operations
// ==============================================================================

console.log('1. C API to TypeScript operations:');

// Simulate receiving U256 from C API
const balanceFromC: U256 = U256Compat.bigIntToU256(5_000_000_000_000_000_000n); // 5 ETH
console.log('  Balance from C API (U256):', balanceFromC.bytes.slice(-8));

// Convert to Uint256 for ergonomic operations
const balance = U256Compat.fromU256(balanceFromC);
console.log('  Balance as Uint256:', balance);
console.log('  Balance in wei (bigint):', Uint256.toBigInt(balance));

// Perform operations using Uint256 API
const transferAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n); // 1 ETH
const newBalance = Uint256.sub(balance, transferAmount);
console.log('  Transfer amount:', transferAmount);
console.log('  New balance:', newBalance);

// Convert back to U256 for C API
const newBalanceForC = U256Compat.toU256(newBalance);
console.log('  New balance for C API (U256):', newBalanceForC.bytes.slice(-8));
console.log();

// ==============================================================================
// SCENARIO 2: Mixing both type systems in application logic
// ==============================================================================

console.log('2. Mixed usage in application:');

// Application uses Uint256 for business logic
const gasPrice = Uint256.fromBigInt(50_000_000_000n); // 50 gwei
const gasLimit = Uint256.fromBigInt(21000n);
const gasCost = Uint256.mul(gasPrice, gasLimit);
console.log('  Gas price:', gasPrice);
console.log('  Gas limit:', gasLimit);
console.log('  Gas cost:', gasCost);

// Convert to U256 when calling C API functions
const gasCostForC = U256Compat.toU256(gasCost);
console.log('  Gas cost for C API:', gasCostForC.bytes.slice(-8));

// Receive result from C API and convert back
const remainingBalanceFromC = U256Compat.toU256(Uint256.sub(newBalance, gasCost));
console.log('  Remaining balance from C:', remainingBalanceFromC.bytes.slice(-8));
console.log();

// ==============================================================================
// SCENARIO 3: Batch conversions for multiple values
// ==============================================================================

console.log('3. Batch conversions:');

// Convert multiple Uint256 values to U256 for C API call
const values: Uint256.Uint256[] = [
  Uint256.fromBigInt(100n),
  Uint256.fromBigInt(200n),
  Uint256.fromBigInt(300n),
];

const valuesForC: U256[] = values.map(U256Compat.toU256);
console.log('  Uint256 values:', values);
console.log('  U256 values (last byte):', valuesForC.map((v) => v.bytes[31]));

// Convert results back from C API
const resultsFromC: U256[] = valuesForC.map((v) =>
  U256Compat.bigIntToU256(U256Compat.u256ToBigInt(v) * 2n)
);
const results: Uint256.Uint256[] = resultsFromC.map(U256Compat.fromU256);
console.log('  Results from C (doubled):', results);
console.log();

// ==============================================================================
// SCENARIO 4: Working with hex strings from JSON/RPC
// ==============================================================================

console.log('4. JSON-RPC integration:');

// Simulate receiving hex string from JSON-RPC
const blockRewardHex = '0x1bc16d674ec80000'; // 2 ETH

// Parse to Uint256 for operations
const blockReward = Uint256.fromHex(blockRewardHex);
console.log('  Block reward (hex):', blockRewardHex);
console.log('  Block reward (Uint256):', blockReward);
console.log('  Block reward (wei):', Uint256.toBigInt(blockReward));

// Calculate miner fee (15% of reward)
const feeNumerator = Uint256.fromBigInt(15n);
const feeDenominator = Uint256.fromBigInt(100n);
const minerFee = Uint256.div(Uint256.mul(blockReward, feeNumerator), feeDenominator);
console.log('  Miner fee (15%):', minerFee);
console.log('  Miner fee (wei):', Uint256.toBigInt(minerFee));

// Convert to U256 for storage/C API
const minerFeeForStorage = U256Compat.toU256(minerFee);
console.log('  Miner fee for storage (U256):', minerFeeForStorage.bytes.slice(-8));
console.log();

// ==============================================================================
// SCENARIO 5: Validation and type safety
// ==============================================================================

console.log('5. Type safety and validation:');

// Type guard usage
const maybeHex: unknown = '0x2a';
if (Uint256.isUint256(maybeHex)) {
  console.log('  Valid Uint256:', maybeHex);
  const u256 = U256Compat.toU256(maybeHex);
  console.log('  Converted to U256:', u256.bytes.slice(-1));
} else {
  console.log('  Invalid Uint256');
}

// Direct conversions with validation
try {
  const fromHex = U256Compat.hexToU256('0xdeadbeef');
  console.log('  Hex to U256:', fromHex.bytes.slice(-4));

  const backToHex = U256Compat.u256ToHex(fromHex);
  console.log('  U256 to hex:', backToHex);
} catch (error) {
  console.log('  Error:', (error as Error).message);
}
console.log();

// ==============================================================================
// SCENARIO 6: Comparison operations across types
// ==============================================================================

console.log('6. Comparing values:');

const value1 = Uint256.fromBigInt(1000n);
const value2U256 = U256Compat.bigIntToU256(2000n);
const value2 = U256Compat.fromU256(value2U256);

console.log('  Value 1:', value1);
console.log('  Value 2 (from U256):', value2);
console.log('  value1 < value2:', Uint256.lt(value1, value2));
console.log('  value1 == value2:', Uint256.eq(value1, value2));

// Using U256 equality check
const value1U256 = U256Compat.toU256(value1);
console.log('  U256 equality (value1 == ZERO):', u256Equals(value1U256, ZERO_U256));
console.log();

// ==============================================================================
// SCENARIO 7: Performance optimization strategy
// ==============================================================================

console.log('7. Performance optimization pattern:');

// For simple conversions: use Uint256 (fast, pure TypeScript)
const simpleCalc = Uint256.add(
  Uint256.fromBigInt(100n),
  Uint256.fromBigInt(200n)
);
console.log('  Simple calculation (Uint256):', simpleCalc);

// For FFI/C API calls: convert to U256
const simpleCalcForC = U256Compat.toU256(simpleCalc);
console.log('  Result for C API (U256):', simpleCalcForC.bytes.slice(-1));

// Strategy: Keep data as Uint256 for TS logic, convert to U256 only at boundaries
console.log('  Recommended: Uint256 for app logic, U256 for FFI boundaries');
console.log();

// ==============================================================================
// SUMMARY
// ==============================================================================

console.log('=== Summary ===');
console.log('U256 (src/types/index.ts):');
console.log('  - Interface with bytes: Uint8Array');
console.log('  - Designed for C API interop');
console.log('  - Matches C struct layout');
console.log('  - Use at FFI boundaries');
console.log();
console.log('Uint256 (src/primitives/uint-utils/):');
console.log('  - Branded type: `0x${string}` & { __brand: "Uint256" }');
console.log('  - Ergonomic TypeScript API');
console.log('  - Rich operations (arithmetic, bitwise, comparison)');
console.log('  - Use in application logic');
console.log();
console.log('U256Compat:');
console.log('  - Conversion utilities between types');
console.log('  - toU256() / fromU256() for main conversions');
console.log('  - Direct helpers: bigIntToU256(), hexToU256(), etc.');
console.log('  - Zero overhead conversions');
console.log();
console.log('Best Practice:');
console.log('  1. Use Uint256 for all application logic');
console.log('  2. Convert to U256 only when calling C API');
console.log('  3. Convert from U256 immediately when receiving from C API');
console.log('  4. Keep conversions at module boundaries');
console.log();

console.log('All integration examples completed successfully!');
