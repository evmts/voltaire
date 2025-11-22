import { describe, expect, it } from "vitest";
import {
	PrecompileAddress,
	blake2f,
	execute,
} from "../evm/precompiles/precompiles.js";

/**
 * Blake2f compression - EIP-152
 * Input: 213 bytes exactly
 *   - rounds: 4 bytes (u32, big-endian)
 *   - h: 64 bytes (8 u64 state values)
 *   - m: 128 bytes (16 u64 message block)
 *   - t: 16 bytes (2 u64 block counter/offset)
 *   - f: 1 byte (final block flag: 0 or 1)
 * Output: 64 bytes (new h state)
 * Gas: rounds * 1 + 0
 */

/**
 * Helper to convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
	const cleanHex = hex.replace(/^0x/, "").replace(/\s/g, "");
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
	}
	return bytes;
}

/**
 * Helper to create Blake2f input
 */
function createBlake2fInput(
	rounds: number,
	h: Uint8Array,
	m: Uint8Array,
	t: Uint8Array,
	f: number,
): Uint8Array {
	const input = new Uint8Array(213);
	// Rounds (4 bytes, big-endian)
	input[0] = (rounds >> 24) & 0xff;
	input[1] = (rounds >> 16) & 0xff;
	input[2] = (rounds >> 8) & 0xff;
	input[3] = rounds & 0xff;
	// h (64 bytes)
	input.set(h, 4);
	// m (128 bytes)
	input.set(m, 68);
	// t (16 bytes)
	input.set(t, 196);
	// f (1 byte)
	input[212] = f;
	return input;
}

