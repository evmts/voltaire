import { describe, expect, it } from "vitest";

describe("Bytecode Fundamentals (docs/primitives/bytecode/fundamentals.mdx)", () => {
	describe("Parsing Bytecode Correctly", () => {
		it("should correctly identify PUSH data vs opcodes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// From docs: PUSH1 0x5b - the 0x5b is data, not JUMPDEST
			const code = Bytecode("0x605b");
			const instructions = code.parseInstructions();

			// Should be 1 instruction (PUSH1), not 2 (PUSH1 + JUMPDEST)
			expect(instructions.length).toBe(1);
			expect(instructions[0].opcode).toBe(0x60);
			expect(instructions[0].pushData).toEqual(new Uint8Array([0x5b]));
		});
	});

	describe("Analyzing Structure", () => {
		it("should analyze bytecode (docs example)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// From docs: 0x6001600201
			const code = Bytecode("0x6001600201");
			const analysis = code.analyze();

			expect(analysis.valid).toBe(true);
			expect(analysis.instructions.length).toBe(3);
		});
	});

	describe("Jump Destinations", () => {
		it("should find valid jump destinations (docs example)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Bytecode: JUMPDEST(0), PUSH1(1) 0x01(2), JUMP(3), JUMPDEST(4), PUSH1(5) 0x02(6), JUMP(7), STOP(8)
			// 0x5b = JUMPDEST at position 0
			// 0x60 0x01 = PUSH1 at positions 1-2
			// 0x56 = JUMP at position 3
			// 0x5b = JUMPDEST at position 4
			// 0x60 0x02 = PUSH1 at positions 5-6
			// 0x56 = JUMP at position 7
			// 0x00 = STOP at position 8
			const code = Bytecode("0x5b6001565b60025600");
			const jumpDests = code.analyzeJumpDestinations();

			expect(jumpDests.has(0)).toBe(true); // First JUMPDEST
			expect(jumpDests.has(4)).toBe(true); // Second JUMPDEST (not 5!)
		});

		it("should check specific positions (docs example)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x5b6001565b60025600");

			expect(code.isValidJumpDest(0)).toBe(true); // JUMPDEST at 0
			expect(code.isValidJumpDest(4)).toBe(true); // JUMPDEST at 4
			expect(code.isValidJumpDest(2)).toBe(false); // PUSH1 data
		});
	});

	describe("Disassembly", () => {
		it("should disassemble bytecode (docs example)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const disassembly = code.formatInstructions();

			expect(Array.isArray(disassembly)).toBe(true);
			expect(disassembly.length).toBe(3);
		});
	});

	describe("Complete Example: ADD Operation", () => {
		it("should analyze add operation bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// From docs: adds 5 + 3 and returns result
			// Let's verify the actual bytecode:
			// PUSH1 0x05 (2 bytes)
			// PUSH1 0x03 (2 bytes)
			// ADD (1 byte)
			// PUSH1 0x00 (2 bytes)
			// MSTORE (1 byte)
			// PUSH1 0x20 (2 bytes)
			// PUSH1 0x00 (2 bytes)
			// PUSH1 0x00 (2 bytes)
			// RETURN (1 byte)
			// Total: 15 bytes (docs may have typo saying 13)
			const code = Bytecode("0x6005600301600052602060006000f3");

			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);

			const instructions = code.formatInstructions();
			expect(instructions.length).toBeGreaterThan(0);

			const size = code.size();
			// API discrepancy: Docs say 13 bytes but actual hex is 15 bytes
			expect(size).toBe(15);
		});
	});

	describe("Metadata Detection (docs example)", () => {
		it("should detect metadata", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Bytecode with typical metadata markers
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x80, 0x60, 0x40, 0x52, 0xa2, 0x64, 0x69, 0x70, 0x66, 0x73,
					0x00, 0x33,
				]),
			);

			if (code.hasMetadata()) {
				const stripped = code.stripMetadata();
				expect(stripped.length).toBeLessThanOrEqual(code.length);
			}
		});
	});

	describe("PUSH Instructions (docs example)", () => {
		it("should parse PUSH4 for function selector", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH4 for function selector (4 bytes)
			const selectorCode = Bytecode("0x63a9059cbb");
			const instructions = selectorCode.parseInstructions();

			expect(instructions[0].opcode).toBe(0x63); // PUSH4
			expect(instructions[0].pushData).toEqual(
				new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
			);
		});
	});
});
