import { readFileSync } from "node:fs";
import { p256 } from "@noble/curves/nist.js";
import { describe, expect, it } from "vitest";
import * as Gas from "../../primitives/GasConstants/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	P256VERIFY_ADDRESS,
	P256VERIFY_GAS,
	P256VERIFY_INPUT_LENGTH,
	p256Verify,
	p256verify,
	verifyP256,
} from "./p256verify.js";
import { execute, isPrecompile, PrecompileAddress } from "./precompiles.js";

const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const MAX_UINT256 = (1n << 256n) - 1n;

// Reference EIP-7951 / RIP-7212 test vector
const H = 0xa82b78501f418ef01de9d97e884bd8fe66aa6fd438d585d5cb7fa88db3f21a40n;
const R = 0x471c3e758c4904285bba7e53118ed0f524adeb0757d25bd2f8e7b0d76dfa714cn;
const S_LOW =
	0x091c7ae3b0636fa73f8300d67e54865d204c5487c7fe83dd1d67b0c249c433ben;
const S_HIGH = N - S_LOW;
const QX = 0x60fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6n;
const QY = 0x7903fe1008b8bc99a41ae9e95628bc64f2f1b20c2d7e9f5177a3c294d4462299n;

// Signatures by the same key over h = 0 and h = 2^256 - 1
const S_HASH_ZERO =
	0x7eec549ecb64d21ec59e76f8c3a92a9e30060e845c4c12967c4d30d29382af87n;
const S_HASH_MAX =
	0x97ac5dc2d435b3f42c69d1c33dfc818b0d251e267dd6dd49583c836bb105be39n;

// Point with x = 0 on secp256r1: (0, sqrt(b))
const SQRT_B =
	0x66485c780e2f83d72433bd5d84a06bb6541c2af31dae871728bf856a174f93f4n;

// Point with x = n + 3 >= n on secp256r1 (exercises R.x mod n == r when R.x >= n)
const X_GE_N = N + 3n;
const Y_FOR_X_GE_N =
	0x484f0c0fda434ef0a808458914f328715d7a545e198ac7eee31dffe861b5d23fn;

const SUCCESS = new Uint8Array(32);
SUCCESS[31] = 1;

function encode(
	h: bigint,
	r: bigint,
	s: bigint,
	qx: bigint,
	qy: bigint,
): Uint8Array {
	const out = new Uint8Array(160);
	for (const [field, value] of [h, r, s, qx, qy].entries()) {
		let remaining = value;
		for (let byte = 31; byte >= 0; byte--) {
			out[field * 32 + byte] = Number(remaining & 0xffn);
			remaining >>= 8n;
		}
	}
	return out;
}

