import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

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

const expectedGas1 = g1MsmGas(k1);

const result1 = execute(
	PrecompileAddress.BLS12_G1_MSM,
	input1,
	BigInt(expectedGas1 + 1000),
	Hardfork.PRAGUE,
);

if (result1.success) {
} else {
}

const k2 = 16;
const input2 = new Uint8Array(160 * k2);

for (let i = 0; i < k2; i++) {
	input2.set(G1_POINT, i * 160);
	input2.set(toBytes(BigInt(i + 1), 32), i * 160 + 128);
}

const individualGas = k2 * 12000;
const msmGas = g1MsmGas(k2);
const savings = individualGas - msmGas;

const result2 = execute(
	PrecompileAddress.BLS12_G1_MSM,
	input2,
	BigInt(msmGas + 5000),
	Hardfork.PRAGUE,
);

if (result2.success) {
} else {
}

const testSizes = [1, 2, 4, 8, 16, 32, 64, 128];

for (const k of testSizes) {
	const total = g1MsmGas(k);
	const perPair = Math.floor(total / k);
	const discount = getMsmDiscount(k);
	const individual = k * 12000;
	const savings = ((1 - total / individual) * 100).toFixed(1);
}

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

const g2IndividualGas = k4 * 45000;
const g2MsmGasTotal = g2MsmGas(k4);
const g2Savings = g2IndividualGas - g2MsmGasTotal;

const result4 = execute(
	PrecompileAddress.BLS12_G2_MSM,
	input4,
	BigInt(g2MsmGasTotal + 10000),
	Hardfork.PRAGUE,
);

if (result4.success) {
} else {
}

const NUM_VALIDATORS = 100;

const individualDerivation = NUM_VALIDATORS * 12000;
const batchDerivation = g1MsmGas(NUM_VALIDATORS);

const NUM_SIGS = 64;

const aggregateComputeGas = g1MsmGas(NUM_SIGS);
const pairingGas = 65000 + 2 * 43000; // 2 pairs

const individualVerifyGas = NUM_SIGS * (12000 + 151000); // G1_MUL + pairing per sig

// Empty input
const emptyInput = new Uint8Array(0);
const resultEmpty = execute(
	PrecompileAddress.BLS12_G1_MSM,
	emptyInput,
	10000n,
	Hardfork.PRAGUE,
);

// Wrong length (not multiple of 160)
const wrongLength = new Uint8Array(159);
const resultWrong = execute(
	PrecompileAddress.BLS12_G1_MSM,
	wrongLength,
	10000n,
	Hardfork.PRAGUE,
);
const g1_16 = g1MsmGas(16);
const g2_16 = g2MsmGas(16);
