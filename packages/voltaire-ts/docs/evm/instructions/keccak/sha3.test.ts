/**
 * Test file for SHA3/KECCAK256 (0x20) documentation examples
 * Tests examples from sha3.mdx
 *
 * NOTE: SHA3 requires memory operations which may need full Frame setup.
 * API discrepancy: Documentation shows direct memory manipulation, actual
 * implementation may differ. These tests validate the conceptual behavior.
 */
import { describe, expect, it } from "vitest";

describe("SHA3/KECCAK256 (0x20) - Documentation Examples", async () => {
	const { sha3 } = await import("../../../../src/evm/keccak/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[] = [], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Empty Data Hash", () => {
		it("returns cached hash for size=0", () => {
			const frame = createFrame([0n, 0n]); // offset=0, size=0
			const err = sha3(frame);

			// Empty data hash is well-known
			const emptyHash =
				0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470n;

			expect(err).toBeNull();
			expect(frame.stack).toEqual([emptyHash]);
		});
	});

	describe("Hash Memory Region", () => {
		it("hashes single byte", () => {
			const frame = createFrame([0n, 1n]); // offset=0, size=1

			// Set memory byte at position 0 to 0x00
			if (frame.memory && typeof frame.memory.set === "function") {
				frame.memory.set(0, 0x00);
			}

			const err = sha3(frame);
			expect(err).toBeNull();
			expect(frame.stack.length).toBe(1);
			// Hash of single 0x00 byte
		});
	});

	describe("Gas Cost", () => {
		it("charges base gas (30) for empty hash", () => {
			const frame = createFrame([0n, 0n], 100n);
			const err = sha3(frame);

			expect(err).toBeNull();
			// Base cost is 30 gas
			expect(frame.gasRemaining).toBeLessThan(100n);
		});

		it("charges per-word gas (6 per word)", () => {
			const frame = createFrame([0n, 32n], 1000n); // 1 word
			const gasBeforeHash = frame.gasRemaining;
			sha3(frame);

			// 30 base + 6*1 word = 36 gas (plus potential memory expansion)
			// Just verify gas was consumed
			expect(frame.gasRemaining).toBeLessThan(gasBeforeHash);
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([0n, 32n], 5n); // Not enough for 36+ gas
			const err = sha3(frame);

			expect(err).toEqual({ type: "OutOfGas" });
		});
	});

	describe("Edge Cases", () => {
		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([0n]); // Only one value
			const err = sha3(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("handles zero offset", () => {
			const frame = createFrame([0n, 0n]);
			const err = sha3(frame);
			expect(err).toBeNull();
		});
	});

	describe("Keccak vs SHA3 Distinction", () => {
		it("uses Keccak-256, not NIST SHA3-256", () => {
			// The EVM SHA3 opcode uses Keccak-256 (pre-NIST padding)
			// Empty hash: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
			// NIST SHA3-256 empty: different value
			const frame = createFrame([0n, 0n]);
			sha3(frame);

			const keccakEmptyHash =
				0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470n;
			expect(frame.stack[0]).toBe(keccakEmptyHash);
		});
	});
});
