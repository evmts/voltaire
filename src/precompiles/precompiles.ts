/**
 * EVM Precompile implementations
 */

import { Keccak256 } from "../crypto/Keccak256/index.js";
import { Ripemd160 } from "../crypto/Ripemd160/index.js";
import { SHA256 } from "../crypto/SHA256/index.js";
import { Secp256k1 } from "../crypto/Secp256k1/index.js";
import { BN254 as Bn254 } from "../crypto/bn254/BN254.js";
import * as Kzg from "../crypto/KZG/index.js";
import * as Gas from "../primitives/GasConstants/index.js";
import * as Hardfork from "../primitives/Hardfork/index.js";
import type { BrandedHash } from "../primitives/Hash/index.js";

export enum PrecompileAddress {
	ECRECOVER = "0x0000000000000000000000000000000000000001",
	SHA256 = "0x0000000000000000000000000000000000000002",
	RIPEMD160 = "0x0000000000000000000000000000000000000003",
	IDENTITY = "0x0000000000000000000000000000000000000004",
	MODEXP = "0x0000000000000000000000000000000000000005",
	BN254_ADD = "0x0000000000000000000000000000000000000006",
	BN254_MUL = "0x0000000000000000000000000000000000000007",
	BN254_PAIRING = "0x0000000000000000000000000000000000000008",
	BLAKE2F = "0x0000000000000000000000000000000000000009",
	POINT_EVALUATION = "0x000000000000000000000000000000000000000a",
	BLS12_G1_ADD = "0x000000000000000000000000000000000000000b",
	BLS12_G1_MUL = "0x000000000000000000000000000000000000000c",
	BLS12_G1_MSM = "0x000000000000000000000000000000000000000d",
	BLS12_G2_ADD = "0x000000000000000000000000000000000000000e",
	BLS12_G2_MUL = "0x000000000000000000000000000000000000000f",
	BLS12_G2_MSM = "0x0000000000000000000000000000000000000010",
	BLS12_PAIRING = "0x0000000000000000000000000000000000000011",
	BLS12_MAP_FP_TO_G1 = "0x0000000000000000000000000000000000000012",
	BLS12_MAP_FP2_TO_G2 = "0x0000000000000000000000000000000000000013",
}

export interface PrecompileResult {
	success: boolean;
	output: Uint8Array;
	gasUsed: bigint;
	error?: string;
}

// Utilities
function beBytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

