import { describe, expect, it } from "vitest";
import type { BrandedBytecode } from "./BrandedBytecode.js";
import { prettyPrint } from "./prettyPrint.js";

// Helper to brand Uint8Array as BrandedBytecode for tests
const bc = (arr: Uint8Array): BrandedBytecode => arr as BrandedBytecode;

describe("prettyPrint", () => {
	it("should format basic bytecode without colors", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, { colors: false });

		expect(result).toContain("EVM Bytecode Disassembly");
		expect(result).toContain("Size: 4 bytes");
		expect(result).toContain("000: PUSH1");
		expect(result).toContain("0x01");
		expect(result).toContain("002: ADD");
		expect(result).toContain("003: STOP");
	});

	it("should format bytecode with JUMPDEST", () => {
		// PUSH1 0x60, PUSH1 0x40, MSTORE, JUMPDEST, STOP
		const bytecode = bc(
			new Uint8Array([0x60, 0x60, 0x60, 0x40, 0x52, 0x5b, 0x00]),
		);
		const result = prettyPrint(bytecode, { colors: false });

		expect(result).toContain("000: PUSH1");
		expect(result).toContain("0x60");
		expect(result).toContain("002: PUSH1");
		expect(result).toContain("0x40");
		expect(result).toContain("004: MSTORE");
		expect(result).toContain("005: JUMPDEST");
		expect(result).toContain("006: STOP");
	});

	it("should include gas costs when showGas is true", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, { colors: false, showGas: true });

		expect(result).toContain("Gas");
		expect(result).toMatch(/PUSH1.*3/);
		expect(result).toMatch(/ADD.*3/);
		expect(result).toMatch(/STOP.*0/);
	});

	it("should include stack effects when showStack is true", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, { colors: false, showStack: true });

		expect(result).toContain("Stack");
		expect(result).toMatch(/PUSH1.*\[→1\]/);
		expect(result).toMatch(/ADD.*\[2→1\]/);
		expect(result).toMatch(/STOP.*\[0→0\]/);
	});

	it("should show block boundaries when showBlocks is true", () => {
		// PUSH1 0x03, JUMPI, STOP, JUMPDEST, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x03, 0x57, 0x00, 0x5b, 0x00]));
		const result = prettyPrint(bytecode, { colors: false, showBlocks: true });

		// Should have block markers or indicators
		expect(result).toContain("Block");
	});

	it("should show summary when showSummary is true", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, {
			colors: false,
			showGas: true,
			showSummary: true,
		});

		expect(result).toContain("Summary");
		expect(result).toContain("Total Gas");
		expect(result).toContain("Instructions");
	});

	it("should hide summary when showSummary is false", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, {
			colors: false,
			showSummary: false,
		});

		expect(result).not.toContain("Summary");
	});

	it("should format in compact mode", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, { colors: false, compact: true });

		// Compact mode should have less whitespace/separators
		expect(result).not.toContain("─────");
	});

	it("should hide line numbers when lineNumbers is false", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, {
			colors: false,
			lineNumbers: false,
		});

		// Should not have PC column with line numbers
		expect(result).not.toContain("000:");
		expect(result).not.toContain("PC");
	});

	it("should use default options when none provided", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode);

		// Should include colors by default (check for ANSI escape codes)
		expect(result).toMatch(/\x1b\[\d+m/);
		expect(result).toContain("EVM Bytecode Disassembly");
	});

	it("should format empty bytecode", () => {
		const bytecode = bc(new Uint8Array([]));
		const result = prettyPrint(bytecode, { colors: false });

		expect(result).toContain("Size: 0 bytes");
	});

	it("should format PUSH32 with full value", () => {
		// PUSH32 with 32 bytes of data
		const bytecode = bc(new Uint8Array([0x7f, ...Array(32).fill(0xff)]));
		const result = prettyPrint(bytecode, { colors: false });

		expect(result).toContain("PUSH32");
		expect(result).toContain(
			"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		);
	});

	it("should handle all options together", () => {
		// PUSH1 0x01, ADD, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
		const result = prettyPrint(bytecode, {
			colors: false,
			showGas: true,
			showStack: true,
			showBlocks: false,
			showJumpArrows: false,
			showFusions: false,
			lineNumbers: true,
			showSummary: true,
			maxWidth: 100,
			compact: false,
		});

		expect(result).toContain("EVM Bytecode Disassembly");
		expect(result).toContain("Gas");
		expect(result).toContain("Stack");
		expect(result).toContain("Summary");
	});

	it("should handle bytecode with invalid opcodes", () => {
		// PUSH1 0x01, INVALID, STOP
		const bytecode = bc(new Uint8Array([0x60, 0x01, 0xfe, 0x00]));
		const result = prettyPrint(bytecode, { colors: false });

		expect(result).toContain("INVALID");
	});
});
