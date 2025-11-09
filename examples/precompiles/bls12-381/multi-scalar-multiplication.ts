import {
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

/**
 * BLS12-381 - Multi-Scalar Multiplication (MSM)
 *
 * Demonstrates G1_MSM (0x0D) and G2_MSM (0x10) precompiles.
 *
 * MSM computes: s₁P₁ + s₂P₂ + ... + sₖPₖ
 *
 * Key optimization: Batch discount for multiple operations
 * - Individual: k multiplications = k × 12,000 gas
 * - Batched MSM: Much cheaper due to Pippenger's algorithm
 *
 * Gas formula: (12,000 × k × discount) / 1000
 *
 * Discount tiers:
 * - 1 pair: 100.0% (12,000 gas)
 * - 2 pairs: 82.0% (9,840 gas total, 4,920 per pair)
 * - 4 pairs: 58.0% (27,840 gas total, 6,960 per pair)
 * - 8 pairs: 43.0% (41,280 gas total, 5,160 per pair)
 * - 16 pairs: 32.0% (61,440 gas total, 3,840 per pair)
 * - 128+ pairs: 17.4% (268,032 gas total, 2,094 per pair)
 *
 * Real-world uses:
 * - Batch public key generation
 * - Aggregated signature verification
 * - zkSNARK verification (multiple point operations)
 */

console.log("=== BLS12-381 - Multi-Scalar Multiplication (MSM) ===\n");

/**
 * Convert bigint to bytes (big-endian, padded)
 */
function toBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[length - 1 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
	return bytes;
}

/**
 * Calculate MSM discount factor
 */
function getMsmDiscount(k: number): number {
	if (k === 1) return 1000;
	if (k === 2) return 820;
	if (k <= 4) return 580;
	if (k <= 8) return 430;
	if (k <= 16) return 320;
	if (k <= 32) return 250;
	if (k <= 64) return 200;
	return 174; // 128+
}

/**
 * Calculate G1_MSM gas cost
 */
function g1MsmGas(k: number): number {
	const discount = getMsmDiscount(k);
	return Math.floor((12000 * k * discount) / 1000);
}

/**
 * Calculate G2_MSM gas cost
 */
function g2MsmGas(k: number): number {
	const discount = getMsmDiscount(k);
	return Math.floor((45000 * k * discount) / 1000);
}

// Example G1 point (simplified generator)
const G1_POINT = new Uint8Array(128);
G1_POINT[63] = 0x01; // x = 1
G1_POINT[127] = 0x02; // y = 2

// Example 1: Small MSM (2 pairs)
console.log("1. G1_MSM with 2 Pairs");
console.log("-".repeat(50));

const scalars1 = [5n, 7n];
const k1 = scalars1.length;

// Build input: 160 bytes per pair
const input1 = new Uint8Array(160 * k1);

for (let i = 0; i < k1; i++) {
	// G1 point (128 bytes)
	input1.set(G1_POINT, i * 160);

	// Scalar (32 bytes)
	input1.set(toBytes(scalars1[i], 32), i * 160 + 128);
}

console.log(`Computing: ${scalars1[0]}×G1 + ${scalars1[1]}×G1`);
console.log(`Input: ${input1.length} bytes (${k1} pairs × 160 bytes)`);
console.log(`Format: [point₁, scalar₁, point₂, scalar₂]\n`);

const expectedGas1 = g1MsmGas(k1);
console.log(`Expected gas: ${expectedGas1}`);
console.log(`Discount: ${getMsmDiscount(k1) / 10}%\n`);

const result1 = execute(
	PrecompileAddress.BLS12_G1_MSM,
	input1,
	BigInt(expectedGas1 + 1000),
	Hardfork.PRAGUE,
);

if (result1.success) {
	console.log(`✓ Success`);
	console.log(`Gas used: ${result1.gasUsed}`);
	console.log(`Result: 128 bytes (G1 point)`);
	console.log(`Represents: ${scalars1[0] + scalars1[1]}×G1 = 12×G1\n`);
} else {
	console.log(`✗ Failed: ${result1.error}\n`);
}

// Example 2: Medium MSM (16 pairs)
console.log("2. G1_MSM with 16 Pairs (Batch Discount)");
console.log("-".repeat(50));

const k2 = 16;
const input2 = new Uint8Array(160 * k2);

for (let i = 0; i < k2; i++) {
	input2.set(G1_POINT, i * 160);
	input2.set(toBytes(BigInt(i + 1), 32), i * 160 + 128);
}

console.log(`Computing: 1×G1 + 2×G1 + ... + 16×G1`);
console.log(`Input: ${input2.length} bytes (${k2} pairs)\n`);

const individualGas = k2 * 12000;
const msmGas = g1MsmGas(k2);
const savings = individualGas - msmGas;

console.log("Gas comparison:");
console.log(`  Individual (${k2} × G1_MUL): ${individualGas} gas`);
console.log(`  Batched MSM: ${msmGas} gas`);
console.log(
	`  Savings: ${savings} gas (${((savings / individualGas) * 100).toFixed(1)}%)\n`,
);

const result2 = execute(
	PrecompileAddress.BLS12_G1_MSM,
	input2,
	BigInt(msmGas + 5000),
	Hardfork.PRAGUE,
);

if (result2.success) {
	console.log(`✓ Success`);
	console.log(`Gas used: ${result2.gasUsed}`);
	console.log(`Result represents: (1+2+...+16)×G1 = 136×G1\n`);
} else {
	console.log(`✗ Failed: ${result2.error}\n`);
}

// Example 3: Gas cost scaling
console.log("3. Gas Cost Scaling Analysis");
console.log("-".repeat(50));

console.log("G1_MSM gas costs (per operation):\n");

const testSizes = [1, 2, 4, 8, 16, 32, 64, 128];

console.log("Pairs | Total Gas | Per Pair | Discount | Savings");
console.log("------|-----------|----------|----------|--------");

for (const k of testSizes) {
	const total = g1MsmGas(k);
	const perPair = Math.floor(total / k);
	const discount = getMsmDiscount(k);
	const individual = k * 12000;
	const savings = ((1 - total / individual) * 100).toFixed(1);

	console.log(
		`${k.toString().padStart(5)} | ` +
			`${total.toString().padStart(9)} | ` +
			`${perPair.toString().padStart(8)} | ` +
			`${(discount / 10).toFixed(1).padStart(8)}% | ` +
			`${savings.padStart(7)}%`,
	);
}

console.log("\nKey insight: Larger batches → better amortization\n");

// Example 4: G2_MSM (larger points)
console.log("4. G2_MSM (G2 Points)");
console.log("-".repeat(50));

// G2 point (256 bytes: 4 x 64-byte field elements)
const G2_POINT = new Uint8Array(256);
G2_POINT[63] = 0x01; // x.c0
G2_POINT[191] = 0x02; // y.c0

const k4 = 4;
const input4 = new Uint8Array(288 * k4); // 288 bytes per G2 pair

for (let i = 0; i < k4; i++) {
	input4.set(G2_POINT, i * 288);
	input4.set(toBytes(BigInt(i + 1), 32), i * 288 + 256);
}

console.log(`Computing: 1×G2 + 2×G2 + 3×G2 + 4×G2`);
console.log(`Input: ${input4.length} bytes (${k4} pairs × 288 bytes)`);
console.log(`Format: [G2_point₁, scalar₁, ...]\n`);

const g2IndividualGas = k4 * 45000;
const g2MsmGasTotal = g2MsmGas(k4);
const g2Savings = g2IndividualGas - g2MsmGasTotal;

console.log("Gas comparison:");
console.log(`  Individual (${k4} × G2_MUL): ${g2IndividualGas} gas`);
console.log(`  Batched G2_MSM: ${g2MsmGasTotal} gas`);
console.log(
	`  Savings: ${g2Savings} gas (${((g2Savings / g2IndividualGas) * 100).toFixed(1)}%)\n`,
);

const result4 = execute(
	PrecompileAddress.BLS12_G2_MSM,
	input4,
	BigInt(g2MsmGasTotal + 10000),
	Hardfork.PRAGUE,
);

if (result4.success) {
	console.log(`✓ Success`);
	console.log(`Gas used: ${result4.gasUsed}`);
	console.log(`Result: 256 bytes (G2 point)\n`);
} else {
	console.log(`✗ Failed: ${result4.error}\n`);
}

// Example 5: Real-world use case - Batch key derivation
console.log("5. Use Case: Batch Key Derivation");
console.log("-".repeat(50));

const NUM_VALIDATORS = 100;
console.log(`Deriving ${NUM_VALIDATORS} validator public keys\n`);

console.log("Scenario: Genesis ceremony for new chain");
console.log("Need to derive public keys for 100 validators\n");

const individualDerivation = NUM_VALIDATORS * 12000;
const batchDerivation = g1MsmGas(NUM_VALIDATORS);

console.log("Method 1: Individual G1_MUL");
console.log(`  Operations: ${NUM_VALIDATORS} × G1_MUL`);
console.log(`  Gas: ${individualDerivation}`);
console.log(`  Time: ${NUM_VALIDATORS} separate calls\n`);

console.log("Method 2: Batched G1_MSM");
console.log(`  Operations: 1 × G1_MSM (${NUM_VALIDATORS} pairs)`);
console.log(`  Gas: ${batchDerivation}`);
console.log(
	`  Savings: ${individualDerivation - batchDerivation} gas (${((1 - batchDerivation / individualDerivation) * 100).toFixed(1)}%)\n`,
);

// Example 6: Signature aggregation verification
console.log("6. Use Case: Aggregate Signature Verification");
console.log("-".repeat(50));

const NUM_SIGS = 64;
console.log(`Verifying aggregate of ${NUM_SIGS} signatures\n`);

console.log("BLS aggregate verification requires:");
console.log(`  1. Compute L = Σ(PK_i × hash_i) for ${NUM_SIGS} signatures`);
console.log(`  2. Pairing check: e(L, G2) × e(-G1, sig_agg) = 1\n`);

const aggregateComputeGas = g1MsmGas(NUM_SIGS);
const pairingGas = 65000 + 2 * 43000; // 2 pairs

console.log("Gas breakdown:");
console.log(`  MSM for L: ${aggregateComputeGas} gas`);
console.log(`  Pairing check: ${pairingGas} gas`);
console.log(`  Total: ${aggregateComputeGas + pairingGas} gas\n`);

const individualVerifyGas = NUM_SIGS * (12000 + 151000); // G1_MUL + pairing per sig
console.log("vs Individual verification:");
console.log(`  ${NUM_SIGS} × (G1_MUL + pairing): ${individualVerifyGas} gas`);
console.log(
	`  Savings: ${individualVerifyGas - (aggregateComputeGas + pairingGas)} gas`,
);
console.log(
	`  Reduction: ${((1 - (aggregateComputeGas + pairingGas) / individualVerifyGas) * 100).toFixed(1)}%\n`,
);

// Example 7: Error cases
console.log("7. Error Cases");
console.log("-".repeat(50));

// Empty input
const emptyInput = new Uint8Array(0);
const resultEmpty = execute(
	PrecompileAddress.BLS12_G1_MSM,
	emptyInput,
	10000n,
	Hardfork.PRAGUE,
);
console.log(
	`Empty input (0 pairs): ${resultEmpty.success ? "unexpected success" : "✓ failed"}`,
);

// Wrong length (not multiple of 160)
const wrongLength = new Uint8Array(159);
const resultWrong = execute(
	PrecompileAddress.BLS12_G1_MSM,
	wrongLength,
	10000n,
	Hardfork.PRAGUE,
);
console.log(
	`Wrong length (159 bytes): ${resultWrong.success ? "unexpected success" : "✓ failed"}`,
);

console.log("\n");

// Example 8: G1 vs G2 comparison
console.log("8. G1_MSM vs G2_MSM Comparison");
console.log("-".repeat(50));

console.log("Input sizes (per pair):");
console.log("  G1_MSM: 160 bytes (128 point + 32 scalar)");
console.log("  G2_MSM: 288 bytes (256 point + 32 scalar)\n");

console.log("Base costs:");
console.log("  G1_MUL: 12,000 gas");
console.log("  G2_MUL: 45,000 gas (~3.75× more)\n");

console.log("MSM cost ratio (16 pairs):");
const g1_16 = g1MsmGas(16);
const g2_16 = g2MsmGas(16);
console.log(`  G1_MSM: ${g1_16} gas`);
console.log(`  G2_MSM: ${g2_16} gas`);
console.log(`  Ratio: ${(g2_16 / g1_16).toFixed(2)}×\n`);

console.log("When to use each:");
console.log("  G1_MSM: Public keys, commitments, most operations");
console.log("  G2_MSM: Signatures, hash-to-curve operations\n");

// Example 9: Optimization strategies
console.log("9. Optimization Strategies");
console.log("-".repeat(50));

console.log("Strategy 1: Batch when possible");
console.log("  - Collect operations into larger batches");
console.log("  - 68% savings at 16 pairs vs individual\n");

console.log("Strategy 2: Precompute static points");
console.log("  - If scalars vary but points are fixed");
console.log("  - Store precomputed multiples off-chain");
console.log("  - Use addition instead of multiplication\n");

console.log("Strategy 3: Balance batch size");
console.log("  - Larger batches → better amortization");
console.log("  - But: Diminishing returns after ~128 pairs");
console.log("  - Optimal range: 16-64 pairs for most cases\n");

console.log("Strategy 4: Choose right group");
console.log("  - G1 operations 3.75× cheaper than G2");
console.log("  - Use G1 for public keys, G2 for signatures");
console.log("  - Matches BLS12-381 common conventions\n");

console.log("=== Complete ===\n");
console.log("Summary:");
console.log("- MSM enables efficient batch operations");
console.log("- Up to 82.6% savings vs individual ops");
console.log("- Critical for signature aggregation");
console.log("- Powers Ethereum 2.0 validator attestations");
console.log("- Pippenger algorithm provides batching discount");
console.log("- Optimal batch size: 16-64 pairs for most cases");
