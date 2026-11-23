import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import {
	bls12G1Add,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	execute,
	isPrecompile,
	PrecompileAddress,
	type PrecompileResult,
} from "./precompiles.js";

type G1Point = ReturnType<typeof bls12_381.G1.Point.fromAffine>;
type G2Point = ReturnType<typeof bls12_381.G2.Point.fromAffine>;

const Fp = bls12_381.fields.Fp;
const Fp2 = bls12_381.fields.Fp2;
const P = Fp.ORDER;
const R = bls12_381.fields.Fr.ORDER;
const G1 = bls12_381.G1.Point.BASE;
const G2 = bls12_381.G2.Point.BASE;
const G1_ZERO = bls12_381.G1.Point.ZERO;
const G2_ZERO = bls12_381.G2.Point.ZERO;
const GAS = 10_000_000n;

function bigIntToFixedBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	let v = value;
	for (let i = length - 1; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

function encodeG1Affine(x: bigint, y: bigint): Uint8Array {
	return concat(bigIntToFixedBytes(x, 64), bigIntToFixedBytes(y, 64));
}

function serializeG1Point(point: G1Point): Uint8Array {
	if (point.equals(G1_ZERO)) return new Uint8Array(128);
	const affine = point.toAffine();
	return encodeG1Affine(affine.x, affine.y);
}

function serializeG2Point(point: G2Point): Uint8Array {
	if (point.equals(G2_ZERO)) return new Uint8Array(256);
	const affine = point.toAffine();
	return concat(
		bigIntToFixedBytes(affine.x.c0, 64),
		bigIntToFixedBytes(affine.x.c1, 64),
		bigIntToFixedBytes(affine.y.c0, 64),
		bigIntToFixedBytes(affine.y.c1, 64),
	);
}

const scalar = (value: bigint) => bigIntToFixedBytes(value, 32);

/** First G1 curve point (smallest x) that is outside the order-r subgroup. */
function g1OutsideSubgroup(): Uint8Array {
	for (let x = 1n; x < 100n; x++) {
		let y: bigint;
		try {
			y = Fp.sqrt(Fp.add(Fp.mul(Fp.sqr(x), x), 4n));
		} catch {
			continue;
		}
		if (!bls12_381.G1.Point.fromAffine({ x, y }).isTorsionFree()) {
			return encodeG1Affine(x, y);
		}
	}
	throw new Error("no G1 point outside the subgroup found");
}

/** First G2 curve point (smallest real x) that is outside the order-r subgroup. */
function g2OutsideSubgroup(): Uint8Array {
	const b = Fp2.create({ c0: 4n, c1: 4n });
	for (let c0 = 1n; c0 < 100n; c0++) {
		const x = Fp2.create({ c0, c1: 0n });
		let y: { c0: bigint; c1: bigint };
		try {
			y = Fp2.sqrt(Fp2.add(Fp2.mul(Fp2.sqr(x), x), b));
		} catch {
			continue;
		}
		if (!Fp2.eql(Fp2.sqr(y), Fp2.add(Fp2.mul(Fp2.sqr(x), x), b))) continue;
		if (!bls12_381.G2.Point.fromAffine({ x, y }).isTorsionFree()) {
			return concat(
				bigIntToFixedBytes(x.c0, 64),
				bigIntToFixedBytes(x.c1, 64),
				bigIntToFixedBytes(y.c0, 64),
				bigIntToFixedBytes(y.c1, 64),
			);
		}
	}
	throw new Error("no G2 point outside the subgroup found");
}

/** An exceptional halt consumes all forwarded gas and returns no output. */
function expectHalt(result: PrecompileResult, gasLimit: bigint): void {
	expect(result.success).toBe(false);
	expect(result.error).toBeDefined();
	expect(result.gasUsed).toBe(gasLimit);
	expect(result.output).toEqual(new Uint8Array(0));
}

const g1 = serializeG1Point(G1);
const g2 = serializeG2Point(G2);
const g1Inf = new Uint8Array(128);
const g2Inf = new Uint8Array(256);

describe("EIP-2537 address table (final, 0x0b..0x11)", () => {
	const table: Array<[string, string]> = [
		["BLS12_G1_ADD", "0x000000000000000000000000000000000000000b"],
		["BLS12_G1_MSM", "0x000000000000000000000000000000000000000c"],
		["BLS12_G2_ADD", "0x000000000000000000000000000000000000000d"],
		["BLS12_G2_MSM", "0x000000000000000000000000000000000000000e"],
		["BLS12_PAIRING", "0x000000000000000000000000000000000000000f"],
		["BLS12_MAP_FP_TO_G1", "0x0000000000000000000000000000000000000010"],
		["BLS12_MAP_FP2_TO_G2", "0x0000000000000000000000000000000000000011"],
	];

	test("enum maps the seven operations to 0x0b..0x11", () => {
		for (const [name, address] of table) {
			expect(PrecompileAddress[name as keyof typeof PrecompileAddress]).toBe(
				address,
			);
		}
		const blsNames = Object.keys(PrecompileAddress).filter((k) =>
			k.startsWith("BLS12_"),
		);
		expect(blsNames.sort()).toEqual(table.map(([name]) => name).sort());
	});

	test("the seven addresses activate at Prague", () => {
		for (const [, address] of table) {
			expect(isPrecompile(address, Hardfork.CANCUN)).toBe(false);
			expect(isPrecompile(address, Hardfork.PRAGUE)).toBe(true);
			expect(isPrecompile(address, Hardfork.OSAKA)).toBe(true);
			expect(isPrecompile(address, Hardfork.AMSTERDAM)).toBe(true);
		}
	});

	test("obsolete 0x12 and 0x13 are not precompiles in any fork", () => {
		for (const address of [
			"0x0000000000000000000000000000000000000012",
			"0x0000000000000000000000000000000000000013",
		]) {
			for (const fork of Hardfork.allIds()) {
				expect(isPrecompile(address, fork)).toBe(false);
				const result = execute(address, new Uint8Array(64), GAS, fork);
				expect(result.success).toBe(false);
				expect(result.gasUsed).toBe(0n);
				expect(result.error).toContain("Unknown precompile");
			}
		}
	});

	test("execute dispatches each address to its operation", () => {
		const run = (address: string, input: Uint8Array) =>
			execute(address, input, GAS, Hardfork.PRAGUE);
		expect(run(PrecompileAddress.BLS12_G1_ADD, concat(g1, g1))).toEqual(
			bls12G1Add(concat(g1, g1), GAS),
		);
		expect(run(PrecompileAddress.BLS12_G1_MSM, concat(g1, scalar(2n)))).toEqual(
			bls12G1Msm(concat(g1, scalar(2n)), GAS),
		);
		expect(run(PrecompileAddress.BLS12_G2_ADD, concat(g2, g2))).toEqual(
			bls12G2Add(concat(g2, g2), GAS),
		);
		expect(run(PrecompileAddress.BLS12_G2_MSM, concat(g2, scalar(2n)))).toEqual(
			bls12G2Msm(concat(g2, scalar(2n)), GAS),
		);
		expect(run(PrecompileAddress.BLS12_PAIRING, concat(g1, g2))).toEqual(
			bls12Pairing(concat(g1, g2), GAS),
		);
		expect(
			run(PrecompileAddress.BLS12_MAP_FP_TO_G1, new Uint8Array(64)),
		).toEqual(bls12MapFpToG1(new Uint8Array(64), GAS));
		expect(
			run(PrecompileAddress.BLS12_MAP_FP2_TO_G2, new Uint8Array(128)),
		).toEqual(bls12MapFp2ToG2(new Uint8Array(128), GAS));
	});

	test("execute before Prague does not run BLS operations", () => {
		for (const [, address] of table) {
			const result = execute(address, new Uint8Array(0), GAS, Hardfork.CANCUN);
			expect(result.success).toBe(false);
			expect(result.gasUsed).toBe(0n);
			expect(result.error).toContain("Unknown precompile");
		}
	});
});

describe("BLS12-381 G1 Add (0x0b)", () => {
	test("gas cost is 375", () => {
		const result = bls12G1Add(new Uint8Array(256), 1000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(375n);
	});

	test("out of gas", () => {
		expectHalt(bls12G1Add(new Uint8Array(256), 374n), 374n);
	});

	test("exact gas with valid input", () => {
		const result = bls12G1Add(new Uint8Array(256), 375n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(375n);
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12G1Add(new Uint8Array(255), 1000n), 1000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12G1Add(new Uint8Array(257), 1000n), 1000n);
	});

	test("invalid input length - empty", () => {
		expectHalt(bls12G1Add(new Uint8Array(0), 1000n), 1000n);
	});

	test("identity + identity = identity", () => {
		const result = bls12G1Add(new Uint8Array(256), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("generator + identity = generator", () => {
		const result = bls12G1Add(concat(g1, g1Inf), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(g1);
	});

	test("identity + generator = generator", () => {
		const result = bls12G1Add(concat(g1Inf, g1), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(g1);
	});

	test("generator + generator = 2*generator", () => {
		const result = bls12G1Add(concat(g1, g1), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG1Point(G1.double()));
	});

	test("generator + (-generator) = identity", () => {
		const result = bls12G1Add(concat(g1, serializeG1Point(G1.negate())), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(256);
		input[63] = 1;
		input[127] = 1;
		expectHalt(bls12G1Add(input, 1000n), 1000n);
	});

	test("rejects a coordinate equal to the field modulus", () => {
		const input = concat(encodeG1Affine(P, 2n), g1Inf);
		expectHalt(bls12G1Add(input, 1000n), 1000n);
	});

	test("rejects x + p even though it reduces to a valid point", () => {
		const { x, y } = G1.toAffine();
		// x + p < 2^384, so the top 16 bytes are still zero.
		expectHalt(
			bls12G1Add(concat(encodeG1Affine(x + P, y), g1Inf), 1000n),
			1000n,
		);
		expectHalt(
			bls12G1Add(concat(encodeG1Affine(x, y + P), g1Inf), 1000n),
			1000n,
		);
		expectHalt(
			bls12G1Add(concat(g1Inf, encodeG1Affine(x + P, y)), 1000n),
			1000n,
		);
	});

	test("rejects any non-zero byte in the top 16 bytes of a coordinate", () => {
		for (const coordinate of [0, 64, 128, 192]) {
			for (let i = 0; i < 16; i++) {
				const input = concat(g1, g1);
				input[coordinate + i] = 1;
				expectHalt(bls12G1Add(input, 1000n), 1000n);
			}
		}
	});

	test("rejects non-zero top bytes on an otherwise infinite point", () => {
		const input = new Uint8Array(256);
		input[0] = 1;
		expectHalt(bls12G1Add(input, 1000n), 1000n);
	});

	test("does not require subgroup membership", () => {
		const outside = g1OutsideSubgroup();
		const result = bls12G1Add(concat(outside, g1Inf), 1000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(375n);
		expect(result.output).toEqual(outside);
	});

	test("output is always 128 bytes", () => {
		expect(bls12G1Add(concat(g1, g1), 1000n).output.length).toBe(128);
		expect(bls12G1Add(new Uint8Array(256), 1000n).output.length).toBe(128);
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_G1_ADD,
			concat(g1, g1),
			1000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(375n);
		expect(result.output).toEqual(serializeG1Point(G1.double()));
	});
});

describe("BLS12-381 G1 scalar multiplication through G1 MSM with k = 1 (0x0c)", () => {
	const mul = (point: Uint8Array, k: bigint, gas = 20000n) =>
		bls12G1Msm(concat(point, scalar(k)), gas);

	test("gas cost is 12000", () => {
		const result = mul(g1, 1n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
	});

	test("out of gas", () => {
		expectHalt(mul(g1, 1n, 11999n), 11999n);
	});

	test("exact gas with valid input", () => {
		const result = mul(g1, 7n, 12000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG1Point(G1.multiply(7n)));
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12G1Msm(new Uint8Array(159), 20000n), 20000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12G1Msm(new Uint8Array(161), 20000n), 20000n);
	});

	test("identity * k = identity", () => {
		const result = mul(g1Inf, 5n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("generator * 0 = identity", () => {
		const result = mul(g1, 0n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("generator * 1 = generator", () => {
		expect(mul(g1, 1n).output).toEqual(g1);
	});

	test("generator * 2 = 2*generator", () => {
		expect(mul(g1, 2n).output).toEqual(serializeG1Point(G1.double()));
	});

	test("generator * (r - 1) = -generator", () => {
		expect(mul(g1, R - 1n).output).toEqual(serializeG1Point(G1.negate()));
	});

	test("scalars at or above the subgroup order are reduced, not rejected", () => {
		const atOrder = mul(g1, R);
		expect(atOrder.success).toBe(true);
		expect(atOrder.output).toEqual(new Uint8Array(128));

		expect(mul(g1, R + 5n).output).toEqual(serializeG1Point(G1.multiply(5n)));

		const max = (1n << 256n) - 1n;
		const maxResult = mul(g1, max);
		expect(maxResult.success).toBe(true);
		expect(maxResult.output).toEqual(serializeG1Point(G1.multiply(max % R)));
	});

	test("invalid point not on curve", () => {
		const point = new Uint8Array(128);
		point[63] = 1;
		point[127] = 1;
		expectHalt(mul(point, 1n), 20000n);
	});

	test("validates the point even when the scalar is zero", () => {
		const point = new Uint8Array(128);
		point[63] = 1;
		point[127] = 1;
		expectHalt(mul(point, 0n), 20000n);
		expectHalt(mul(g1OutsideSubgroup(), 0n), 20000n);
	});

	test("output is always 128 bytes when successful", () => {
		for (const k of [0n, 1n, 2n, 255n]) {
			expect(mul(g1, k).output.length).toBe(128);
		}
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_G1_MSM,
			concat(g1, scalar(3n)),
			20000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
		expect(result.output).toEqual(serializeG1Point(G1.multiply(3n)));
	});
});

describe("BLS12-381 G1 MSM (0x0c)", () => {
	const pairs = (...items: Array<[Uint8Array, bigint]>) =>
		concat(...items.flatMap(([point, k]) => [point, scalar(k)]));

	test("empty input is invalid", () => {
		expectHalt(bls12G1Msm(new Uint8Array(0), 20000n), 20000n);
	});

	test("invalid input length not multiple of 160", () => {
		expectHalt(bls12G1Msm(new Uint8Array(161), 50000n), 50000n);
		expectHalt(bls12G1Msm(new Uint8Array(319), 50000n), 50000n);
	});

	test("single pair gas cost: 1 * 12000 * 1000 / 1000", () => {
		expect(bls12G1Msm(pairs([g1, 1n]), GAS).gasUsed).toBe(12000n);
	});

	test("two pairs gas cost: 2 * 12000 * 949 / 1000", () => {
		expect(bls12G1Msm(pairs([g1, 1n], [g1, 2n]), GAS).gasUsed).toBe(22776n);
	});

	test("four pairs gas cost: 4 * 12000 * 797 / 1000", () => {
		const input = pairs([g1, 1n], [g1, 2n], [g1, 3n], [g1, 4n]);
		expect(bls12G1Msm(input, GAS).gasUsed).toBe(38256n);
	});

	test("out of gas", () => {
		const input = pairs([g1, 1n], [g1, 2n]);
		expectHalt(bls12G1Msm(input, 22775n), 22775n);
		expect(bls12G1Msm(input, 22776n).success).toBe(true);
	});

	test("single identity point with scalar = identity", () => {
		const result = bls12G1Msm(pairs([g1Inf, 9n]), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("generator with scalar 5", () => {
		const result = bls12G1Msm(pairs([g1, 5n]), GAS);
		expect(result.output).toEqual(serializeG1Point(G1.multiply(5n)));
	});

	test("two generators with scalars 1 and 2", () => {
		const result = bls12G1Msm(pairs([g1, 1n], [g1, 2n]), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG1Point(G1.multiply(3n)));
	});

	test("mixed points, zero scalars and infinity", () => {
		const p5 = serializeG1Point(G1.multiply(5n));
		const result = bls12G1Msm(
			pairs([g1, 7n], [p5, 3n], [g1Inf, 11n], [g1, 0n]),
			GAS,
		);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG1Point(G1.multiply(22n)));
	});

	test("multiple identity points", () => {
		const result = bls12G1Msm(pairs([g1Inf, 1n], [g1Inf, 2n]), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(128));
	});

	test("invalid point not on curve", () => {
		const point = new Uint8Array(128);
		point[63] = 1;
		point[127] = 1;
		expectHalt(bls12G1Msm(pairs([g1, 1n], [point, 1n]), GAS), GAS);
	});

	test("rejects a point outside the subgroup", () => {
		expectHalt(bls12G1Msm(pairs([g1OutsideSubgroup(), 1n]), GAS), GAS);
		expectHalt(
			bls12G1Msm(pairs([g1, 1n], [g1OutsideSubgroup(), 1n]), GAS),
			GAS,
		);
	});

	test("rejects non-canonical coordinates", () => {
		const { x, y } = G1.toAffine();
		expectHalt(bls12G1Msm(pairs([encodeG1Affine(x + P, y), 1n]), GAS), GAS);
		const dirty = new Uint8Array(g1);
		dirty[15] = 1;
		expectHalt(bls12G1Msm(pairs([dirty, 1n]), GAS), GAS);
	});

	test("output is always 128 bytes", () => {
		expect(bls12G1Msm(pairs([g1, 1n], [g1, 2n]), GAS).output.length).toBe(128);
	});
});

describe("BLS12-381 G2 Add (0x0d)", () => {
	test("gas cost is 600", () => {
		const result = bls12G2Add(new Uint8Array(512), 1000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(600n);
	});

	test("out of gas", () => {
		expectHalt(bls12G2Add(new Uint8Array(512), 599n), 599n);
	});

	test("exact gas with valid input", () => {
		expect(bls12G2Add(new Uint8Array(512), 600n).success).toBe(true);
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12G2Add(new Uint8Array(511), 1000n), 1000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12G2Add(new Uint8Array(513), 1000n), 1000n);
	});

	test("invalid input length - empty", () => {
		expectHalt(bls12G2Add(new Uint8Array(0), 1000n), 1000n);
	});

	test("identity + identity = identity", () => {
		const result = bls12G2Add(new Uint8Array(512), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(256));
	});

	test("generator + identity = generator", () => {
		expect(bls12G2Add(concat(g2, g2Inf), 1000n).output).toEqual(g2);
	});

	test("identity + generator = generator", () => {
		expect(bls12G2Add(concat(g2Inf, g2), 1000n).output).toEqual(g2);
	});

	test("generator + generator = 2*generator", () => {
		const result = bls12G2Add(concat(g2, g2), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG2Point(G2.double()));
	});

	test("generator + (-generator) = identity", () => {
		const result = bls12G2Add(concat(g2, serializeG2Point(G2.negate())), 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(256));
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(512);
		input[63] = 1;
		input[191] = 1;
		expectHalt(bls12G2Add(input, 1000n), 1000n);
	});

	test("rejects each coordinate when it is not below the field modulus", () => {
		const affine = G2.toAffine();
		const coordinates = [affine.x.c0, affine.x.c1, affine.y.c0, affine.y.c1];
		for (let i = 0; i < 4; i++) {
			// Adding p keeps the value congruent, so only a range check rejects it.
			const point = new Uint8Array(g2);
			point.set(bigIntToFixedBytes((coordinates[i] as bigint) + P, 64), i * 64);
			expectHalt(bls12G2Add(concat(point, g2Inf), 1000n), 1000n);
			expectHalt(bls12G2Add(concat(g2Inf, point), 1000n), 1000n);
		}
		const atModulus = new Uint8Array(256);
		atModulus.set(bigIntToFixedBytes(P, 64), 0);
		expectHalt(bls12G2Add(concat(atModulus, g2Inf), 1000n), 1000n);
	});

	test("rejects any non-zero byte in the top 16 bytes of a coordinate", () => {
		for (let coordinate = 0; coordinate < 8; coordinate++) {
			for (const i of [0, 7, 15]) {
				const input = concat(g2, g2);
				input[coordinate * 64 + i] = 1;
				expectHalt(bls12G2Add(input, 1000n), 1000n);
			}
		}
	});

	test("does not require subgroup membership", () => {
		const outside = g2OutsideSubgroup();
		const result = bls12G2Add(concat(outside, g2Inf), 1000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(600n);
		expect(result.output).toEqual(outside);
	});

	test("output is always 256 bytes when successful", () => {
		expect(bls12G2Add(concat(g2, g2), 1000n).output.length).toBe(256);
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_G2_ADD,
			concat(g2, g2),
			1000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(600n);
		expect(result.output).toEqual(serializeG2Point(G2.double()));
	});
});

describe("BLS12-381 G2 scalar multiplication through G2 MSM with k = 1 (0x0e)", () => {
	const mul = (point: Uint8Array, k: bigint, gas = 50000n) =>
		bls12G2Msm(concat(point, scalar(k)), gas);

	test("gas cost is 22500", () => {
		const result = mul(g2, 1n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(22500n);
	});

	test("out of gas", () => {
		expectHalt(mul(g2, 1n, 22499n), 22499n);
	});

	test("exact gas with valid input", () => {
		expect(mul(g2, 1n, 22500n).success).toBe(true);
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12G2Msm(new Uint8Array(287), 50000n), 50000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12G2Msm(new Uint8Array(289), 50000n), 50000n);
	});

	test("identity * k = identity", () => {
		const result = mul(g2Inf, 5n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(256));
	});

	test("generator * 0 = identity", () => {
		const result = mul(g2, 0n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(256));
	});

	test("generator * 1 = generator", () => {
		expect(mul(g2, 1n).output).toEqual(g2);
	});

	test("generator * 2 = 2*generator", () => {
		expect(mul(g2, 2n).output).toEqual(serializeG2Point(G2.double()));
	});

	test("scalars at or above the subgroup order are reduced, not rejected", () => {
		expect(mul(g2, R).output).toEqual(new Uint8Array(256));
		const max = (1n << 256n) - 1n;
		const result = mul(g2, max);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG2Point(G2.multiply(max % R)));
	});

	test("invalid point not on curve", () => {
		const point = new Uint8Array(256);
		point[63] = 1;
		point[191] = 1;
		expectHalt(mul(point, 1n), 50000n);
	});

	test("output is always 256 bytes when successful", () => {
		for (const k of [0n, 1n, 255n]) {
			expect(mul(g2, k).output.length).toBe(256);
		}
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_G2_MSM,
			concat(g2, scalar(3n)),
			50000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(22500n);
		expect(result.output).toEqual(serializeG2Point(G2.multiply(3n)));
	});
});

describe("BLS12-381 G2 MSM (0x0e)", () => {
	const pairs = (...items: Array<[Uint8Array, bigint]>) =>
		concat(...items.flatMap(([point, k]) => [point, scalar(k)]));

	test("empty input is invalid", () => {
		expectHalt(bls12G2Msm(new Uint8Array(0), 50000n), 50000n);
	});

	test("invalid input length not multiple of 288", () => {
		expectHalt(bls12G2Msm(new Uint8Array(289), 100000n), 100000n);
		expectHalt(bls12G2Msm(new Uint8Array(575), 100000n), 100000n);
	});

	test("single pair gas cost: 1 * 22500 * 1000 / 1000", () => {
		expect(bls12G2Msm(pairs([g2, 1n]), GAS).gasUsed).toBe(22500n);
	});

	test("two pairs gas cost: 2 * 22500 * 1000 / 1000", () => {
		expect(bls12G2Msm(pairs([g2, 1n], [g2, 2n]), GAS).gasUsed).toBe(45000n);
	});

	test("three pairs gas cost floors: 3 * 22500 * 923 / 1000", () => {
		const input = pairs([g2, 1n], [g2, 2n], [g2, 3n]);
		expect(bls12G2Msm(input, GAS).gasUsed).toBe(62302n);
	});

	test("four pairs gas cost: 4 * 22500 * 884 / 1000", () => {
		const input = pairs([g2, 1n], [g2, 2n], [g2, 3n], [g2, 4n]);
		expect(bls12G2Msm(input, GAS).gasUsed).toBe(79560n);
	});

	test("out of gas", () => {
		const input = pairs([g2, 1n], [g2, 2n]);
		expectHalt(bls12G2Msm(input, 44999n), 44999n);
		expect(bls12G2Msm(input, 45000n).success).toBe(true);
	});

	test("single identity point with scalar = identity", () => {
		const result = bls12G2Msm(pairs([g2Inf, 9n]), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(new Uint8Array(256));
	});

	test("generator with scalar 5", () => {
		const result = bls12G2Msm(pairs([g2, 5n]), GAS);
		expect(result.output).toEqual(serializeG2Point(G2.multiply(5n)));
	});

	test("mixed points, zero scalars and infinity", () => {
		const p5 = serializeG2Point(G2.multiply(5n));
		const result = bls12G2Msm(
			pairs([g2, 7n], [p5, 3n], [g2Inf, 11n], [g2, 0n]),
			GAS,
		);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(serializeG2Point(G2.multiply(22n)));
	});

	test("invalid point not on curve", () => {
		const point = new Uint8Array(256);
		point[63] = 1;
		point[191] = 1;
		expectHalt(bls12G2Msm(pairs([g2, 1n], [point, 1n]), GAS), GAS);
	});

	test("rejects a point outside the subgroup", () => {
		expectHalt(bls12G2Msm(pairs([g2OutsideSubgroup(), 1n]), GAS), GAS);
	});

	test("output is always 256 bytes when successful", () => {
		expect(bls12G2Msm(pairs([g2, 1n], [g2, 2n]), GAS).output.length).toBe(256);
	});
});

describe("BLS12-381 Pairing (0x0f)", () => {
	const TRUE = bigIntToFixedBytes(1n, 32);
	const FALSE = new Uint8Array(32);

	test("empty input is invalid", () => {
		expectHalt(bls12Pairing(new Uint8Array(0), 100000n), 100000n);
	});

	test("single pair gas cost: 32600 + 37700", () => {
		expect(bls12Pairing(new Uint8Array(384), GAS).gasUsed).toBe(70300n);
	});

	test("two pairs gas cost", () => {
		expect(bls12Pairing(new Uint8Array(768), GAS).gasUsed).toBe(102900n);
	});

	test("three pairs gas cost", () => {
		expect(bls12Pairing(new Uint8Array(1152), GAS).gasUsed).toBe(135500n);
	});

	test("out of gas", () => {
		expectHalt(bls12Pairing(new Uint8Array(384), 70299n), 70299n);
		expect(bls12Pairing(new Uint8Array(384), 70300n).success).toBe(true);
	});

	test("invalid input length not multiple of 384", () => {
		expectHalt(bls12Pairing(new Uint8Array(383), GAS), GAS);
		expectHalt(bls12Pairing(new Uint8Array(385), GAS), GAS);
	});

	test("pairs made only of identity points return 1", () => {
		const result = bls12Pairing(new Uint8Array(384), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(TRUE);
		expect(bls12Pairing(concat(g1, g2Inf), GAS).output).toEqual(TRUE);
		expect(bls12Pairing(concat(g1Inf, g2), GAS).output).toEqual(TRUE);
	});

	test("e(G1, G2) alone is not one", () => {
		const result = bls12Pairing(concat(g1, g2), GAS);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(FALSE);
	});

	test("e(G1, G2) * e(-G1, G2) = 1", () => {
		const input = concat(g1, g2, serializeG1Point(G1.negate()), g2);
		const result = bls12Pairing(input, GAS);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(102900n);
		expect(result.output).toEqual(TRUE);
	});

	test("bilinearity: e(aG1, bG2) * e(-abG1, G2) = 1", () => {
		const a = 6n;
		const b = 11n;
		const input = concat(
			serializeG1Point(G1.multiply(a)),
			serializeG2Point(G2.multiply(b)),
			serializeG1Point(G1.multiply(a * b).negate()),
			g2,
		);
		expect(bls12Pairing(input, GAS).output).toEqual(TRUE);

		const wrong = concat(
			serializeG1Point(G1.multiply(a)),
			serializeG2Point(G2.multiply(b)),
			serializeG1Point(G1.multiply(a * b + 1n).negate()),
			g2,
		);
		expect(bls12Pairing(wrong, GAS).output).toEqual(FALSE);
	});

	test("an identity pair does not change the product", () => {
		const input = concat(
			g1,
			g2,
			g1Inf,
			g2Inf,
			serializeG1Point(G1.negate()),
			g2,
		);
		const result = bls12Pairing(input, GAS);
		expect(result.gasUsed).toBe(135500n);
		expect(result.output).toEqual(TRUE);
	});

	test("rejects points outside the subgroup, even paired with infinity", () => {
		expectHalt(bls12Pairing(concat(g1OutsideSubgroup(), g2), GAS), GAS);
		expectHalt(bls12Pairing(concat(g1, g2OutsideSubgroup()), GAS), GAS);
		expectHalt(bls12Pairing(concat(g1OutsideSubgroup(), g2Inf), GAS), GAS);
		expectHalt(bls12Pairing(concat(g1Inf, g2OutsideSubgroup()), GAS), GAS);
	});

	test("rejects non-canonical coordinates", () => {
		const { x, y } = G1.toAffine();
		expectHalt(bls12Pairing(concat(encodeG1Affine(x + P, y), g2), GAS), GAS);
		const dirty = concat(g1, g2);
		dirty[128] = 1;
		expectHalt(bls12Pairing(dirty, GAS), GAS);
	});

	test("output is always 32 bytes: 31 zeros and a boolean byte", () => {
		for (const input of [
			new Uint8Array(384),
			concat(g1, g2),
			concat(g1, g2, serializeG1Point(G1.negate()), g2),
		]) {
			const { output } = bls12Pairing(input, GAS);
			expect(output.length).toBe(32);
			expect(output.subarray(0, 31)).toEqual(new Uint8Array(31));
			expect([0, 1]).toContain(output[31]);
		}
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_PAIRING,
			concat(g1, g2, serializeG1Point(G1.negate()), g2),
			GAS,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(102900n);
		expect(result.output).toEqual(TRUE);
	});
});

describe("BLS12-381 Map Fp to G1 (0x10)", () => {
	const fp = (value: bigint) => bigIntToFixedBytes(value, 64);
	const decodeG1 = (output: Uint8Array) =>
		bls12_381.G1.Point.fromAffine({
			x: BigInt(`0x${Buffer.from(output.subarray(0, 64)).toString("hex")}`),
			y: BigInt(`0x${Buffer.from(output.subarray(64, 128)).toString("hex")}`),
		});

	test("gas cost is 5500", () => {
		const result = bls12MapFpToG1(new Uint8Array(64), 10000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(5500n);
	});

	test("out of gas", () => {
		expectHalt(bls12MapFpToG1(new Uint8Array(64), 5499n), 5499n);
	});

	test("exact gas with valid input", () => {
		expect(bls12MapFpToG1(new Uint8Array(64), 5500n).success).toBe(true);
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12MapFpToG1(new Uint8Array(63), 10000n), 10000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12MapFpToG1(new Uint8Array(65), 10000n), 10000n);
	});

	test("invalid input length - empty", () => {
		expectHalt(bls12MapFpToG1(new Uint8Array(0), 10000n), 10000n);
	});

	test("maps 0, 1, an arbitrary element and p - 1 to subgroup points", () => {
		for (const u of [0n, 1n, 0x123456789abcdefn, P - 1n]) {
			const result = bls12MapFpToG1(fp(u), 10000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(128);
			const point = decodeG1(result.output);
			point.assertValidity();
			expect(point.isTorsionFree()).toBe(true);
		}
	});

	test("rejects a field element equal to or above the modulus", () => {
		expectHalt(bls12MapFpToG1(fp(P), 10000n), 10000n);
		expectHalt(bls12MapFpToG1(fp(P + 1n), 10000n), 10000n);
		expectHalt(bls12MapFpToG1(fp((1n << 384n) - 1n), 10000n), 10000n);
	});

	test("rejects any non-zero byte in the top 16 bytes", () => {
		for (let i = 0; i < 16; i++) {
			const input = fp(1n);
			input[i] = 1;
			expectHalt(bls12MapFpToG1(input, 10000n), 10000n);
		}
		expectHalt(bls12MapFpToG1(new Uint8Array(64).fill(0xff), 10000n), 10000n);
	});

	test("maps the field element directly instead of hashing the input bytes", () => {
		for (const u of [0n, 1n, 0xabcdefn]) {
			const input = fp(u);
			const mapped = bls12MapFpToG1(input, 10000n).output;
			const hashed = serializeG1Point(
				bls12_381.G1.hashToCurve(input) as G1Point,
			);
			expect(mapped).not.toEqual(hashed);
		}
	});

	test("matches the EIP-2537 vector bls_g1map_", () => {
		const input = Uint8Array.from(
			Buffer.from(
				"00000000000000000000000000000000156c8a6a2c184569d69a76be144b5cdc5141d2d2ca4fe341f011e25e3969c55ad9e9b9ce2eb833c81a908e5fa4ac5f03",
				"hex",
			),
		);
		const result = bls12MapFpToG1(input, 5500n);
		expect(result.success).toBe(true);
		expect(Buffer.from(result.output).toString("hex")).toBe(
			"00000000000000000000000000000000184bb665c37ff561a89ec2122dd343f20e0f4cbcaec84e3c3052ea81d1834e192c426074b02ed3dca4e7676ce4ce48ba0000000000000000000000000000000004407b8d35af4dacc809927071fc0405218f1401a6d15af775810e4e460064bcc9468beeba82fdc751be70476c888bf3",
		);
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_MAP_FP_TO_G1,
			fp(7n),
			10000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(5500n);
		expect(result.output).toEqual(bls12MapFpToG1(fp(7n), 10000n).output);
	});
});

describe("BLS12-381 Map Fp2 to G2 (0x11)", () => {
	const fp2 = (c0: bigint, c1: bigint) =>
		concat(bigIntToFixedBytes(c0, 64), bigIntToFixedBytes(c1, 64));
	const big = (bytes: Uint8Array) =>
		BigInt(`0x${Buffer.from(bytes).toString("hex")}`);
	const decodeG2 = (output: Uint8Array) =>
		bls12_381.G2.Point.fromAffine({
			x: Fp2.create({
				c0: big(output.subarray(0, 64)),
				c1: big(output.subarray(64, 128)),
			}),
			y: Fp2.create({
				c0: big(output.subarray(128, 192)),
				c1: big(output.subarray(192, 256)),
			}),
		});

	test("gas cost is 23800", () => {
		const result = bls12MapFp2ToG2(new Uint8Array(128), 100000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(23800n);
	});

	test("out of gas", () => {
		expectHalt(bls12MapFp2ToG2(new Uint8Array(128), 23799n), 23799n);
	});

	test("exact gas with valid input", () => {
		expect(bls12MapFp2ToG2(new Uint8Array(128), 23800n).success).toBe(true);
	});

	test("invalid input length - too short", () => {
		expectHalt(bls12MapFp2ToG2(new Uint8Array(127), 100000n), 100000n);
	});

	test("invalid input length - too long", () => {
		expectHalt(bls12MapFp2ToG2(new Uint8Array(129), 100000n), 100000n);
	});

	test("invalid input length - empty", () => {
		expectHalt(bls12MapFp2ToG2(new Uint8Array(0), 100000n), 100000n);
	});

	test("maps Fp2 elements to subgroup points", () => {
		const inputs: Array<[bigint, bigint]> = [
			[0n, 0n],
			[1n, 0n],
			[0n, 1n],
			[0x1234n, 0xabcdefn],
			[P - 1n, P - 1n],
		];
		for (const [c0, c1] of inputs) {
			const result = bls12MapFp2ToG2(fp2(c0, c1), 100000n);
			expect(result.success).toBe(true);
			expect(result.output.length).toBe(256);
			const point = decodeG2(result.output);
			point.assertValidity();
			expect(point.isTorsionFree()).toBe(true);
		}
	});

	test("rejects c0 or c1 equal to or above the modulus", () => {
		expectHalt(bls12MapFp2ToG2(fp2(P, 0n), 100000n), 100000n);
		expectHalt(bls12MapFp2ToG2(fp2(0n, P), 100000n), 100000n);
		expectHalt(bls12MapFp2ToG2(fp2(P + 1n, P + 1n), 100000n), 100000n);
	});

	test("rejects any non-zero byte in the top 16 bytes of c0 or c1", () => {
		for (const base of [0, 64]) {
			for (let i = 0; i < 16; i++) {
				const input = fp2(1n, 1n);
				input[base + i] = 1;
				expectHalt(bls12MapFp2ToG2(input, 100000n), 100000n);
			}
		}
		expectHalt(
			bls12MapFp2ToG2(new Uint8Array(128).fill(0xff), 100000n),
			100000n,
		);
	});

	test("maps the field element directly instead of hashing the input bytes", () => {
		const input = fp2(3n, 5n);
		const mapped = bls12MapFp2ToG2(input, 100000n).output;
		const hashed = serializeG2Point(bls12_381.G2.hashToCurve(input) as G2Point);
		expect(mapped).not.toEqual(hashed);
	});

	test("distinct elements map to distinct points", () => {
		expect(bls12MapFp2ToG2(fp2(1n, 0n), 100000n).output).not.toEqual(
			bls12MapFp2ToG2(fp2(0n, 1n), 100000n).output,
		);
	});

	test("via execute", () => {
		const result = execute(
			PrecompileAddress.BLS12_MAP_FP2_TO_G2,
			fp2(7n, 9n),
			100000n,
			Hardfork.PRAGUE,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(23800n);
		expect(result.output).toEqual(bls12MapFp2ToG2(fp2(7n, 9n), 100000n).output);
	});
});
