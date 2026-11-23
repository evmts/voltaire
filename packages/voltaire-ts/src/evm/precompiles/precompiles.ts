/**
 * EVM Precompile implementations
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { compress as blake2fCompress } from "../../crypto/Blake2/index.js";
import { BN254 as Bn254 } from "../../crypto/bn254/BN254.js";
import { Keccak256 } from "../../crypto/Keccak256/index.js";
import * as Kzg from "../../crypto/KZG/index.js";
import { Ripemd160 } from "../../crypto/Ripemd160/index.js";
import { CURVE_ORDER as SECP256K1_ORDER } from "../../crypto/Secp256k1/constants.js";
import { Secp256k1 } from "../../crypto/Secp256k1/index.js";
import { SHA256 } from "../../crypto/SHA256/index.js";
import * as Gas from "../../primitives/GasConstants/index.js";
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import type { HashType } from "../../primitives/Hash/index.js";
import { p256Verify } from "./p256verify.js";

export {
	P256VERIFY_ADDRESS,
	P256VERIFY_GAS,
	P256VERIFY_INPUT_LENGTH,
	p256Verify,
	p256verify,
	verifyP256,
} from "./p256verify.js";

/**
 * Precompile addresses. BLS12-381 entries follow the final EIP-2537 layout:
 * seven operations at `0x0b..0x11`.
 */
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
	BLS12_G1_MSM = "0x000000000000000000000000000000000000000c",
	BLS12_G2_ADD = "0x000000000000000000000000000000000000000d",
	BLS12_G2_MSM = "0x000000000000000000000000000000000000000e",
	BLS12_PAIRING = "0x000000000000000000000000000000000000000f",
	BLS12_MAP_FP_TO_G1 = "0x0000000000000000000000000000000000000010",
	BLS12_MAP_FP2_TO_G2 = "0x0000000000000000000000000000000000000011",
	P256_VERIFY = "0x0000000000000000000000000000000000000100",
}

export interface PrecompileResult {
	success: boolean;
	output: Uint8Array;
	gasUsed: bigint;
	error?: string;
}

/**
 * Build the result for an out-of-gas or exceptional halt.
 * A halting precompile consumes all forwarded gas and returns no output, so
 * `gasUsed` equals `gasLimit` and can never exceed it.
 */
