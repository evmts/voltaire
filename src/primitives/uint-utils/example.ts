/**
 * Examples demonstrating Uint64 and Uint256 utilities
 */

import * as Uint64 from './uint64';
import * as Uint256 from './uint256';

// ==============================================================================
// UINT64 EXAMPLES
// ==============================================================================

console.log('=== Uint64 Examples ===\n');

// Creating Uint64 values
console.log('1. Creating Uint64 values:');
const uint64FromBigInt = Uint64.fromBigInt(1000n);
const uint64FromNumber = Uint64.fromNumber(42);
console.log('  From bigint(1000):', uint64FromBigInt);
console.log('  From number(42):', uint64FromNumber);
console.log('  ZERO constant:', Uint64.UINT64_ZERO);
console.log('  ONE constant:', Uint64.UINT64_ONE);
console.log('  MAX constant:', Uint64.UINT64_MAX);
console.log();

// Converting Uint64 values
console.log('2. Converting Uint64 values:');
const uint64Value = Uint64.fromBigInt(12345n);
console.log('  Original:', uint64Value);
console.log('  To bigint:', Uint64.toBigInt(uint64Value));
console.log('  To number:', Uint64.toNumber(uint64Value));
console.log();

// Arithmetic operations
console.log('3. Uint64 arithmetic:');
const a64 = Uint64.fromBigInt(100n);
const b64 = Uint64.fromBigInt(50n);
console.log('  a =', a64);
console.log('  b =', b64);
console.log('  a + b =', Uint64.add(a64, b64));
console.log('  a - b =', Uint64.sub(a64, b64));
console.log('  a * b =', Uint64.mul(a64, b64));
console.log('  a / b =', Uint64.div(a64, b64));
console.log('  a % b =', Uint64.mod(a64, b64));
console.log();

// Comparison operations
console.log('4. Uint64 comparisons:');
const x64 = Uint64.fromBigInt(100n);
const y64 = Uint64.fromBigInt(200n);
console.log('  x =', x64);
console.log('  y =', y64);
console.log('  x == y:', Uint64.eq(x64, y64));
console.log('  x < y:', Uint64.lt(x64, y64));
console.log('  x > y:', Uint64.gt(x64, y64));
console.log('  x <= y:', Uint64.lte(x64, y64));
console.log('  x >= y:', Uint64.gte(x64, y64));
console.log('  compare(x, y):', Uint64.compare(x64, y64));
console.log('  min(x, y):', Uint64.min(x64, y64));
console.log('  max(x, y):', Uint64.max(x64, y64));
console.log();

// Error handling
console.log('5. Uint64 error handling:');
try {
  Uint64.fromBigInt(-1n);
} catch (error) {
  console.log('  Negative value error:', (error as Error).message);
}

try {
  Uint64.fromBigInt(18446744073709551616n); // 2^64
} catch (error) {
  console.log('  Overflow error:', (error as Error).message);
}

try {
  Uint64.div(Uint64.UINT64_ONE, Uint64.UINT64_ZERO);
} catch (error) {
  console.log('  Division by zero error:', (error as Error).message);
}
console.log();

// ==============================================================================
// UINT256 EXAMPLES
// ==============================================================================

console.log('=== Uint256 Examples ===\n');

// Creating Uint256 values
console.log('1. Creating Uint256 values:');
const uint256FromBigInt = Uint256.fromBigInt(1000000n);
const uint256FromHex = Uint256.fromHex('0xdeadbeef');
const uint256FromBytes = Uint256.fromBytes(new Uint8Array([0xff, 0xee, 0xdd, 0xcc]));
console.log('  From bigint(1000000):', uint256FromBigInt);
console.log('  From hex("0xdeadbeef"):', uint256FromHex);
console.log('  From bytes([0xff, 0xee, 0xdd, 0xcc]):', uint256FromBytes);
console.log('  ZERO constant:', Uint256.ZERO);
console.log('  ONE constant:', Uint256.ONE);
console.log('  MAX constant:', Uint256.MAX_UINT256);
console.log();

