/**
 * Ethereum Execution Spec Tests (EEST) + Wycheproof Compliance Suite
 *
 * Exercises Voltaire TypeScript end-to-end against published Ethereum
 * Execution Spec, EIP, RFC, NIST, and Wycheproof test vectors across:
 *   1. All 18 EVM precompiles (0x01..0x11 + 0x100) and fork activation gating
 *   2. Wycheproof cryptographic edge cases (secp256k1, P-256, Ed25519) & NIST/RFC hashes
 *   3. Hardfork protocol vectors from Frontier through Prague/Pectra,
 *      Osaka/Fusaka, and Amsterdam/Glamsterdam
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Blake2 } from "./crypto/Blake2/index.js";
import { Ed25519 } from "./crypto/Ed25519/index.js";
import { EIP712, type TypedData } from "./crypto/EIP712/index.js";
import { Keccak256 } from "./crypto/Keccak256/index.js";
import { P256 } from "./crypto/P256/index.js";
import { Ripemd160 } from "./crypto/Ripemd160/index.js";
import { CURVE_ORDER as SECP256K1_N } from "./crypto/Secp256k1/constants.js";
import { Secp256k1 } from "./crypto/Secp256k1/index.js";
import { SHA256 } from "./crypto/SHA256/index.js";
import { handle as clzHandle } from "./evm/bitwise/0x1e_CLZ.js";
import type { BrandedFrame } from "./evm/Frame/FrameType.js";
import {
	blake2f,
	bls12G1Add,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	bn254Add,
	bn254Mul,
	bn254Pairing,
	ecrecover,
	execute,
	identity,
	isPrecompile,
	modexp,
	PrecompileAddress,
	type PrecompileResult,
	p256Verify,
	pointEvaluation,
	ripemd160,
	sha256,
} from "./evm/precompiles/precompiles.js";
import type { AddressType } from "./primitives/Address/AddressType.js";
import { Address } from "./primitives/Address/index.js";
import * as Authorization from "./primitives/Authorization/index.js";
import * as Blob from "./primitives/Blob/index.js";
import * as BlockAccessList from "./primitives/BlockAccessList/index.js";
import * as ExecutionPayloadBid from "./primitives/ExecutionPayloadBid/index.js";
import * as FeeMarket from "./primitives/FeeMarket/FeeMarket.js";
import * as GasConstants from "./primitives/GasConstants/index.js";
import type { HardforkType } from "./primitives/Hardfork/HardforkType.js";
import * as Hardfork from "./primitives/Hardfork/index.js";
import type { HashType } from "./primitives/Hash/HashType.js";
import * as Hex from "./primitives/Hex/index.js";
import * as Opcode from "./primitives/Opcode/index.js";
import type { PrivateKeyType } from "./primitives/PrivateKey/PrivateKeyType.js";
import * as SignatureErc8010 from "./primitives/SignatureErc8010/index.js";
import * as SignedData from "./primitives/SignedData/index.js";
import * as Transaction from "./primitives/Transaction/index.js";
import * as Trie from "./primitives/Trie/index.js";

const fromHex = (hex: string): Uint8Array => {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	return Uint8Array.from(Buffer.from(clean, "hex"));
};

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");

function bigIntToBytes32(value: bigint): Uint8Array {
	const out = new Uint8Array(32);
	let remaining = value;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return out;
}

function modexpHeader(base: bigint, exp: bigint, mod: bigint): Uint8Array {
	const out = new Uint8Array(96);
	out.set(bigIntToBytes32(base), 0);
	out.set(bigIntToBytes32(exp), 32);
	out.set(bigIntToBytes32(mod), 64);
	return out;
}

function makeClzFrame(
	stack: bigint[],
	gasRemaining: bigint,
	hardfork?: HardforkType,
): BrandedFrame {
	return {
		__tag: "Frame",
		stack,
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining,
		bytecode: new Uint8Array(),
		caller: Address("0x0000000000000000000000000000000000000000"),
		address: Address("0x0000000000000000000000000000000000000000"),
		value: 0n,
		calldata: new Uint8Array(),
		output: new Uint8Array(),
		returnData: new Uint8Array(),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
		...(hardfork === undefined ? {} : { hardfork }),
	};
}

interface PipeVector {
	name: string;
	input: Uint8Array;
	expected: string;
	gas: bigint;
}

function loadPipeVectors(relativePath: string): PipeVector[] {
	const text = readFileSync(new URL(relativePath, import.meta.url), "utf8");
	const out: PipeVector[] = [];
	for (const rawLine of text.split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const [name = "", inputHex = "", expected = "", gasStr = "0"] =
			line.split("|");
		out.push({
			name,
			input: fromHex(inputHex),
			expected,
			gas: BigInt(gasStr),
		});
	}
	return out;
}

interface Eip2537SuccessVector {
	Name: string;
	Input: string;
	Expected: string;
	Gas: number;
}

interface Eip2537FailVector {
	Name: string;
	Input: string;
	ExpectedError: string;
}

type BlsOp =
	| "g1Add"
	| "g1Msm"
	| "g2Add"
	| "g2Msm"
	| "pairing"
	| "mapFpToG1"
	| "mapFp2ToG2";

interface Eip2537VectorFile {
	success: Record<BlsOp, Eip2537SuccessVector[]>;
	fail: Record<BlsOp, Eip2537FailVector[]>;
	msmGas: { g1Msm: Array<[number, number]>; g2Msm: Array<[number, number]> };
}

// ============================================================================
// 1. Ethereum Execution Spec (EEST) Precompile Vectors (0x01..0x11 + 0x100)
// ============================================================================

describe("EEST Compliance: EVM Precompiles (0x01..0x11 + 0x100)", () => {
	it("enforces hardfork activation gating across Frontier through Amsterdam", () => {
		// Frontier: 0x01..0x04 active; 0x05+ inactive
		expect(isPrecompile(PrecompileAddress.ECRECOVER, Hardfork.FRONTIER)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.SHA256, Hardfork.FRONTIER)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.RIPEMD160, Hardfork.FRONTIER)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.IDENTITY, Hardfork.FRONTIER)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.MODEXP, Hardfork.HOMESTEAD)).toBe(
			false,
		);
		expect(isPrecompile(PrecompileAddress.BN254_ADD, Hardfork.HOMESTEAD)).toBe(
			false,
		);

		// Byzantium: 0x05..0x08 active; 0x09 inactive
		expect(isPrecompile(PrecompileAddress.MODEXP, Hardfork.BYZANTIUM)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.BN254_ADD, Hardfork.BYZANTIUM)).toBe(
			true,
		);
		expect(isPrecompile(PrecompileAddress.BN254_MUL, Hardfork.BYZANTIUM)).toBe(
			true,
		);
		expect(
			isPrecompile(PrecompileAddress.BN254_PAIRING, Hardfork.BYZANTIUM),
		).toBe(true);
		expect(isPrecompile(PrecompileAddress.BLAKE2F, Hardfork.BYZANTIUM)).toBe(
			false,
		);

		// Istanbul: 0x09 active; 0x0a inactive
		expect(isPrecompile(PrecompileAddress.BLAKE2F, Hardfork.ISTANBUL)).toBe(
			true,
		);
		expect(
			isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.SHANGHAI),
		).toBe(false);

		// Cancun: 0x0a active; 0x0b..0x11 inactive
		expect(
			isPrecompile(PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN),
		).toBe(true);
		expect(isPrecompile(PrecompileAddress.BLS12_G1_ADD, Hardfork.CANCUN)).toBe(
			false,
		);

		// Prague: 0x0b..0x11 active; 0x100 inactive
		for (const addr of [
			PrecompileAddress.BLS12_G1_ADD,
			PrecompileAddress.BLS12_G1_MSM,
			PrecompileAddress.BLS12_G2_ADD,
			PrecompileAddress.BLS12_G2_MSM,
			PrecompileAddress.BLS12_PAIRING,
			PrecompileAddress.BLS12_MAP_FP_TO_G1,
			PrecompileAddress.BLS12_MAP_FP2_TO_G2,
		]) {
			expect(isPrecompile(addr, Hardfork.PRAGUE)).toBe(true);
		}
		expect(isPrecompile(PrecompileAddress.P256_VERIFY, Hardfork.PRAGUE)).toBe(
			false,
		);
		const preOsaka = execute(
			PrecompileAddress.P256_VERIFY,
			new Uint8Array(160),
			10_000n,
			Hardfork.PRAGUE,
		);
		expect(preOsaka.success).toBe(false);
		expect(preOsaka.gasUsed).toBe(0n);

		// Osaka & Amsterdam: 0x100 active alongside all prior precompiles
		expect(isPrecompile(PrecompileAddress.P256_VERIFY, Hardfork.OSAKA)).toBe(
			true,
		);
		expect(
			isPrecompile(PrecompileAddress.P256_VERIFY, Hardfork.AMSTERDAM),
		).toBe(true);
	});

	it("0x01 ECRECOVER: verifies valid, high-s, invalid-v, zero-scalar, and OOG vectors", () => {
		const privKey = fromHex(
			"4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		) as PrivateKeyType;
		const expectedAddr = Address.fromPublicKey(
			Secp256k1.derivePublicKey(privKey),
		);
		const digest = Keccak256.hashString("EEST ecRecover vector") as HashType;
		const sig = Secp256k1.sign(digest, privKey);

		const buildInput = (
			h: Uint8Array,
			vWord: Uint8Array,
			r: Uint8Array,
			s: Uint8Array,
		): Uint8Array => {
			const buf = new Uint8Array(128);
			buf.set(h, 0);
			buf.set(vWord, 32);
			buf.set(r, 64);
			buf.set(s, 96);
			return buf;
		};

		// Valid recovery (low-s)
		const vValid = bigIntToBytes32(BigInt(sig.v));
		const res = execute(
			PrecompileAddress.ECRECOVER,
			buildInput(digest, vValid, sig.r, sig.s),
			3000n,
			Hardfork.FRONTIER,
		);
		expect(res.success).toBe(true);
		expect(res.gasUsed).toBe(3000n);
		expect(res.output.subarray(0, 12)).toEqual(new Uint8Array(12));
		expect(toHex(res.output.subarray(12, 32))).toBe(toHex(expectedAddr));

		// High-s signature (s' = n - s, flipped v) is accepted by precompile 0x01 per Yellow Paper
		let sBig = 0n;
		for (const byte of sig.s) sBig = (sBig << 8n) | BigInt(byte);
		const highS = bigIntToBytes32(SECP256K1_N - sBig);
		const flippedV = bigIntToBytes32(BigInt(sig.v === 27 ? 28 : 27));
		const highSRes = ecrecover(
			buildInput(digest, flippedV, sig.r, highS),
			3000n,
		);
		expect(highSRes.success).toBe(true);
		expect(toHex(highSRes.output.subarray(12, 32))).toBe(toHex(expectedAddr));

		// Invalid v word (non-zero upper byte or v = 29) -> empty output, 3000 gas
		const badVUpper = bigIntToBytes32((1n << 8n) | 27n);
		const badVRes = ecrecover(
			buildInput(digest, badVUpper, sig.r, sig.s),
			3000n,
		);
		expect(badVRes.success).toBe(true);
		expect(badVRes.output.length).toBe(0);
		expect(badVRes.gasUsed).toBe(3000n);

		// Zero r or s >= n -> empty output, 3000 gas
		const zeroRRes = ecrecover(
			buildInput(digest, vValid, new Uint8Array(32), sig.s),
			3000n,
		);
		expect(zeroRRes.success).toBe(true);
		expect(zeroRRes.output.length).toBe(0);

		const overflowSRes = ecrecover(
			buildInput(digest, vValid, sig.r, bigIntToBytes32(SECP256K1_N)),
			3000n,
		);
		expect(overflowSRes.success).toBe(true);
		expect(overflowSRes.output.length).toBe(0);

		// OOG at 2999 gas
		const oog = ecrecover(buildInput(digest, vValid, sig.r, sig.s), 2999n);
		expect(oog.success).toBe(false);
		expect(oog.gasUsed).toBe(2999n);
	});

	it("0x02 SHA256, 0x03 RIPEMD160, 0x04 IDENTITY: matches Yellow Paper vectors and gas", () => {
		// 0x02 SHA256
		const shaEmpty = execute(
			PrecompileAddress.SHA256,
			new Uint8Array(0),
			60n,
			Hardfork.FRONTIER,
		);
		expect(shaEmpty.success).toBe(true);
		expect(shaEmpty.gasUsed).toBe(60n);
		expect(toHex(shaEmpty.output)).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		const shaAbc = sha256(new TextEncoder().encode("abc"), 72n);
		expect(shaAbc.success).toBe(true);
		expect(shaAbc.gasUsed).toBe(72n);
		expect(toHex(shaAbc.output)).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
		expect(sha256(new Uint8Array(0), 59n).success).toBe(false);

		// 0x03 RIPEMD160 (12-byte left zero-padded 20-byte digest)
		const ripEmpty = execute(
			PrecompileAddress.RIPEMD160,
			new Uint8Array(0),
			600n,
			Hardfork.FRONTIER,
		);
		expect(ripEmpty.success).toBe(true);
		expect(ripEmpty.gasUsed).toBe(600n);
		expect(toHex(ripEmpty.output)).toBe(
			"0000000000000000000000009c1185a5c5e9fc54612808977ee8f548b2258d31",
		);
		const ripAbc = ripemd160(new TextEncoder().encode("abc"), 720n);
		expect(ripAbc.success).toBe(true);
		expect(ripAbc.gasUsed).toBe(720n);
		expect(toHex(ripAbc.output)).toBe(
			"0000000000000000000000008eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
		);
		expect(ripemd160(new Uint8Array(0), 599n).success).toBe(false);

		// 0x04 IDENTITY
		const idEmpty = execute(
			PrecompileAddress.IDENTITY,
			new Uint8Array(0),
			15n,
			Hardfork.FRONTIER,
		);
		expect(idEmpty.success).toBe(true);
		expect(idEmpty.gasUsed).toBe(15n);
		expect(idEmpty.output).toEqual(new Uint8Array(0));

		const payload33 = new Uint8Array(33).fill(0x5a);
		const id33 = identity(payload33, 21n);
		expect(id33.success).toBe(true);
		expect(id33.gasUsed).toBe(21n);
		expect(id33.output).toEqual(payload33);
		expect(identity(payload33, 20n).success).toBe(false);
	});

	it("0x05 MODEXP: verifies EIP-198/2565 computation, EIP-7823 Osaka 1024-byte cap, and EIP-7883 gas", () => {
		// 3^5 mod 7 = 5 (Berlin/Prague min gas 200 vs Osaka EIP-7883 min gas 500)
		const vec = new Uint8Array([...modexpHeader(1n, 1n, 1n), 3, 5, 7]);
		const pragueRes = execute(
			PrecompileAddress.MODEXP,
			vec,
			200n,
			Hardfork.PRAGUE,
		);
		expect(pragueRes.success).toBe(true);
		expect(pragueRes.gasUsed).toBe(200n);
		expect(pragueRes.output).toEqual(Uint8Array.from([5]));

		const osakaOog = execute(
			PrecompileAddress.MODEXP,
			vec,
			499n,
			Hardfork.OSAKA,
		);
		expect(osakaOog.success).toBe(false);
		expect(osakaOog.gasUsed).toBe(499n);

		const osakaOk = execute(
			PrecompileAddress.MODEXP,
			vec,
			500n,
			Hardfork.OSAKA,
		);
		expect(osakaOk.success).toBe(true);
		expect(osakaOk.gasUsed).toBe(500n);
		expect(osakaOk.output).toEqual(Uint8Array.from([5]));

		// Right-padded partial modulus (2^3 mod 0x0100 = 8 -> [0x00, 0x08])
		const padded = new Uint8Array([...modexpHeader(1n, 1n, 2n), 2, 3, 1]);
		expect(modexp(padded, 500n, Hardfork.OSAKA)).toEqual({
			success: true,
			output: Uint8Array.from([0, 8]),
			gasUsed: 500n,
		});

		// EIP-7823 Osaka operand cap: 1024 accepted, 1025 rejected on Osaka but accepted on Prague
		expect(
			modexp(modexpHeader(1024n, 0n, 0n), 1_000_000n, Hardfork.OSAKA).success,
		).toBe(true);
		for (const [b, e, m] of [
			[1025n, 0n, 0n],
			[0n, 1025n, 0n],
			[0n, 0n, 1025n],
		] as const) {
			const rejected = modexp(
				modexpHeader(b, e, m),
				1_000_000n,
				Hardfork.OSAKA,
			);
			expect(rejected.success).toBe(false);
			expect(rejected.gasUsed).toBe(1_000_000n);

			const pragueAllowed = modexp(
				modexpHeader(b, e, m),
				1_000_000n,
				Hardfork.PRAGUE,
			);
			expect(pragueAllowed.success).toBe(true);
		}

		// EIP-7883 long exponent pricing (0, 1024, 0) -> 253,952 gas on Osaka
		const longExp = modexpHeader(0n, 1024n, 0n);
		expect(modexp(longExp, 253_952n, Hardfork.OSAKA)).toEqual({
			success: true,
			output: new Uint8Array(0),
			gasUsed: 253_952n,
		});
		expect(modexp(longExp, 253_951n, Hardfork.OSAKA).success).toBe(false);
	});

	it("0x06..0x08 BN254 ecAdd/ecMul/ecPairing: passes all official EIP-196/197 vectors and EIP-1108 repricing", () => {
		const addVectors = loadPipeVectors(
			"./evm/precompiles/eip196_add.vectors.txt",
		);
		const mulVectors = loadPipeVectors(
			"./evm/precompiles/eip196_mul.vectors.txt",
		);
		const pairVectors = loadPipeVectors(
			"./evm/precompiles/eip197_pairing.vectors.txt",
		);
		expect(addVectors.length).toBe(16);
		expect(mulVectors.length).toBe(19);
		expect(pairVectors.length).toBe(14);

		for (const v of addVectors) {
			const res = execute(
				PrecompileAddress.BN254_ADD,
				v.input,
				v.gas,
				Hardfork.ISTANBUL,
			);
			expect(res.success, `ecAdd ${v.name}`).toBe(true);
			expect(res.gasUsed).toBe(v.gas);
			expect(toHex(res.output)).toBe(v.expected);
		}

		for (const v of mulVectors) {
			const res = execute(
				PrecompileAddress.BN254_MUL,
				v.input,
				v.gas,
				Hardfork.ISTANBUL,
			);
			expect(res.success, `ecMul ${v.name}`).toBe(true);
			expect(res.gasUsed).toBe(v.gas);
			expect(toHex(res.output)).toBe(v.expected);
		}

		for (const v of pairVectors) {
			const res = execute(
				PrecompileAddress.BN254_PAIRING,
				v.input,
				v.gas,
				Hardfork.ISTANBUL,
			);
			expect(res.success, `ecPairing ${v.name}`).toBe(true);
			expect(res.gasUsed).toBe(v.gas);
			expect(toHex(res.output)).toBe(v.expected);
		}

		// Byzantium (EIP-196/197) vs Istanbul (EIP-1108) gas repricing
		expect(
			bn254Add(new Uint8Array(128), 500n, Hardfork.BYZANTIUM).gasUsed,
		).toBe(500n);
		expect(bn254Add(new Uint8Array(128), 150n, Hardfork.ISTANBUL).gasUsed).toBe(
			150n,
		);
		expect(
			bn254Mul(new Uint8Array(96), 40_000n, Hardfork.BYZANTIUM).gasUsed,
		).toBe(40_000n);
		expect(bn254Mul(new Uint8Array(96), 6000n, Hardfork.ISTANBUL).gasUsed).toBe(
			6000n,
		);
		expect(
			bn254Pairing(new Uint8Array(0), 100_000n, Hardfork.BYZANTIUM).gasUsed,
		).toBe(100_000n);
		expect(
			bn254Pairing(new Uint8Array(0), 45_000n, Hardfork.ISTANBUL).gasUsed,
		).toBe(45_000n);

		// Off-curve G1 point halts and burns all forwarded gas
		const offCurve = new Uint8Array(128);
		offCurve[31] = 1;
		offCurve[63] = 1; // (1, 1) does not satisfy y^2 = x^3 + 3
		const halt = bn254Add(offCurve, 5000n, Hardfork.ISTANBUL);
		expect(halt.success).toBe(false);
		expect(halt.gasUsed).toBe(5000n);
	});

	it("0x09 BLAKE2F: passes official EIP-152 / RFC 7693 vector and rejects malformed flags/lengths", () => {
		const vector = fromHex(
			"0000000c" +
				"48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5" +
				"d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b" +
				"616263" +
				"00".repeat(125) +
				"03000000000000000000000000000000" +
				"01",
		);
		const res = execute(
			PrecompileAddress.BLAKE2F,
			vector,
			12n,
			Hardfork.ISTANBUL,
		);
		expect(res.success).toBe(true);
		expect(res.gasUsed).toBe(12n);
		expect(toHex(res.output)).toBe(
			"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1" +
				"7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
		);

		// OOG at 11 gas
		expect(blake2f(vector, 11n).success).toBe(false);
		// Invalid flag = 2
		const badFlag = new Uint8Array(vector);
		badFlag[212] = 2;
		const badFlagRes = blake2f(badFlag, 100n);
		expect(badFlagRes.success).toBe(false);
		expect(badFlagRes.gasUsed).toBe(100n);
		// Invalid input length
		expect(blake2f(new Uint8Array(212), 100n).success).toBe(false);
	});

	it("0x0a POINT_EVALUATION (EIP-4844): verifies gas, input length, and versioned-hash consensus rules", () => {
		// Official empty-blob infinity commitment & published EIP-4844 versioned hash
		const infinityCommitment = fromHex(`c0${"00".repeat(47)}`);
		const toVersionedHash = Blob.ToVersionedHash({ sha256: SHA256.hash });
		const computedHash = toVersionedHash(infinityCommitment as Blob.Commitment);
		expect(toHex(computedHash)).toBe(
			"010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014",
		);
		expect(Blob.isValidVersion(computedHash)).toBe(true);

		// Out of gas (< 50,000) halts consuming forwarded gas
		const oog = execute(
			PrecompileAddress.POINT_EVALUATION,
			new Uint8Array(192),
			49_999n,
			Hardfork.CANCUN,
		);
		expect(oog.success).toBe(false);
		expect(oog.gasUsed).toBe(49_999n);

		// Wrong length (!= 192) halts consuming all forwarded gas
		const shortRes = pointEvaluation(new Uint8Array(191), 60_000n);
		expect(shortRes.success).toBe(false);
		expect(shortRes.gasUsed).toBe(60_000n);
		expect(shortRes.error).toContain("192");

		// Mismatched versioned hash (wrong version byte 0x00 or flipped digest byte) halts before KZG pairing
		const mismatched = new Uint8Array(192);
		mismatched.set(computedHash, 0);
		mismatched[0] = 0x00; // Wrong version byte (must be 0x01)
		mismatched.set(infinityCommitment, 96);
		const mismatchRes = execute(
			PrecompileAddress.POINT_EVALUATION,
			mismatched,
			50_000n,
			Hardfork.CANCUN,
		);
		expect(mismatchRes.success).toBe(false);
		expect(mismatchRes.gasUsed).toBe(50_000n);
		expect(mismatchRes.error).toContain("Versioned hash");
	});

	it("0x0b..0x11 BLS12-381 (EIP-2537): passes all 137 official Ethereum EIP-2537 vectors and MSM gas table", () => {
		const eip2537 = JSON.parse(
			readFileSync(
				new URL("./evm/precompiles/eip2537.vectors.json", import.meta.url),
				"utf8",
			),
		) as Eip2537VectorFile;

		const ops: Record<
			BlsOp,
			{
				address: PrecompileAddress;
				run: (input: Uint8Array, gas: bigint) => PrecompileResult;
			}
		> = {
			g1Add: { address: PrecompileAddress.BLS12_G1_ADD, run: bls12G1Add },
			g1Msm: { address: PrecompileAddress.BLS12_G1_MSM, run: bls12G1Msm },
			g2Add: { address: PrecompileAddress.BLS12_G2_ADD, run: bls12G2Add },
			g2Msm: { address: PrecompileAddress.BLS12_G2_MSM, run: bls12G2Msm },
			pairing: { address: PrecompileAddress.BLS12_PAIRING, run: bls12Pairing },
			mapFpToG1: {
				address: PrecompileAddress.BLS12_MAP_FP_TO_G1,
				run: bls12MapFpToG1,
			},
			mapFp2ToG2: {
				address: PrecompileAddress.BLS12_MAP_FP2_TO_G2,
				run: bls12MapFp2ToG2,
			},
		};

		let successCount = 0;
		let failCount = 0;

		for (const opName of Object.keys(ops) as BlsOp[]) {
			const { address } = ops[opName];
			for (const vec of eip2537.success[opName]) {
				const gas = BigInt(vec.Gas);
				const res = execute(address, fromHex(vec.Input), gas, Hardfork.PRAGUE);
				expect(res.success, `${opName}:${vec.Name}`).toBe(true);
				expect(res.gasUsed).toBe(gas);
				expect(toHex(res.output)).toBe(vec.Expected);
				successCount++;
			}
			for (const vec of eip2537.fail[opName]) {
				const res = execute(
					address,
					fromHex(vec.Input),
					10_000_000n,
					Hardfork.PRAGUE,
				);
				expect(res.success, `${opName}:fail:${vec.Name}`).toBe(false);
				expect(res.gasUsed).toBe(10_000_000n);
				failCount++;
			}
		}

		expect(successCount).toBe(72);
		expect(failCount).toBe(65);

		// Verify EIP-2537 MSM discount tables match every published [k, gas] entry
		for (const [k, gas] of eip2537.msmGas.g1Msm) {
			expect(GasConstants.Precompile.calculateBls12G1MsmCost(BigInt(k))).toBe(
				BigInt(gas),
			);
		}
		for (const [k, gas] of eip2537.msmGas.g2Msm) {
			expect(GasConstants.Precompile.calculateBls12G2MsmCost(BigInt(k))).toBe(
				BigInt(gas),
			);
		}
	});

	it("0x100 P256VERIFY (EIP-7951 Osaka): passes all 782 go-ethereum/Wycheproof conformance vectors", () => {
		const raw = readFileSync(
			new URL("./evm/precompiles/p256verify.vectors.txt", import.meta.url),
			"utf8",
		);
		const validOut = `${"00".repeat(31)}01`;
		let count = 0;

		for (const rawLine of raw.split("\n")) {
			const line = rawLine.trim();
			if (!line || line.startsWith("#")) continue;
			const [inputHex = "", expectedFlag = "0"] = line.split(" ");
			const res = execute(
				PrecompileAddress.P256_VERIFY,
				fromHex(inputHex),
				6900n,
				Hardfork.OSAKA,
			);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(6900n);
			expect(toHex(res.output)).toBe(expectedFlag === "1" ? validOut : "");
			count++;
		}

		expect(count).toBe(782);

		// OOG at 6899 gas halts; wrong input length returns empty with success: true
		expect(p256Verify(new Uint8Array(160), 6899n).success).toBe(false);
		const badLen = p256Verify(new Uint8Array(159), 6900n);
		expect(badLen.success).toBe(true);
		expect(badLen.output.length).toBe(0);
		expect(badLen.gasUsed).toBe(6900n);
	});
});

// ============================================================================
// 2. Wycheproof Crypto Edge Cases & NIST / RFC Hash Vectors
// ============================================================================

describe("Wycheproof Crypto Edge Cases & NIST/RFC Hash Vectors", () => {
	it("secp256k1: enforces low-s malleability, rejects zero/overflow scalars and invalid curve points", () => {
		const halfN = SECP256K1_N >> 1n;
		const priv = bigIntToBytes32(1n) as PrivateKeyType;
		const pub = Secp256k1.derivePublicKey(priv);
		const msgHash = Keccak256.hashString("wycheproof-secp256k1") as HashType;
		const sig = Secp256k1.sign(msgHash, priv);

		// Signer always produces low-s canonical signature
		expect(Secp256k1.isValidSignature(sig)).toBe(true);
		expect(Secp256k1.verify(sig, msgHash, pub)).toBe(true);
		expect(Secp256k1.recoverPublicKey(sig, msgHash)).toEqual(pub);

		// High-s malleable twin (s = n/2 + 1 and s = n - s_orig) rejected by isValidSignature
		expect(
			Secp256k1.isValidSignature({
				r: sig.r,
				s: bigIntToBytes32(halfN + 1n) as HashType,
				v: 27,
			}),
		).toBe(false);
		expect(
			Secp256k1.isValidSignature({
				r: sig.r,
				s: bigIntToBytes32(SECP256K1_N - 1n) as HashType,
				v: 27,
			}),
		).toBe(false);

		// Zero, order n, and overflow private scalars rejected
		expect(Secp256k1.isValidPrivateKey(new Uint8Array(32))).toBe(false);
		expect(Secp256k1.isValidPrivateKey(bigIntToBytes32(SECP256K1_N))).toBe(
			false,
		);
		expect(Secp256k1.isValidPrivateKey(bigIntToBytes32(SECP256K1_N + 1n))).toBe(
			false,
		);
		expect(Secp256k1.isValidPrivateKey(new Uint8Array(32).fill(0xff))).toBe(
			false,
		);
		expect(Secp256k1.isValidPrivateKey(bigIntToBytes32(SECP256K1_N - 1n))).toBe(
			true,
		);

		// Zero r/s and overflow r/s >= n rejected
		expect(
			Secp256k1.isValidSignature({
				r: new Uint8Array(32) as HashType,
				s: sig.s,
				v: 27,
			}),
		).toBe(false);
		expect(
			Secp256k1.isValidSignature({
				r: bigIntToBytes32(SECP256K1_N) as HashType,
				s: sig.s,
				v: 27,
			}),
		).toBe(false);

		// Invalid curve points (infinity all-zero, off-curve (1, 1), x >= p) rejected
		expect(Secp256k1.isValidPublicKey(new Uint8Array(64))).toBe(false);
		const offCurve = new Uint8Array(64);
		offCurve[31] = 1;
		offCurve[63] = 1;
		expect(Secp256k1.isValidPublicKey(offCurve)).toBe(false);
		const coordOverflow = new Uint8Array(64).fill(0xff);
		expect(Secp256k1.isValidPublicKey(coordOverflow)).toBe(false);
		expect(Secp256k1.isValidPublicKey(pub)).toBe(true);
	});

	it("P-256 (secp256r1): rejects point-at-infinity, off-curve points, x >= p, and non-canonical scalars", () => {
		const priv = bigIntToBytes32(7n) as unknown as Parameters<
			typeof P256.derivePublicKey
		>[0];
		const pub = P256.derivePublicKey(priv);
		const digest = SHA256.hashString("wycheproof-p256") as unknown as HashType;
		const sig = P256.sign(digest, priv);

		expect(P256.validatePrivateKey(priv)).toBe(true);
		expect(P256.validatePublicKey(pub)).toBe(true);
		expect(P256.verify(sig, digest, pub)).toBe(true);

		// Non-canonical private scalars: 0, n, n + 1, 2^256 - 1
		expect(
			P256.validatePrivateKey(
				new Uint8Array(32) as unknown as Parameters<
					typeof P256.validatePrivateKey
				>[0],
			),
		).toBe(false);
		expect(
			P256.validatePrivateKey(
				bigIntToBytes32(P256.CURVE_ORDER) as unknown as Parameters<
					typeof P256.validatePrivateKey
				>[0],
			),
		).toBe(false);
		expect(
			P256.validatePrivateKey(
				bigIntToBytes32(P256.CURVE_ORDER + 1n) as unknown as Parameters<
					typeof P256.validatePrivateKey
				>[0],
			),
		).toBe(false);
		expect(
			P256.validatePrivateKey(
				new Uint8Array(32).fill(0xff) as unknown as Parameters<
					typeof P256.validatePrivateKey
				>[0],
			),
		).toBe(false);

		// Point at infinity (0, 0)
		const infinity = new Uint8Array(64);
		expect(P256.validatePublicKey(infinity)).toBe(false);
		expect(
			P256.verify(
				sig,
				digest,
				infinity as unknown as Parameters<typeof P256.verify>[2],
			),
		).toBe(false);

		// Off-curve point (x, y + 1)
		const offCurve = new Uint8Array(pub);
		offCurve[63] = ((offCurve[63] ?? 0) + 1) & 0xff;
		expect(P256.validatePublicKey(offCurve)).toBe(false);
		expect(
			P256.verify(
				sig,
				digest,
				offCurve as unknown as Parameters<typeof P256.verify>[2],
			),
		).toBe(false);

		// Non-canonical coordinate x = p
		const xEqP = new Uint8Array(64);
		xEqP.set(bigIntToBytes32(P256.FIELD_PRIME), 0);
		expect(P256.validatePublicKey(xEqP)).toBe(false);

		// Invalid SEC1 hybrid prefix (0x06)
		const hybrid = new Uint8Array(65);
		hybrid[0] = 0x06;
		hybrid.set(pub, 1);
		expect(P256.validatePublicKey(hybrid)).toBe(false);
	});

	it("Ed25519: matches RFC 8032 vectors and rejects Wycheproof small-order and non-canonical points", () => {
		// RFC 8032 Section 7.1 Test Vector 1 (empty message)
		const seed1 = fromHex(
			"9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
		);
		const kp1 = Ed25519.keypairFromSeed(seed1);
		expect(toHex(kp1.publicKey)).toBe(
			"d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
		);
		const sig1 = Ed25519.sign(new Uint8Array(0), kp1.secretKey);
		expect(toHex(sig1)).toBe(
			"e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155" +
				"5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
		);
		expect(Ed25519.verify(sig1, new Uint8Array(0), kp1.publicKey)).toBe(true);

		// RFC 8032 Section 7.1 Test Vector 2 (1-byte message 0x72)
		const seed2 = fromHex(
			"4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb",
		);
		const kp2 = Ed25519.keypairFromSeed(seed2);
		expect(toHex(kp2.publicKey)).toBe(
			"3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
		);
		const sig2 = Ed25519.sign(Uint8Array.from([0x72]), kp2.secretKey);
		expect(toHex(sig2)).toBe(
			"92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da" +
				"085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00",
		);
		expect(Ed25519.verify(sig2, Uint8Array.from([0x72]), kp2.publicKey)).toBe(
			true,
		);

		// Wycheproof small-order torsion points (order 1, 2, 4, 8) MUST be rejected
		const smallOrderPoints = [
			"0100000000000000000000000000000000000000000000000000000000000000", // identity (order 1)
			"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f", // order 2
			"0000000000000000000000000000000000000000000000000000000000000000", // order 4
			"0000000000000000000000000000000000000000000000000000000000000080", // order 4
			"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a", // order 8
			"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa", // order 8
			"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05", // order 8
			"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85", // order 8
		];
		const forgedSig = new Uint8Array(64);
		forgedSig.set(fromHex(smallOrderPoints[0] ?? ""), 0); // R = identity, S = 0
		for (const ptHex of smallOrderPoints) {
			const pt = fromHex(ptHex) as unknown as Parameters<
				typeof Ed25519.verify
			>[2];
			expect(
				Ed25519.verify(
					forgedSig as unknown as Parameters<typeof Ed25519.verify>[0],
					new Uint8Array(0),
					pt,
				),
				`small-order ${ptHex}`,
			).toBe(false);
		}

		// Non-canonical field encoding y = p = 2^255 - 19 and y = 2^255 - 1
		for (const nonCanonical of [
			"edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
			"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
		]) {
			const badPk = fromHex(nonCanonical) as unknown as Parameters<
				typeof Ed25519.verify
			>[2];
			expect(Ed25519.verify(sig1, new Uint8Array(0), badPk)).toBe(false);
		}

		// Non-canonical signature scalar S >= L (group order L = 2^252 + 27742317777372353535851937790883648493)
		const badScalarSig = new Uint8Array(sig1);
		badScalarSig.set(
			fromHex(
				"edd3f55c1a631258d69cf7a2def9de1400000000000000000000000000000010",
			),
			32,
		);
		expect(
			Ed25519.verify(
				badScalarSig as unknown as Parameters<typeof Ed25519.verify>[0],
				new Uint8Array(0),
				kp1.publicKey,
			),
		).toBe(false);
	});

	it("NIST / RFC hash vectors: SHA-256, Keccak-256, RIPEMD-160, and BLAKE2b", () => {
		// SHA-256 (FIPS 180-4)
		expect(toHex(SHA256.hashString(""))).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(toHex(SHA256.hashString("abc"))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
		expect(
			toHex(
				SHA256.hashString(
					"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
				),
			),
		).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");

		// Keccak-256 (Ethereum Yellow Paper — pre-NIST 0x01 padding)
		expect(toHex(Keccak256.hashString(""))).toBe(
			"c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
		expect(toHex(Keccak256.hashString("abc"))).toBe(
			"4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
		);
		expect(toHex(Keccak256.hashString("testing"))).toBe(
			"5f16f4c7f149ac4f9510d9cf8cf384038ad348b3bcdc01915f95de12df9d1b02",
		);

		// RIPEMD-160 (ISO/IEC 10118-3)
		expect(toHex(Ripemd160.hashString(""))).toBe(
			"9c1185a5c5e9fc54612808977ee8f548b2258d31",
		);
		expect(toHex(Ripemd160.hashString("a"))).toBe(
			"0bdc9d2d256b3ee9daae347be6f4dc835a467ffe",
		);
		expect(toHex(Ripemd160.hashString("abc"))).toBe(
			"8eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
		);
		expect(toHex(Ripemd160.hashString("message digest"))).toBe(
			"5d0689ef49d2fae572b881b123a85ffa21595f36",
		);
		expect(toHex(Ripemd160.hashString("abcdefghijklmnopqrstuvwxyz"))).toBe(
			"f71c27109c692c1b56bbdceb5b9d2865b3708dbc",
		);

		// BLAKE2b (RFC 7693 Appendix A)
		expect(toHex(Blake2.hashString("", 64))).toBe(
			"786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419" +
				"d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
		);
		expect(toHex(Blake2.hashString("abc", 64))).toBe(
			"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1" +
				"7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
		);
		expect(toHex(Blake2.hashString("", 32))).toBe(
			"0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
		);
		expect(toHex(Blake2.hashString("abc", 32))).toBe(
			"bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
		);
	});
});

// ============================================================================
// 3. Hardfork Protocol Vectors (Frontier -> Prague -> Osaka -> Amsterdam)
// ============================================================================

describe("Hardfork Protocol Vectors (Frontier -> Prague/Pectra -> Osaka/Fusaka -> Amsterdam/Glamsterdam)", () => {
	it("maintains strict chronological hardfork order and EIP feature gates", () => {
		const sequence: HardforkType[] = [
			Hardfork.FRONTIER,
			Hardfork.HOMESTEAD,
			Hardfork.BYZANTIUM,
			Hardfork.ISTANBUL,
			Hardfork.BERLIN,
			Hardfork.LONDON,
			Hardfork.MERGE,
			Hardfork.SHANGHAI,
			Hardfork.CANCUN,
			Hardfork.PRAGUE,
			Hardfork.OSAKA,
			Hardfork.AMSTERDAM,
		];
		for (let i = 1; i < sequence.length; i++) {
			const prev = sequence[i - 1];
			const curr = sequence[i];
			expect(prev && curr && Hardfork.lt(prev, curr)).toBe(true);
			expect(prev && curr && Hardfork.isAtLeast(curr, prev)).toBe(true);
		}

		expect(Hardfork.hasEIP1559(Hardfork.BERLIN)).toBe(false);
		expect(Hardfork.hasEIP1559(Hardfork.LONDON)).toBe(true);
		expect(Hardfork.hasEIP3855(Hardfork.MERGE)).toBe(false);
		expect(Hardfork.hasEIP3855(Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.hasEIP4844(Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP4844(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP1153(Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP1153(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.LONDON)).toBe(false);
		expect(Hardfork.isPostMerge(Hardfork.AMSTERDAM)).toBe(true);
	});

	it("signs, serializes, deserializes, and recovers senders across all 5 tx envelopes (Legacy, 2930, 1559, 4844, 7702)", () => {
		const privKey = fromHex(
			"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		) as PrivateKeyType;
		const expectedSender = Address.fromPublicKey(
			Secp256k1.derivePublicKey(privKey),
		);
		const recipient = Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0");
		const slotHash = fromHex(`${"00".repeat(31)}01`) as HashType;
		const versionedHash = fromHex(
			"010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014",
		) as HashType;

		// Type 0: Legacy (EIP-155 chainId = 1 -> v = 37/38)
		const legacyDraft: Transaction.Legacy = {
			type: Transaction.Type.Legacy,
			nonce: 0n,
			gasPrice: 20_000_000_000n,
			gasLimit: 21_000n,
			to: recipient,
			value: 1_000_000_000_000_000_000n,
			data: new Uint8Array(0),
			v: 37n, // signals EIP-155 chainId = 1 to getSigningHash
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const legacySig = Secp256k1.sign(
			Transaction.getSigningHash(legacyDraft),
			privKey,
		);
		const legacySigned: Transaction.Legacy = {
			...legacyDraft,
			v: BigInt(legacySig.v - 27) + 37n,
			r: legacySig.r,
			s: legacySig.s,
		};
		const legacyRaw = Transaction.serialize(legacySigned);
		expect(Transaction.detectType(legacyRaw)).toBe(Transaction.Type.Legacy);
		const legacyDec = Transaction.deserialize(legacyRaw);
		expect(Transaction.getChainId(legacyDec)).toBe(1n);
		expect(
			Address.equals(Transaction.getSender(legacyDec), expectedSender),
		).toBe(true);

		// Type 1: EIP-2930 (Berlin)
		const tx2930Draft: Transaction.EIP2930 = {
			type: Transaction.Type.EIP2930,
			chainId: 1n,
			nonce: 1n,
			gasPrice: 20_000_000_000n,
			gasLimit: 30_000n,
			to: recipient,
			value: 0n,
			data: Uint8Array.from([0x12, 0x34]),
			accessList: [{ address: recipient, storageKeys: [slotHash] }],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const sig2930 = Secp256k1.sign(
			Transaction.getSigningHash(tx2930Draft),
			privKey,
		);
		const tx2930: Transaction.EIP2930 = {
			...tx2930Draft,
			yParity: sig2930.v - 27,
			r: sig2930.r,
			s: sig2930.s,
		};
		const raw2930 = Transaction.serialize(tx2930);
		expect(raw2930[0]).toBe(0x01);
		expect(Transaction.detectType(raw2930)).toBe(Transaction.Type.EIP2930);
		const dec2930 = Transaction.deserialize(raw2930);
		expect(Transaction.verifySignature(dec2930)).toBe(true);
		expect(Address.equals(Transaction.getSender(dec2930), expectedSender)).toBe(
			true,
		);

		// Type 2: EIP-1559 (London)
		const tx1559Draft: Transaction.EIP1559 = {
			type: Transaction.Type.EIP1559,
			chainId: 1n,
			nonce: 2n,
			maxPriorityFeePerGas: 2_000_000_000n,
			maxFeePerGas: 50_000_000_000n,
			gasLimit: 21_000n,
			to: recipient,
			value: 100n,
			data: new Uint8Array(0),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const sig1559 = Secp256k1.sign(
			Transaction.getSigningHash(tx1559Draft),
			privKey,
		);
		const tx1559: Transaction.EIP1559 = {
			...tx1559Draft,
			yParity: sig1559.v - 27,
			r: sig1559.r,
			s: sig1559.s,
		};
		const raw1559 = Transaction.serialize(tx1559);
		expect(raw1559[0]).toBe(0x02);
		const dec1559 = Transaction.deserialize(raw1559);
		expect(Transaction.verifySignature(dec1559)).toBe(true);
		expect(Address.equals(Transaction.getSender(dec1559), expectedSender)).toBe(
			true,
		);

		// Type 3: EIP-4844 (Cancun Blob Transaction)
		const tx4844Draft: Transaction.EIP4844 = {
			type: Transaction.Type.EIP4844,
			chainId: 1n,
			nonce: 3n,
			maxPriorityFeePerGas: 1_000_000_000n,
			maxFeePerGas: 30_000_000_000n,
			gasLimit: 21_000n,
			to: recipient,
			value: 0n,
			data: new Uint8Array(0),
			accessList: [],
			maxFeePerBlobGas: 10_000_000_000n,
			blobVersionedHashes: [versionedHash],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const sig4844 = Secp256k1.sign(
			Transaction.getSigningHash(tx4844Draft),
			privKey,
		);
		const tx4844: Transaction.EIP4844 = {
			...tx4844Draft,
			yParity: sig4844.v - 27,
			r: sig4844.r,
			s: sig4844.s,
		};
		const raw4844 = Transaction.serialize(tx4844);
		expect(raw4844[0]).toBe(0x03);
		const dec4844 = Transaction.deserialize(raw4844);
		expect(Transaction.getBlobCount(dec4844)).toBe(1);
		expect(Transaction.verifySignature(dec4844)).toBe(true);
		expect(Address.equals(Transaction.getSender(dec4844), expectedSender)).toBe(
			true,
		);

		// Type 4: EIP-7702 (Prague/Pectra Set-Code Authorization Transaction)
		expect(Authorization.MAGIC_BYTE).toBe(0x05);
		expect(Authorization.PER_AUTH_BASE_COST).toBe(12_500n);
		expect(Authorization.PER_EMPTY_ACCOUNT_COST).toBe(25_000n);
		const signedAuth = Authorization.sign(
			{ chainId: 1n, address: recipient, nonce: 0n },
			privKey,
		);
		const recoveredAuth = Authorization.verify(signedAuth);
		expect(Address.equals(recoveredAuth, expectedSender)).toBe(true);
		expect(Authorization.calculateGasCost([signedAuth], 1)).toBe(37_500n);

		const tx7702Draft: Transaction.EIP7702 = {
			type: Transaction.Type.EIP7702,
			chainId: 1n,
			nonce: 4n,
			maxPriorityFeePerGas: 1_000_000_000n,
			maxFeePerGas: 30_000_000_000n,
			gasLimit: 100_000n,
			to: recipient,
			value: 0n,
			data: new Uint8Array(0),
			accessList: [],
			authorizationList: [
				{
					chainId: signedAuth.chainId,
					address: signedAuth.address,
					nonce: signedAuth.nonce,
					yParity: signedAuth.yParity,
					r: signedAuth.r,
					s: signedAuth.s,
				},
			],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const sig7702 = Secp256k1.sign(
			Transaction.getSigningHash(tx7702Draft),
			privKey,
		);
		const tx7702: Transaction.EIP7702 = {
			...tx7702Draft,
			yParity: sig7702.v - 27,
			r: sig7702.r,
			s: sig7702.s,
		};
		const raw7702 = Transaction.serialize(tx7702);
		expect(raw7702[0]).toBe(0x04);
		const dec7702 = Transaction.deserialize(raw7702);
		expect(Transaction.getAuthorizationCount(dec7702)).toBe(1);
		expect(Transaction.verifySignature(dec7702)).toBe(true);
		expect(Address.equals(Transaction.getSender(dec7702), expectedSender)).toBe(
			true,
		);
	});

	it("EIP-7691 / EIP-7892 BPO / EIP-7918: matches exact blob schedules, timestamps, and reserve pricing", () => {
		// Schedule presets
		expect(FeeMarket.BlobSchedule.CANCUN).toEqual({
			target: 3n,
			max: 6n,
			baseFeeUpdateFraction: 3_338_477n,
		});
		expect(FeeMarket.BlobSchedule.PRAGUE).toEqual({
			target: 6n,
			max: 9n,
			baseFeeUpdateFraction: 5_007_716n,
		});
		expect(FeeMarket.BlobSchedule.BPO1).toEqual({
			target: 10n,
			max: 15n,
			baseFeeUpdateFraction: 8_346_193n,
		});
		expect(FeeMarket.BlobSchedule.BPO2).toEqual({
			target: 14n,
			max: 21n,
			baseFeeUpdateFraction: 11_684_671n,
		});

		// Mainnet activation timestamp resolution (EIP-7892)
		expect(
			FeeMarket.BlobSchedule.forTimestamp(
				FeeMarket.BlobSchedule.CANCUN_TIMESTAMP,
			),
		).toEqual(FeeMarket.BlobSchedule.CANCUN);
		expect(
			FeeMarket.BlobSchedule.forTimestamp(
				FeeMarket.BlobSchedule.PRAGUE_TIMESTAMP,
			),
		).toEqual(FeeMarket.BlobSchedule.PRAGUE);
		expect(
			FeeMarket.BlobSchedule.forTimestamp(
				FeeMarket.BlobSchedule.BPO1_TIMESTAMP,
			),
		).toEqual(FeeMarket.BlobSchedule.BPO1);
		expect(
			FeeMarket.BlobSchedule.forTimestamp(
				FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
			),
		).toEqual(FeeMarket.BlobSchedule.BPO2);

		// Cross-language execution-specs fake_exponential blob base fee vectors
		expect(
			FeeMarket.calculateBlobBaseFee(
				2_314_058n,
				FeeMarket.BlobSchedule.CANCUN.baseFeeUpdateFraction,
			),
		).toBe(2n);
		expect(
			FeeMarket.calculateBlobBaseFee(
				100_000_000n,
				FeeMarket.BlobSchedule.PRAGUE.baseFeeUpdateFraction,
			),
		).toBe(470_442_149n);
		expect(
			FeeMarket.calculateBlobBaseFee(
				100_000_000n,
				FeeMarket.BlobSchedule.BPO1.baseFeeUpdateFraction,
			),
		).toBe(159_773n);
		expect(
			FeeMarket.calculateBlobBaseFee(
				100_000_000n,
				FeeMarket.BlobSchedule.BPO2.baseFeeUpdateFraction,
			),
		).toBe(5_209n);

		// EIP-7918 Osaka reserve price: 9 blobs used (max) with high execution base fee triggers reserve branch
		const maxOsakaBlobGas = 9n * FeeMarket.BlobSchedule.GAS_PER_BLOB; // 1,179,648
		const excessReserve = FeeMarket.calculateExcessBlobGas(
			0n,
			maxOsakaBlobGas,
			{
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 1_000_000_000n,
			},
		);
		// (1,179,648 * (9 - 6)) / 9 = 393,216
		expect(excessReserve).toBe(393_216n);

		// When blob base fee already exceeds reserve bound (baseFee = 1 wei), standard subtraction applies
		const excessNormal = FeeMarket.calculateExcessBlobGas(
			100_000_000n,
			maxOsakaBlobGas,
			{
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 1n,
			},
		);
		expect(excessNormal).toBe(
			100_000_000n + maxOsakaBlobGas - 6n * FeeMarket.BlobSchedule.GAS_PER_BLOB,
		);
	});

	it("EIP-7825 Osaka tx gas limit cap (2^24 = 16,777,216) and EIP-7939 CLZ opcode (0x1e)", () => {
		// EIP-7825
		expect(Transaction.MAX_TX_GAS_LIMIT).toBe(16_777_216n);
		expect(GasConstants.TxGasLimitOsaka).toBe(16_777_216n);

		const capTx = { gasLimit: 16_777_216n };
		const overCapTx = { gasLimit: 16_777_217n };
		expect(Transaction.exceedsTxGasLimit(capTx, Hardfork.OSAKA)).toBe(false);
		expect(Transaction.exceedsTxGasLimit(overCapTx, Hardfork.OSAKA)).toBe(true);
		expect(Transaction.exceedsTxGasLimit(overCapTx, Hardfork.AMSTERDAM)).toBe(
			true,
		);
		expect(Transaction.exceedsTxGasLimit(overCapTx, Hardfork.PRAGUE)).toBe(
			false,
		);

		expect(() =>
			Transaction.validateGasLimit_internal.call(capTx, {
				hardfork: Hardfork.OSAKA,
			}),
		).not.toThrow();
		expect(() =>
			Transaction.validateGasLimit_internal.call(overCapTx, {
				hardfork: Hardfork.OSAKA,
			}),
		).toThrow(/EIP-7825/);

		// EIP-7939 CLZ (0x1e)
		expect(Opcode.CLZ).toBe(0x1e);

		const clzVectors: Array<[bigint, bigint]> = [
			[0n, 256n],
			[1n, 255n],
			[1n << 255n, 0n],
			[(1n << 256n) - 1n, 0n],
			[(1n << 255n) - 1n, 1n],
			[1n << 128n, 127n],
		];
		for (const [input, expected] of clzVectors) {
			const frame = makeClzFrame([input], 5n, Hardfork.OSAKA);
			expect(clzHandle(frame)).toBeNull();
			expect(frame.stack).toEqual([expected]);
			expect(frame.gasRemaining).toBe(0n);
		}

		// Fork gating & OOG
		expect(clzHandle(makeClzFrame([1n], 100n, Hardfork.PRAGUE))).toEqual({
			type: "InvalidOpcode",
		});
		expect(clzHandle(makeClzFrame([1n], 100n, Hardfork.AMSTERDAM))).toBeNull();
		expect(clzHandle(makeClzFrame([1n], 4n, Hardfork.OSAKA))).toEqual({
			type: "OutOfGas",
		});
	});

	it("Amsterdam/Glamsterdam: verifies EIP-7928 BlockAccessList, EIP-7732 ExecutionPayloadBid, and EIP-8037/8038 gas constants", () => {
		// EIP-7928 Block Access List (cross-checked with Zig reference vector)
		const emptyBal = BlockAccessList.from([]);
		expect(Hex.fromBytes(BlockAccessList.calculateHash(emptyBal))).toBe(
			BlockAccessList.EMPTY_BLOCK_ACCESS_LIST_HASH,
		);

		const bal = BlockAccessList.from([
			{ address: "0x00000000000000000000000000000000000000bb" },
			{
				address: "0x00000000000000000000000000000000000000aa",
				storageChanges: [
					{
						slot: 256n,
						changes: [{ blockAccessIndex: 3, newValue: 1n << 255n }],
					},
					{
						slot: 1n,
						changes: [
							{ blockAccessIndex: 2, newValue: 0n },
							{ blockAccessIndex: 1, newValue: 42n },
						],
					},
				],
				storageReads: [2n, 0n],
				balanceChanges: [{ blockAccessIndex: 1, postBalance: 1000n }],
				nonceChanges: [{ blockAccessIndex: 1, newNonce: 1n }],
				codeChanges: [{ blockAccessIndex: 2, newCode: "0x6000" }],
			},
		]);
		const rlp = BlockAccessList.toRlp(bal);
		const balHash = Hex.fromBytes(BlockAccessList.calculateHash(bal));
		expect(balHash).toBe(
			"0x7a6e55bde06c036cc607ef0262a5c3f46eba0d9a8a4a991334d72295a92696a2",
		);
		expect(BlockAccessList.fromRlp(rlp)).toEqual(bal);

		// EIP-7732 ePBS ExecutionPayloadBid
		expect(ExecutionPayloadBid.BUILDER_INDEX_SELF_BUILD).toBe(2n ** 64n - 1n);
		expect(ExecutionPayloadBid.DOMAIN_BEACON_BUILDER).toBe("0x0B000000");
		const signedBid = ExecutionPayloadBid.fromSigned({
			message: {
				parentBlockHash: `0x${"11".repeat(32)}`,
				parentBlockRoot: `0x${"22".repeat(32)}`,
				blockHash: `0x${"33".repeat(32)}`,
				prevRandao: `0x${"44".repeat(32)}`,
				feeRecipient: `0x${"55".repeat(20)}`,
				gasLimit: 60_000_000n,
				builderIndex: ExecutionPayloadBid.BUILDER_INDEX_SELF_BUILD,
				slot: 13_164_544n,
				value: 0n,
				executionPayment: 0n,
				blobKzgCommitments: [`0x${"66".repeat(48)}`],
				executionRequestsRoot: `0x${"88".repeat(32)}`,
			},
			signature: `0x${"99".repeat(96)}`,
		});
		expect(signedBid.signature.byteLength).toBe(96);
		expect(signedBid.message.blobKzgCommitments[0]?.byteLength).toBe(48);
		expect(() =>
			ExecutionPayloadBid.fromSigned({
				message: {
					parentBlockHash: `0x${"11".repeat(32)}`,
					parentBlockRoot: `0x${"22".repeat(32)}`,
					blockHash: `0x${"33".repeat(32)}`,
					prevRandao: `0x${"44".repeat(32)}`,
					feeRecipient: `0x${"55".repeat(20)}`,
					gasLimit: 60_000_000n,
					builderIndex: 1n,
					slot: 1n,
					value: 0n,
					executionPayment: 0n,
					blobKzgCommitments: [],
					executionRequestsRoot: `0x${"88".repeat(32)}`,
				},
				signature: `0x${"99".repeat(64)}`, // must be 96 bytes
			}),
		).toThrow();

		// EIP-8037 & EIP-8038 Amsterdam state gas & access repricing
		expect(GasConstants.AmsterdamCostPerStateByte).toBe(1530n);
		expect(GasConstants.AmsterdamStateGasStorageSet).toBe(97_920n);
		expect(GasConstants.AmsterdamStateGasNewAccount).toBe(183_600n);
		expect(GasConstants.AmsterdamColdAccountAccess).toBe(3000n);
		expect(GasConstants.AmsterdamColdStorageAccess).toBe(2100n);
		expect(GasConstants.AmsterdamWarmAccess).toBe(100n);
	});

	it("Standards & Proofs: EIP-1186 MPT proofs, EIP-55, EIP-191, EIP-1191, EIP-712, and ERC-8010", () => {
		// 1. EIP-1186 / Yellow Paper Merkle Patricia Trie root & inclusion/non-inclusion proofs
		const emptyTrie = Trie.init();
		expect(toHex(Trie.rootHash(emptyTrie))).toBe(
			"56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
		);
		const enc = new TextEncoder();

		// Exact Yellow Paper single-leaf keccak256(RLP([compact_leaf("a"), "a"*32])) vector
		const singleLeaf = Trie.put(
			emptyTrie,
			enc.encode("a"),
			enc.encode("a".repeat(32)),
		);
		expect(toHex(Trie.rootHash(singleLeaf))).toBe(
			"b6efa2e8269c59a22dc2d07be9ccbf540727e4a2023b286a096cd89cafc0927c",
		);

		// EIP-1186 state-trie keys (32-byte keccak256(address) keys -> account RLP values)
		const keyA = Keccak256.hash(
			Address("0x1111111111111111111111111111111111111111"),
		);
		const keyB = Keccak256.hash(
			Address("0x2222222222222222222222222222222222222222"),
		);
		const keyMissing = Keccak256.hash(
			Address("0x3333333333333333333333333333333333333333"),
		);
		const valA = new Uint8Array(40).fill(0xaa);
		const valB = new Uint8Array(40).fill(0xbb);

		let trie = Trie.put(emptyTrie, keyA, valA);
		trie = Trie.put(trie, keyB, valB);
		const trieReverse = Trie.put(Trie.put(emptyTrie, keyB, valB), keyA, valA);
		const root = Trie.rootHash(trie);
		expect(toHex(root)).toBe(toHex(Trie.rootHash(trieReverse)));

		const incProof = Trie.prove(trie, keyA);
		const incResult = Trie.verify(root, keyA, incProof.proof);
		expect(incResult.valid).toBe(true);
		expect(incResult.value).toEqual(valA);

		const nonIncProof = Trie.prove(trie, keyMissing);
		const nonIncResult = Trie.verify(root, keyMissing, nonIncProof.proof);
		expect(nonIncResult.valid).toBe(true);
		expect(nonIncResult.value).toBeNull();

		// Tampered proof fails verification
		const tamperedProof = incProof.proof.map((n) => new Uint8Array(n));
		const lastNode = tamperedProof[tamperedProof.length - 1];
		if (lastNode) lastNode[lastNode.length - 1] ^= 0xff;
		expect(Trie.verify(root, keyA, tamperedProof).valid).toBe(false);

		// 2. EIP-55 official mixed-case checksum vectors
		const eip55Vectors = [
			"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			"0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
			"0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB",
			"0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb",
			"0x52908400098527886E0F7030069857D2E4169EE7",
			"0x8617E340B3D01FA5F11F306F4090FD50E238070D",
			"0xde709f2102306220921060314715629080e2fb77",
			"0x27b1fdb04752bbc536007a920d24acb045561c26",
		];
		for (const expected of eip55Vectors) {
			const addr = Address(expected.toLowerCase());
			expect(Address.toChecksummed(addr)).toBe(expected);
			expect(Address.isValidChecksum(expected)).toBe(true);
		}
		expect(
			Address.isValidChecksum("0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
		).toBe(false);

		// 3. EIP-1191 chain-specific checksum vectors (RSK mainnet 30 & testnet 31)
		const toEip1191 = (rawAddr: AddressType, chainId: number): string => {
			const hex = Address.toHex(rawAddr).slice(2);
			const hashHex = toHex(Keccak256.hashString(`${chainId}0x${hex}`));
			let out = "0x";
			for (let i = 0; i < hex.length; i++) {
				const ch = hex[i] ?? "";
				const nibble = Number.parseInt(hashHex[i] ?? "0", 16);
				out += nibble >= 8 ? ch.toUpperCase() : ch;
			}
			return out;
		};
		expect(
			toEip1191(Address("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"), 30),
		).toBe("0x5aaEB6053f3e94c9b9a09f33669435E7ef1bEAeD");
		expect(
			toEip1191(Address("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"), 30),
		).toBe("0xFb6916095cA1Df60bb79ce92cE3EA74c37c5d359");
		expect(
			toEip1191(Address("0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb"), 30),
		).toBe("0xDBF03B407c01E7CD3cBea99509D93F8Dddc8C6FB");
		expect(
			toEip1191(Address("0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb"), 31),
		).toBe("0xdbF03B407C01E7cd3cbEa99509D93f8dDDc8C6fB");
		expect(
			toEip1191(Address("0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb"), 31),
		).toBe("0xd1220a0CF47c7B9Be7A2E6Ba89f429762E7b9adB");

		// 4. EIP-191 SignedData (0x00, 0x01, 0x45 personal_sign)
		const hashPersonal = SignedData.Hash({ keccak256: Keccak256.hash });
		const verifyPersonal = SignedData.Verify({
			keccak256: Keccak256.hash,
			recoverPublicKey: Secp256k1.recoverPublicKey,
			addressFromPublicKey: Address.fromPublicKey,
		});
		const signerKey = fromHex(
			"4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",
		) as PrivateKeyType;
		const signerAddr = Address.fromPublicKey(
			Secp256k1.derivePublicKey(signerKey),
		);
		const personalDigest = hashPersonal("Hello World") as HashType;
		const personalSig = Secp256k1.sign(personalDigest, signerKey);
		expect(verifyPersonal("Hello World", personalSig, signerAddr)).toBe(true);
		const v00 = SignedData.from(
			SignedData.VERSION_DATA_WITH_VALIDATOR,
			signerAddr,
			enc.encode("payload"),
		);
		expect(v00[0]).toBe(0x19);
		expect(v00[1]).toBe(0x00);

		// 5. EIP-712 official "Ether Mail" spec vector (exact domain, struct, and final digest)
		const mailTypedData: TypedData = {
			domain: {
				name: "Ether Mail",
				version: "1",
				chainId: 1n,
				verifyingContract: Address.fromHex(
					"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
				),
			},
			types: {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "string" },
				],
			},
			primaryType: "Mail",
			message: {
				from: {
					name: "Cow",
					wallet: Address.fromHex("0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"),
				},
				to: {
					name: "Bob",
					wallet: Address.fromHex("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
				},
				contents: "Hello, Bob!",
			},
		};
		expect(toHex(EIP712.Domain.hash(mailTypedData.domain))).toBe(
			"f2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f",
		);
		expect(
			toHex(
				EIP712.hashStruct("Mail", mailTypedData.message, mailTypedData.types),
			),
		).toBe("c52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e");
		expect(toHex(EIP712.hashTypedData(mailTypedData))).toBe(
			"be609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2",
		);

		// 6. ERC-8010 pre-delegation signature wrapper (EIP-7702 + 32-byte 0x8010..8010 magic trailer)
		const authFor8010 = Authorization.sign(
			{
				chainId: 1n,
				address: Address("0x0000000000000000000000000000000000000001"),
				nonce: 2n,
			},
			signerKey,
		);
		let rBig = 0n;
		for (const b of authFor8010.r) rBig = (rBig << 8n) | BigInt(b);
		let sBig = 0n;
		for (const b of authFor8010.s) sBig = (sBig << 8n) | BigInt(b);
		const wrapped = SignatureErc8010.wrap({
			authorization: {
				address: "0x0000000000000000000000000000000000000001",
				chainId: 1,
				nonce: 2n,
				yParity: authFor8010.yParity,
				r: rBig,
				s: sBig,
			},
			to: "0x0000000000000000000000000000000000000002",
			data: "0xabcdef",
			signature: "0x1234ab",
		});
		expect(SignatureErc8010.validate(wrapped)).toBe(true);
		expect(wrapped.endsWith("8010".repeat(16))).toBe(true);
		const unwrapped = SignatureErc8010.unwrap(wrapped);
		expect(unwrapped.signature).toBe("0x1234ab");
		expect(unwrapped.to).toBe("0x0000000000000000000000000000000000000002");
		expect(unwrapped.data).toBe("0xabcdef");
		expect(unwrapped.authorization.nonce).toBe(2n);
		expect(unwrapped.authorization.r).toBe(rBig);
		expect(unwrapped.authorization.s).toBe(sBig);
	});
});
