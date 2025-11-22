/**
 * Uint256 WASM vs JS Performance Benchmarks
 *
 * Compares WASM and JS implementations across all operations
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import * as loader from "../../wasm-loader/loader.js";
import * as Uint from "./index.js";
import * as UintWasm from "./Uint256.wasm.js";

// Load WASM module before benchmarking
await loader.loadWasm(
	new URL("../../../wasm/primitives.wasm", import.meta.url),
);

// ============================================================================
// Test Data
// ============================================================================

const smallValue = Uint.from(100n);
const mediumValue = Uint.from(1n << 64n);
const largeValue = Uint.from(1n << 128n);
const maxValue = Uint.MAX;

// WASM equivalent values (32-byte buffers)
const smallWasm = UintWasm.u256FromBigInt(100n);
const mediumWasm = UintWasm.u256FromBigInt(1n << 64n);
const largeWasm = UintWasm.u256FromBigInt(1n << 128n);

// ============================================================================
// Arithmetic Operations
// ============================================================================

bench("U256 (JS) add - small", () => {
	Uint.plus(smallValue, smallValue);
});

bench("U256 (WASM) add - small", () => {
	UintWasm.u256Add(smallWasm, smallWasm);
});

bench("U256 (JS) add - medium", () => {
	Uint.plus(mediumValue, mediumValue);
});

bench("U256 (WASM) add - medium", () => {
	UintWasm.u256Add(mediumWasm, mediumWasm);
});

bench("U256 (JS) add - large", () => {
	Uint.plus(largeValue, largeValue);
});

bench("U256 (WASM) add - large", () => {
	UintWasm.u256Add(largeWasm, largeWasm);
});

bench("U256 (JS) sub - small", () => {
	Uint.minus(smallValue, Uint.from(50n));
});

bench("U256 (WASM) sub - small", () => {
	UintWasm.u256Sub(smallWasm, UintWasm.u256FromBigInt(50n));
});

bench("U256 (JS) mul - small", () => {
	Uint.times(smallValue, Uint.from(2n));
});

bench("U256 (WASM) mul - small", () => {
	UintWasm.u256Mul(smallWasm, UintWasm.u256FromBigInt(2n));
});

bench("U256 (JS) mul - medium", () => {
	Uint.times(mediumValue, Uint.from(2n));
});

bench("U256 (WASM) mul - medium", () => {
	UintWasm.u256Mul(mediumWasm, UintWasm.u256FromBigInt(2n));
});

bench("U256 (JS) div - small", () => {
	Uint.dividedBy(smallValue, Uint.from(10n));
});

bench("U256 (WASM) div - small", () => {
	UintWasm.u256Div(smallWasm, UintWasm.u256FromBigInt(10n));
});

bench("U256 (JS) mod - small", () => {
	Uint.modulo(smallValue, Uint.from(30n));
});

bench("U256 (WASM) mod - small", () => {
	UintWasm.u256Mod(smallWasm, UintWasm.u256FromBigInt(30n));
});

// ============================================================================
// Bitwise Operations
// ============================================================================

const a = Uint.from(0xffn);
const b = Uint.from(0x0fn);
const aWasm = UintWasm.u256FromBigInt(0xffn);
const bWasm = UintWasm.u256FromBigInt(0x0fn);

bench("U256 (JS) bitwiseAnd", () => {
	Uint.bitwiseAnd(a, b);
});

bench("U256 (WASM) bitwiseAnd", () => {
	UintWasm.u256BitwiseAnd(aWasm, bWasm);
});

bench("U256 (JS) bitwiseOr", () => {
	Uint.bitwiseOr(a, b);
});

bench("U256 (WASM) bitwiseOr", () => {
	UintWasm.u256BitwiseOr(aWasm, bWasm);
});

bench("U256 (JS) bitwiseXor", () => {
	Uint.bitwiseXor(a, b);
});

bench("U256 (WASM) bitwiseXor", () => {
	UintWasm.u256BitwiseXor(aWasm, bWasm);
});

bench("U256 (JS) bitwiseNot", () => {
	Uint.bitwiseNot(a);
});

bench("U256 (WASM) bitwiseNot", () => {
	UintWasm.u256BitwiseNot(aWasm);
});

bench("U256 (JS) shiftLeft - 1 bit", () => {
	Uint.shiftLeft(smallValue, Uint.ONE);
});

bench("U256 (WASM) shiftLeft - 1 bit", () => {
	UintWasm.u256ShiftLeft(smallWasm, UintWasm.u256FromBigInt(1n));
});

bench("U256 (JS) shiftLeft - 8 bits", () => {
	Uint.shiftLeft(smallValue, Uint.from(8n));
});

bench("U256 (WASM) shiftLeft - 8 bits", () => {
	UintWasm.u256ShiftLeft(smallWasm, UintWasm.u256FromBigInt(8n));
});

bench("U256 (JS) shiftRight - 1 bit", () => {
	Uint.shiftRight(smallValue, Uint.ONE);
});

bench("U256 (WASM) shiftRight - 1 bit", () => {
	UintWasm.u256ShiftRight(smallWasm, UintWasm.u256FromBigInt(1n));
});

// ============================================================================
// Modular Arithmetic
// ============================================================================

const mod = Uint.from(997n);
const modWasm = UintWasm.u256FromBigInt(997n);

bench("U256 (JS) addMod", () => {
	const base = Uint.from(500n);
	const other = Uint.from(600n);
	Uint.plus(base, other);
	Uint.modulo(Uint.plus(base, other), mod);
});

bench("U256 (WASM) addMod", () => {
	const base = UintWasm.u256FromBigInt(500n);
	const other = UintWasm.u256FromBigInt(600n);
	const sum = UintWasm.u256Add(base, other);
	UintWasm.u256Mod(sum, modWasm);
});

bench("U256 (JS) mulMod", () => {
	const base = Uint.from(500n);
	const other = Uint.from(600n);
	Uint.modulo(Uint.times(base, other), mod);
});

bench("U256 (WASM) mulMod", () => {
	const base = UintWasm.u256FromBigInt(500n);
	const other = UintWasm.u256FromBigInt(600n);
	const product = UintWasm.u256Mul(base, other);
	UintWasm.u256Mod(product, modWasm);
});

// ============================================================================
// Comparison Operations
// ============================================================================

const v1 = Uint.from(100n);
const v2 = Uint.from(200n);
const v1Wasm = UintWasm.u256FromBigInt(100n);
const v2Wasm = UintWasm.u256FromBigInt(200n);

bench("U256 (JS) equals", () => {
	Uint.equals(v1, v1);
});

bench("U256 (WASM) equals", () => {
	UintWasm.u256Eq(v1Wasm, v1Wasm);
});

bench("U256 (JS) lessThan", () => {
	Uint.lessThan(v1, v2);
});

bench("U256 (WASM) lessThan", () => {
	UintWasm.u256Lt(v1Wasm, v2Wasm);
});

bench("U256 (JS) greaterThan", () => {
	Uint.greaterThan(v2, v1);
});

bench("U256 (WASM) greaterThan", () => {
	UintWasm.u256Gt(v2Wasm, v1Wasm);
});

// ============================================================================
// Conversion Operations
// ============================================================================

const testHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const testBigInt = 123456789n;

bench("U256 (JS) fromHex", () => {
	Uint.fromHex(testHex);
});

bench("U256 (WASM) fromHex", () => {
	UintWasm.u256FromHex(testHex);
});

bench("U256 (JS) toHex", () => {
	Uint.toHex(smallValue);
});

bench("U256 (WASM) toHex", () => {
	UintWasm.u256ToHex(smallWasm);
});

bench("U256 (JS) fromBigInt", () => {
	Uint.fromBigInt(testBigInt);
});

bench("U256 (WASM) fromBigInt", () => {
	UintWasm.u256FromBigInt(testBigInt);
});

bench("U256 (JS) toBigInt", () => {
	Uint.toBigInt(smallValue);
});

bench("U256 (WASM) toBigInt", () => {
	UintWasm.u256ToBigInt(smallWasm);
});

bench("U256 (JS) fromBytes", () => {
	Uint.fromBytes(new Uint8Array(32));
});

bench("U256 (WASM) fromBytes (toHex conversion)", () => {
	const bytes = new Uint8Array(32);
	UintWasm.u256ToHex(bytes);
});

// ============================================================================
// Bit Manipulation
// ============================================================================

bench("U256 (JS) bitLength", () => {
	Uint.bitLength(smallValue);
});

bench("U256 (WASM) bitLength", () => {
	const bigint = UintWasm.u256ToBigInt(smallWasm);
	bigint.toString(2).length;
});

bench("U256 (JS) leadingZeros", () => {
	Uint.leadingZeros(smallValue);
});

bench("U256 (WASM) leadingZeros", () => {
	const bitLen = UintWasm.u256ToBigInt(smallWasm).toString(2).length;
	256 - bitLen;
});

bench("U256 (JS) popCount", () => {
	Uint.popCount(Uint.from(0xffn));
});

bench("U256 (WASM) popCount", () => {
	const bigint = UintWasm.u256ToBigInt(UintWasm.u256FromBigInt(0xffn));
	bigint.toString(2).split("1").length - 1;
});

// ============================================================================
// Run and Export Results
// ============================================================================

interface BenchResult {
	name: string;
	ops_per_sec: number;
	avg_time_ns: number;
	min_time_ns: number;
	max_time_ns: number;
}

const results: BenchResult[] = [];

// Monkey patch mitata's summary to capture results
const originalSummary = (globalThis as any).summary;
if (!originalSummary) {
	(globalThis as any).summary = (result: any) => {
		results.push({
			name: result.name,
			ops_per_sec: result.ops,
			avg_time_ns: result.avg * 1_000_000,
			min_time_ns: result.min * 1_000_000,
			max_time_ns: result.max * 1_000_000,
		});
	};
}

await run({
	throw: false,
	colors: true,
});

// Export results
const output = {
	timestamp: new Date().toISOString(),
	runtime: "bun",
	version: process.version,
	platform: process.platform,
	arch: process.arch,
	results,
	summary: {
		total_benchmarks: results.length,
		fastest:
			results.length > 0
				? results.reduce((a, b) => (a.ops_per_sec > b.ops_per_sec ? a : b))
				: null,
		slowest:
			results.length > 0
				? results.reduce((a, b) => (a.ops_per_sec < b.ops_per_sec ? a : b))
				: null,
	},
};

const outputPath = new URL("./uint-wasm-results.json", import.meta.url)
	.pathname;
writeFileSync(outputPath, JSON.stringify(output, null, 2));