// Converting Uint256 values
console.log('2. Converting Uint256 values:');
const uint256Value = Uint256.fromBigInt(0xdeadbeefn);
console.log('  Original:', uint256Value);
console.log('  To bigint:', Uint256.toBigInt(uint256Value));
console.log('  To hex:', Uint256.toHex(uint256Value));
console.log('  To bytes (last 4 bytes):', Uint256.toBytes(uint256Value).slice(-4));
console.log();

// Arithmetic operations
console.log('3. Uint256 arithmetic:');
const a256 = Uint256.fromBigInt(1000n);
const b256 = Uint256.fromBigInt(50n);
console.log('  a =', a256);
console.log('  b =', b256);
console.log('  a + b =', Uint256.add(a256, b256));
console.log('  a - b =', Uint256.sub(a256, b256));
console.log('  a * b =', Uint256.mul(a256, b256));
console.log('  a / b =', Uint256.div(a256, b256));
console.log('  a % b =', Uint256.mod(a256, b256));
console.log();

// Power operation
console.log('4. Uint256 power:');
const base = Uint256.fromBigInt(2n);
const exponent = Uint256.fromBigInt(10n);
console.log('  2^10 =', Uint256.pow(base, exponent), '=', Uint256.toBigInt(Uint256.pow(base, exponent)));
console.log();

// Comparison operations
console.log('5. Uint256 comparisons:');
const x256 = Uint256.fromBigInt(1000n);
const y256 = Uint256.fromBigInt(2000n);
console.log('  x =', x256);
console.log('  y =', y256);
console.log('  x == y:', Uint256.eq(x256, y256));
console.log('  x < y:', Uint256.lt(x256, y256));
console.log('  x > y:', Uint256.gt(x256, y256));
console.log('  x <= y:', Uint256.lte(x256, y256));
console.log('  x >= y:', Uint256.gte(x256, y256));
console.log('  compare(x, y):', Uint256.compare(x256, y256));
console.log('  min(x, y):', Uint256.min(x256, y256));
console.log('  max(x, y):', Uint256.max(x256, y256));
console.log();

// Bitwise operations
console.log('6. Uint256 bitwise operations:');
const bit1 = Uint256.fromBigInt(0b11110000n);
const bit2 = Uint256.fromBigInt(0b10101010n);
console.log('  a =', bit1, '(binary: 11110000)');
console.log('  b =', bit2, '(binary: 10101010)');
console.log('  a & b =', Uint256.and(bit1, bit2), '(binary:', Uint256.toBigInt(Uint256.and(bit1, bit2)).toString(2).padStart(8, '0'), ')');
console.log('  a | b =', Uint256.or(bit1, bit2), '(binary:', Uint256.toBigInt(Uint256.or(bit1, bit2)).toString(2).padStart(8, '0'), ')');
console.log('  a ^ b =', Uint256.xor(bit1, bit2), '(binary:', Uint256.toBigInt(Uint256.xor(bit1, bit2)).toString(2).padStart(8, '0'), ')');
console.log('  ~ONE =', Uint256.not(Uint256.ONE));
console.log();

// Shift operations
console.log('7. Uint256 shift operations:');
const shiftValue = Uint256.fromBigInt(1n);
console.log('  1 << 0 =', Uint256.shl(shiftValue, 0));
console.log('  1 << 8 =', Uint256.shl(shiftValue, 8), '=', Uint256.toBigInt(Uint256.shl(shiftValue, 8)));
console.log('  256 >> 8 =', Uint256.shr(Uint256.fromBigInt(256n), 8));
console.log();

// Bytes conversion
console.log('8. Uint256 bytes conversion:');
const bytesValue = new Uint8Array(32);
bytesValue[28] = 0x01;
bytesValue[29] = 0x02;
bytesValue[30] = 0x03;
bytesValue[31] = 0x04;
const fromBytesValue = Uint256.fromBytes(bytesValue);
console.log('  Input bytes (last 4):', bytesValue.slice(-4));
console.log('  Uint256 value:', fromBytesValue);
console.log('  Back to bytes (last 4):', Uint256.toBytes(fromBytesValue).slice(-4));
console.log('  BigInt value:', Uint256.toBigInt(fromBytesValue));
console.log();