function exceptionalHalt(gasLimit: bigint, error: string): PrecompileResult {
	return {
		success: false,
		output: new Uint8Array(0),
		gasUsed: gasLimit,
		error,
	};
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

// BLS12-381 Helper Functions

type Bls12G1Point = ReturnType<typeof bls12_381.G1.Point.fromAffine>;
type Bls12G2Point = ReturnType<typeof bls12_381.G2.Point.fromAffine>;

const BLS12_FP = bls12_381.fields.Fp;
const BLS12_FP2 = bls12_381.fields.Fp2;
const BLS12_FR_ORDER = bls12_381.fields.Fr.ORDER;
/** G1 curve constant: y^2 = x^3 + 4 */
const BLS12_G1_B = 4n;
/** G2 curve constant: y^2 = x^3 + 4(1 + u) */
const BLS12_G2_B = BLS12_FP2.create({ c0: 4n, c1: 4n });

/**
 * Decode a 64-byte EIP-2537 base field element.
 * The top 16 bytes must be zero and the value must be below the field modulus.
 * @throws {Error} If the encoding is not canonical
 */
function decodeBls12Fp(bytes: Uint8Array): bigint {
	if (bytes.length !== 64) {
		throw new Error("invalid field element length");
	}
	for (let i = 0; i < 16; i++) {
		if (bytes[i] !== 0) throw new Error("invalid field element top bytes");
	}
	const value = beBytesToBigInt(bytes.subarray(16, 64));
	if (value >= BLS12_FP.ORDER) {
		throw new Error("invalid fp.Element encoding");
	}
	return value;
}

/**
 * Deserialize a G1 point from 128 bytes (EIP-2537 encoding)
 * Format: [x (64 bytes) | y (64 bytes)]
 * Point at infinity: all zeros
 *
 * Both coordinates must be canonical field elements and the point must be on
 * the curve. The subgroup check is required for MSM and pairing inputs and
 * skipped for G1ADD.
 * @throws {Error} If the encoding or the point is invalid
 */
function deserializeG1(
	bytes: Uint8Array,
	subgroupCheck: boolean,
): Bls12G1Point {
	if (bytes.length !== 128) {
		throw new Error("Invalid G1 point length");
	}
	const x = decodeBls12Fp(bytes.subarray(0, 64));
	const y = decodeBls12Fp(bytes.subarray(64, 128));
	if (x === 0n && y === 0n) {
		return bls12_381.G1.Point.ZERO;
	}
	const rhs = BLS12_FP.add(BLS12_FP.mul(BLS12_FP.sqr(x), x), BLS12_G1_B);
	if (!BLS12_FP.eql(BLS12_FP.sqr(y), rhs)) {
		throw new Error("invalid point: not on curve");
	}
	const point = bls12_381.G1.Point.fromAffine({ x, y });
	if (subgroupCheck && !point.isTorsionFree()) {
		throw new Error("g1 point is not in the correct subgroup");
	}
	return point;
}

/**
 * Serialize a G1 point to 128 bytes (EIP-2537 encoding)
 */
function serializeG1(point: Bls12G1Point): Uint8Array {
	const result = new Uint8Array(128);

	// Handle point at infinity
	if (point.equals(bls12_381.G1.Point.ZERO)) {
		return result; // All zeros
	}

	// Convert to affine coordinates
	const affine = point.toAffine();

	// Serialize x and y (64 bytes each, big-endian, left-padded)
	result.set(bigIntToFixedBytes(affine.x, 64), 0);
	result.set(bigIntToFixedBytes(affine.y, 64), 64);

	return result;
}

/**
 * Deserialize a G2 point from 256 bytes (EIP-2537 encoding)
 * Format: [x.c0 (64) | x.c1 (64) | y.c0 (64) | y.c1 (64)]
 * Point at infinity: all zeros
 *
 * Every coordinate must be a canonical field element and the point must be on
 * the curve. The subgroup check is required for MSM and pairing inputs and
 * skipped for G2ADD.
 * @throws {Error} If the encoding or the point is invalid
 */
function deserializeG2(
	bytes: Uint8Array,
	subgroupCheck: boolean,
): Bls12G2Point {
	if (bytes.length !== 256) {
		throw new Error("Invalid G2 point length");
	}
	// Range-check all four coordinates before building any Fp2 element:
	// Fp2.create reduces modulo p and would accept non-canonical encodings.
	const xc0 = decodeBls12Fp(bytes.subarray(0, 64));
	const xc1 = decodeBls12Fp(bytes.subarray(64, 128));
	const yc0 = decodeBls12Fp(bytes.subarray(128, 192));
	const yc1 = decodeBls12Fp(bytes.subarray(192, 256));
	if (xc0 === 0n && xc1 === 0n && yc0 === 0n && yc1 === 0n) {
		return bls12_381.G2.Point.ZERO;
	}
	const x = BLS12_FP2.create({ c0: xc0, c1: xc1 });
	const y = BLS12_FP2.create({ c0: yc0, c1: yc1 });
	const rhs = BLS12_FP2.add(BLS12_FP2.mul(BLS12_FP2.sqr(x), x), BLS12_G2_B);
	if (!BLS12_FP2.eql(BLS12_FP2.sqr(y), rhs)) {
		throw new Error("invalid point: not on curve");
	}
	const point = bls12_381.G2.Point.fromAffine({ x, y });
	if (subgroupCheck && !point.isTorsionFree()) {
		throw new Error("g2 point is not in the correct subgroup");
	}
	return point;
}

/**
 * Serialize a G2 point to 256 bytes (EIP-2537 encoding)
 */
function serializeG2(point: Bls12G2Point): Uint8Array {
	const result = new Uint8Array(256);

	// Handle point at infinity
	if (point.equals(bls12_381.G2.Point.ZERO)) {
		return result; // All zeros
	}

	// Convert to affine coordinates
	const affine = point.toAffine();

	// Extract Fp2 components (c0, c1)
	const x = affine.x as { c0: bigint; c1: bigint };
	const y = affine.y as { c0: bigint; c1: bigint };

	// Serialize each component (64 bytes, big-endian, left-padded)
	result.set(bigIntToFixedBytes(x.c0, 64), 0);
	result.set(bigIntToFixedBytes(x.c1, 64), 64);
	result.set(bigIntToFixedBytes(y.c0, 64), 128);
	result.set(bigIntToFixedBytes(y.c1, 64), 192);

	return result;
}

/**
 * Field-to-curve maps (EIP-2537): simplified SWU map, isogeny, then one
 * cofactor clearing. No hashing is involved.
 *
 * The noble typings describe the raw SWU callback. The hasher method that
 * exists at run time takes one field element (a bigint for Fp, `[c0, c1]` for
 * Fp2) and returns the cofactor-cleared point; the EIP-2537 vectors in the
 * test suite pin that behavior.
 */
const mapFpToG1 = bls12_381.G1.mapToCurve as unknown as (
	u: bigint,
) => Bls12G1Point;
const mapFp2ToG2 = bls12_381.G2.mapToCurve as unknown as (
	u: [bigint, bigint],
) => Bls12G2Point;

/** Fork that activates each precompile address. */
const PRECOMPILE_ACTIVATION: ReadonlyMap<string, HardforkType> = new Map([
	[PrecompileAddress.ECRECOVER, Hardfork.FRONTIER],
	[PrecompileAddress.SHA256, Hardfork.FRONTIER],
	[PrecompileAddress.RIPEMD160, Hardfork.FRONTIER],
	[PrecompileAddress.IDENTITY, Hardfork.FRONTIER],
	[PrecompileAddress.MODEXP, Hardfork.BYZANTIUM],
	[PrecompileAddress.BN254_ADD, Hardfork.BYZANTIUM],
	[PrecompileAddress.BN254_MUL, Hardfork.BYZANTIUM],
	[PrecompileAddress.BN254_PAIRING, Hardfork.BYZANTIUM],
	[PrecompileAddress.BLAKE2F, Hardfork.ISTANBUL],
	[PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN],
	[PrecompileAddress.BLS12_G1_ADD, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_G1_MSM, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_G2_ADD, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_G2_MSM, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_PAIRING, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_MAP_FP_TO_G1, Hardfork.PRAGUE],
	[PrecompileAddress.BLS12_MAP_FP2_TO_G2, Hardfork.PRAGUE],
	[PrecompileAddress.P256_VERIFY, Hardfork.OSAKA],
]);

/**
 * Check if an address is a precompile for a given hardfork
 */
export function isPrecompile(address: string, hardfork: HardforkType): boolean {
	const activation = PRECOMPILE_ACTIVATION.get(address.toLowerCase());
	return activation !== undefined && Hardfork.isAtLeast(hardfork, activation);
}

/**
 * Execute a precompile
 *
 * The address must be an active precompile for `hardfork`. An address that is
 * not (unknown, or not yet activated) is an ordinary account: nothing runs,
 * and the result is `success: false` with `gasUsed: 0n`.
 *
 * @param address - Precompile address
 * @param input - Input data
 * @param gasLimit - Gas limit for execution
 * @param hardfork - Current hardfork
 * @returns Precompile execution result
 */
export function execute(
	address: string,
	input: Uint8Array,
	gasLimit: bigint,
	hardfork: HardforkType,
): PrecompileResult {
	if (!isPrecompile(address, hardfork)) {
		return {
			success: false,
			output: new Uint8Array(0),
			gasUsed: 0n,
			error: `Unknown precompile: ${address}`,
		};
	}

	switch (address.toLowerCase()) {
		case PrecompileAddress.ECRECOVER:
			return ecrecover(input, gasLimit);
		case PrecompileAddress.SHA256:
			return sha256(input, gasLimit);
		case PrecompileAddress.RIPEMD160:
			return ripemd160(input, gasLimit);
		case PrecompileAddress.IDENTITY:
			return identity(input, gasLimit);
		case PrecompileAddress.MODEXP:
			return modexp(input, gasLimit, hardfork);
		case PrecompileAddress.BN254_ADD:
			return bn254Add(input, gasLimit, hardfork);
		case PrecompileAddress.BN254_MUL:
			return bn254Mul(input, gasLimit, hardfork);
		case PrecompileAddress.BN254_PAIRING:
			return bn254Pairing(input, gasLimit, hardfork);
		case PrecompileAddress.BLAKE2F:
			return blake2f(input, gasLimit);
		case PrecompileAddress.POINT_EVALUATION:
			return pointEvaluation(input, gasLimit);
		case PrecompileAddress.BLS12_G1_ADD:
			return bls12G1Add(input, gasLimit);
		case PrecompileAddress.BLS12_G1_MSM:
			return bls12G1Msm(input, gasLimit);
		case PrecompileAddress.BLS12_G2_ADD:
			return bls12G2Add(input, gasLimit);
		case PrecompileAddress.BLS12_G2_MSM:
			return bls12G2Msm(input, gasLimit);
		case PrecompileAddress.BLS12_PAIRING:
			return bls12Pairing(input, gasLimit);
		case PrecompileAddress.BLS12_MAP_FP_TO_G1:
			return bls12MapFpToG1(input, gasLimit);
		case PrecompileAddress.BLS12_MAP_FP2_TO_G2:
			return bls12MapFp2ToG2(input, gasLimit);
		case PrecompileAddress.P256_VERIFY:
			return p256Verify(input, gasLimit);
		default:
			return exceptionalHalt(gasLimit, `Unhandled precompile: ${address}`);
	}
}

/**
 * ECRECOVER precompile (0x01)
 * Recover signer address from signature
 *
 * Input (right-padded or truncated to 128 bytes): `hash(32) || v(32) || r(32) || s(32)`.
 * `v` is a full 32-byte word: bytes 32..62 must be zero and byte 63 must be
 * 27 or 28. `r` and `s` must be in `[1, n - 1]`; high `s` is accepted.
 * Any invalid input or failed recovery succeeds with empty output and costs
 * 3000 gas. A successful recovery returns the address left-padded to 32 bytes.
 */
export function ecrecover(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.EcRecover;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	const noAddress = (): PrecompileResult => ({
		success: true,
		output: new Uint8Array(0),
		gasUsed: gas,
	});
	// Spec: input padded/truncated to 128 bytes
	const buf = new Uint8Array(128);
	buf.set(_input.subarray(0, Math.min(128, _input.length)), 0);

	const hash = buf.slice(0, 32);
	const r = buf.slice(64, 96);
	const s = buf.slice(96, 128);

	// v is a 32-byte big-endian word that must equal 27 or 28 exactly.
	for (let i = 32; i < 63; i++) {
		if (buf[i] !== 0) return noAddress();
	}
	const v = buf[63];
	if (v !== 27 && v !== 28) return noAddress();

	const rValue = beBytesToBigInt(r);
	const sValue = beBytesToBigInt(s);
	if (
		rValue === 0n ||
		rValue >= SECP256K1_ORDER ||
		sValue === 0n ||
		sValue >= SECP256K1_ORDER
	) {
		return noAddress();
	}

	try {
		const pub = Secp256k1.recoverPublicKey({ r, s, v }, hash as HashType);
		const hashResult = Keccak256.hash(pub);
		const addr = hashResult.slice(12);
		const out = new Uint8Array(32);
		// left pad 12 zero bytes, then 20-byte address
		out.set(addr, 12);
		return { success: true, output: out, gasUsed: gas };
	} catch {
		// No public key recovers from this signature.
		return noAddress();
	}
}

/**
 * SHA256 precompile (0x02)
 */
export function sha256(input: Uint8Array, gasLimit: bigint): PrecompileResult {
	const gas = Gas.Precompile.calculateSha256Cost(BigInt(input.length));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
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
	const gas = Gas.Precompile.calculateRipemd160Cost(BigInt(input.length));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
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
	const gas = Gas.Precompile.calculateIdentityCost(BigInt(input.length));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	return { success: true, output: new Uint8Array(input), gasUsed: gas };
}

/** Read a big-endian segment, treating missing bytes on its right as zero. */
function readPaddedBigInt(
	input: Uint8Array,
	start: bigint,
	length: bigint,
): bigint {
	const inputLength = BigInt(input.length);
	if (length === 0n || start >= inputLength) return 0n;
	const available = inputLength - start;
	const count = length < available ? length : available;
	const value = beBytesToBigInt(
		input.subarray(Number(start), Number(start + count)),
	);
	return value << (8n * (length - count));
}

/**
 * MODEXP precompile (0x05)
 * Right-pads missing input bytes and returns a modulus-sized result.
 * Osaka rejects declared operands above 1,024 bytes before empty-output
 * shortcuts and uses EIP-7883 gas. Exceptional failures consume all supplied gas.
 * @param _input - EIP-198 length header followed by operand bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to Berlin pricing
 * @returns Execution status, owned output bytes and consumed gas
 */
export function modexp(
	_input: Uint8Array,
	gasLimit: bigint,
	hardfork: HardforkType = Hardfork.BERLIN,
): PrecompileResult {
	const failure = (error: string): PrecompileResult =>
		exceptionalHalt(gasLimit, error);
	const baseLen = readPaddedBigInt(_input, 0n, 32n);
	const expLen = readPaddedBigInt(_input, 32n, 32n);
	const modLen = readPaddedBigInt(_input, 64n, 32n);
	if (
		Hardfork.isAtLeast(hardfork, Hardfork.OSAKA) &&
		(baseLen > 1024n || expLen > 1024n || modLen > 1024n)
	) {
		return failure("ModExp operand length exceeds Osaka limit (1024 bytes)");
	}
	const expStart = 96n + baseLen;
	const modStart = expStart + expLen;
	const expHead = readPaddedBigInt(
		_input,
		expStart,
		expLen < 32n ? expLen : 32n,
	);
	const gas = Gas.Precompile.calculateModExpCost(
		baseLen,
		expLen,
		modLen,
		expHead,
		hardfork,
	);
	if (gasLimit < gas) return failure("Out of gas");
	if (modLen === 0n)
		return { success: true, output: new Uint8Array(), gasUsed: gas };
	// Gas and protocol bounds are checked while lengths are still exact BigInts.
	if (
		baseLen > BigInt(Number.MAX_SAFE_INTEGER) ||
		expLen > BigInt(Number.MAX_SAFE_INTEGER) ||
		modLen > BigInt(Number.MAX_SAFE_INTEGER)
	) {
		return failure("ModExp operand length cannot be represented");
	}
	const mLen = Number(modLen);
	const mod = readPaddedBigInt(_input, modStart, modLen);
	if (mod === 0n)
		return { success: true, output: new Uint8Array(mLen), gasUsed: gas };
	const base = readPaddedBigInt(_input, 96n, baseLen);
	const exp = readPaddedBigInt(_input, expStart, expLen);

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
 *
 * Gas: 500 from Byzantium (EIP-196), 150 from Istanbul (EIP-1108).
 * @param _input - Two G1 points, right-padded or truncated to 128 bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export function bn254Add(
	_input: Uint8Array,
	gasLimit: bigint,
	hardfork: HardforkType = Hardfork.DEFAULT,
): PrecompileResult {
	const gas = Gas.Precompile.getEcAddCost(hardfork);
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	// Input: 128 bytes (G1 point A || G1 point B)
	const buf = new Uint8Array(128);
	buf.set(_input.subarray(0, Math.min(128, _input.length)), 0);
	const aBytes = buf.slice(0, 64);
	const bBytes = buf.slice(64, 128);
	try {
		const a = Bn254.deserializeG1(aBytes);
		const b = Bn254.deserializeG1(bBytes);
		const sum = Bn254.G1.add(a, b);
		const out = Bn254.serializeG1(sum);
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BN254_MUL precompile (0x07)
 * BN254 elliptic curve multiplication
 *
 * Gas: 40000 from Byzantium (EIP-196), 6000 from Istanbul (EIP-1108).
 * @param _input - G1 point and scalar, right-padded or truncated to 96 bytes
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export function bn254Mul(
	_input: Uint8Array,
	gasLimit: bigint,
	hardfork: HardforkType = Hardfork.DEFAULT,
): PrecompileResult {
	const gas = Gas.Precompile.getEcMulCost(hardfork);
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	// Input: 96 bytes (G1 point || scalar)
	const buf = new Uint8Array(96);
	buf.set(_input.subarray(0, Math.min(96, _input.length)), 0);
	const pBytes = buf.slice(0, 64);
	const sBytes = buf.slice(64, 96);
	try {
		const p = Bn254.deserializeG1(pBytes);
		const s = beBytesToBigInt(sBytes);
		const prod = Bn254.G1.mul(p, s);
		const out = Bn254.serializeG1(prod);
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * Decode an EIP-197 G2 point.
 *
 * The wire order is `x_imag || x_real || y_imag || y_real` (`c1` before `c0`);
 * `Bn254.deserializeG2` takes `c0` first. Coordinates >= the field modulus,
 * off-curve points and points outside the order-r subgroup throw.
 */
function decodeEip197G2(wire: Uint8Array) {
	const bytes = new Uint8Array(128);
	bytes.set(wire.subarray(32, 64), 0);
	bytes.set(wire.subarray(0, 32), 32);
	bytes.set(wire.subarray(96, 128), 64);
	bytes.set(wire.subarray(64, 96), 96);
	return Bn254.deserializeG2(bytes);
}

/**
 * BN254_PAIRING precompile (0x08)
 * BN254 pairing check
 *
 * Gas for k pairs: `100000 + 80000 * k` from Byzantium (EIP-197),
 * `45000 + 34000 * k` from Istanbul (EIP-1108).
 * Halts on a coordinate >= the field modulus, an off-curve point, or a G2
 * point outside the order-r subgroup.
 * @param input - k pairs of 192 bytes (G1 `x || y`, then G2
 *   `x_imag || x_real || y_imag || y_real`)
 * @param gasLimit - Gas forwarded to the precompile
 * @param hardfork - Active fork; defaults to the latest stable fork
 */
export function bn254Pairing(
	input: Uint8Array,
	gasLimit: bigint,
	hardfork: HardforkType = Hardfork.DEFAULT,
): PrecompileResult {
	if (input.length % 192 !== 0) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}
	const k = input.length / 192;
	const gas = Gas.Precompile.calculateEcPairingCost(BigInt(k), hardfork);
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");

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
			const g2 = decodeEip197G2(input.subarray(off + 64, off + 192));
			pairs.push([g1, g2]);
		}
		const ok = Bn254.Pairing.pairingCheck(pairs);
		const out = new Uint8Array(32);
		if (ok) out[31] = 1;
		return { success: true, output: out, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLAKE2F precompile (0x09)
 * Blake2 F compression function per EIP-152
 *
 * Input format (213 bytes):
 * - rounds (4 bytes, big-endian) - number of compression rounds
 * - h (64 bytes) - state vector
 * - m (128 bytes) - message block
 * - t (16 bytes) - offset counters
 * - f (1 byte) - final block flag (must be 0 or 1)
 *
 * @see https://eips.ethereum.org/EIPS/eip-152
 */
export function blake2f(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (_input.length !== 213) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	// Validate final flag per EIP-152 - must be 0 or 1
	const finalFlag = _input[212];
	if (finalFlag !== 0 && finalFlag !== 1) {
		return exceptionalHalt(gasLimit, "Invalid final flag");
	}

	// Parse rounds (big-endian) - use >>> 0 to force unsigned 32-bit interpretation
	const rounds =
		(((_input[0] ?? 0) << 24) |
			((_input[1] ?? 0) << 16) |
			((_input[2] ?? 0) << 8) |
			(_input[3] ?? 0)) >>>
		0;
	const gas = Gas.Precompile.calculateBlake2fCost(BigInt(rounds));

	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");

	try {
		const output = blake2fCompress(_input);
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/** BLS12-381 scalar field modulus, the second word of the 0x0a return value. */
const BLS_MODULUS_BYTES = Uint8Array.from([
	0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48, 0x33, 0x39, 0xd8, 0x08, 0x09,
	0xa1, 0xd8, 0x05, 0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe, 0xff, 0xff,
	0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
]);

/**
 * POINT_EVALUATION precompile (0x0a)
 * KZG point evaluation (EIP-4844)
 *
 * Input format (192 bytes per EIP-4844):
 * - versioned_hash (32 bytes) - `0x01 || sha256(commitment)[1..32]`
 * - z (32 bytes) - evaluation point
 * - y (32 bytes) - claimed evaluation result
 * - commitment (48 bytes) - KZG commitment
 * - proof (48 bytes) - KZG proof
 *
 * Returns `FIELD_ELEMENTS_PER_BLOB || BLS_MODULUS` (64 bytes) when the
 * versioned hash matches the commitment and the proof verifies. A wrong input
 * length, a mismatched versioned hash, a non-canonical field element, or an
 * invalid proof is an exceptional halt that consumes all forwarded gas.
 */
export function pointEvaluation(
	_input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.PointEvaluation;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	// EIP-4844 specifies exactly 192 bytes
	if (_input.length !== 192) {
		return exceptionalHalt(
			gasLimit,
			"Invalid input length: expected 192 bytes",
		);
	}
	const versionedHash = _input.subarray(0, 32);
	const z = _input.slice(32, 64);
	const y = _input.slice(64, 96);
	const commitment = _input.slice(96, 144);
	const proof = _input.slice(144, 192);

	// kzg_to_versioned_hash: VERSIONED_HASH_VERSION_KZG || sha256(commitment)[1:]
	const expectedHash = new Uint8Array(SHA256.hash(commitment));
	expectedHash[0] = 0x01;
	let mismatch = 0;
	for (let i = 0; i < 32; i++) {
		mismatch |= (versionedHash[i] ?? 0) ^ (expectedHash[i] ?? 0);
	}
	if (mismatch !== 0) {
		return exceptionalHalt(
			gasLimit,
			"Versioned hash does not match commitment",
		);
	}

	let ok: boolean;
	try {
		if (!Kzg.isInitialized()) Kzg.loadTrustedSetup();
		ok = Kzg.verifyKzgProof(commitment, z, y, proof);
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
	if (!ok) return exceptionalHalt(gasLimit, "Invalid KZG proof");

	// FIELD_ELEMENTS_PER_BLOB (4096 = 0x1000) || BLS_MODULUS, two 32-byte words
	const out = new Uint8Array(64);
	out[30] = 0x10;
	out.set(BLS_MODULUS_BYTES, 32);
	return { success: true, output: out, gasUsed: gas };
}

/**
 * BLS12_G1ADD precompile (0x0b, EIP-2537)
 *
 * Input: two G1 points (256 bytes). Output: one G1 point (128 bytes).
 * Gas: 375. Points must be on the curve; no subgroup check.
 */
export function bls12G1Add(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.Bls12G1Add;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	if (input.length !== 256) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	try {
		const point1 = deserializeG1(input.subarray(0, 128), false);
		const point2 = deserializeG1(input.subarray(128, 256), false);
		const output = serializeG1(point1.add(point2));
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_G1MSM precompile (0x0c, EIP-2537)
 *
 * Input: k >= 1 pairs of G1 point (128 bytes) and scalar (32 bytes).
 * Output: one G1 point (128 bytes).
 * Gas: `k * 12000 * discount(k) / 1000`. Every point must be in the subgroup.
 */
export function bls12G1Msm(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (input.length % 160 !== 0 || input.length === 0) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	const k = input.length / 160;
	const gas = Gas.Precompile.calculateBls12G1MsmCost(BigInt(k));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");

	try {
		let result = bls12_381.G1.Point.ZERO;
		for (let i = 0; i < k; i++) {
			const offset = i * 160;
			// Validate every point, including those with a zero scalar.
			const point = deserializeG1(input.subarray(offset, offset + 128), true);
			// Scalars may exceed the subgroup order; the point has order r.
			const scalar =
				beBytesToBigInt(input.subarray(offset + 128, offset + 160)) %
				BLS12_FR_ORDER;
			if (scalar === 0n || point.is0()) continue;
			result = result.add(point.multiplyUnsafe(scalar));
		}
		return { success: true, output: serializeG1(result), gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_G2ADD precompile (0x0d, EIP-2537)
 *
 * Input: two G2 points (512 bytes). Output: one G2 point (256 bytes).
 * Gas: 600. Points must be on the curve; no subgroup check.
 */
export function bls12G2Add(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.Bls12G2Add;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	if (input.length !== 512) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	try {
		const point1 = deserializeG2(input.subarray(0, 256), false);
		const point2 = deserializeG2(input.subarray(256, 512), false);
		const output = serializeG2(point1.add(point2));
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_G2MSM precompile (0x0e, EIP-2537)
 *
 * Input: k >= 1 pairs of G2 point (256 bytes) and scalar (32 bytes).
 * Output: one G2 point (256 bytes).
 * Gas: `k * 22500 * discount(k) / 1000`. Every point must be in the subgroup.
 */
export function bls12G2Msm(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (input.length % 288 !== 0 || input.length === 0) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	const k = input.length / 288;
	const gas = Gas.Precompile.calculateBls12G2MsmCost(BigInt(k));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");

	try {
		let result = bls12_381.G2.Point.ZERO;
		for (let i = 0; i < k; i++) {
			const offset = i * 288;
			// Validate every point, including those with a zero scalar.
			const point = deserializeG2(input.subarray(offset, offset + 256), true);
			// Scalars may exceed the subgroup order; the point has order r.
			const scalar =
				beBytesToBigInt(input.subarray(offset + 256, offset + 288)) %
				BLS12_FR_ORDER;
			if (scalar === 0n || point.is0()) continue;
			result = result.add(point.multiplyUnsafe(scalar));
		}
		return { success: true, output: serializeG2(result), gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_PAIRING_CHECK precompile (0x0f, EIP-2537)
 *
 * Input: k >= 1 pairs of G1 point (128 bytes) and G2 point (256 bytes).
 * Output: 32 bytes, last byte 1 when the product of pairings is one, else 0.
 * Gas: `32600 * k + 37700`. Every point must be in its subgroup.
 */
export function bls12Pairing(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	if (input.length % 384 !== 0 || input.length === 0) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	const k = input.length / 384;
	const gas = Gas.Precompile.calculateBls12PairingCost(BigInt(k));
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");

	try {
		// Validate every pair; a pair with a point at infinity contributes one.
		const pairs: Array<{ g1: Bls12G1Point; g2: Bls12G2Point }> = [];
		for (let i = 0; i < k; i++) {
			const offset = i * 384;
			const g1 = deserializeG1(input.subarray(offset, offset + 128), true);
			const g2 = deserializeG2(
				input.subarray(offset + 128, offset + 384),
				true,
			);
			if (!g1.is0() && !g2.is0()) pairs.push({ g1, g2 });
		}

		const output = new Uint8Array(32);
		if (pairs.length === 0) {
			output[31] = 1;
			return { success: true, output, gasUsed: gas };
		}

		// pairingBatch returns the product after the final exponentiation.
		const product = bls12_381.pairingBatch(pairs);
		const isOne = bls12_381.fields.Fp12.eql(product, bls12_381.fields.Fp12.ONE);
		output[31] = isOne ? 1 : 0;
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_MAP_FP_TO_G1 precompile (0x10, EIP-2537)
 *
 * Input: one canonical Fp element (64 bytes). Output: one G1 point (128 bytes).
 * Gas: 5500. Applies the field-to-curve map directly; the input is not hashed.
 */
export function bls12MapFpToG1(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.Bls12MapFpToG1;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	if (input.length !== 64) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	try {
		const u = decodeBls12Fp(input);
		const output = serializeG1(mapFpToG1(u));
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}

/**
 * BLS12_MAP_FP2_TO_G2 precompile (0x11, EIP-2537)
 *
 * Input: one canonical Fp2 element `c0 || c1` (128 bytes).
 * Output: one G2 point (256 bytes).
 * Gas: 23800. Applies the field-to-curve map directly; the input is not hashed.
 */
export function bls12MapFp2ToG2(
	input: Uint8Array,
	gasLimit: bigint,
): PrecompileResult {
	const gas = Gas.Precompile.Bls12MapFp2ToG2;
	if (gasLimit < gas) return exceptionalHalt(gasLimit, "Out of gas");
	if (input.length !== 128) {
		return exceptionalHalt(gasLimit, "Invalid input length");
	}

	try {
		const c0 = decodeBls12Fp(input.subarray(0, 64));
		const c1 = decodeBls12Fp(input.subarray(64, 128));
		const output = serializeG2(mapFp2ToG2([c0, c1]));
		return { success: true, output, gasUsed: gas };
	} catch (e) {
		return exceptionalHalt(gasLimit, String(e));
	}
}
