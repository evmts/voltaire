import { execute, PrecompileAddress } from '../../../src/precompiles/precompiles.js';
import { Hardfork } from '../../../src/primitives/Hardfork/index.js';

/**
 * BN254 Precompiles - Basic Operations
 *
 * Three BN254 precompiles on alt_bn128 curve:
 * - 0x06: ECADD - Point addition (150 gas)
 * - 0x07: ECMUL - Scalar multiplication (6,000 gas)
 * - 0x08: ECPAIRING - Pairing check (45,000 + 34,000k gas)
 *
 * Curve equation: y² = x³+ 3
 * Field modulus (p): 21888242871839275222246405745257275088696311157297823662689037894645226208583
 * Group order (r): 21888242871839275222246405745257275088548364400416034343698204186575808495617
 */

console.log('=== BN254 Precompiles - Basic Operations ===\n');

// BN254 curve parameters
const FIELD_MODULUS = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const GROUP_ORDER = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// G1 generator point
const G1_X = 1n;
const G1_Y = 2n;

/**
 * Convert bigint to 32-byte big-endian
 */
function toBigEndian(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
  }
  return bytes;
}

/**
 * Read bigint from 32-byte big-endian
 */
function fromBigEndian(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let i = 0; i < 32; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  return value;
}

// Example 1: ECADD - Point Addition (0x06)
console.log('1. ECADD - G1 Point Addition (0x06)');
console.log('-'.repeat(50));

// Add G1 generator to itself: G + G = 2G
const ecaddInput = new Uint8Array(128);
ecaddInput.set(toBigEndian(G1_X), 0);    // x1
ecaddInput.set(toBigEndian(G1_Y), 32);   // y1
ecaddInput.set(toBigEndian(G1_X), 64);   // x2
ecaddInput.set(toBigEndian(G1_Y), 96);   // y2

console.log('Adding G1 + G1 = 2G');
console.log(`Input: 128 bytes (2 points × 64 bytes)`);
console.log(`Point format: [x, y] (32 bytes each)\n`);

const ecaddResult = execute(
  PrecompileAddress.BN254_ADD,
  ecaddInput,
  1000n,
  Hardfork.CANCUN
);

if (ecaddResult.success) {
  const resultX = fromBigEndian(ecaddResult.output.slice(0, 32));
  const resultY = fromBigEndian(ecaddResult.output.slice(32, 64));

  console.log('✓ Success');
  console.log(`Gas used: ${ecaddResult.gasUsed}`);
  console.log(`Result 2G:`);
  console.log(`  x = ${resultX}`);
  console.log(`  y = ${resultY}`);
} else {
  console.log(`✗ Failed: ${ecaddResult.error}`);
}

console.log('\n');

// Example 2: ECMUL - Scalar Multiplication (0x07)
console.log('2. ECMUL - G1 Scalar Multiplication (0x07)');
console.log('-'.repeat(50));

const scalar = 42n;

const ecmulInput = new Uint8Array(96);
ecmulInput.set(toBigEndian(G1_X), 0);      // x
ecmulInput.set(toBigEndian(G1_Y), 32);     // y
ecmulInput.set(toBigEndian(scalar), 64);   // scalar

console.log(`Computing ${scalar} × G1`);
console.log(`Input: 96 bytes (point + scalar)`);
console.log(`Format: [x, y, scalar] (32 bytes each)\n`);

const ecmulResult = execute(
  PrecompileAddress.BN254_MUL,
  ecmulInput,
  10000n,
  Hardfork.CANCUN
);

if (ecmulResult.success) {
  const resultX = fromBigEndian(ecmulResult.output.slice(0, 32));
  const resultY = fromBigEndian(ecmulResult.output.slice(32, 64));

  console.log('✓ Success');
  console.log(`Gas used: ${ecmulResult.gasUsed}`);
  console.log(`Result ${scalar}G:`);
  console.log(`  x = ${resultX}`);
  console.log(`  y = ${resultY}`);

  // Verify point is on curve: y² = x³ + 3
  const lhs = (resultY * resultY) % FIELD_MODULUS;
  const rhs = (resultX * resultX * resultX + 3n) % FIELD_MODULUS;
  const onCurve = lhs === rhs;
  console.log(`  On curve: ${onCurve ? '✓' : '✗'}`);
} else {
  console.log(`✗ Failed: ${ecmulResult.error}`);
}

console.log('\n');

// Example 3: Point at infinity
console.log('3. Point at Infinity (Identity Element)');
console.log('-'.repeat(50));

// Add G1 to identity
const identityInput = new Uint8Array(128);
identityInput.set(toBigEndian(G1_X), 0);
identityInput.set(toBigEndian(G1_Y), 32);
// Second point is (0, 0) = infinity

console.log('Adding G1 + O = G1 (identity law)');
console.log('O represented as (0, 0)\n');

const identityResult = execute(
  PrecompileAddress.BN254_ADD,
  identityInput,
  1000n,
  Hardfork.CANCUN
);