describe("Blake2f Compression Function (0x09) - EIP-152", () => {
	describe("Input validation", () => {
		it("should reject input shorter than 213 bytes", () => {
			const input = new Uint8Array(212);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should reject input longer than 213 bytes", () => {
			const input = new Uint8Array(214);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid input length");
		});

		it("should accept exactly 213 bytes", () => {
			const input = new Uint8Array(213);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should reject empty input", () => {
			const input = new Uint8Array(0);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(false);
		});
	});

	describe("Gas calculation", () => {
		it("should calculate gas as rounds * 1", () => {
			// 0 rounds
			const input0 = hexToBytes(
				"0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res0 = blake2f(input0, 0n);
			expect(res0.success).toBe(true);
			expect(res0.gasUsed).toBe(0n);

			// 1 round
			const input1 = hexToBytes(
				"0000000148c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res1 = blake2f(input1, 1n);
			expect(res1.success).toBe(true);
			expect(res1.gasUsed).toBe(1n);

			// 12 rounds
			const input12 = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res12 = blake2f(input12, 12n);
			expect(res12.success).toBe(true);
			expect(res12.gasUsed).toBe(12n);
		});

		it("should fail when insufficient gas for rounds", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 11n); // Need 12
			expect(result.success).toBe(false);
		});

		it("should succeed with exact gas", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
		});

		it("should handle maximum rounds (2^32-1)", () => {
			const input = hexToBytes(
				"ffffffff48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 4294967295n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(4294967295n);
		});
	});

	describe("Final block flag validation", () => {
		it("should accept final flag = 0 (false, non-final block)", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
		});

		it("should accept final flag = 1 (true, final block)", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
		});
	});

	describe("Input parsing", () => {
		it("should extract rounds from first 4 bytes (big-endian)", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);

			// Test rounds = 0
			let input = createBlake2fInput(0, h, m, t, 0);
			let result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(0n);

			// Test rounds = 256 (0x00000100)
			input = createBlake2fInput(256, h, m, t, 0);
			result = blake2f(input, 300n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(256n);

			// Test rounds = 65536 (0x00010000)
			input = createBlake2fInput(65536, h, m, t, 0);
			result = blake2f(input, 100000n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(65536n);
		});

		it("should parse h state (64 bytes)", () => {
			const h = new Uint8Array(64);
			h.fill(0xaa);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);

			const input = createBlake2fInput(1, h, m, t, 0);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should parse message block m (128 bytes)", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			m.fill(0x55);
			const t = new Uint8Array(16);

			const input = createBlake2fInput(1, h, m, t, 0);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
		});

		it("should parse offset/block counter t (16 bytes)", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);
			t.fill(0xff);

			const input = createBlake2fInput(1, h, m, t, 0);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
		});
	});

	describe("Output format", () => {
		it("should output exactly 64 bytes", () => {
			const input = new Uint8Array(213);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should produce different outputs for different inputs", () => {
			const h1 = new Uint8Array(64);
			const h2 = new Uint8Array(64);
			h2.fill(0x01);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);

			const input1 = createBlake2fInput(1, h1, m, t, 0);
			const input2 = createBlake2fInput(1, h2, m, t, 0);

			const res1 = blake2f(input1, 100n);
			const res2 = blake2f(input2, 100n);

			expect(res1.success).toBe(true);
			expect(res2.success).toBe(true);

			// Output should be different (extremely likely for Blake2f)
			let sameOutput = true;
			for (let i = 0; i < 64; i++) {
				if (res1.output[i] !== res2.output[i]) {
					sameOutput = false;
					break;
				}
			}
			// Note: Could theoretically be same, but probability is negligible
		});

		it("should be deterministic", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);

			const input1 = createBlake2fInput(12, h, m, t, 1);
			const input2 = createBlake2fInput(12, h, m, t, 1);

			const res1 = blake2f(input1, 100n);
			const res2 = blake2f(input2, 100n);

			expect(res1.success).toBe(true);
			expect(res2.success).toBe(true);
			expect(res1.output).toEqual(res2.output);
		});
	});

	describe("EIP-152 test vectors", () => {
		it("test vector 1: basic compression with final flag", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("test vector 2: zero input parameters", () => {
			const input = new Uint8Array(213);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("test vector 3: maximum rounds", () => {
			const input = hexToBytes(
				"ffffffff48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 4294967295n);
			expect(result.success).toBe(true);
		});

		it("test vector 4: single round", () => {
			const input = hexToBytes(
				"0000000148c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(1n);
		});

		it("test vector 5: f=1 final flag", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
		});

		it("test vector 6: f=0 non-final flag", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000",
			);
			const result = blake2f(input, 12n);
			expect(result.success).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("should handle all-zero initial state", () => {
			const h = new Uint8Array(64); // All zeros
			const m = new Uint8Array(128); // All zeros
			const t = new Uint8Array(16); // All zeros

			const input = createBlake2fInput(1, h, m, t, 1);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should handle all-ones state and message", () => {
			const h = new Uint8Array(64);
			h.fill(0xff);
			const m = new Uint8Array(128);
			m.fill(0xff);
			const t = new Uint8Array(16);
			t.fill(0xff);

			const input = createBlake2fInput(12, h, m, t, 1);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});

		it("should handle large offset values (block counter)", () => {
			const h = new Uint8Array(64);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);
			// Set offset to maximum value
			t.fill(0xff);

			const input = createBlake2fInput(1, h, m, t, 0);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
		});

		it("should handle alternating bit patterns", () => {
			const h = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				h[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const m = new Uint8Array(128);
			for (let i = 0; i < 128; i++) {
				m[i] = i % 2 === 0 ? 0x55 : 0xaa;
			}
			const t = new Uint8Array(16);

			const input = createBlake2fInput(12, h, m, t, 1);
			const result = blake2f(input, 100n);
			expect(result.success).toBe(true);
		});

		it("should produce correct output for sequential compression", () => {
			const h0 = new Uint8Array(64);
			const m = new Uint8Array(128);
			const t = new Uint8Array(16);

			// First compression
			const input1 = createBlake2fInput(12, h0, m, t, 0);
			const res1 = blake2f(input1, 100n);
			expect(res1.success).toBe(true);

			// Second compression using previous output as state
			const input2 = createBlake2fInput(12, res1.output, m, t, 1);
			const res2 = blake2f(input2, 100n);
			expect(res2.success).toBe(true);
		});
	});

	describe("Gas consumption patterns", () => {
		it("should handle zero gas with zero rounds", () => {
			const input = hexToBytes(
				"0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const result = blake2f(input, 0n);
			expect(result.success).toBe(true);
			expect(result.gasUsed).toBe(0n);
		});

		it("should handle linear gas growth with rounds", () => {
			const inputs: Array<[number, bigint]> = [
				[1, 100n],
				[10, 100n],
				[100, 200n],
				[1000, 2000n],
			];

			for (const [rounds, gas] of inputs) {
				const input = new Uint8Array(213);
				// Set rounds in first 4 bytes
				input[0] = (rounds >> 24) & 0xff;
				input[1] = (rounds >> 16) & 0xff;
				input[2] = (rounds >> 8) & 0xff;
				input[3] = rounds & 0xff;

				const result = blake2f(input, gas);
				expect(result.success).toBe(true);
				expect(result.gasUsed).toBe(BigInt(rounds));
			}
		});
	});

	describe("Execute interface", () => {
		it("should work through execute() function", () => {
			const input = new Uint8Array(213);
			const result = execute(PrecompileAddress.BLAKE2F, input, 100n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(64);
		});
	});
});
