/**
 * Benchmark: prettyPrint() Bytecode Disassembly
 * Measures performance of bytecode pretty printing with various options
 */

import { bench, run } from "mitata";
import type { BrandedBytecode } from "./BrandedBytecode.js";
import * as Bytecode from "./index.js";

// ============================================================================
// Test Data Generation
// ============================================================================

/**
 * Generate random bytecode of specified size
 */
function generateBytecode(size: number): BrandedBytecode {
	const bytecode: number[] = [];
	let pos = 0;

	while (pos < size) {
		const op = Math.floor(Math.random() * 256);

		// Bias toward PUSH instructions and JUMPDESTs
		if (op >= 0x60 && op <= 0x7f) {
			// PUSH instruction
			const pushSize = op - 0x5f;
			bytecode.push(op);
			for (let i = 0; i < pushSize && pos + 1 + i < size; i++) {
				bytecode.push(Math.floor(Math.random() * 256));
			}
			pos += 1 + pushSize;
		} else if (Math.random() < 0.1) {
			// 10% chance of JUMPDEST
			bytecode.push(0x5b);
			pos += 1;
		} else {
			// Regular opcode
			bytecode.push(op % 0x60); // Avoid PUSH range
			pos += 1;
		}
	}

	return new Uint8Array(bytecode.slice(0, size)) as BrandedBytecode;
}

// Test bytecode samples
const smallBytecode = generateBytecode(100) as BrandedBytecode;
const mediumBytecode = generateBytecode(1024) as BrandedBytecode;
const largeBytecode = generateBytecode(10240) as BrandedBytecode;

// Simple patterns for baseline
const simplePush = new Uint8Array([
	0x60, 0x01, 0x60, 0x02, 0x01,
]) as BrandedBytecode;

// Convert to branded bytecode
const smallCode = Bytecode.from(smallBytecode) as BrandedBytecode;
const mediumCode = Bytecode.from(mediumBytecode) as BrandedBytecode;
const largeCode = Bytecode.from(largeBytecode) as BrandedBytecode;
const simpleCode = Bytecode.from(simplePush) as BrandedBytecode;

// ============================================================================
// Benchmarks
// ============================================================================

// Baseline: small bytecode with minimal options
bench("prettyPrint() - small (100 bytes)", () => {
	Bytecode.prettyPrint(smallCode, { colors: false });
});

bench("prettyPrint() - medium (1KB)", () => {
	Bytecode.prettyPrint(mediumCode, { colors: false });
});

bench("prettyPrint() - large (10KB)", () => {
	Bytecode.prettyPrint(largeCode, { colors: false });
});

bench("prettyPrint() - simple pattern", () => {
	Bytecode.prettyPrint(simpleCode, { colors: false });
});

await run();

// With colors enabled
bench("prettyPrint() - small with colors", () => {
	Bytecode.prettyPrint(smallCode, { colors: true });
});

bench("prettyPrint() - medium with colors", () => {
	Bytecode.prettyPrint(mediumCode, { colors: true });
});

bench("prettyPrint() - large with colors", () => {
	Bytecode.prettyPrint(largeCode, { colors: true });
});

await run();

// With all options enabled
bench("prettyPrint() - small with all options", () => {
	Bytecode.prettyPrint(smallCode, {
		colors: true,
		showGas: true,
		showStack: true,
		showBlocks: true,
		showJumpArrows: false,
		showFusions: false,
		lineNumbers: true,
		showSummary: true,
	});
});

bench("prettyPrint() - medium with all options", () => {
	Bytecode.prettyPrint(mediumCode, {
		colors: true,
		showGas: true,
		showStack: true,
		showBlocks: true,
		showJumpArrows: false,
		showFusions: false,
		lineNumbers: true,
		showSummary: true,
	});
});

bench("prettyPrint() - large with all options", () => {
	Bytecode.prettyPrint(largeCode, {
		colors: true,
		showGas: true,
		showStack: true,
		showBlocks: true,
		showJumpArrows: false,
		showFusions: false,
		lineNumbers: true,
		showSummary: true,
	});
});

await run();

// Compact mode (minimal output)
bench("prettyPrint() - small compact", () => {
	Bytecode.prettyPrint(smallCode, { compact: true, colors: false });
});

bench("prettyPrint() - medium compact", () => {
	Bytecode.prettyPrint(mediumCode, { compact: true, colors: false });
});

bench("prettyPrint() - large compact", () => {
	Bytecode.prettyPrint(largeCode, { compact: true, colors: false });
});

await run();

// Minimal output variations
bench("prettyPrint() - no gas, no stack", () => {
	Bytecode.prettyPrint(mediumCode, {
		colors: false,
		showGas: false,
		showStack: false,
		showSummary: false,
	});
});

bench("prettyPrint() - gas only", () => {
	Bytecode.prettyPrint(mediumCode, {
		colors: false,
		showGas: true,
		showStack: false,
		showSummary: false,
	});
});

bench("prettyPrint() - stack only", () => {
	Bytecode.prettyPrint(mediumCode, {
		colors: false,
		showGas: false,
		showStack: true,
		showSummary: false,
	});
});

await run();

// Block analysis
bench("prettyPrint() - small with blocks", () => {
	Bytecode.prettyPrint(smallCode, {
		colors: false,
		showBlocks: true,
		showGas: true,
		showStack: true,
	});
});

bench("prettyPrint() - medium with blocks", () => {
	Bytecode.prettyPrint(mediumCode, {
		colors: false,
		showBlocks: true,
		showGas: true,
		showStack: true,
	});
});

bench("prettyPrint() - large with blocks", () => {
	Bytecode.prettyPrint(largeCode, {
		colors: false,
		showBlocks: true,
		showGas: true,
		showStack: true,
	});
});

await run();
