import { describe, expect, it } from "vitest";
import * as Bytecode from "./BrandedBytecode/index.js";
import type { BrandedBytecode } from "./BrandedBytecode/BrandedBytecode.js";

// Helper to brand Uint8Array as BrandedBytecode
const bc = (arr: Uint8Array): BrandedBytecode => arr as BrandedBytecode;

// Random data generation helpers
const randomByte = () => Math.floor(Math.random() * 256);
const randomBytes = (n: number) => {
	const arr = new Uint8Array(n);
	for (let i = 0; i < n; i++) {
		arr[i] = randomByte();
	}
	return arr;
};

// ============================================================================
// Random Bytecode Sequences - Parse Without Crashing
// ============================================================================

describe("Bytecode Fuzz: Random sequences", () => {
	it("parses random small bytecode without crashing", () => {
		for (let trial = 0; trial < 100; trial++) {
			const code = bc(randomBytes(32));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
			expect(() => Bytecode.size(code)).not.toThrow();
		}
	});

	it("parses random medium bytecode without crashing", () => {
		for (let trial = 0; trial < 50; trial++) {
			const code = bc(randomBytes(1024));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
			expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
		}
	});

	it("parses random large bytecode without crashing", () => {
		for (let trial = 0; trial < 10; trial++) {
			const code = bc(randomBytes(10000));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
		}
	});

	it("handles random bytecode with all analysis functions", () => {
		for (let trial = 0; trial < 20; trial++) {
			const code = bc(randomBytes(256));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
			expect(() => Bytecode.analyzeGas(code)).not.toThrow();
			expect(() => Bytecode.analyzeStack(code)).not.toThrow();
			expect(() => Bytecode.detectFusions(code)).not.toThrow();
			expect(() => Bytecode.hasMetadata(code)).not.toThrow();
		}
	});
});

// ============================================================================
// Malformed Bytecode - Truncated PUSH Instructions
// ============================================================================

describe("Bytecode Fuzz: Truncated PUSH instructions", () => {
	it("handles PUSH1 without data", () => {
		const code = bc(new Uint8Array([0x60])); // PUSH1 with no data
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(Bytecode.validate(code)).toBe(false);
		const insts = Bytecode.parseInstructions(code);
		expect(insts.length).toBe(1);
		expect(insts[0]?.pushData?.length).toBe(0); // No data available
	});

	it("handles PUSH32 without data", () => {
		const code = bc(new Uint8Array([0x7f])); // PUSH32 with no data
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(Bytecode.validate(code)).toBe(false);
	});

	it("handles PUSH32 with partial data", () => {
		for (let dataLen = 1; dataLen < 32; dataLen++) {
			const code = bc(new Uint8Array([0x7f, ...randomBytes(dataLen)]));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(Bytecode.validate(code)).toBe(false);
		}
	});

	it("handles random PUSH opcodes with random truncation", () => {
		for (let trial = 0; trial < 50; trial++) {
			const pushOpcode = 0x60 + Math.floor(Math.random() * 32); // PUSH1-PUSH32
			const expectedSize = pushOpcode - 0x60 + 1;
			const actualSize = Math.floor(Math.random() * expectedSize); // Random truncation
			const code = bc(new Uint8Array([pushOpcode, ...randomBytes(actualSize)]));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			if (actualSize < expectedSize) {
				expect(Bytecode.validate(code)).toBe(false);
			}
		}
	});

	it("handles multiple truncated PUSH instructions", () => {
		const parts: number[] = [];
		for (let i = 0; i < 10; i++) {
			const pushOpcode = 0x60 + Math.floor(Math.random() * 32);
			const expectedSize = pushOpcode - 0x60 + 1;
			const actualSize = Math.floor(Math.random() * (expectedSize + 1));
			parts.push(pushOpcode, ...Array.from(randomBytes(actualSize)));
		}
		const code = bc(new Uint8Array(parts));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(() => Bytecode.validate(code)).not.toThrow();
	});
});

// ============================================================================
// Invalid Jump Destinations
// ============================================================================

