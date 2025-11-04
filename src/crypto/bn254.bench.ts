/**
 * BN254 Performance Benchmarks
 *
 * Measures performance of:
 * - G1 scalar multiplication
 * - G2 scalar multiplication
 * - Pairing computation
 * - Multi-pairing operations
 *
 * Compares three implementations:
 * - Pure TypeScript (baseline)
 * - WASM native Zig (optimized)
 * - WASM Arkworks (production-grade, expected fastest)
 */

// import { Bn254Wasm } from "./bn254.wasm.js";
// import { Bn254Ark } from "./bn254.ark.js";
import fs from "fs";
import path from "path";
import { bench, describe } from "vitest";
import { Bn254 } from "./bn254.js";

const results: Record<string, { ops_per_sec: number; avg_time_ms: number }> =
	{};

// function _recordBenchmark(name: string, opsPerSec: number, avgTimeMs: number) {
//   _results[name] = {
//     ops_per_sec: opsPerSec,
//     avg_time_ms: avgTimeMs,
//   };
// }

describe("BN254 Performance Benchmarks", () => {
	const g1 = Bn254.G1.generator();
	const g2 = Bn254.G2.generator();
	const scalar = 123456789n;
	const scalar2 = 987654321n;

	bench(
		"G1.mul",
		() => {
			Bn254.G1.mul.call(g1, scalar);
		},
		{
			time: 1000,
			iterations: 100,
		},
	);

	bench(
		"G1.add",
		() => {
			const p1 = Bn254.G1.mul.call(g1, scalar);
			const p2 = Bn254.G1.mul.call(g1, scalar2);
			Bn254.G1.add.call(p1, p2);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"G1.double",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			Bn254.G1.double.call(p);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"G1.negate",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			Bn254.G1.negate.call(p);
		},
		{
			time: 1000,
			iterations: 10000,
		},
	);

	bench(
		"G1.isOnCurve",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			Bn254.G1.isOnCurve.call(p);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"G1.toAffine",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			Bn254.G1.toAffine.call(p);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"G2.mul",
		() => {
			Bn254.G2.mul.call(g2, scalar);
		},
		{
			time: 1000,
			iterations: 50,
		},
	);

	bench(
		"G2.add",
		() => {
			const q1 = Bn254.G2.mul.call(g2, scalar);
			const q2 = Bn254.G2.mul.call(g2, scalar2);
			Bn254.G2.add.call(q1, q2);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);

	bench(
		"G2.double",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.double.call(q);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);

	bench(
		"G2.negate",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.negate.call(q);
		},
		{
			time: 1000,
			iterations: 5000,
		},
	);

	bench(
		"G2.isOnCurve",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.isOnCurve.call(q);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);

	bench(
		"G2.isInSubgroup",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.isInSubgroup.call(q);
		},
		{
			time: 1000,
			iterations: 10,
		},
	);

	bench(
		"G2.toAffine",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.toAffine.call(q);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);

	bench(
		"G2.frobenius",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.G2.frobenius.call(q);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"Pairing.pair",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			const q = Bn254.G2.mul.call(g2, scalar2);
			Bn254.Pairing.pair(p, q);
		},
		{
			time: 2000,
			iterations: 10,
		},
	);

	bench(
		"Pairing.pairingCheck (2 pairs)",
		() => {
			const p1 = Bn254.G1.mul.call(g1, scalar);
			const q1 = Bn254.G2.mul.call(g2, scalar2);
			const p2 = Bn254.G1.mul.call(g1, scalar2);
			const q2 = Bn254.G2.mul.call(g2, scalar);
			Bn254.Pairing.pairingCheck([
				[p1, q1],
				[p2, q2],
			]);
		},
		{
			time: 2000,
			iterations: 10,
		},
	);

	bench(
		"Pairing.multiPairing (4 pairs)",
		() => {
			const pairs: Array<[Bn254.G1Point, Bn254.G2Point]> = [];
			for (let i = 0; i < 4; i++) {
				const p = Bn254.G1.mul.call(g1, scalar + BigInt(i));
				const q = Bn254.G2.mul.call(g2, scalar2 + BigInt(i));
				pairs.push([p, q]);
			}
			Bn254.Pairing.multiPairing(pairs);
		},
		{
			time: 2000,
			iterations: 5,
		},
	);

	bench(
		"serializeG1",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			Bn254.serializeG1(p);
		},
		{
			time: 1000,
			iterations: 5000,
		},
	);

	bench(
		"deserializeG1",
		() => {
			const p = Bn254.G1.mul.call(g1, scalar);
			const bytes = Bn254.serializeG1(p);
			Bn254.deserializeG1(bytes);
		},
		{
			time: 1000,
			iterations: 1000,
		},
	);

	bench(
		"serializeG2",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			Bn254.serializeG2(q);
		},
		{
			time: 1000,
			iterations: 5000,
		},
	);

	bench(
		"deserializeG2",
		() => {
			const q = Bn254.G2.mul.call(g2, scalar);
			const bytes = Bn254.serializeG2(q);
			Bn254.deserializeG2(bytes);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);

	bench(
		"Fr.mul",
		() => {
			Bn254.Fr.mul(scalar, scalar2);
		},
		{
			time: 1000,
			iterations: 100000,
		},
	);

	bench(
		"Fr.inv",
		() => {
			Bn254.Fr.inv(scalar);
		},
		{
			time: 1000,
			iterations: 100,
		},
	);

	bench(
		"Fr.pow",
		() => {
			Bn254.Fr.pow(scalar, 17n);
		},
		{
			time: 1000,
			iterations: 500,
		},
	);
});

if ((import.meta as any).vitest) {
	const { afterAll } = await import("vitest");

	afterAll(() => {
		const outputPath = path.join(
			process.cwd(),
			"src/crypto/bn254-bench-results.json",
		);

		fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
	});
}

// ============================================================================
// WASM and Arkworks Benchmarks (TODO)
// ============================================================================
// TODO: Once WASM implementations are ready, add benchmarks for:
//
// describe("BN254 WASM Benchmarks", () => {
//   const g1 = Bn254Wasm.G1.generator();
//   const g2 = Bn254Wasm.G2.generator();
//   const scalar = 123456789n;
//
//   bench("WASM G1.mul", () => {
//     Bn254Wasm.G1.mul.call(g1, scalar);
//   });
//
//   bench("WASM G2.mul", () => {
//     Bn254Wasm.G2.mul.call(g2, scalar);
//   });
//
//   bench("WASM Pairing.pair", () => {
//     Bn254Wasm.Pairing.pair(g1, g2);
//   });
// });
//
// describe("BN254 Arkworks Benchmarks", () => {
//   const g1 = Bn254Ark.G1.generator();
//   const g2 = Bn254Ark.G2.generator();
//   const scalar = 123456789n;
//
//   bench("Arkworks G1.mul", () => {
//     Bn254Ark.G1.mul.call(g1, scalar);
//   });
//
//   bench("Arkworks G2.mul", () => {
//     Bn254Ark.G2.mul.call(g2, scalar);
//   });
//
//   bench("Arkworks Pairing.pair", () => {
//     Bn254Ark.Pairing.pair(g1, g2);
//   });
// });
//
// Expected performance hierarchy:
// Arkworks (Rust, optimized) >> WASM (Zig, optimized) >> Pure TS (baseline)
// Typical speedups:
// - Arkworks: 50-100x faster than Pure TS
// - WASM: 10-30x faster than Pure TS
