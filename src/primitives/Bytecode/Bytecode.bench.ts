/**
 * Bytecode Benchmarks
 *
 * Measures performance of bytecode analysis and manipulation operations
 */

import type { BrandedBytecode } from "./BrandedBytecode/BrandedBytecode.js";
import { analyze } from "./BrandedBytecode/analyze.js";
import { analyzeJumpDestinations } from "./BrandedBytecode/analyzeJumpDestinations.js";
import { equals } from "./BrandedBytecode/equals.js";
import { extractRuntime } from "./BrandedBytecode/extractRuntime.js";
import { formatInstructions } from "./BrandedBytecode/formatInstructions.js";
import { fromHex } from "./BrandedBytecode/fromHex.js";
import { getPushSize } from "./BrandedBytecode/getPushSize.js";
import { hasMetadata } from "./BrandedBytecode/hasMetadata.js";
import { isPush } from "./BrandedBytecode/isPush.js";
import { isTerminator } from "./BrandedBytecode/isTerminator.js";
import { isValidJumpDest } from "./BrandedBytecode/isValidJumpDest.js";
import { parseInstructions } from "./BrandedBytecode/parseInstructions.js";
import { size } from "./BrandedBytecode/size.js";
import { stripMetadata } from "./BrandedBytecode/stripMetadata.js";
import { toHex } from "./BrandedBytecode/toHex.js";
import { validate } from "./BrandedBytecode/validate.js";

// ============================================================================
// Benchmark Runner
// ============================================================================

interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		fn();
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		fn();
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data Generation
// ============================================================================

