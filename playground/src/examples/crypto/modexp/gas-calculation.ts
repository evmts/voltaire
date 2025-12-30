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

console.log("=== EIP-2565 MODEXP Gas Calculation ===\n");

// === Basic Gas Calculation ===
console.log("--- Basic Examples ---");

// Minimum gas cost is 200
const minGas = ModExp.calculateGas(1n, 1n, 1n, 1n);
console.log("Tiny operation (1-byte each):");
console.log(`  Gas: ${minGas} (minimum is 200)`);

// Small numbers
const smallGas = ModExp.calculateGas(32n, 32n, 32n, 256n);
console.log("\n32-byte (256-bit) operation:");
console.log(`  Gas: ${smallGas}`);

// Medium numbers
const medGas = ModExp.calculateGas(64n, 64n, 64n, 0xffffffffffffffffn);
console.log("\n64-byte (512-bit) operation:");
console.log(`  Gas: ${medGas}`);

// Large numbers
const largeGas = ModExp.calculateGas(
	256n,
	256n,
	256n,
	0xffffffffffffffffffffffffffffffffn,
);
console.log("\n256-byte (2048-bit) operation:");
console.log(`  Gas: ${largeGas}`);

// === Impact of Operand Sizes ===
console.log("\n--- Operand Size Impact ---");

console.log("Varying base length (mod=32, exp=32):");
for (const baseLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	const gas = ModExp.calculateGas(baseLen, 32n, 32n, 256n);
	console.log(`  base=${baseLen} bytes: ${gas} gas`);
}

console.log("\nVarying modulus length (base=32, exp=32):");
for (const modLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	const gas = ModExp.calculateGas(32n, 32n, modLen, 256n);
	console.log(`  mod=${modLen} bytes: ${gas} gas`);
}

console.log("\nVarying exponent length (base=32, mod=32):");
for (const expLen of [1n, 8n, 16n, 32n, 64n, 128n]) {
	// expHead is the first 32 bytes of exponent
	const gas = ModExp.calculateGas(32n, expLen, 32n, 256n);
	console.log(`  exp=${expLen} bytes: ${gas} gas`);
}

// === Multiplication Complexity Formula ===
console.log("\n--- Multiplication Complexity ---");
console.log("Formula based on max(base_len, mod_len):");
console.log("  x <= 64:      x^2");
console.log("  64 < x <= 1024: x^2/4 + 96*x - 3072");
console.log("  x > 1024:     x^2/16 + 480*x - 199680");

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

console.log("\nComplexity values:");
for (const x of [32n, 64n, 128n, 256n, 512n, 1024n, 2048n]) {
	console.log(`  x=${x}: complexity=${showComplexity(x)}`);
}

// === Iteration Count (Exponent Impact) ===
console.log("\n--- Iteration Count ---");
console.log("Based on exponent length and leading bits.");

// Small exponent (<= 32 bytes): use bit length
console.log("\nSmall exponent examples:");
for (const expHead of [0n, 1n, 255n, 256n, 65535n, 65536n, 0xffffffffn]) {
	const gas = ModExp.calculateGas(32n, 32n, 32n, expHead);
	const bits = expHead === 0n ? 0 : expHead.toString(2).length;
	console.log(`  expHead=${expHead} (${bits} bits): ${gas} gas`);
}

// Large exponent (> 32 bytes): 8*(exp_len-32) + bit_length(head)
console.log("\nLarge exponent examples:");
for (const expLen of [33n, 64n, 128n, 256n]) {
	const gas = ModExp.calculateGas(32n, expLen, 32n, 0xffffffffn);
	console.log(`  exp_len=${expLen}: ${gas} gas`);
}

// === Real-World Gas Estimates ===
console.log("\n--- Real-World Use Cases ---");

// RSA-2048 verification
const rsa2048Gas = ModExp.calculateGas(256n, 3n, 256n, 65537n);
console.log("RSA-2048 verification (e=65537):");
console.log(`  base=256, exp=3, mod=256 bytes`);
console.log(`  Gas: ${rsa2048Gas}`);

// RSA-2048 decryption (private key is 256 bytes)
const rsa2048DecryptGas = ModExp.calculateGas(
	256n,
	256n,
	256n,
	0xffffffffffffffffffffffffffffffffn,
);
console.log("\nRSA-2048 decryption (256-byte private key):");
console.log(`  Gas: ${rsa2048DecryptGas}`);

// RSA-4096 verification
const rsa4096Gas = ModExp.calculateGas(512n, 3n, 512n, 65537n);
console.log("\nRSA-4096 verification:");
console.log(`  Gas: ${rsa4096Gas}`);

// BLS signature verification (modexp in pairing)
const bls12Gas = ModExp.calculateGas(48n, 32n, 48n, 0xffffffffn);
console.log("\nBLS12-381 field operation (384-bit):");
console.log(`  Gas: ${bls12Gas}`);

// === Gas Cost Comparison Table ===
console.log("\n--- Gas Cost Table ---");
console.log("Operation                      | Gas");
console.log("-------------------------------|--------");

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
	console.log(`${op.name.padEnd(30)} | ${gas.toString().padStart(6)}`);
}

// === Gas vs ETH Cost ===
console.log("\n--- Gas Cost in ETH ---");
console.log("At 30 gwei gas price:");

const gasPrice = 30n; // gwei
const gweiToEth = 1_000_000_000n;

for (const op of operations) {
	const gas = ModExp.calculateGas(op.baseLen, op.expLen, op.modLen, op.expHead);
	const costGwei = gas * gasPrice;
	const costEth = Number(costGwei) / Number(gweiToEth);
	console.log(`  ${op.name}: ${costEth.toFixed(6)} ETH`);
}