if (identityResult.success) {
  const resultX = fromBigEndian(identityResult.output.slice(0, 32));
  const resultY = fromBigEndian(identityResult.output.slice(32, 64));

  console.log('✓ Success');
  console.log(`Gas used: ${identityResult.gasUsed}`);
  console.log(`Result equals G1: ${resultX === G1_X && resultY === G1_Y ? '✓' : '✗'}`);
} else {
  console.log(`✗ Failed: ${identityResult.error}`);
}

console.log('\n');

// Example 4: Scalar multiplication edge cases
console.log('4. Scalar Multiplication Edge Cases');
console.log('-'.repeat(50));

const testScalars = [
  { value: 0n, desc: 'Zero (should return infinity)' },
  { value: 1n, desc: 'One (should return G1)' },
  { value: GROUP_ORDER, desc: 'Group order (should return infinity)' },
  { value: GROUP_ORDER + 1n, desc: 'Group order + 1 (should return G1)' },
];

for (const { value, desc } of testScalars) {
  const input = new Uint8Array(96);
  input.set(toBigEndian(G1_X), 0);
  input.set(toBigEndian(G1_Y), 32);
  input.set(toBigEndian(value), 64);

  const result = execute(
    PrecompileAddress.BN254_MUL,
    input,
    10000n,
    Hardfork.CANCUN
  );

  if (result.success) {
    const x = fromBigEndian(result.output.slice(0, 32));
    const y = fromBigEndian(result.output.slice(32, 64));
    const isInfinity = x === 0n && y === 0n;
    const isG1 = x === G1_X && y === G1_Y;

    let resultDesc = '';
    if (isInfinity) resultDesc = 'infinity';
    else if (isG1) resultDesc = 'G1';
    else resultDesc = 'other point';

    console.log(`  ${desc}: ${resultDesc}`);
  }
}

console.log('\n');

// Example 5: Combining operations
console.log('5. Combining Operations');
console.log('-'.repeat(50));

// Compute 5G + 7G = 12G using both methods

// Method 1: Compute separately then add
console.log('Method 1: Compute 5G and 7G, then add');

const mul5Input = new Uint8Array(96);
mul5Input.set(toBigEndian(G1_X), 0);
mul5Input.set(toBigEndian(G1_Y), 32);
mul5Input.set(toBigEndian(5n), 64);

const mul5Result = execute(
  PrecompileAddress.BN254_MUL,
  mul5Input,
  10000n,
  Hardfork.CANCUN
);

const mul7Input = new Uint8Array(96);
mul7Input.set(toBigEndian(G1_X), 0);
mul7Input.set(toBigEndian(G1_Y), 32);
mul7Input.set(toBigEndian(7n), 64);

const mul7Result = execute(
  PrecompileAddress.BN254_MUL,
  mul7Input,
  10000n,
  Hardfork.CANCUN
);

if (mul5Result.success && mul7Result.success) {
  const addCombinedInput = new Uint8Array(128);
  addCombinedInput.set(mul5Result.output, 0);
  addCombinedInput.set(mul7Result.output, 64);

  const addCombinedResult = execute(
    PrecompileAddress.BN254_ADD,
    addCombinedInput,
    1000n,
    Hardfork.CANCUN
  );

  const gas1 = mul5Result.gasUsed + mul7Result.gasUsed + (addCombinedResult.success ? addCombinedResult.gasUsed : 0n);
  console.log(`  Gas: ${gas1} (6000 + 6000 + 150)`);
}

// Method 2: Compute 12G directly
console.log('\nMethod 2: Compute 12G directly');

const mul12Input = new Uint8Array(96);
mul12Input.set(toBigEndian(G1_X), 0);
mul12Input.set(toBigEndian(G1_Y), 32);
mul12Input.set(toBigEndian(12n), 64);

const mul12Result = execute(
  PrecompileAddress.BN254_MUL,
  mul12Input,
  10000n,
  Hardfork.CANCUN
);

if (mul12Result.success) {
  console.log(`  Gas: ${mul12Result.gasUsed} (6000)`);
}

console.log('\nOptimization: Direct multiplication saves 6,150 gas!\n');

// Example 6: Gas cost summary
console.log('6. Gas Cost Summary');
console.log('-'.repeat(50));

console.log('Post-Istanbul (EIP-1108) gas costs:');
console.log('  ECADD (0x06):    150 gas (was 500)');
console.log('  ECMUL (0x07):  6,000 gas (was 40,000)');
console.log('  ECPAIRING base: 45,000 gas (was 100,000)');
console.log('  ECPAIRING/pair: 34,000 gas (was 80,000)\n');

console.log('Common operations:');
console.log('  Point addition:       150 gas');
console.log('  Scalar multiplication: 6,000 gas (40× more than addition)');
console.log('  2-pair pairing:     113,000 gas (45k + 2×34k)');
console.log('  4-pair pairing:     181,000 gas (typical Groth16)\n');

console.log('=== Complete ===\n');
console.log('Key Points:');
console.log('- ECADD: Cheapest at 150 gas');
console.log('- ECMUL: 40× more expensive than addition');
console.log('- Prefer addition when possible');
console.log('- All operations enforce curve validity');
console.log('- Critical for zkSNARK verification');