describe("Bytecode Fuzz: Invalid jump destinations", () => {
	it("handles random jump destination checks", () => {
		for (let trial = 0; trial < 50; trial++) {
			const code = bc(randomBytes(100));
			const offset = Math.floor(Math.random() * 100);
			expect(() => Bytecode.isValidJumpDest(code, offset)).not.toThrow();
		}
	});

	it("validates jump destinations inside PUSH data", () => {
		// PUSH1 with 0x5b (JUMPDEST) as data - should not be valid jump dest
		const code = bc(new Uint8Array([0x60, 0x5b, 0x00]));
		expect(Bytecode.isValidJumpDest(code, 0)).toBe(false); // PUSH1
		expect(Bytecode.isValidJumpDest(code, 1)).toBe(false); // Data (0x5b)
		expect(Bytecode.isValidJumpDest(code, 2)).toBe(false); // STOP
	});

	it("handles out-of-bounds jump destination checks", () => {
		const code = bc(randomBytes(50));
		expect(Bytecode.isValidJumpDest(code, 100)).toBe(false);
		expect(Bytecode.isValidJumpDest(code, 1000)).toBe(false);
		expect(Bytecode.isValidJumpDest(code, -1)).toBe(false);
	});

	it("handles jump destination analysis with random bytecode", () => {
		for (let trial = 0; trial < 30; trial++) {
			const code = bc(randomBytes(200));
			const result = Bytecode.analyzeJumpDestinations(code);
			expect(result).toBeDefined();
			expect(result instanceof Set).toBe(true);
		}
	});
});

// ============================================================================
// Random JUMPDEST Locations
// ============================================================================

describe("Bytecode Fuzz: Random JUMPDEST locations", () => {
	it("parses bytecode with random JUMPDEST placements", () => {
		for (let trial = 0; trial < 30; trial++) {
			const parts: number[] = [];
			for (let i = 0; i < 50; i++) {
				if (Math.random() < 0.2) {
					parts.push(0x5b); // JUMPDEST
				} else {
					parts.push(randomByte());
				}
			}
			const code = bc(new Uint8Array(parts));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
		}
	});

	it("validates JUMPDEST inside and outside PUSH data", () => {
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			// Add some valid JUMPDESTs
			parts.push(0x5b, 0x00); // JUMPDEST, STOP
			// Add PUSH with JUMPDEST in data
			parts.push(0x60, 0x5b); // PUSH1 0x5b
			// Add more valid JUMPDESTs
			parts.push(0x5b, 0x00); // JUMPDEST, STOP
			const code = bc(new Uint8Array(parts));
			const dests = Bytecode.analyzeJumpDestinations(code);
			expect(dests.has(0)).toBe(true); // First JUMPDEST
			expect(dests.has(3)).toBe(false); // JUMPDEST in PUSH data
			expect(dests.has(4)).toBe(true); // Last JUMPDEST
		}
	});
});

// ============================================================================
// Metadata Section Parsing
// ============================================================================

describe("Bytecode Fuzz: Metadata section parsing", () => {
	it("handles random metadata-like endings", () => {
		for (let trial = 0; trial < 50; trial++) {
			const mainCode = randomBytes(100);
			const metadataLen = 0x20 + Math.floor(Math.random() * 0x20); // 0x20-0x3f
			const code = bc(
				new Uint8Array([
					...mainCode,
					...randomBytes(metadataLen - 2),
					0x00,
					metadataLen,
				]),
			);
			expect(() => Bytecode.hasMetadata(code)).not.toThrow();
			expect(() => Bytecode.stripMetadata(code)).not.toThrow();
		}
	});

	it("handles bytecode without metadata marker", () => {
		for (let trial = 0; trial < 30; trial++) {
			const code = bc(randomBytes(100));
			expect(() => Bytecode.hasMetadata(code)).not.toThrow();
			const stripped = Bytecode.stripMetadata(code);
			if (!Bytecode.hasMetadata(code)) {
				expect(stripped).toBe(code); // Should return same if no metadata
			}
		}
	});

	it("handles metadata with various length markers", () => {
		const validLengths = [0x20, 0x25, 0x30, 0x33, 0x40];
		for (const len of validLengths) {
			const mainCode = randomBytes(50);
			// len includes the 2-byte length marker, so metadata is (len - 2) bytes + 2 byte marker
			// stripMetadata removes (len + 2) bytes total
			const code = bc(
				new Uint8Array([...mainCode, ...randomBytes(len), 0x00, len]),
			);
			expect(Bytecode.hasMetadata(code)).toBe(true);
			const stripped = Bytecode.stripMetadata(code);
			expect(stripped.length).toBe(mainCode.length);
		}
	});

	it("handles edge case metadata lengths", () => {
		// Too short to have metadata
		const tiny = bc(new Uint8Array([0x60]));
		expect(Bytecode.hasMetadata(tiny)).toBe(false);

		// Exactly 2 bytes, edge case
		const twoBytes = bc(new Uint8Array([0x00, 0x30]));
		expect(() => Bytecode.hasMetadata(twoBytes)).not.toThrow();
	});
});

