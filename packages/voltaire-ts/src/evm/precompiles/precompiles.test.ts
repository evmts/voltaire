import { describe, expect, it } from "vitest";
import { Keccak256 } from "../../crypto/Keccak256/index.js";
import { Secp256k1 } from "../../crypto/Secp256k1/index.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import * as Hex from "../../primitives/Hex/index.js";
import {
	blake2f as evmBlake2f,
	bn254Add as evmBn254Add,
	bn254Mul as evmBn254Mul,
	bn254Pairing as evmBn254Pairing,
	ecrecover as evmEcrecover,
	identity as evmIdentity,
	modexp as evmModexp,
	ripemd160 as evmRipemd160,
	sha256 as evmSha256,
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
} from "./precompiles.js";

function beBytes32(n: bigint): Uint8Array {
	const out = new Uint8Array(32);
	let v = n;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
}

describe("Precompiles - core behaviors", () => {
	it("ecrecover recovers correct address", () => {
		// Message hash (keccak256 of a test string)
		const msg = new TextEncoder().encode("hello evm ecrecover");
		const msgHash = Keccak256.hash(msg);

		// Deterministic private key for test (not secure)
		const priv = new Uint8Array(32);
		priv[31] = 7; // small scalar

		const sig = Secp256k1.sign(msgHash, priv);
		const pub = Secp256k1.derivePublicKey(priv);
		const addr = Keccak256.hash(pub).slice(12); // last 20 bytes

		// Build EVM ecrecover input: hash(32) | v(32) | r(32) | s(32)
		const input = new Uint8Array(128);
		input.set(msgHash, 0);
		const vBytes = beBytes32(BigInt(sig.v));
		input.set(vBytes, 32);
		input.set(sig.r, 64);
		input.set(sig.s, 96);

		const res = evmEcrecover(input, 3000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(32);
		// Left 12 bytes zero, last 20 = address
		expect([...res.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		expect(Hex.fromBytes(res.output.slice(12))).toBe(Hex.fromBytes(addr));
	});

	it("sha256 hashes input correctly", () => {
		const data = new TextEncoder().encode("abc");
		const res = evmSha256(data, 10000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(32);
		// Known SHA-256 of "abc"
		const expected =
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
		expect(Hex.fromBytes(res.output).slice(2)).toBe(expected);
	});

	it("ripemd160 hashes and left-pads to 32 bytes", () => {
		const data = new TextEncoder().encode("abc");
		const res = evmRipemd160(data, 100000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(32);
		// Left pad zeros
		expect([...res.output.slice(0, 12)].every((b) => b === 0)).toBe(true);
		// Known RIPEMD-160 of "abc": 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
		const expectedTail = "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc";
		expect(Hex.fromBytes(res.output.slice(12)).slice(2)).toBe(expectedTail);
	});

	it("identity returns input bytes", () => {
		const input = new Uint8Array([1, 2, 3, 4, 5]);
		const res = evmIdentity(input, 1000n);
		expect(res.success).toBe(true);
		expect(res.output).toEqual(input);
	});

	it("modexp computes 2^3 mod 5", () => {
		// Header: base_len=1, exp_len=1, mod_len=1
		const header = new Uint8Array(96);
		header.set(beBytes32(1n), 0);
		header.set(beBytes32(1n), 32);
		header.set(beBytes32(1n), 64);
		const tail = new Uint8Array([2, 3, 5]); // base, exp, mod
		const input = new Uint8Array(96 + 3);
		input.set(header, 0);
		input.set(tail, 96);

		const res = evmModexp(input, 1000000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(1);
		expect(res.output[0]).toBe(3);
	});

	it("bn254Add infinity + infinity = infinity", () => {
		const input = new Uint8Array(128); // two zero points
		const res = evmBn254Add(input, 150n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(64);
		expect([...res.output].every((b) => b === 0)).toBe(true);
	});

	it("bn254Mul infinity * 0 = infinity", () => {
		const input = new Uint8Array(96); // point(0) + scalar(0)
		const res = evmBn254Mul(input, 6000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(64);
		expect([...res.output].every((b) => b === 0)).toBe(true);
	});

	it("bn254Pairing with zero pairs returns 1", () => {
		const input = new Uint8Array(0);
		const res = evmBn254Pairing(input, 45000n);
		expect(res.success).toBe(true);
		expect(res.output.length).toBe(32);
		expect(res.output[31]).toBe(1);
	});
});

describe("execute() hardfork gate", () => {
	// [address, first fork with the precompile, fork just before it]
	const activation: Array<[string, string, string | undefined]> = [
		[PrecompileAddress.ECRECOVER, Hardfork.FRONTIER, undefined],
		[PrecompileAddress.SHA256, Hardfork.FRONTIER, undefined],
		[PrecompileAddress.RIPEMD160, Hardfork.FRONTIER, undefined],
		[PrecompileAddress.IDENTITY, Hardfork.FRONTIER, undefined],
		[PrecompileAddress.MODEXP, Hardfork.BYZANTIUM, Hardfork.SPURIOUS_DRAGON],
		[PrecompileAddress.BN254_ADD, Hardfork.BYZANTIUM, Hardfork.SPURIOUS_DRAGON],
		[PrecompileAddress.BN254_MUL, Hardfork.BYZANTIUM, Hardfork.SPURIOUS_DRAGON],
		[
			PrecompileAddress.BN254_PAIRING,
			Hardfork.BYZANTIUM,
			Hardfork.SPURIOUS_DRAGON,
		],
		[PrecompileAddress.BLAKE2F, Hardfork.ISTANBUL, Hardfork.PETERSBURG],
		[PrecompileAddress.POINT_EVALUATION, Hardfork.CANCUN, Hardfork.SHANGHAI],
		[PrecompileAddress.BLS12_G1_ADD, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_G1_MSM, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_G2_ADD, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_G2_MSM, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_PAIRING, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_MAP_FP_TO_G1, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.BLS12_MAP_FP2_TO_G2, Hardfork.PRAGUE, Hardfork.CANCUN],
		[PrecompileAddress.P256_VERIFY, Hardfork.OSAKA, Hardfork.PRAGUE],
	];

	const expectNotPrecompile = (result: PrecompileResult) => {
		expect(result.success).toBe(false);
		expect(result.output).toEqual(new Uint8Array(0));
		expect(result.gasUsed).toBe(0n);
		expect(result.error).toContain("Unknown precompile");
	};

	it("covers every address in PrecompileAddress", () => {
		expect(activation.map(([address]) => address).sort()).toEqual(
			Object.values(PrecompileAddress).sort(),
		);
	});

	it("refuses every precompile before its activation fork", () => {
		const forks = Hardfork.allIds();
		for (const [address, first] of activation) {
			for (const fork of forks) {
				const active = Hardfork.isAtLeast(fork, first as typeof fork);
				expect(isPrecompile(address, fork)).toBe(active);
				if (!active) {
					expectNotPrecompile(
						execute(address, new Uint8Array(0), 10_000_000n, fork),
					);
				}
			}
		}
	});

	it("runs every precompile at its activation fork and not one fork earlier", () => {
		for (const [address, first, previous] of activation) {
			const at = execute(
				address,
				new Uint8Array(0),
				10_000_000n,
				first as Parameters<typeof execute>[3],
			);
			// The precompile ran: it either succeeded or halted with all gas.
			expect(at.error ?? "").not.toContain("Unknown precompile");
			if (!at.success) expect(at.gasUsed).toBe(10_000_000n);

			if (previous !== undefined) {
				expectNotPrecompile(
					execute(
						address,
						new Uint8Array(0),
						10_000_000n,
						previous as Parameters<typeof execute>[3],
					),
				);
			}
		}
	});

	it("is not a precompile for unknown addresses in any fork", () => {
		for (const address of [
			"0x0000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000012",
			"0x0000000000000000000000000000000000000013",
			"0x0000000000000000000000000000000000000014",
			"0x00000000000000000000000000000000000000ff",
			"0x0000000000000000000000000000000000000101",
		]) {
			for (const fork of Hardfork.allIds()) {
				expect(isPrecompile(address, fork)).toBe(false);
				expectNotPrecompile(execute(address, new Uint8Array(0), 1000n, fork));
			}
		}
	});

	it("matches addresses case-insensitively", () => {
		const upper = "0x000000000000000000000000000000000000000A";
		expect(isPrecompile(upper, Hardfork.CANCUN)).toBe(true);
		expect(isPrecompile(upper, Hardfork.SHANGHAI)).toBe(false);
		const result = execute(
			"0x000000000000000000000000000000000000000B",
			new Uint8Array(256),
			1000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(375n);
	});

	it("passes the hardfork to MODEXP and BN254 pricing", () => {
		const run = (address: string, input: Uint8Array, fork: string) =>
			execute(
				address,
				input,
				10_000_000n,
				fork as Parameters<typeof execute>[3],
			).gasUsed;
		expect(
			run(PrecompileAddress.BN254_ADD, new Uint8Array(128), Hardfork.BYZANTIUM),
		).toBe(500n);
		expect(
			run(PrecompileAddress.BN254_ADD, new Uint8Array(128), Hardfork.ISTANBUL),
		).toBe(150n);
		expect(
			run(PrecompileAddress.BN254_MUL, new Uint8Array(96), Hardfork.PETERSBURG),
		).toBe(40000n);
		expect(
			run(PrecompileAddress.BN254_MUL, new Uint8Array(96), Hardfork.OSAKA),
		).toBe(6000n);
		expect(
			run(
				PrecompileAddress.BN254_PAIRING,
				new Uint8Array(192),
				Hardfork.CONSTANTINOPLE,
			),
		).toBe(180000n);
		expect(
			run(
				PrecompileAddress.BN254_PAIRING,
				new Uint8Array(192),
				Hardfork.PRAGUE,
			),
		).toBe(79000n);
	});
});

describe("Out-of-gas and exceptional halts", () => {
	const expectHalt = (result: PrecompileResult, gasLimit: bigint) => {
		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.gasUsed).toBe(gasLimit);
		expect(result.output).toEqual(new Uint8Array(0));
	};

	it("out of gas consumes exactly the forwarded gas for every fixed-input precompile", () => {
		const blake = new Uint8Array(213);
		blake[3] = 12;
		const cases: Array<[() => (gas: bigint) => PrecompileResult, bigint]> = [
			[() => (gas) => evmEcrecover(new Uint8Array(128), gas), 3000n],
			[() => (gas) => evmSha256(new Uint8Array(32), gas), 72n],
			[() => (gas) => evmRipemd160(new Uint8Array(32), gas), 720n],
			[() => (gas) => evmIdentity(new Uint8Array(32), gas), 18n],
			[() => (gas) => evmBn254Add(new Uint8Array(128), gas), 150n],
			[() => (gas) => evmBn254Mul(new Uint8Array(96), gas), 6000n],
			[() => (gas) => evmBn254Pairing(new Uint8Array(192), gas), 79000n],
			[() => (gas) => evmBlake2f(blake, gas), 12n],
		];
		for (const [make, cost] of cases) {
			const run = make();
			const exact = run(cost);
			expect(exact.success).toBe(true);
			expect(exact.gasUsed).toBe(cost);
			for (const gasLimit of [0n, cost - 1n]) {
				const result = run(gasLimit);
				expect(result.error).toBe("Out of gas");
				expectHalt(result, gasLimit);
			}
		}
	});

	it("malformed input halts with gasLimit, never 0 and never more", () => {
		expectHalt(evmBn254Pairing(new Uint8Array(191), 500000n), 500000n);
		expectHalt(evmBn254Pairing(new Uint8Array(1), 7n), 7n);
		expectHalt(evmBlake2f(new Uint8Array(212), 1000n), 1000n);
		const badFlag = new Uint8Array(213);
		badFlag[212] = 2;
		expectHalt(evmBlake2f(badFlag, 1000n), 1000n);
		const notOnCurve = new Uint8Array(128);
		notOnCurve[31] = 1;
		notOnCurve[63] = 3;
		expectHalt(evmBn254Add(notOnCurve, 1000n), 1000n);
	});

	it("modexp out of gas consumes the forwarded gas", () => {
		const header = new Uint8Array(96 + 3);
		header.set(beBytes32(1n), 0);
		header.set(beBytes32(1n), 32);
		header.set(beBytes32(1n), 64);
		header.set([2, 3, 5], 96);
		expectHalt(evmModexp(header, 199n), 199n);
		expectHalt(evmModexp(header, 499n, Hardfork.OSAKA), 499n);
	});
});