function generateBytecode(size: number, includeJumpdests = true): Uint8Array {
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
		} else if (includeJumpdests && Math.random() < 0.1) {
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

// Generate test bytecode samples
const smallCode = generateBytecode(100) as BrandedBytecode;
const mediumCode = generateBytecode(1000) as BrandedBytecode;
const largeCode = generateBytecode(10000) as BrandedBytecode;
const hugeCode = generateBytecode(50000) as BrandedBytecode;

// Simple patterns
const simplePush = new Uint8Array([
	0x60, 0x01, 0x60, 0x02, 0x01,
]) as BrandedBytecode;
const pushWithJumpdest = new Uint8Array([
	0x60,
	0x5b,
	0x5b, // PUSH1 0x5b, JUMPDEST
	0x60,
	0x00,
	0x56, // PUSH1 0x00, JUMP
	0x5b,
	0x00, // JUMPDEST, STOP
]) as BrandedBytecode;

// Metadata samples
const codeWithMetadata = new Uint8Array([
	...mediumCode.slice(0, 900),
	...new Array(0x33 - 2).fill(0xa2),
	0x00,
	0x33,
]) as BrandedBytecode;

const results: BenchmarkResult[] = [];

// ============================================================================
// Jump Destination Analysis Benchmarks
// ============================================================================

console.log(
	"================================================================================",
);
console.log("BYTECODE JUMP DESTINATION ANALYSIS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- analyzeJumpDestinations - varying sizes ---");
results.push(
	benchmark("analyzeJumpDestinations - small (100b)", () =>
		analyzeJumpDestinations(smallCode),
	),
);
results.push(
	benchmark("analyzeJumpDestinations - medium (1kb)", () =>
		analyzeJumpDestinations(mediumCode),
	),
);
results.push(
	benchmark("analyzeJumpDestinations - large (10kb)", () =>
		analyzeJumpDestinations(largeCode),
	),
);
results.push(
	benchmark("analyzeJumpDestinations - huge (50kb)", () =>
		analyzeJumpDestinations(hugeCode),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- isValidJumpDest ---");
results.push(
	benchmark("isValidJumpDest - small", () => isValidJumpDest(smallCode, 10)),
);
results.push(
	benchmark("isValidJumpDest - medium", () => isValidJumpDest(mediumCode, 500)),
);
results.push(
	benchmark("isValidJumpDest - large", () => isValidJumpDest(largeCode, 5000)),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Validation Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("BYTECODE VALIDATION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- validate - varying sizes ---");
results.push(benchmark("validate - small (100b)", () => validate(smallCode)));
results.push(benchmark("validate - medium (1kb)", () => validate(mediumCode)));
results.push(benchmark("validate - large (10kb)", () => validate(largeCode)));
results.push(benchmark("validate - huge (50kb)", () => validate(hugeCode)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- validate - edge cases ---");
const invalidPush = new Uint8Array([0x60]) as BrandedBytecode; // Incomplete PUSH
results.push(
	benchmark("validate - invalid (incomplete PUSH)", () =>
		validate(invalidPush),
	),
);
results.push(
	benchmark("validate - simple pattern", () => validate(simplePush)),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Instruction Parsing Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("INSTRUCTION PARSING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- parseInstructions - varying sizes ---");
results.push(
	benchmark("parseInstructions - small (100b)", () =>
		parseInstructions(smallCode),
	),
);
results.push(
	benchmark("parseInstructions - medium (1kb)", () =>
		parseInstructions(mediumCode),
	),
);
results.push(
	benchmark("parseInstructions - large (10kb)", () =>
		parseInstructions(largeCode),
	),
);
results.push(
	benchmark("parseInstructions - huge (50kb)", () =>
		parseInstructions(hugeCode),
	),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- parseInstructions - patterns ---");
results.push(
	benchmark("parseInstructions - simple PUSH", () =>
		parseInstructions(simplePush),
	),
);
results.push(
	benchmark("parseInstructions - with JUMPDESTs", () =>
		parseInstructions(pushWithJumpdest),
	),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Complete Analysis Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("COMPLETE ANALYSIS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- analyze - full bytecode analysis ---");
results.push(benchmark("analyze - small (100b)", () => analyze(smallCode)));
results.push(benchmark("analyze - medium (1kb)", () => analyze(mediumCode)));
results.push(benchmark("analyze - large (10kb)", () => analyze(largeCode)));
results.push(benchmark("analyze - huge (50kb)", () => analyze(hugeCode)));

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Hex Conversion Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("HEX CONVERSION BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- toHex - varying sizes ---");
results.push(benchmark("toHex - small (100b)", () => toHex(smallCode)));
results.push(benchmark("toHex - medium (1kb)", () => toHex(mediumCode)));
results.push(benchmark("toHex - large (10kb)", () => toHex(largeCode)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

const smallHex = toHex(smallCode);
const mediumHex = toHex(mediumCode);
const largeHex = toHex(largeCode);

console.log("\n--- fromHex - varying sizes ---");
results.push(benchmark("fromHex - small (100b)", () => fromHex(smallHex)));
results.push(benchmark("fromHex - medium (1kb)", () => fromHex(mediumHex)));
results.push(benchmark("fromHex - large (10kb)", () => fromHex(largeHex)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- hex round-trip ---");
results.push(
	benchmark("hex round-trip - small", () => fromHex(toHex(smallCode))),
);
results.push(
	benchmark("hex round-trip - medium", () => fromHex(toHex(mediumCode))),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Formatting Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("FORMATTING BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- formatInstructions (disassembly) ---");
results.push(
	benchmark("formatInstructions - small (100b)", () =>
		formatInstructions(smallCode),
	),
);
results.push(
	benchmark("formatInstructions - medium (1kb)", () =>
		formatInstructions(mediumCode),
	),
);
results.push(
	benchmark("formatInstructions - large (10kb)", () =>
		formatInstructions(largeCode),
	),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Metadata Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("METADATA OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- hasMetadata ---");
results.push(
	benchmark("hasMetadata - without metadata", () => hasMetadata(mediumCode)),
);
results.push(
	benchmark("hasMetadata - with metadata", () => hasMetadata(codeWithMetadata)),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

console.log("\n--- stripMetadata ---");
results.push(
	benchmark("stripMetadata - without metadata", () =>
		stripMetadata(mediumCode),
	),
);
results.push(
	benchmark("stripMetadata - with metadata", () =>
		stripMetadata(codeWithMetadata),
	),
);

console.log(
	results
		.slice(-2)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Comparison Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("COMPARISON BENCHMARKS");
console.log(
	"================================================================================\n",
);

const smallCode2 = new Uint8Array(smallCode) as BrandedBytecode;
const mediumCode2 = new Uint8Array(mediumCode) as BrandedBytecode;
const largeCode2 = new Uint8Array(largeCode) as BrandedBytecode;

console.log("--- equals - varying sizes ---");
results.push(
	benchmark("equals - small (100b)", () => equals(smallCode, smallCode2)),
);
results.push(
	benchmark("equals - medium (1kb)", () => equals(mediumCode, mediumCode2)),
);
results.push(
	benchmark("equals - large (10kb)", () => equals(largeCode, largeCode2)),
);

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Opcode Utility Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("OPCODE UTILITY BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- opcode utilities ---");
results.push(benchmark("isPush", () => isPush(0x60)));
results.push(benchmark("getPushSize", () => getPushSize(0x7f)));
results.push(benchmark("isTerminator", () => isTerminator(0xf3)));

console.log(
	results
		.slice(-3)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Size Operations Benchmarks
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("SIZE OPERATIONS BENCHMARKS");
console.log(
	"================================================================================\n",
);

console.log("--- size and extraction ---");
results.push(benchmark("size - small", () => size(smallCode)));
results.push(benchmark("size - large", () => size(largeCode)));
results.push(
	benchmark("extractRuntime - small", () => extractRuntime(smallCode, 10)),
);
results.push(
	benchmark("extractRuntime - large", () => extractRuntime(largeCode, 100)),
);

console.log(
	results
		.slice(-4)
		.map(
			(r) =>
				`  ${r.name}: ${r.opsPerSec.toFixed(0)} ops/sec (${r.avgTimeMs.toFixed(4)} ms/op)`,
		)
		.join("\n"),
);

// ============================================================================
// Summary
// ============================================================================

console.log("\n");
console.log(
	"================================================================================",
);
console.log("BENCHMARK SUMMARY");
console.log(
	"================================================================================\n",
);

console.log(`Total benchmarks run: ${results.length}`);
console.log(
	`Total test iterations: ${results.reduce((sum, r) => sum + r.iterations, 0)}`,
);

// Find fastest and slowest
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);
console.log(
	`\nFastest: ${sorted[0]?.name} (${sorted[0]?.opsPerSec.toFixed(0)} ops/sec)`,
);
console.log(
	`Slowest: ${sorted[sorted.length - 1]?.name} (${sorted[sorted.length - 1]?.opsPerSec.toFixed(0)} ops/sec)`,
);

// Scaling analysis
const smallAnalysis = results.find((r) => r.name === "analyze - small (100b)");
const mediumAnalysis = results.find((r) => r.name === "analyze - medium (1kb)");
const largeAnalysis = results.find((r) => r.name === "analyze - large (10kb)");

if (smallAnalysis && mediumAnalysis && largeAnalysis) {
	console.log("\n--- Analysis Scaling (size vs time) ---");
	console.log(`100b:  ${smallAnalysis.avgTimeMs.toFixed(4)} ms (baseline)`);
	console.log(
		`1kb:   ${mediumAnalysis.avgTimeMs.toFixed(4)} ms (${(mediumAnalysis.avgTimeMs / smallAnalysis.avgTimeMs).toFixed(2)}x)`,
	);
	console.log(
		`10kb:  ${largeAnalysis.avgTimeMs.toFixed(4)} ms (${(largeAnalysis.avgTimeMs / smallAnalysis.avgTimeMs).toFixed(2)}x)`,
	);
}

console.log("\n");

// Export results
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/bytecode-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
	console.log(`Results saved to: ${resultsFile}\n`);
}
