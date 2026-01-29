/**
 * BN254 Performance Benchmarks
 *
 * Measures performance of:
 * - G1 point operations (add, mul, double, negate)
 * - G2 point operations (add, mul, double, negate)
 * - Pairing computation
 * - Multi-pairing operations
 * - Serialization/deserialization
 * - Field operations (Fr)
 *
 * Compares:
 * - Pure TypeScript implementation
 * - WASM implementation (when available)
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import {
	BN254 as Bn254,
	type G1PointType,
	type G2PointType,
} from "./bn254/BN254.js";

// WASM not yet implemented - uncomment when ready
// import { Bn254Wasm } from "./bn254.wasm.js";

// Test data - pre-compute points to benchmark operations, not setup
const g1 = Bn254.G1.generator();
const g2 = Bn254.G2.generator();
const scalar = 123456789n;
const scalar2 = 987654321n;

// Pre-computed points for benchmarks that need inputs
const g1Mul = Bn254.G1.mul(g1, scalar);
const g1Mul2 = Bn254.G1.mul(g1, scalar2);
const g2Mul = Bn254.G2.mul(g2, scalar);
const g2Mul2 = Bn254.G2.mul(g2, scalar2);

// Pre-serialized data for deserialization benchmarks
const g1Bytes = Bn254.serializeG1(g1Mul);
const g2Bytes = Bn254.serializeG2(g2Mul);

// ============================================================================
// G1 Operations - TypeScript
// ============================================================================

bench("TS: G1.add", () => {
	Bn254.G1.add(g1Mul, g1Mul2);
});

bench("TS: G1.double", () => {
	Bn254.G1.double(g1Mul);
});

bench("TS: G1.negate", () => {
	Bn254.G1.negate(g1Mul);
});

bench("TS: G1.mul (scalar: 123456789)", () => {
	Bn254.G1.mul(g1, scalar);
});

bench("TS: G1.isOnCurve", () => {
	Bn254.G1.isOnCurve(g1Mul);
});

bench("TS: G1.toAffine", () => {
	Bn254.G1.toAffine(g1Mul);
});

bench("TS: G1.equal", () => {
	Bn254.G1.equal(g1Mul, g1Mul2);
});

await run();

// ============================================================================
// G2 Operations - TypeScript
// ============================================================================

bench("TS: G2.add", () => {
	Bn254.G2.add(g2Mul, g2Mul2);
});

bench("TS: G2.double", () => {
	Bn254.G2.double(g2Mul);
});

bench("TS: G2.negate", () => {
	Bn254.G2.negate(g2Mul);
});

bench("TS: G2.mul (scalar: 123456789)", () => {
	Bn254.G2.mul(g2, scalar);
});

bench("TS: G2.isOnCurve", () => {
	Bn254.G2.isOnCurve(g2Mul);
});

bench("TS: G2.isInSubgroup", () => {
	Bn254.G2.isInSubgroup(g2Mul);
});

bench("TS: G2.toAffine", () => {
	Bn254.G2.toAffine(g2Mul);
});

bench("TS: G2.frobenius", () => {
	Bn254.G2.frobenius(g2Mul);
});

bench("TS: G2.equal", () => {
	Bn254.G2.equal(g2Mul, g2Mul2);
});

await run();

// ============================================================================
// Pairing Operations - TypeScript
// ============================================================================

bench("TS: Pairing.pair", () => {
	Bn254.Pairing.pair(g1Mul, g2Mul);
});

bench("TS: Pairing.pairingCheck (2 pairs)", () => {
	Bn254.Pairing.pairingCheck([
		[g1Mul, g2Mul],
		[g1Mul2, g2Mul2],
	]);
});

bench("TS: Pairing.multiPairing (4 pairs)", () => {
	const pairs: Array<[G1PointType, G2PointType]> = [
		[g1Mul, g2Mul],
		[g1Mul2, g2Mul2],
		[Bn254.G1.mul(g1, scalar + 1n), Bn254.G2.mul(g2, scalar2 + 1n)],
		[Bn254.G1.mul(g1, scalar + 2n), Bn254.G2.mul(g2, scalar2 + 2n)],
	];
	Bn254.Pairing.multiPairing(pairs);
});

await run();

// ============================================================================
// Serialization - TypeScript
// ============================================================================

bench("TS: serializeG1", () => {
	Bn254.serializeG1(g1Mul);
});

bench("TS: deserializeG1", () => {
	Bn254.deserializeG1(g1Bytes);
});

bench("TS: serializeG2", () => {
	Bn254.serializeG2(g2Mul);
});

bench("TS: deserializeG2", () => {
	Bn254.deserializeG2(g2Bytes);
});

await run();

// ============================================================================
// Field Operations (Fr) - TypeScript
// ============================================================================

bench("TS: Fr.add", () => {
	Bn254.Fr.add(scalar, scalar2);
});

bench("TS: Fr.sub", () => {
	Bn254.Fr.sub(scalar, scalar2);
});

bench("TS: Fr.mul", () => {
	Bn254.Fr.mul(scalar, scalar2);
});

bench("TS: Fr.inv", () => {
	Bn254.Fr.inv(scalar);
});

bench("TS: Fr.pow (exp: 17)", () => {
	Bn254.Fr.pow(scalar, 17n);
});

bench("TS: Fr.neg", () => {
	Bn254.Fr.neg(scalar);
});

await run();

// ============================================================================
// WASM Benchmarks - Uncomment when WASM is implemented
// ============================================================================

// await Bn254Wasm.init(); // Initialize WASM module

// bench("WASM: G1.add", () => {
//   Bn254Wasm.G1.add(g1Mul, g1Mul2);
// });

// bench("WASM: G1.mul (scalar: 123456789)", () => {
//   Bn254Wasm.G1.mul(g1, scalar);
// });

// bench("WASM: G2.add", () => {
//   Bn254Wasm.G2.add(g2Mul, g2Mul2);
// });

// bench("WASM: G2.mul (scalar: 123456789)", () => {
//   Bn254Wasm.G2.mul(g2, scalar);
// });

// bench("WASM: Pairing.pair", () => {
//   Bn254Wasm.Pairing.pair(g1Mul, g2Mul);
// });

// bench("WASM: Pairing.pairingCheck (2 pairs)", () => {
//   Bn254Wasm.Pairing.pairingCheck([[g1Mul, g2Mul], [g1Mul2, g2Mul2]]);
// });

// await run();

// ============================================================================
// Export results metadata
// ============================================================================

const benchResults = {
	timestamp: new Date().toISOString(),
	implementations: ["TypeScript (pure JS)"],
	// Add "WASM (Zig)" when implemented
	categories: {
		g1: [
			"G1.add",
			"G1.double",
			"G1.negate",
			"G1.mul",
			"G1.isOnCurve",
			"G1.toAffine",
			"G1.equal",
		],
		g2: [
			"G2.add",
			"G2.double",
			"G2.negate",
			"G2.mul",
			"G2.isOnCurve",
			"G2.isInSubgroup",
			"G2.toAffine",
			"G2.frobenius",
			"G2.equal",
		],
		pairing: ["Pairing.pair", "Pairing.pairingCheck", "Pairing.multiPairing"],
		serialization: [
			"serializeG1",
			"deserializeG1",
			"serializeG2",
			"deserializeG2",
		],
		fr: ["Fr.add", "Fr.sub", "Fr.mul", "Fr.inv", "Fr.pow", "Fr.neg"],
	},
	note: "Run 'bun run src/crypto/bn254.bench.ts' to see detailed performance results. WASM comparison will be added when Bn254Wasm is implemented.",
};

writeFileSync(
	"src/crypto/bn254-bench-results.json",
	JSON.stringify(benchResults, null, 2),
);
