/**
 * EIP-2565 Gas Calculation for MODEXP
 *
 * The MODEXP precompile gas cost was repriced in EIP-2565 to better
 * reflect the actual computational cost.
 *
 * Gas formula: max(200, floor(multiplication_complexity * iteration_count / 3))
 *
 * Where:
 * - multiplication_complexity depends on max(base_len, mod_len)
 * - iteration_count depends on exponent length and high bits
 *
 * @see https://eips.ethereum.org/EIPS/eip-2565
 */

import { ModExp } from "@tevm/voltaire";

// Minimum gas cost is 200
const minGas = ModExp.calculateGas(1n, 1n, 1n, 1n);

// Small numbers
const smallGas = ModExp.calculateGas(32n, 32n, 32n, 256n);

// Medium numbers
const medGas = ModExp.calculateGas(64n, 64n, 64n, 0xffffffffffffffffn);

// Large numbers
const largeGas = ModExp.calculateGas(
	256n,
	256n,
	256n,
	0xffffffffffffffffffffffffffffffffn,
);
for (const baseLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	const gas = ModExp.calculateGas(baseLen, 32n, 32n, 256n);
}
for (const modLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	const gas = ModExp.calculateGas(32n, 32n, modLen, 256n);
}
for (const expLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	// expHead is the first 32 bytes of exponent
	const gas = ModExp.calculateGas(32n, expLen, 32n, 256n);
}

function showComplexity(x: bigint) {
	let complexity: bigint;
	if (x <= 64n) {
		complexity = x * x;
	} else if (x <= 1024n) {
		complexity = (x * x) / 4n + 96n * x - 3072n;
	} else {
		complexity = (x * x) / 16n + 480n * x - 199680n;
	}
	return complexity;
}
for (const x of [32n, 64n, 128n, 256n, 512n, 1024n, 2048n]) {
}
for (const expHead of [0n, 1n, 255n, 256n, 65535n, 65536n, 0xffffffffn]) {
	const gas = ModExp.calculateGas(32n, 32n, 32n, expHead);
	const bits = expHead === 0n ? 0 : expHead.toString(2).length;
}
for (const expLen of [33n, 64n, 128n, 256n]) {
	const gas = ModExp.calculateGas(32n, expLen, 32n, 0xffffffffn);
}

// RSA-2048 verification
const rsa2048Gas = ModExp.calculateGas(256n, 3n, 256n, 65537n);

// RSA-2048 decryption (private key is 256 bytes)
const rsa2048DecryptGas = ModExp.calculateGas(
	256n,
	256n,
	256n,
	0xffffffffffffffffffffffffffffffffn,
);

// RSA-4096 verification
const rsa4096Gas = ModExp.calculateGas(512n, 3n, 512n, 65537n);

// BLS signature verification (modexp in pairing)
const bls12Gas = ModExp.calculateGas(48n, 32n, 48n, 0xffffffffn);

const operations = [
	{
		name: "2^10 mod 1000 (tiny)",
		baseLen: 1n,
		expLen: 1n,
		modLen: 2n,
		expHead: 10n,
	},
	{
		name: "256-bit modexp",
		baseLen: 32n,
		expLen: 32n,
		modLen: 32n,
		expHead: 256n,
	},
	{
		name: "512-bit modexp",
		baseLen: 64n,
		expLen: 64n,
		modLen: 64n,
		expHead: 512n,
	},
	{
		name: "RSA-2048 verify",
		baseLen: 256n,
		expLen: 3n,
		modLen: 256n,
		expHead: 65537n,
	},
	{
		name: "RSA-2048 sign",
		baseLen: 256n,
		expLen: 256n,
		modLen: 256n,
		expHead: 0xffffffffn,
	},
	{
		name: "RSA-4096 verify",
		baseLen: 512n,
		expLen: 3n,
		modLen: 512n,
		expHead: 65537n,
	},
	{
		name: "DH-2048 compute",
		baseLen: 256n,
		expLen: 256n,
		modLen: 256n,
		expHead: 0xffffffffn,
	},
];

for (const op of operations) {
	const gas = ModExp.calculateGas(op.baseLen, op.expLen, op.modLen, op.expHead);
}

const gasPrice = 30n; // gwei
const gweiToEth = 1_000_000_000n;

for (const op of operations) {
	const gas = ModExp.calculateGas(op.baseLen, op.expLen, op.modLen, op.expHead);
	const costGwei = gas * gasPrice;
	const costEth = Number(costGwei) / Number(gweiToEth);
}