// ============================================================================
// Gas Analysis with Random Bytecode
// ============================================================================

describe("Bytecode Fuzz: Gas analysis", () => {
	it("analyzes gas for random bytecode without crashing", () => {
		for (let trial = 0; trial < 30; trial++) {
			const code = bc(randomBytes(100));
			const result = Bytecode.analyzeGas(code);
			expect(result).toBeDefined();
			expect(typeof result.total).toBe("bigint");
			expect(Array.isArray(result.byInstruction)).toBe(true);
		}
	});

	it("handles gas analysis with all possible opcodes", () => {
		// Create bytecode with one of each opcode
		const allOpcodes = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			allOpcodes[i] = i;
		}
		const code = bc(allOpcodes);
		expect(() => Bytecode.analyzeGas(code)).not.toThrow();
	});

	it("handles gas analysis with expensive operations", () => {
		// Include known expensive operations
		const code = bc(
			new Uint8Array([
				0x20, // SHA3 (expensive)
				0xf0, // CREATE (expensive)
				0xf1, // CALL (expensive)
				0xf2, // CALLCODE (expensive)
				0xfa, // STATICCALL (expensive)
			]),
		);
		const result = Bytecode.analyzeGas(code);
		expect(result.total).toBeGreaterThan(0n);
	});
});

// ============================================================================
// Stack Analysis Edge Cases
// ============================================================================

describe("Bytecode Fuzz: Stack analysis edge cases", () => {
	it("analyzes stack for random bytecode", () => {
		for (let trial = 0; trial < 30; trial++) {
			const code = bc(randomBytes(100));
			expect(() => Bytecode.analyzeStack(code)).not.toThrow();
		}
	});

	it("handles stack underflow scenarios", () => {
		// POP without anything on stack
		const code = bc(new Uint8Array([0x50]));
		const result = Bytecode.analyzeStack(code);
		expect(result).toBeDefined();
		// Should detect underflow
		expect(result.issues.length).toBeGreaterThan(0);
	});

	it("handles stack overflow scenarios", () => {
		// Lots of PUSH operations to hit stack limit
		const pushes = new Array(1025).fill(0x60).concat([0x00]); // 1025 PUSH1 ops + data
		const parts: number[] = [];
		for (let i = 0; i < 1025; i++) {
			parts.push(0x60, 0x00); // PUSH1 0x00
		}
		const code = bc(new Uint8Array(parts));
		expect(() => Bytecode.analyzeStack(code)).not.toThrow();
	});

	it("handles stack analysis with various initial depths", () => {
		const code = bc(randomBytes(50));
		for (let depth = 0; depth <= 10; depth++) {
			expect(() =>
				Bytecode.analyzeStack(code, { initialDepth: depth }),
			).not.toThrow();
		}
	});

	it("handles empty bytecode stack analysis", () => {
		const code = bc(new Uint8Array([]));
		const result = Bytecode.analyzeStack(code);
		expect(result.valid).toBe(true);
		expect(result.maxDepth).toBe(0);
	});

	it("handles stack analysis with DUP and SWAP operations", () => {
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			// Add some values to stack
			for (let i = 0; i < 10; i++) {
				parts.push(0x60, randomByte()); // PUSH1
			}
			// Add random DUP/SWAP
			for (let i = 0; i < 10; i++) {
				const op =
					Math.random() < 0.5
						? 0x80 + Math.floor(Math.random() * 16)
						: // DUP1-DUP16
							0x90 + Math.floor(Math.random() * 16); // SWAP1-SWAP16
				parts.push(op);
			}
			const code = bc(new Uint8Array(parts));
			expect(() => Bytecode.analyzeStack(code)).not.toThrow();
		}
	});
});