function fromHex(hex: string): Uint8Array {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

function expectValid(input: Uint8Array): void {
	expect(p256Verify(input, P256VERIFY_GAS)).toEqual({
		success: true,
		output: SUCCESS,
		gasUsed: 6900n,
	});
}

function expectInvalid(input: Uint8Array): void {
	expect(p256Verify(input, P256VERIFY_GAS)).toEqual({
		success: true,
		output: new Uint8Array(0),
		gasUsed: 6900n,
	});
}

describe("P256VERIFY constants (EIP-7951)", () => {
	it("uses address 0x0100, 6900 gas, and 160-byte input", () => {
		expect(P256VERIFY_ADDRESS).toBe(
			"0x0000000000000000000000000000000000000100",
		);
		expect(PrecompileAddress.P256_VERIFY).toBe(P256VERIFY_ADDRESS);
		expect(P256VERIFY_GAS).toBe(6900n);
		expect(Gas.P256VERIFY_GAS).toBe(6900n);
		expect(Gas.Precompile.P256VERIFY_GAS).toBe(6900n);
		expect(Gas.Precompile.P256Verify).toBe(6900n);
		expect(Gas.Precompile.calculateP256VerifyCost()).toBe(6900n);
		expect(P256VERIFY_INPUT_LENGTH).toBe(160);
		expect(p256verify).toBe(p256Verify);
	});
});

describe("P256VERIFY valid signatures & EIP-7951 edge cases", () => {
	it("accepts valid low-s and high-s signatures", () => {
		expect(S_LOW).toBeLessThanOrEqual(N / 2n);
		expect(S_HIGH).toBeGreaterThan(N / 2n);
		expectValid(encode(H, R, S_LOW, QX, QY));
		expectValid(encode(H, R, S_HIGH, QX, QY));
	});

	it("accepts h = 0, h = n, and h = 2^256 - 1 without re-hashing", () => {
		// h = 0 and h = n both reduce to 0 mod n
		expectValid(encode(0n, R, S_HASH_ZERO, QX, QY));
		expectValid(encode(N, R, S_HASH_ZERO, QX, QY));
		expectValid(encode(0n, R, N - S_HASH_ZERO, QX, QY));
		expectValid(encode(MAX_UINT256, R, S_HASH_MAX, QX, QY));
		// h and h + n verify identically when h + n < 2^256
		const smallH = 0x1234n;
		const smallHPlusN = smallH + N;
		const base = p256.Point.BASE.toAffine();
		// Private key d = 1, nonce k = 1 => r = G.x, s = (h + r) mod n
		const sForSmallH = (smallH + base.x) % N;
		expectValid(encode(smallH, base.x, sForSmallH, base.x, base.y));
		expectValid(encode(smallHPlusN, base.x, sForSmallH, base.x, base.y));
	});

	it("reduces recovered R.x modulo n (accepts R.x == r + n)", () => {
		// With h ≡ 0 (mod n) and r = s = 3, u1 = 0, u2 = 1 => R = Q.
		// Q.x = n + 3, so R.x mod n == 3 == r.
		expectValid(encode(0n, 3n, 3n, X_GE_N, Y_FOR_X_GE_N));
		expectValid(encode(N, 3n, 3n, X_GE_N, Y_FOR_X_GE_N));
		expectValid(encode(0n, 3n, N - 3n, X_GE_N, Y_FOR_X_GE_N));
	});

	it("accepts on-curve public key with qx = 0 (not infinity)", () => {
		// With h = 0, r = s = 1, Q = (0, sqrt(b)) is on curve, R = Q => R.x = 0 != 1,
		// so test with Q = G + (0, sqrt(b)) or verify verifyP256 accepts qx=0 point via valid sig:
		// Choose k such that R = (0, sqrt(b)) is impossible for r=0, instead verify signing with Q = (0, sqrt(b))
		// Actually, Q = (0, sqrt(b)) is a valid generator multiple; choose u1=1, u2=1 so R = G + Q:
		const q = p256.Point.fromAffine({ x: 0n, y: SQRT_B });
		const Rpt = p256.Point.BASE.add(q).toAffine();
		const r = Rpt.x % N;
		// Need u1 = h * s^-1 = 1 and u2 = r * s^-1 = 1 => s = r, h = r
		expectValid(encode(r, r, r, 0n, SQRT_B));
	});

	it("verifies freshly generated noble signatures (both low-s and high-s)", () => {
		for (let seed = 1; seed <= 5; seed++) {
			const priv = new Uint8Array(32);
			priv[31] = seed * 17;
			const pub = p256.getPublicKey(priv, false);
			const msgHash = new Uint8Array(32);
			msgHash[0] = seed;
			msgHash[31] = seed ^ 0xaa;
			const sig = p256.sign(msgHash, priv, {
				prehash: false,
				lowS: true,
			});

			const input = new Uint8Array(160);
			input.set(msgHash, 0);
			input.set(sig, 32);
			input.set(pub.subarray(1, 65), 96);
			expectValid(input);

			// Flip s -> n - s (high-s twin)
			let s = 0n;
			for (let i = 0; i < 32; i++) {
				s = (s << 8n) | BigInt(sig[32 + i] ?? 0);
			}
			const sHigh = N - s;
			const highInput = new Uint8Array(input);
			let rem = sHigh;
			for (let i = 31; i >= 0; i--) {
				highInput[64 + i] = Number(rem & 0xffn);
				rem >>= 8n;
			}
			expectValid(highInput);
		}
	});
});

describe("P256VERIFY invalid inputs return empty output (never revert)", () => {
	it("rejects wrong input lengths (strictly 160 bytes)", () => {
		const valid = encode(H, R, S_LOW, QX, QY);
		for (const len of [0, 1, 32, 159, 161, 192, 320]) {
			const input = new Uint8Array(len);
			input.set(valid.subarray(0, Math.min(len, 160)));
			expectInvalid(input);
		}
	});

	it("rejects out-of-range r and s (0, n, n+1, maxUint256)", () => {
		for (const bad of [0n, N, N + 1n, MAX_UINT256]) {
			expectInvalid(encode(H, bad, S_LOW, QX, QY));
			expectInvalid(encode(H, R, bad, QX, QY));
		}
	});

	it("rejects invalid public keys (qx>=p, qy>=p, infinity, (0,1), off-curve)", () => {
		expectInvalid(encode(H, R, S_LOW, P, QY));
		expectInvalid(encode(H, R, S_LOW, P + 1n, QY));
		expectInvalid(encode(H, R, S_LOW, MAX_UINT256, QY));
		expectInvalid(encode(H, R, S_LOW, QX, P));
		expectInvalid(encode(H, R, S_LOW, QX, P + 1n));
		expectInvalid(encode(H, R, S_LOW, QX, MAX_UINT256));
		// Point at infinity (0, 0) and affine identity artifact (0, 1)
		expectInvalid(encode(H, R, S_LOW, 0n, 0n));
		expectInvalid(encode(H, R, S_LOW, 0n, 1n));
		// Off-curve point
		expectInvalid(encode(H, R, S_LOW, QX, (QY + 1n) % P));
	});

	it("rejects wrong hash, wrong signature, and recovered point at infinity R = O", () => {
		expectInvalid(encode(H ^ 1n, R, S_LOW, QX, QY));
		expectInvalid(encode(H, R ^ 1n, S_LOW, QX, QY));
		expectInvalid(encode(H, R, S_LOW ^ 1n, QX, QY));
		// R = u1*G + u2*Q = O: Q = G, h = n - 1, r = 1, s = 1 => (-1)*G + 1*G = O
		const base = p256.Point.BASE.toAffine();
		expectInvalid(encode(N - 1n, 1n, 1n, base.x, base.y));
	});
});

describe("P256VERIFY gas & Osaka hardfork gating", () => {
	it("returns Out of gas consuming gasLimit when gasLimit < 6900 (checked before length)", () => {
		const valid = encode(H, R, S_LOW, QX, QY);
		for (const input of [valid, new Uint8Array(0), new Uint8Array(159)]) {
			for (const gasLimit of [0n, 1n, 6899n]) {
				const res = p256Verify(input, gasLimit);
				expect(res).toEqual({
					success: false,
					output: new Uint8Array(0),
					gasUsed: gasLimit,
					error: "Out of gas",
				});
			}
		}
		// Exact gas succeeds
		expectValid(valid);
		// Extra gas still charges 6900
		expect(p256Verify(valid, 100_000n).gasUsed).toBe(6900n);
	});

	it("gates 0x0100 strictly to Osaka+ in isPrecompile and execute", () => {
		const addr = PrecompileAddress.P256_VERIFY;
		const valid = encode(H, R, S_LOW, QX, QY);

		for (const fork of [
			Hardfork.FRONTIER,
			Hardfork.BYZANTIUM,
			Hardfork.ISTANBUL,
			Hardfork.CANCUN,
			Hardfork.PRAGUE,
		]) {
			expect(isPrecompile(addr, fork)).toBe(false);
			const res = execute(addr, valid, 100_000n, fork);
			expect(res.success).toBe(false);
			expect(res.gasUsed).toBe(0n);
			expect(res.output.length).toBe(0);
		}

		expect(isPrecompile(addr, Hardfork.OSAKA)).toBe(true);
		expect(isPrecompile(addr.toUpperCase(), Hardfork.OSAKA)).toBe(true);
		expect(execute(addr, valid, 100_000n, Hardfork.OSAKA)).toEqual({
			success: true,
			output: SUCCESS,
			gasUsed: 6900n,
		});

		// Adjacent addresses are NOT precompiles
		expect(
			isPrecompile(
				"0x0000000000000000000000000000000000000014",
				Hardfork.OSAKA,
			),
		).toBe(false);
		expect(
			isPrecompile(
				"0x00000000000000000000000000000000000000ff",
				Hardfork.OSAKA,
			),
		).toBe(false);
		expect(
			isPrecompile(
				"0x0000000000000000000000000000000000000101",
				Hardfork.OSAKA,
			),
		).toBe(false);
	});
});

describe("P256VERIFY official go-ethereum / Wycheproof conformance vectors", () => {
	it("passes all 782 EIP-7951 conformance vectors", () => {
		const raw = readFileSync(
			new URL("./p256verify.vectors.txt", import.meta.url),
			"utf8",
		);
		const lines = raw
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.startsWith("#"));

		expect(lines.length).toBe(782);

		let validCount = 0;
		let invalidCount = 0;
		for (const line of lines) {
			const [hex, expected] = line.split(" ");
			const input = fromHex(hex as string);
			const shouldVerify = expected === "1";
			expect(verifyP256(input)).toBe(shouldVerify);
			const res = p256Verify(input, P256VERIFY_GAS);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(6900n);
			if (shouldVerify) {
				expect(res.output).toEqual(SUCCESS);
				validCount++;
			} else {
				expect(res.output.length).toBe(0);
				invalidCount++;
			}
		}
		expect(validCount).toBeGreaterThan(0);
		expect(invalidCount).toBeGreaterThan(0);
	});
});