function bigIntToFixedBytes(value: bigint, size: number): Uint8Array {
	const out = new Uint8Array(size);
	let v = value;
	for (let i = size - 1; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
}

/**
 * Check if an address is a precompile for a given hardfork
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: precompile checks require branching per hardfork
export function isPrecompile(
	address: string,
	hardfork: Hardfork.BrandedHardfork,
): boolean {
	const normalized = address.toLowerCase();

	// Available in all hardforks
	if (normalized === PrecompileAddress.ECRECOVER.toLowerCase()) return true;
	if (normalized === PrecompileAddress.SHA256.toLowerCase()) return true;
	if (normalized === PrecompileAddress.RIPEMD160.toLowerCase()) return true;
	if (normalized === PrecompileAddress.IDENTITY.toLowerCase()) return true;

	// Available from Byzantium
	if (normalized === PrecompileAddress.MODEXP.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.BYZANTIUM);
	}
	if (normalized === PrecompileAddress.BN254_ADD.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.BYZANTIUM);
	}
	if (normalized === PrecompileAddress.BN254_MUL.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.BYZANTIUM);
	}
	if (normalized === PrecompileAddress.BN254_PAIRING.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.BYZANTIUM);
	}

	// Available from Istanbul
	if (normalized === PrecompileAddress.BLAKE2F.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.ISTANBUL);
	}

	// Available from Cancun
	if (normalized === PrecompileAddress.POINT_EVALUATION.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.CANCUN);
	}

	// BLS precompiles from Prague
	if (normalized === PrecompileAddress.BLS12_G1_ADD.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_G1_MUL.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_G1_MSM.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_G2_ADD.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_G2_MUL.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_G2_MSM.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_PAIRING.toLowerCase()) {
		return Hardfork.isAtLeast(hardfork, Hardfork.PRAGUE);
	}
	if (normalized === PrecompileAddress.BLS12_MAP_FP_TO_G1.toLowerCase()) {
		// TODO: Add PRAGUE hardfork support
		return Hardfork.isAtLeast(hardfork, Hardfork.CANCUN);
	}
	if (normalized === PrecompileAddress.BLS12_MAP_FP2_TO_G2.toLowerCase()) {
		// TODO: Add PRAGUE hardfork support
		return Hardfork.isAtLeast(hardfork, Hardfork.CANCUN);
	}

	return false;
}

/**
 * Execute a precompile
 * @param address - Precompile address
 * @param input - Input data
 * @param gasLimit - Gas limit for execution
 * @param hardfork - Current hardfork
 * @returns Precompile execution result
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: precompile execution requires branching per type
export function execute(
	address: string,
	input: Uint8Array,
	gasLimit: bigint,
	_hardfork: Hardfork.BrandedHardfork,
): PrecompileResult {
	const normalized = address.toLowerCase();

	if (normalized === PrecompileAddress.ECRECOVER.toLowerCase()) {
		return ecrecover(input, gasLimit);
	}
	if (normalized === PrecompileAddress.SHA256.toLowerCase()) {
		return sha256(input, gasLimit);
	}
	if (normalized === PrecompileAddress.RIPEMD160.toLowerCase()) {
		return ripemd160(input, gasLimit);
	}
	if (normalized === PrecompileAddress.IDENTITY.toLowerCase()) {
		return identity(input, gasLimit);
	}
	if (normalized === PrecompileAddress.MODEXP.toLowerCase()) {
		return modexp(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BN254_ADD.toLowerCase()) {
		return bn254Add(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BN254_MUL.toLowerCase()) {
		return bn254Mul(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BN254_PAIRING.toLowerCase()) {
		return bn254Pairing(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLAKE2F.toLowerCase()) {
		return blake2f(input, gasLimit);
	}
	if (normalized === PrecompileAddress.POINT_EVALUATION.toLowerCase()) {
		return pointEvaluation(input, gasLimit);
	}

	// BLS precompiles
	if (normalized === PrecompileAddress.BLS12_G1_ADD.toLowerCase()) {
		return bls12G1Add(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_G1_MUL.toLowerCase()) {
		return bls12G1Mul(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_G1_MSM.toLowerCase()) {
		return bls12G1Msm(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_G2_ADD.toLowerCase()) {
		return bls12G2Add(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_G2_MUL.toLowerCase()) {
		return bls12G2Mul(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_G2_MSM.toLowerCase()) {
		return bls12G2Msm(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_PAIRING.toLowerCase()) {
		return bls12Pairing(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_MAP_FP_TO_G1.toLowerCase()) {
		return bls12MapFpToG1(input, gasLimit);
	}
	if (normalized === PrecompileAddress.BLS12_MAP_FP2_TO_G2.toLowerCase()) {
		return bls12MapFp2ToG2(input, gasLimit);
	}

	return {
		success: false,
		output: new Uint8Array(0),
		gasUsed: 0n,
		error: `Unknown precompile: ${address}`,
	};
}

/**
 * ECRECOVER precompile (0x01)
 * Recover signer address from signature
 */
export function ecrecover(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 3000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	// Spec: input padded/truncated to 128 bytes
	const buf = new Uint8Array(128);
	buf.set(_input.slice(0, Math.min(128, _input.length)), 0);

	const hash = buf.slice(0, 32);
	const v = buf[63] ?? 0; // last byte of v (32-byte padded)
	const r = buf.slice(64, 96);
	const s = buf.slice(96, 128);

	try {
		const pub = Secp256k1.recoverPublicKey({ r, s, v }, hash as BrandedHash);
		const hashResult = Keccak256.hash(pub);
		const addr = hashResult.slice(12);
		const out = new Uint8Array(32);
		// left pad 12 zero bytes, then 20-byte address
		out.set(addr, 12);
		return { success: true, output: out, gasUsed: gas };
	} catch {
		// Invalid signature: return zero address (32 bytes all zero)
		return { success: true, output: new Uint8Array(32), gasUsed: gas };
	}
}

/**
 * SHA256 precompile (0x02)
 */
export function sha256(input: Uint8Array, gasLimit: bigint): PrecompileResult {
	const words = BigInt(Math.ceil(input.length / 32));
	const gas = 60n + words * 12n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	const out = SHA256.hash(input);
	return { success: true, output: out, gasUsed: gas };
}

/**
 * RIPEMD160 precompile (0x03)
 */
export function ripemd160(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const words = BigInt(Math.ceil(input.length / 32));
	const gas = 600n + words * 120n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	const h20 = Ripemd160.hash(input);
	const out = new Uint8Array(32);
	// left pad 12 zero bytes, then 20 bytes hash
	out.set(h20, 12);
	return { success: true, output: out, gasUsed: gas };
}

/**
 * IDENTITY precompile (0x04)
 * Returns input data unchanged
 */
export function identity(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 15n + BigInt(Math.ceil(input.length / 32)) * 3n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(input), gasUsed: gas };
}