// ============================================================================
// Very Long Bytecode (100KB+)
// ============================================================================

describe("Bytecode Fuzz: Very long bytecode", () => {
	it("parses 100KB bytecode without crashing", () => {
		const code = bc(randomBytes(100_000));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(() => Bytecode.validate(code)).not.toThrow();
	});

	it("parses 500KB bytecode without crashing", () => {
		const code = bc(randomBytes(500_000));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(() => Bytecode.size(code)).not.toThrow();
	});

	it("handles 1MB bytecode parsing", () => {
		const code = bc(randomBytes(1_000_000));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
	});

	it("analyzes very long bytecode structure", () => {
		const code = bc(randomBytes(200_000));
		expect(() => Bytecode.hasMetadata(code)).not.toThrow();
		expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
	});
});

// ============================================================================
// All Opcodes (0x00-0xFF)
// ============================================================================

describe("Bytecode Fuzz: All opcodes", () => {
	it("parses bytecode with all possible opcodes", () => {
		const allOpcodes = new Uint8Array(256);
		for (let i = 0; i < 256; i++) {
			allOpcodes[i] = i;
		}
		const code = bc(allOpcodes);
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
	});

	it("validates all opcode values", () => {
		for (let opcode = 0; opcode <= 0xff; opcode++) {
			const code = bc(new Uint8Array([opcode]));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.isPush(opcode)).not.toThrow();
			expect(() => Bytecode.isTerminator(opcode)).not.toThrow();
		}
	});

	it("handles formatInstruction for all opcodes", () => {
		for (let opcode = 0; opcode <= 0xff; opcode++) {
			const inst = { opcode, position: 0 };
			expect(() => Bytecode.formatInstruction(inst)).not.toThrow();
		}
	});

	it("handles sequential all-opcode bytecode", () => {
		const parts: number[] = [];
		for (let opcode = 0; opcode <= 0xff; opcode++) {
			parts.push(opcode);
			// For PUSH opcodes, add appropriate data
			if (opcode >= 0x60 && opcode <= 0x7f) {
				const pushSize = opcode - 0x60 + 1;
				parts.push(...Array.from(randomBytes(pushSize)));
			}
		}
		const code = bc(new Uint8Array(parts));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(() => Bytecode.validate(code)).not.toThrow();
	});
});

// ============================================================================
// Fusion Pattern Detection with Random Code
// ============================================================================

describe("Bytecode Fuzz: Fusion pattern detection", () => {
	it("detects fusions in random bytecode", () => {
		for (let trial = 0; trial < 30; trial++) {
			const code = bc(randomBytes(200));
			expect(() => Bytecode.detectFusions(code)).not.toThrow();
		}
	});

	it("handles fusion detection with PUSH-arithmetic patterns", () => {
		const arithmeticOps = [0x01, 0x02, 0x03, 0x04]; // ADD, MUL, SUB, DIV
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			for (let i = 0; i < 10; i++) {
				parts.push(0x60, randomByte()); // PUSH1
				parts.push(
					arithmeticOps[Math.floor(Math.random() * arithmeticOps.length)] ??
						0x01,
				);
			}
			const code = bc(new Uint8Array(parts));
			const fusions = Bytecode.detectFusions(code);
			expect(Array.isArray(fusions)).toBe(true);
		}
	});

	it("handles fusion detection with DUP/SWAP patterns", () => {
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			for (let i = 0; i < 20; i++) {
				const isDup = Math.random() < 0.5;
				parts.push(
					isDup
						? 0x80 + Math.floor(Math.random() * 16)
						: 0x90 + Math.floor(Math.random() * 16),
				);
			}
			const code = bc(new Uint8Array(parts));
			expect(() => Bytecode.detectFusions(code)).not.toThrow();
		}
	});

	it("handles fusion detection at bytecode boundaries", () => {
		// Fusion pattern at the very end (might be truncated)
		const code = bc(new Uint8Array([0x60, 0x05])); // PUSH1 0x05 (no following op)
		expect(() => Bytecode.detectFusions(code)).not.toThrow();
	});
});