// Type guards
console.log('9. Type guards:');
console.log('  isUint64("0x42"):', Uint64.isUint64('0x42'));
console.log('  isUint64("invalid"):', Uint64.isUint64('invalid'));
console.log('  isUint256("0xdeadbeef"):', Uint256.isUint256('0xdeadbeef'));
console.log('  isUint256("invalid"):', Uint256.isUint256('invalid'));
console.log();

// Error handling
console.log('10. Uint256 error handling:');
try {
  Uint256.fromBigInt(-1n);
} catch (error) {
  console.log('  Negative value error:', (error as Error).message);
}

try {
  Uint256.fromBigInt((1n << 256n));
} catch (error) {
  console.log('  Overflow error:', (error as Error).message);
}

try {
  Uint256.fromHex('0xGG');
} catch (error) {
  console.log('  Invalid hex error:', (error as Error).message);
}

try {
  Uint256.fromBytes(new Uint8Array(33));
} catch (error) {
  console.log('  Bytes too large error:', (error as Error).message);
}

try {
  Uint256.shl(Uint256.ONE, 256);
} catch (error) {
  console.log('  Shift out of range error:', (error as Error).message);
}
console.log();

// ==============================================================================
// PRACTICAL ETHEREUM USE CASES
// ==============================================================================

console.log('=== Practical Ethereum Use Cases ===\n');

// Gas calculations
console.log('1. Gas calculations:');
const gasPrice = Uint256.fromBigInt(50_000_000_000n); // 50 gwei
const gasLimit = Uint64.fromBigInt(21000n); // Standard transfer
const maxFee = Uint256.mul(gasPrice, Uint256.fromBigInt(Uint64.toBigInt(gasLimit)));
console.log('  Gas price (50 gwei):', gasPrice);
console.log('  Gas limit (21000):', gasLimit);
console.log('  Max fee (wei):', maxFee);
console.log('  Max fee (bigint):', Uint256.toBigInt(maxFee));
console.log();

// Token amounts
console.log('2. Token amounts (18 decimals):');
const oneToken = Uint256.fromBigInt(1_000_000_000_000_000_000n); // 1e18
const tokenAmount = Uint256.mul(Uint256.fromBigInt(5n), oneToken);
console.log('  1 token (wei):', oneToken);
console.log('  5 tokens (wei):', tokenAmount);
console.log('  5 tokens (bigint):', Uint256.toBigInt(tokenAmount));
console.log();

// Block numbers and timestamps
console.log('3. Block numbers and timestamps:');
const currentBlock = Uint64.fromBigInt(18_000_000n);
const targetBlock = Uint64.fromBigInt(18_500_000n);
const blocksRemaining = Uint64.sub(targetBlock, currentBlock);
console.log('  Current block:', currentBlock);
console.log('  Target block:', targetBlock);
console.log('  Blocks remaining:', blocksRemaining);
console.log('  Blocks remaining (number):', Uint64.toNumber(blocksRemaining));
console.log();

// Account balance
console.log('4. Account balance:');
const balance = Uint256.fromHex('0x1bc16d674ec80000'); // 2 ETH in wei
const transferAmount = Uint256.fromBigInt(1_000_000_000_000_000_000n); // 1 ETH
const remainingBalance = Uint256.sub(balance, transferAmount);
console.log('  Balance:', balance);
console.log('  Transfer amount:', transferAmount);
console.log('  Remaining balance:', remainingBalance);
console.log('  Remaining balance (bigint):', Uint256.toBigInt(remainingBalance));
console.log();

// Bit manipulation (checking flags)
console.log('5. Bit manipulation (feature flags):');
const flags = Uint256.fromBigInt(0b00001101n); // Features enabled: 0, 2, 3
const hasFeature0 = Uint256.toBigInt(Uint256.and(flags, Uint256.fromBigInt(1n << 0n))) !== 0n;
const hasFeature1 = Uint256.toBigInt(Uint256.and(flags, Uint256.fromBigInt(1n << 1n))) !== 0n;
const hasFeature2 = Uint256.toBigInt(Uint256.and(flags, Uint256.fromBigInt(1n << 2n))) !== 0n;
console.log('  Flags:', flags, '(binary: 00001101)');
console.log('  Has feature 0:', hasFeature0);
console.log('  Has feature 1:', hasFeature1);
console.log('  Has feature 2:', hasFeature2);
console.log();

console.log('All examples completed successfully!');