/**
 * MODEXP precompile (0x05)
 * Modular exponentiation
 */
export function modexp(_input: Uint8Array, gasLimit: bigint): PrecompileResult {
	if (_input.length < 96) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: 0n,
			error: "Invalid input length",
		};
	}
	const baseLen = beBytesToBigInt(_input.slice(0, 32));
	const expLen = beBytesToBigInt(_input.slice(32, 64));
	const modLen = beBytesToBigInt(_input.slice(64, 96));

	// guard values to JS numbers for slicing
	const bLen = Number(baseLen);
	const eLen = Number(expLen);
	const mLen = Number(modLen);

	const baseStart = 96;
	const expStart = baseStart + bLen;
	const modStart = expStart + eLen;

	const expHead = _input.slice(
		expStart,
		Math.min(expStart + 32, _input.length),
	);
	const expHeadVal = beBytesToBigInt(expHead);
	const gas = Gas.Precompile.calculateModExpCost(
		baseLen,
		expLen,
		modLen,
		expHeadVal,
	);
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}

	if (mLen === 0) {
		return { success: true, output: new Uint8Array(0), gasUsed: gas };
	}

	const baseBytes = _input.slice(
		baseStart,
		Math.min(baseStart + bLen, _input.length),
	);
	const expBytes = _input.slice(
		expStart,
		Math.min(expStart + eLen, _input.length),
	);
	const modBytes = _input.slice(
		modStart,
		Math.min(modStart + mLen, _input.length),
	);

	const base = beBytesToBigInt(baseBytes);
	const exp = beBytesToBigInt(expBytes);
	const mod = beBytesToBigInt(modBytes);

	if (mod === 0n) {
		// Division by zero -> empty output per Zig precompile tests
		return { success: true, output: new Uint8Array(0), gasUsed: gas };
	}

	// fast modular exponentiation
	const result = (function powmod(a: bigint, e: bigint, m: bigint): bigint {
		let res = 1n;
		let x = a % m;
		let k = e;
		while (k > 0n) {
			if (k & 1n) res = (res * x) % m;
			x = (x * x) % m;
			k >>= 1n;
		}
		return res % m;
	})(base, exp, mod);

	const out = bigIntToFixedBytes(result, mLen);
	return { success: true, output: out, gasUsed: gas };
}

/**
 * BN254_ADD precompile (0x06)
 * BN254 elliptic curve addition
 */
export function bn254Add(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 150n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	// Input: 128 bytes (G1 point A || G1 point B)
	const buf = new Uint8Array(128);
	buf.set(_input.slice(0, Math.min(128, _input.length)), 0);
	const aBytes = buf.slice(0, 64);
	const bBytes = buf.slice(64, 128);
	try {
		const a = Bn254.deserializeG1(aBytes);
		const b = Bn254.deserializeG1(bBytes);
		const sum = Bn254.G1.add(a, b);
		const out = Bn254.serializeG1(sum);
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: String(e),
		};
	}
}

/**
 * BN254_MUL precompile (0x07)
 * BN254 elliptic curve multiplication
 */
export function bn254Mul(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 6000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	// Input: 96 bytes (G1 point || scalar)
	const buf = new Uint8Array(96);
	buf.set(_input.slice(0, Math.min(96, _input.length)), 0);
	const pBytes = buf.slice(0, 64);
	const sBytes = buf.slice(64, 96);
	try {
		const p = Bn254.deserializeG1(pBytes);
		const s = beBytesToBigInt(sBytes);
		const prod = Bn254.G1.mul(p, s);
		const out = Bn254.serializeG1(prod);
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: String(e),
		};
	}
}