// ============================================================================
// Bytecode Validation Edge Cases
// ============================================================================

describe("Bytecode Fuzz: Validation edge cases", () => {
	it("validates empty bytecode", () => {
		const code = bc(new Uint8Array([]));
		expect(Bytecode.validate(code)).toBe(true);
	});

	it("validates single byte bytecode", () => {
		for (let opcode = 0; opcode <= 0xff; opcode++) {
			const code = bc(new Uint8Array([opcode]));
			const isValid = Bytecode.validate(code);
			// PUSH opcodes should be invalid (missing data)
			if (opcode >= 0x60 && opcode <= 0x7f) {
				expect(isValid).toBe(false);
			} else {
				expect(isValid).toBe(true);
			}
		}
	});

	it("validates bytecode with correct PUSH data", () => {
		for (let pushNum = 1; pushNum <= 32; pushNum++) {
			const opcode = 0x60 + pushNum - 1;
			const code = bc(new Uint8Array([opcode, ...randomBytes(pushNum)]));
			expect(Bytecode.validate(code)).toBe(true);
		}
	});

	it("validates mixed valid and invalid sequences", () => {
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			for (let i = 0; i < 10; i++) {
				if (Math.random() < 0.3) {
					// Add invalid PUSH
					const pushOp = 0x60 + Math.floor(Math.random() * 32);
					parts.push(pushOp);
					// Intentionally truncate sometimes
					if (Math.random() < 0.5) {
						const expectedSize = pushOp - 0x60 + 1;
						parts.push(...Array.from(randomBytes(expectedSize - 1)));
					}
				} else {
					// Add valid instruction
					parts.push(randomByte() & 0x5f); // Non-PUSH opcode
				}
			}
			const code = bc(new Uint8Array(parts));
			expect(() => Bytecode.validate(code)).not.toThrow();
		}
	});
});

// ============================================================================
// PUSH with Wrong Data Length
// ============================================================================

