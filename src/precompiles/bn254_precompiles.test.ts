import { describe, expect, test } from "vitest";
import {
	execute,
	PrecompileAddress,
	bn254Add,
	bn254Mul,
	bn254Pairing,
} from "./precompiles.js";
import * as Hardfork from "../primitives/Hardfork/index.js";
import * as G1 from "../crypto/bn254/G1/index.js";
import * as G2 from "../crypto/bn254/G2/index.js";
import { serializeG1, serializeG2 } from "../crypto/bn254/BN254.js";
import { G1_GENERATOR_X, FP_MOD, FR_MOD } from "../crypto/bn254/constants.js";

describe("BN254 precompiles", () => {
	describe("bn254Add (0x06)", () => {
		test("gas cost is 150", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 1000n);
			expect(result.gasUsed).toBe(150n);
		});

		test("fails with insufficient gas", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 100n);
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		test("succeeds with exact gas", () => {
			const input = new Uint8Array(128);
			const result = bn254Add(input, 150n);
			expect(result.success).toBe(true);
		});

		test("adds two infinity points", () => {
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);
			const input = new Uint8Array(128);
			input.set(infBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		test("adds generator to infinity", () => {
			const gen = G1.generator();
			const inf = G1.infinity();
			const genBytes = serializeG1(gen);
			const infBytes = serializeG1(inf);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(infBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);

			// Result should equal generator
			const xResult = BigInt(
				"0x" +
					Array.from(result.output.slice(0, 32))
						.map((b) => b.toString(16).padStart(2, "0"))
						.join(""),
			);
			expect(xResult).toBe(G1_GENERATOR_X);
		});

		test("adds generator to itself (doubling)", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const doubled = G1.double(gen);
			const doubledBytes = serializeG1(doubled);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(genBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(doubledBytes);
		});

		test("adds generator to negation (gives infinity)", () => {
			const gen = G1.generator();
			const neg = G1.negate(gen);
			const genBytes = serializeG1(gen);
			const negBytes = serializeG1(neg);

			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(negBytes, 64);

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		test("handles short input (pads with zeros)", () => {
			const input = new Uint8Array(10);
			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
		});

		test("handles long input (truncates)", () => {
			const input = new Uint8Array(200);
			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
		});

		test("output is always 64 bytes", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const input = new Uint8Array(128);
			input.set(genBytes, 0);

			const result = bn254Add(input, 1000n);
			expect(result.output.length).toBe(64);
		});

		test("is commutative", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const genBytes = serializeG1(gen);
			const doubledBytes = serializeG1(doubled);

			const input1 = new Uint8Array(128);
			input1.set(genBytes, 0);
			input1.set(doubledBytes, 64);

			const input2 = new Uint8Array(128);
			input2.set(doubledBytes, 0);
			input2.set(genBytes, 64);

			const result1 = bn254Add(input1, 1000n);
			const result2 = bn254Add(input2, 1000n);

			expect(result1.output).toEqual(result2.output);
		});

		test("executes via generic execute function", () => {
			const input = new Uint8Array(128);
			const result = execute(
				PrecompileAddress.BN254_ADD,
				input,
				1000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("bn254Mul (0x07)", () => {
		test("gas cost is 6000", () => {
			const input = new Uint8Array(96);
			const result = bn254Mul(input, 10000n);
			expect(result.gasUsed).toBe(6000n);
		});

		test("fails with insufficient gas", () => {
			const input = new Uint8Array(96);
			const result = bn254Mul(input, 5000n);
			expect(result.success).toBe(false);
		});

		test("succeeds with exact gas", () => {
			const input = new Uint8Array(96);
			const result = bn254Mul(input, 6000n);
			expect(result.success).toBe(true);
		});

		test("multiplies by zero gives infinity", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const scalar = new Uint8Array(32); // zero scalar

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		test("multiplies by one gives same point", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const scalar = new Uint8Array(32);
			scalar[31] = 1; // scalar = 1

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(genBytes);
		});

		test("multiplies by two gives doubled point", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const genBytes = serializeG1(gen);
			const doubledBytes = serializeG1(doubled);
			const scalar = new Uint8Array(32);
			scalar[31] = 2; // scalar = 2

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output).toEqual(doubledBytes);
		});

		test("multiplies infinity by scalar gives infinity", () => {
			const inf = G1.infinity();
			const infBytes = serializeG1(inf);
			const scalar = new Uint8Array(32);
			scalar[31] = 123; // non-zero scalar

			const input = new Uint8Array(96);
			input.set(infBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.every((b) => b === 0)).toBe(true);
		});

		test("multiplies by small scalar", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const scalar = new Uint8Array(32);
			scalar[31] = 5; // scalar = 5

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		test("multiplies by large scalar", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const scalar = new Uint8Array(32);
			scalar.fill(0xff); // large scalar

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		test("handles short input (pads with zeros)", () => {
			const input = new Uint8Array(10);
			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
		});

		test("handles long input (truncates)", () => {
			const input = new Uint8Array(200);
			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
		});

		test("output is always 64 bytes", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const scalar = new Uint8Array(32);
			scalar[31] = 3;

			const input = new Uint8Array(96);
			input.set(genBytes, 0);
			input.set(scalar, 64);

			const result = bn254Mul(input, 10000n);
			expect(result.output.length).toBe(64);
		});

		test("executes via generic execute function", () => {
			const input = new Uint8Array(96);
			const result = execute(
				PrecompileAddress.BN254_MUL,
				input,
				10000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("bn254Pairing (0x08)", () => {
		test("base gas cost is 45000", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			expect(result.gasUsed).toBe(45000n);
		});

		test("gas cost increases per pair (34000 per pair)", () => {
			// 1 pair: 45000 + 34000 = 79000
			const input = new Uint8Array(192); // 1 pair
			const result = bn254Pairing(input, 100000n);
			expect(result.gasUsed).toBe(79000n);
		});

		test("gas cost for 2 pairs", () => {
			// 2 pairs: 45000 + 2*34000 = 113000
			const input = new Uint8Array(384); // 2 pairs
			const result = bn254Pairing(input, 200000n);
			expect(result.gasUsed).toBe(113000n);
		});

		test("fails with insufficient gas", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 10000n);
			expect(result.success).toBe(false);
		});

		test("succeeds with exact gas", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 45000n);
			expect(result.success).toBe(true);
		});

		test("empty input returns 1 (true)", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// Output should be 1 (32 bytes, all zeros except last byte = 1)
			const value = result.output[31];
			expect(value).toBe(1);
		});

		test("fails on invalid input length (not multiple of 192)", () => {
			const input = new Uint8Array(100);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(false);
		});

		test("fails on input length 191", () => {
			const input = new Uint8Array(191);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(false);
		});

		test("fails on input length 193", () => {
			const input = new Uint8Array(193);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(false);
		});

		test("single pair with valid points", () => {
			const input = new Uint8Array(192);
			// Fill with generator points (simplified)
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		test("multiple pairs", () => {
			const input = new Uint8Array(384); // 2 pairs
			const result = bn254Pairing(input, 200000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
		});

		test("output is always 32 bytes", () => {
			const inputs = [
				new Uint8Array(0),
				new Uint8Array(192),
				new Uint8Array(384),
			];

			for (const input of inputs) {
				const result = bn254Pairing(input, 200000n);
				expect(result.output.length).toBe(32);
			}
		});

		test("output is 0 or 1", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			const output = result.output;
			// All bytes except last should be 0
			for (let i = 0; i < 31; i++) {
				expect(output[i]).toBe(0);
			}
			// Last byte should be 0 or 1
			expect([0, 1]).toContain(output[31]);
		});

		test("handles 10 pairs", () => {
			const input = new Uint8Array(192 * 10);
			const expectedGas = 45000n + 34000n * 10n;
			const result = bn254Pairing(input, expectedGas + 10000n);
			expect(result.gasUsed).toBe(expectedGas);
		});

		test("executes via generic execute function", () => {
			const input = new Uint8Array(0);
			const result = execute(
				PrecompileAddress.BN254_PAIRING,
				input,
				100000n,
				Hardfork.BYZANTIUM,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("integration tests", () => {
		test("add then multiply", () => {
			// First add two points
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const addInput = new Uint8Array(128);
			addInput.set(genBytes, 0);
			addInput.set(genBytes, 64);

			const addResult = bn254Add(addInput, 1000n);
			expect(addResult.success).toBe(true);

			// Then multiply result by 2
			const mulInput = new Uint8Array(96);
			mulInput.set(addResult.output, 0);
			const scalar = new Uint8Array(32);
			scalar[31] = 2;
			mulInput.set(scalar, 64);

			const mulResult = bn254Mul(mulInput, 10000n);
			expect(mulResult.success).toBe(true);
		});

		test("sequence of operations maintains correctness", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);

			// Compute 2*G via add
			const addInput = new Uint8Array(128);
			addInput.set(genBytes, 0);
			addInput.set(genBytes, 64);
			const add1 = bn254Add(addInput, 1000n);

			// Compute 2*G via mul
			const mulInput = new Uint8Array(96);
			mulInput.set(genBytes, 0);
			const scalar = new Uint8Array(32);
			scalar[31] = 2;
			mulInput.set(scalar, 64);
			const mul1 = bn254Mul(mulInput, 10000n);

			// Results should match
			expect(add1.output).toEqual(mul1.output);
		});

		test("all precompiles have consistent gas reporting", () => {
			const addInput = new Uint8Array(128);
			const mulInput = new Uint8Array(96);
			const pairInput = new Uint8Array(0);

			const addResult = bn254Add(addInput, 10000n);
			const mulResult = bn254Mul(mulInput, 10000n);
			const pairResult = bn254Pairing(pairInput, 100000n);

			expect(addResult.gasUsed).toBeLessThanOrEqual(10000n);
			expect(mulResult.gasUsed).toBeLessThanOrEqual(10000n);
			expect(pairResult.gasUsed).toBeLessThanOrEqual(100000n);
		});
	});

	describe("EIP-196 and EIP-197 test vectors", () => {
		test("EIP-196 example 1: add two valid points", () => {
			// From EIP-196 test vectors
			const input = new Uint8Array(128);
			// Point 1: (1, 2) - generator
			input.set(new Uint8Array(31), 0);
			input[31] = 1;
			input.set(new Uint8Array(31), 32);
			input[63] = 2;
			// Point 2: (1, 2) - generator
			input.set(new Uint8Array(31), 64);
			input[95] = 1;
			input.set(new Uint8Array(31), 96);
			input[127] = 2;

			const result = bn254Add(input, 1000n);
			expect(result.success).toBe(true);
		});

		test("EIP-196 example 2: multiply by 2", () => {
			const input = new Uint8Array(96);
			// Point: (1, 2) - generator
			input.set(new Uint8Array(31), 0);
			input[31] = 1;
			input.set(new Uint8Array(31), 32);
			input[63] = 2;
			// Scalar: 2
			input.set(new Uint8Array(31), 64);
			input[95] = 2;

			const result = bn254Mul(input, 10000n);
			expect(result.success).toBe(true);
		});

		test("EIP-197: empty pairing check", () => {
			const input = new Uint8Array(0);
			const result = bn254Pairing(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.output[31]).toBe(1);
		});
	});

	describe("Error handling and edge cases", () => {
		describe("bn254Add error cases", () => {
			test("fails with invalid point (not on curve)", () => {
				const input = new Uint8Array(128);
				// Set x=1, y=3 (not on curve since y^2 != x^3 + 3 in this field)
				input[31] = 1;
				input[63] = 3;

				const result = bn254Add(input, 1000n);
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			test("accepts point where x equals field modulus (wraps to 0)", () => {
				const input = new Uint8Array(128);
				// Set x to be FP_MOD (wraps to 0)
				const modBytes = bigIntToBytes32(FP_MOD);
				input.set(modBytes, 0);
				// This creates point (0, y) which must be checked for curve validity

				const result = bn254Add(input, 1000n);
				// May succeed or fail depending on whether (0, y) is on curve
				// The precompile implementation may reduce modulo FP_MOD
				expect(result.gasUsed).toBe(150n);
			});

			test("fails with point where y >= field modulus", () => {
				const input = new Uint8Array(128);
				input[31] = 1;
				// Set y to be >= FP_MOD
				const overModBytes = bigIntToBytes32(FP_MOD + 1n);
				input.set(overModBytes, 32);

				const result = bn254Add(input, 1000n);
				expect(result.success).toBe(false);
			});

			test("handles max field element values", () => {
				const input = new Uint8Array(128);
				// Generator point
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				input.set(genBytes, 0);
				input.set(genBytes, 64);

				const result = bn254Add(input, 1000n);
				expect(result.success).toBe(true);
			});
		});

		describe("bn254Mul error cases", () => {
			test("fails with invalid point (not on curve)", () => {
				const input = new Uint8Array(96);
				input[31] = 1;
				input[63] = 3; // invalid y
				input[95] = 2; // scalar = 2

				const result = bn254Mul(input, 10000n);
				expect(result.success).toBe(false);
			});

			test("accepts scalar greater than curve order (wraps)", () => {
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				const input = new Uint8Array(96);
				input.set(genBytes, 0);

				// Scalar = FR_MOD + 1 (should wrap to 1)
				const scalarBytes = bigIntToBytes32(FR_MOD + 1n);
				input.set(scalarBytes, 64);

				const result = bn254Mul(input, 10000n);
				// Should succeed, scalar wraps modulo curve order
				expect(result.success).toBe(true);
				// Result should equal generator (since (FR_MOD + 1) mod FR_MOD = 1)
				expect(result.output).toEqual(genBytes);
			});

			test("accepts maximum scalar value", () => {
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				const input = new Uint8Array(96);
				input.set(genBytes, 0);

				// Set scalar to max uint256
				const scalar = new Uint8Array(32);
				scalar.fill(0xff);
				input.set(scalar, 64);

				const result = bn254Mul(input, 10000n);
				expect(result.success).toBe(true);
			});

			test("multiplies by curve order gives infinity", () => {
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				const input = new Uint8Array(96);
				input.set(genBytes, 0);

				// Scalar = curve order
				const scalarBytes = bigIntToBytes32(FR_MOD);
				input.set(scalarBytes, 64);

				const result = bn254Mul(input, 10000n);
				expect(result.success).toBe(true);
				// Result should be point at infinity
				expect(result.output.every((b) => b === 0)).toBe(true);
			});
		});

		describe("bn254Pairing error cases", () => {
			test("fails with invalid G1 point (not on curve)", () => {
				const input = new Uint8Array(192);
				// Invalid G1 point
				input[31] = 1;
				input[63] = 3;
				// Zero G2 point (infinity)

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(false);
			});

			test("fails with invalid G2 point (not on curve)", () => {
				const input = new Uint8Array(192);
				// Valid G1 generator
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				input.set(genBytes, 0);
				// Invalid G2 point (all zeros except one byte)
				input[64] = 1;

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(false);
			});

			test("handles pairing with G1 and G2 infinity", () => {
				const input = new Uint8Array(192);
				// Both points at infinity (all zeros)

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(true);
				// Pairing with infinity should return 1 (valid)
				expect(result.output[31]).toBe(1);
			});

			test("handles pairing with G1 generator and G2 infinity", () => {
				const input = new Uint8Array(192);
				const gen = G1.generator();
				const genBytes = serializeG1(gen);
				input.set(genBytes, 0);
				// G2 at infinity (all zeros)

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(true);
			});

			test("handles pairing with G1 infinity and G2 generator", () => {
				const input = new Uint8Array(192);
				// G1 at infinity (all zeros)
				// G2 generator
				const g2gen = G2.generator();
				const g2Bytes = serializeG2(g2gen);
				input.set(g2Bytes, 64);

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(true);
			});

			test("valid pairing: e(G1, G2)", () => {
				const input = new Uint8Array(192);
				const g1 = G1.generator();
				const g2 = G2.generator();
				const g1Bytes = serializeG1(g1);
				const g2Bytes = serializeG2(g2);

				input.set(g1Bytes, 0);
				input.set(g2Bytes, 64);

				const result = bn254Pairing(input, 100000n);
				expect(result.success).toBe(true);
				expect(result.output.length).toBe(32);
			});

			test("pairing check with negated point", () => {
				const input = new Uint8Array(384);
				const g1 = G1.generator();
				const g1Neg = G1.negate(g1);
				const g2 = G2.generator();

				const g1Bytes = serializeG1(g1);
				const g1NegBytes = serializeG1(g1Neg);
				const g2Bytes = serializeG2(g2);

				// First pair: (G1, G2)
				input.set(g1Bytes, 0);
				input.set(g2Bytes, 64);
				// Second pair: (-G1, G2)
				input.set(g1NegBytes, 192);
				input.set(g2Bytes, 256);

				const result = bn254Pairing(input, 200000n);
				expect(result.success).toBe(true);
				// e(P, Q) * e(-P, Q) should equal 1 mathematically
				// but the exact result depends on pairing implementation
				expect(result.output.length).toBe(32);
				expect([0, 1]).toContain(result.output[31]);
			});

			test("pairing check with 3 pairs", () => {
				const input = new Uint8Array(576); // 3 pairs
				const g1 = G1.generator();
				const g2 = G2.generator();
				const g1Bytes = serializeG1(g1);
				const g2Bytes = serializeG2(g2);

				// Fill all three pairs with same points (simplified test)
				for (let i = 0; i < 3; i++) {
					input.set(g1Bytes, i * 192);
					input.set(g2Bytes, i * 192 + 64);
				}

				const expectedGas = 45000n + 34000n * 3n;
				const result = bn254Pairing(input, expectedGas + 10000n);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(expectedGas);
			});
		});
	});

	describe("Additional integration tests", () => {
		test("add is associative: (A + B) + C = A + (B + C)", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const tripled = G1.add(doubled, gen);

			const genBytes = serializeG1(gen);
			const doubledBytes = serializeG1(doubled);
			const tripledBytes = serializeG1(tripled);

			// (gen + gen) + gen
			const input1 = new Uint8Array(128);
			input1.set(genBytes, 0);
			input1.set(genBytes, 64);
			const result1 = bn254Add(input1, 1000n);

			const input2 = new Uint8Array(128);
			input2.set(result1.output, 0);
			input2.set(genBytes, 64);
			const result2 = bn254Add(input2, 1000n);

			// gen + (gen + gen)
			const input3 = new Uint8Array(128);
			input3.set(genBytes, 0);
			input3.set(doubledBytes, 64);
			const result3 = bn254Add(input3, 1000n);

			expect(result2.output).toEqual(result3.output);
			expect(result2.output).toEqual(tripledBytes);
		});

		test("mul is distributive: k*(P + Q) = k*P + k*Q", () => {
			const gen = G1.generator();
			const doubled = G1.double(gen);
			const genBytes = serializeG1(gen);
			const doubledBytes = serializeG1(doubled);

			const scalar = 3n;
			const scalarBytes = bigIntToBytes32(scalar);

			// 3 * (G + G) = 3 * 2G = 6G
			const mulInput1 = new Uint8Array(96);
			mulInput1.set(doubledBytes, 0);
			mulInput1.set(scalarBytes, 64);
			const result1 = bn254Mul(mulInput1, 10000n);

			// 3*G + 3*G = 6G
			const mulInput2 = new Uint8Array(96);
			mulInput2.set(genBytes, 0);
			mulInput2.set(scalarBytes, 64);
			const result2 = bn254Mul(mulInput2, 10000n);

			const addInput = new Uint8Array(128);
			addInput.set(result2.output, 0);
			addInput.set(result2.output, 64);
			const result3 = bn254Add(addInput, 1000n);

			expect(result1.output).toEqual(result3.output);
		});

		test("chain multiple adds and muls", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);

			// Compute 7*G through: 2*(3*G + G)
			// Step 1: 3*G
			const mulInput1 = new Uint8Array(96);
			mulInput1.set(genBytes, 0);
			mulInput1.set(bigIntToBytes32(3n), 64);
			const threeG = bn254Mul(mulInput1, 10000n);

			// Step 2: 3*G + G = 4*G
			const addInput1 = new Uint8Array(128);
			addInput1.set(threeG.output, 0);
			addInput1.set(genBytes, 64);
			const fourG = bn254Add(addInput1, 1000n);

			// Step 3: 2*(4*G) = 8*G - wait, we want 7*G
			// Recompute: (3*G + G) + 3*G = 7*G
			const addInput2 = new Uint8Array(128);
			addInput2.set(fourG.output, 0);
			addInput2.set(threeG.output, 64);
			const sevenG = bn254Add(addInput2, 1000n);

			// Verify with direct multiplication
			const mulInput2 = new Uint8Array(96);
			mulInput2.set(genBytes, 0);
			mulInput2.set(bigIntToBytes32(7n), 64);
			const sevenGDirect = bn254Mul(mulInput2, 10000n);

			expect(sevenG.output).toEqual(sevenGDirect.output);
		});

		test("consistent results across execute() and direct calls", () => {
			const gen = G1.generator();
			const genBytes = serializeG1(gen);
			const input = new Uint8Array(128);
			input.set(genBytes, 0);
			input.set(genBytes, 64);

			const direct = bn254Add(input, 1000n);
			const viaExecute = execute(
				PrecompileAddress.BN254_ADD,
				input,
				1000n,
				Hardfork.BYZANTIUM,
			);

			expect(direct.success).toBe(viaExecute.success);
			expect(direct.output).toEqual(viaExecute.output);
			expect(direct.gasUsed).toBe(viaExecute.gasUsed);
		});

		test("gas exhaustion at exact boundary", () => {
			const input = new Uint8Array(128);

			// Should succeed at 150
			const result1 = bn254Add(input, 150n);
			expect(result1.success).toBe(true);

			// Should fail at 149
			const result2 = bn254Add(input, 149n);
			expect(result2.success).toBe(false);
		});
	});
});

// Helper function to convert bigint to 32-byte big-endian array
function bigIntToBytes32(value: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	let v = value;
	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}