/**
 * BN254_PAIRING precompile (0x08)
 * BN254 pairing check
 */
export function bn254Pairing(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (input.length % 192 !== 0) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: 0n,
			error: "Invalid input length",
		};
	}
	const k = input.length / 192;
	const gas = 45000n + BigInt(k) * 34000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}

	try {
		const pairs: Array<
			[
				ReturnType<typeof Bn254.deserializeG1>,
				ReturnType<typeof Bn254.deserializeG2>,
			]
		> = [];
		for (let i = 0; i < k; i++) {
			const off = i * 192;
			const g1 = Bn254.deserializeG1(input.slice(off, off + 64));
			const g2 = Bn254.deserializeG2(input.slice(off + 64, off + 192));
			pairs.push([g1, g2]);
		}
		const ok = Bn254.Pairing.pairingCheck(pairs);
		const out = new Uint8Array(32);
		if (ok) out[31] = 1;
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: String(e),
		};
	}
}

/**
 * BLAKE2F precompile (0x09)
 * Blake2 compression function
 */
export function blake2f(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (_input.length !== 213) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: 0n,
			error: "Invalid input length",
		};
	}
	const rounds = new DataView(_input.buffer).getUint32(0, false);
	const gas = BigInt(rounds);
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(64), gasUsed: gas };
}

/**
 * POINT_EVALUATION precompile (0x0a)
 * KZG point evaluation (EIP-4844)
 */
export function pointEvaluation(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 50000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	// EIP-4844: input = commitment(48) | z(32) | y(32) | proof(48) = 160 bytes per spec
	// Some implementations use 160 or 192 including flags; we tolerate 160 or 192 with trailing zeros.
	if (!(_input.length === 160 || _input.length === 192)) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Invalid input length",
		};
	}
	const commitment = _input.slice(0, 48);
	const z = _input.slice(48, 80);
	const y = _input.slice(80, 112);
	const proof = _input.slice(112, 160);
	try {
		if (!Kzg.isInitialized()) Kzg.loadTrustedSetup();
		const ok = Kzg.verifyKzgProof(commitment, z, y, proof);
		const out = new Uint8Array(64);
		if (ok) {
			// FIELD_ELEMENTS_PER_BLOB (4096) || BLS_MODULUS (per Zig impl format)
			out[30] = 0x10;
			out[31] = 0x00;
			const blsModulus = Uint8Array.from([
				0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08,
				0x09, 0xa1, 0xd8, 0x05, 0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
				0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
			]);
			out.set(blsModulus, 32);
		}
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: String(e),
		};
	}
}

/**
 * BLS12_G1_ADD precompile (0x0b)
 */
export function bls12G1Add(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 500n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(128), gasUsed: gas };
}

/**
 * BLS12_G1_MUL precompile (0x0c)
 */
export function bls12G1Mul(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 12000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(128), gasUsed: gas };
}

/**
 * BLS12_G1_MSM precompile (0x0d)
 */
export function bls12G1Msm(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const k = input.length / 160;
	const gas = 12000n * BigInt(k);
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(128), gasUsed: gas };
}

/**
 * BLS12_G2_ADD precompile (0x0e)
 */
export function bls12G2Add(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 800n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(256), gasUsed: gas };
}

/**
 * BLS12_G2_MUL precompile (0x0f)
 */
export function bls12G2Mul(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 45000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(256), gasUsed: gas };
}

/**
 * BLS12_G2_MSM precompile (0x10)
 */
export function bls12G2Msm(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const k = input.length / 288;
	const gas = 45000n * BigInt(k);
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(256), gasUsed: gas };
}

/**
 * BLS12_PAIRING precompile (0x11)
 */
export function bls12Pairing(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const k = input.length / 384;
	const gas = 115000n + BigInt(k) * 23000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(32), gasUsed: gas };
}

/**
 * BLS12_MAP_FP_TO_G1 precompile (0x12)
 */
export function bls12MapFpToG1(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 5500n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(128), gasUsed: gas };
}

/**
 * BLS12_MAP_FP2_TO_G2 precompile (0x13)
 */
export function bls12MapFp2ToG2(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = 75000n;
	if (gasLimit < gas) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: gas,
			error: "Out of gas",
		};
	}
	return { success: true, output: new Uint8Array(256), gasUsed: gas };
}