describe("Bytecode Fuzz: PUSH with wrong data length", () => {
	it("handles PUSH1 with no data", () => {
		const code = bc(new Uint8Array([0x60]));
		const insts = Bytecode.parseInstructions(code);
		expect(insts.length).toBe(1);
		expect(insts[0]?.pushData?.length).toBe(0);
	});

	it("handles PUSH2 with 1 byte", () => {
		const code = bc(new Uint8Array([0x61, 0xff]));
		expect(Bytecode.validate(code)).toBe(false);
		const insts = Bytecode.parseInstructions(code);
		expect(insts[0]?.pushData?.length).toBe(1);
	});

	it("handles PUSH32 with 31 bytes", () => {
		const code = bc(new Uint8Array([0x7f, ...randomBytes(31)]));
		expect(Bytecode.validate(code)).toBe(false);
		const insts = Bytecode.parseInstructions(code);
		expect(insts[0]?.pushData?.length).toBe(31);
	});

	it("handles all PUSH variants with 0 bytes", () => {
		for (let pushNum = 1; pushNum <= 32; pushNum++) {
			const opcode = 0x60 + pushNum - 1;
			const code = bc(new Uint8Array([opcode]));
			expect(Bytecode.validate(code)).toBe(false);
			const insts = Bytecode.parseInstructions(code);
			expect(insts[0]?.pushData?.length).toBe(0);
		}
	});

	it("handles all PUSH variants with 1 less byte than required", () => {
		for (let pushNum = 2; pushNum <= 32; pushNum++) {
			const opcode = 0x60 + pushNum - 1;
			const code = bc(new Uint8Array([opcode, ...randomBytes(pushNum - 1)]));
			expect(Bytecode.validate(code)).toBe(false);
		}
	});

	it("handles random PUSH with random incorrect lengths", () => {
		for (let trial = 0; trial < 50; trial++) {
			const pushNum = 1 + Math.floor(Math.random() * 32);
			const opcode = 0x60 + pushNum - 1;
			const wrongLen = Math.floor(Math.random() * pushNum); // 0 to pushNum-1
			const code = bc(new Uint8Array([opcode, ...randomBytes(wrongLen)]));
			if (wrongLen < pushNum) {
				expect(Bytecode.validate(code)).toBe(false);
			}
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		}
	});

	it("handles consecutive PUSH instructions with varying wrong lengths", () => {
		for (let trial = 0; trial < 20; trial++) {
			const parts: number[] = [];
			for (let i = 0; i < 5; i++) {
				const pushNum = 1 + Math.floor(Math.random() * 32);
				const opcode = 0x60 + pushNum - 1;
				const actualLen = Math.floor(Math.random() * (pushNum + 1)); // 0 to pushNum
				parts.push(opcode, ...Array.from(randomBytes(actualLen)));
			}
			const code = bc(new Uint8Array(parts));
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
		}
	});
});

// ============================================================================
// Combined Stress Tests
// ============================================================================

describe("Bytecode Fuzz: Combined stress tests", () => {
	it("performs all operations on same random bytecode", () => {
		for (let trial = 0; trial < 10; trial++) {
			const code = bc(randomBytes(512));

			// All operations should not crash
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
			expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
			expect(() => Bytecode.analyzeGas(code)).not.toThrow();
			expect(() => Bytecode.analyzeStack(code)).not.toThrow();
			expect(() => Bytecode.detectFusions(code)).not.toThrow();
			expect(() => Bytecode.hasMetadata(code)).not.toThrow();
			expect(() => Bytecode.stripMetadata(code)).not.toThrow();
			expect(() => Bytecode.size(code)).not.toThrow();
			expect(() => Bytecode.toHex(code)).not.toThrow();
			expect(() => Bytecode.hash(code)).not.toThrow();

			// Results should be consistent
			const size1 = Bytecode.size(code);
			const size2 = Bytecode.size(code);
			expect(size1).toBe(size2);
		}
	});

	it("handles pathological bytecode patterns", () => {
		const patterns = [
			// All zeros
			new Uint8Array(1000).fill(0x00),
			// All 0xff
			new Uint8Array(1000).fill(0xff),
			// Alternating
			new Uint8Array(1000).map((_, i) => (i % 2 === 0 ? 0x00 : 0xff)),
			// All JUMPDEST
			new Uint8Array(1000).fill(0x5b),
			// All PUSH1
			new Uint8Array(1000).fill(0x60),
		];

		for (const pattern of patterns) {
			const code = bc(pattern);
			expect(() => Bytecode.parseInstructions(code)).not.toThrow();
			expect(() => Bytecode.validate(code)).not.toThrow();
			expect(() => Bytecode.analyzeJumpDestinations(code)).not.toThrow();
		}
	});

	it("handles bytecode at EVM contract size limits", () => {
		// EIP-170: contract size limit is 24KB
		const maxSize = 24576;
		const code = bc(randomBytes(maxSize));
		expect(() => Bytecode.parseInstructions(code)).not.toThrow();
		expect(() => Bytecode.validate(code)).not.toThrow();
	});

	it("handles bytecode exceeding EVM contract size limits", () => {
		// Test with bytecode larger than 24KB limit
		const oversized = bc(randomBytes(50_000));
		expect(() => Bytecode.parseInstructions(oversized)).not.toThrow();
		expect(() => Bytecode.validate(oversized)).not.toThrow();
	});
});
