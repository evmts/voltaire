import { bls12_381 } from "@noble/curves/bls12-381.js";
import { describe, expect, test } from "vitest";
import {
	PrecompileAddress,
	bls12G1Add,
	bls12G1Mul,
	bls12G1Msm,
	bls12G2Add,
	bls12G2Mul,
	bls12G2Msm,
	bls12MapFp2ToG2,
	bls12MapFpToG1,
	bls12Pairing,
	execute,
} from "./precompiles.js";

const BLS12_FIELD_MODULUS = BigInt(
	"0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab",
);

function serializeG1Point(
	point: ReturnType<typeof bls12_381.G1.Point.fromAffine>,
): Uint8Array {
	const output = new Uint8Array(128);
	if (point.equals(bls12_381.G1.Point.ZERO)) {
		return output;
	}
	const affine = point.toAffine();
	const xBytes = bigIntToFixedBytes(affine.x, 64);
	const yBytes = bigIntToFixedBytes(affine.y, 64);
	output.set(xBytes, 0);
	output.set(yBytes, 64);
	return output;
}

function serializeG2Point(
	point: ReturnType<typeof bls12_381.G2.Point.fromAffine>,
): Uint8Array {
	const output = new Uint8Array(256);
	if (point.equals(bls12_381.G2.Point.ZERO)) {
		return output;
	}
	const affine = point.toAffine();
	const xc0 = bigIntToFixedBytes(affine.x.c0, 64);
	const xc1 = bigIntToFixedBytes(affine.x.c1, 64);
	const yc0 = bigIntToFixedBytes(affine.y.c0, 64);
	const yc1 = bigIntToFixedBytes(affine.y.c1, 64);
	output.set(xc0, 0);
	output.set(xc1, 64);
	output.set(yc0, 128);
	output.set(yc1, 192);
	return output;
}

function bigIntToFixedBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	let v = value;
	for (let i = length - 1; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}

describe("BLS12-381 G1 Add (0x0b)", () => {
	test("gas cost is 500", () => {
		const input = new Uint8Array(256);
		const result = bls12G1Add(input, 1000n);
		expect(result.gasUsed).toBe(500n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(256);
		const result = bls12G1Add(input, 499n);
		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
	});

	test("exact gas", () => {
		const input = new Uint8Array(256);
		const result = bls12G1Add(input, 500n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(500n);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(255);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(257);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - empty", () => {
		const input = new Uint8Array(0);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(false);
	});

	test("identity + identity = identity", () => {
		const input = new Uint8Array(256);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator + identity = generator", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(256);
		input.set(genBytes, 0);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("identity + generator = generator", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(256);
		input.set(genBytes, 128);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator + generator = 2*generator", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const doubled = gen.double();
		const doubledBytes = serializeG1Point(doubled);
		const input = new Uint8Array(256);
		input.set(genBytes, 0);
		input.set(genBytes, 128);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(doubledBytes);
	});

	test("generator + (-generator) = identity", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const neg = gen.negate();
		const genBytes = serializeG1Point(gen);
		const negBytes = serializeG1Point(neg);
		const input = new Uint8Array(256);
		input.set(genBytes, 0);
		input.set(negBytes, 128);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(256);
		input[63] = 1;
		input[127] = 2;
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(false);
	});

	test("point with coordinate >= field modulus", () => {
		const input = new Uint8Array(256);
		const tooLarge = bigIntToFixedBytes(BLS12_FIELD_MODULUS, 64);
		input.set(tooLarge, 0);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(false);
	});

	test("output is always 128 bytes", () => {
		const input = new Uint8Array(256);
		const result = bls12G1Add(input, 1000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(256);
		const result = execute(PrecompileAddress.BLS12_G1_ADD, input, 1000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(500n);
	});
});

describe("BLS12-381 G1 Mul (0x0c)", () => {
	test("gas cost is 12000", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Mul(input, 20000n);
		expect(result.gasUsed).toBe(12000n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Mul(input, 11999n);
		expect(result.success).toBe(false);
	});

	test("exact gas", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Mul(input, 12000n);
		expect(result.success).toBe(true);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(159);
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(161);
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("identity * k = identity", () => {
		const input = new Uint8Array(160);
		input[159] = 42;
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator * 0 = identity", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator * 1 = generator", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		input[159] = 1;
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator * 2 = 2*generator", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const doubled = gen.double();
		const doubledBytes = serializeG1Point(doubled);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		input[159] = 2;
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(doubledBytes);
	});

	test("generator * large scalar", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const scalar = 0x123456789abcdefn;
		const expected = gen.multiply(scalar);
		const expectedBytes = serializeG1Point(expected);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		const scalarBytes = bigIntToFixedBytes(scalar, 32);
		input.set(scalarBytes, 128);
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(expectedBytes);
	});

	test("generator * max scalar", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		for (let i = 128; i < 160; i++) {
			input[i] = 0xff;
		}
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(!result.output.every((b) => b === 0)).toBe(true);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(160);
		input[63] = 1;
		input[127] = 2;
		input[159] = 5;
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("output is always 128 bytes", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Mul(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(160);
		const result = execute(PrecompileAddress.BLS12_G1_MUL, input, 20000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
	});
});

describe("BLS12-381 G1 MSM (0x0d)", () => {
	test("empty input fails", () => {
		const input = new Uint8Array(0);
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length not multiple of 160", () => {
		const input = new Uint8Array(159);
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("single pair gas cost with discount", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
	});

	test("two pairs gas cost with discount", () => {
		const input = new Uint8Array(320);
		const result = bls12G1Msm(input, 30000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(19680n);
	});

	test("four pairs gas cost with discount", () => {
		const input = new Uint8Array(640);
		const result = bls12G1Msm(input, 40000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(27840n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Msm(input, 11999n);
		expect(result.success).toBe(false);
	});

	test("single identity point with zero scalar", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator with scalar 1", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		input[159] = 1;
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator with scalar 5", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const expected = gen.multiply(5n);
		const expectedBytes = serializeG1Point(expected);
		const input = new Uint8Array(160);
		input.set(genBytes, 0);
		input[159] = 5;
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(expectedBytes);
	});

	test("two generators with scalars 1 and 2", () => {
		const gen = bls12_381.G1.ProjectivePoint.BASE;
		const genBytes = serializeG1Point(gen);
		const expected = gen.multiply(3n);
		const expectedBytes = serializeG1Point(expected);
		const input = new Uint8Array(320);
		input.set(genBytes, 0);
		input[159] = 1;
		input.set(genBytes, 160);
		input[319] = 2;
		const result = bls12G1Msm(input, 30000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(expectedBytes);
	});

	test("multiple identity points", () => {
		const input = new Uint8Array(640);
		const result = bls12G1Msm(input, 40000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(160);
		input[63] = 1;
		input[127] = 2;
		input[159] = 5;
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(false);
	});

	test("output is always 128 bytes", () => {
		const input = new Uint8Array(160);
		const result = bls12G1Msm(input, 20000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(160);
		const result = execute(PrecompileAddress.BLS12_G1_MSM, input, 20000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(12000n);
	});
});

describe("BLS12-381 G2 Add (0x0e)", () => {
	test("gas cost is 800", () => {
		const input = new Uint8Array(512);
		const result = bls12G2Add(input, 2000n);
		expect(result.gasUsed).toBe(800n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(512);
		const result = bls12G2Add(input, 799n);
		expect(result.success).toBe(false);
	});

	test("exact gas", () => {
		const input = new Uint8Array(512);
		const result = bls12G2Add(input, 800n);
		expect(result.success).toBe(true);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(511);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(513);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(false);
	});

	test("identity + identity = identity", () => {
		const input = new Uint8Array(512);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator + identity = generator", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const input = new Uint8Array(512);
		input.set(genBytes, 0);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("identity + generator = generator", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const input = new Uint8Array(512);
		input.set(genBytes, 256);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator + generator = 2*generator", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const doubled = gen.double();
		const doubledBytes = serializeG2Point(doubled);
		const input = new Uint8Array(512);
		input.set(genBytes, 0);
		input.set(genBytes, 256);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(doubledBytes);
	});

	test("generator + (-generator) = identity", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const neg = gen.negate();
		const genBytes = serializeG2Point(gen);
		const negBytes = serializeG2Point(neg);
		const input = new Uint8Array(512);
		input.set(genBytes, 0);
		input.set(negBytes, 256);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(512);
		input[63] = 1;
		input[255] = 2;
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(false);
	});

	test("output is always 256 bytes", () => {
		const input = new Uint8Array(512);
		const result = bls12G2Add(input, 2000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(512);
		const result = execute(PrecompileAddress.BLS12_G2_ADD, input, 2000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(800n);
	});
});

describe("BLS12-381 G2 Mul (0x0f)", () => {
	test("gas cost is 45000", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Mul(input, 50000n);
		expect(result.gasUsed).toBe(45000n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Mul(input, 44999n);
		expect(result.success).toBe(false);
	});

	test("exact gas", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Mul(input, 45000n);
		expect(result.success).toBe(true);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(287);
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(289);
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("identity * k = identity", () => {
		const input = new Uint8Array(288);
		input[287] = 42;
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator * 0 = identity", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator * 1 = generator", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		input[287] = 1;
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator * 2 = 2*generator", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const doubled = gen.double();
		const doubledBytes = serializeG2Point(doubled);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		input[287] = 2;
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(doubledBytes);
	});

	test("generator * large scalar", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const scalar = 0x123456789abcdefn;
		const expected = gen.multiply(scalar);
		const expectedBytes = serializeG2Point(expected);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		const scalarBytes = bigIntToFixedBytes(scalar, 32);
		input.set(scalarBytes, 256);
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(expectedBytes);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(288);
		input[63] = 1;
		input[255] = 2;
		input[287] = 5;
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("output is always 256 bytes", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Mul(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(288);
		const result = execute(PrecompileAddress.BLS12_G2_MUL, input, 50000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(45000n);
	});
});

describe("BLS12-381 G2 MSM (0x10)", () => {
	test("empty input fails", () => {
		const input = new Uint8Array(0);
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length not multiple of 288", () => {
		const input = new Uint8Array(287);
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("single pair gas cost with discount", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(45000n);
	});

	test("two pairs gas cost with discount", () => {
		const input = new Uint8Array(576);
		const result = bls12G2Msm(input, 80000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(73800n);
	});

	test("four pairs gas cost with discount", () => {
		const input = new Uint8Array(1152);
		const result = bls12G2Msm(input, 120000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(104400n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Msm(input, 44999n);
		expect(result.success).toBe(false);
	});

	test("single identity point with zero scalar", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output.every((b) => b === 0)).toBe(true);
	});

	test("generator with scalar 1", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		input[287] = 1;
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(genBytes);
	});

	test("generator with scalar 5", () => {
		const gen = bls12_381.G2.ProjectivePoint.BASE;
		const genBytes = serializeG2Point(gen);
		const expected = gen.multiply(5n);
		const expectedBytes = serializeG2Point(expected);
		const input = new Uint8Array(288);
		input.set(genBytes, 0);
		input[287] = 5;
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output).toEqual(expectedBytes);
	});

	test("invalid point not on curve", () => {
		const input = new Uint8Array(288);
		input[63] = 1;
		input[255] = 2;
		input[287] = 5;
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(false);
	});

	test("output is always 256 bytes", () => {
		const input = new Uint8Array(288);
		const result = bls12G2Msm(input, 50000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(288);
		const result = execute(PrecompileAddress.BLS12_G2_MSM, input, 50000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(45000n);
	});
});

describe("BLS12-381 Pairing (0x11)", () => {
	test("empty input gas cost is base only", () => {
		const input = new Uint8Array(0);
		const result = bls12Pairing(input, 70000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(65000n);
	});

	test("single pair gas cost", () => {
		const input = new Uint8Array(384);
		const result = bls12Pairing(input, 120000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(108000n);
	});

	test("two pairs gas cost", () => {
		const input = new Uint8Array(768);
		const result = bls12Pairing(input, 200000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(151000n);
	});

	test("three pairs gas cost", () => {
		const input = new Uint8Array(1152);
		const result = bls12Pairing(input, 250000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(194000n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(0);
		const result = bls12Pairing(input, 64999n);
		expect(result.success).toBe(false);
	});

	test("invalid input length not multiple of 384", () => {
		const input = new Uint8Array(383);
		const result = bls12Pairing(input, 120000n);
		expect(result.success).toBe(false);
	});

	test("empty input returns success (1)", () => {
		const input = new Uint8Array(0);
		const result = bls12Pairing(input, 70000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(32);
		expect(result.output[31]).toBe(1);
		expect(result.output.slice(0, 31).every((b) => b === 0)).toBe(true);
	});

	test("valid pairing check with identity points", () => {
		const input = new Uint8Array(384);
		const result = bls12Pairing(input, 120000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(32);
		expect([0, 1].includes(result.output[31])).toBe(true);
	});

	test("output is always 32 bytes", () => {
		const input = new Uint8Array(384);
		const result = bls12Pairing(input, 120000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(32);
	});

	test("output format is 31 zeros + result byte", () => {
		const input = new Uint8Array(384);
		const result = bls12Pairing(input, 120000n);
		expect(result.success).toBe(true);
		expect(result.output.slice(0, 31).every((b) => b === 0)).toBe(true);
		expect([0, 1].includes(result.output[31])).toBe(true);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(0);
		const result = execute(PrecompileAddress.BLS12_PAIRING, input, 70000n);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(65000n);
	});
});

describe("BLS12-381 Map Fp to G1 (0x12)", () => {
	test("gas cost is 5500", () => {
		const input = new Uint8Array(64);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.gasUsed).toBe(5500n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(64);
		const result = bls12MapFpToG1(input, 5499n);
		expect(result.success).toBe(false);
	});

	test("exact gas", () => {
		const input = new Uint8Array(64);
		const result = bls12MapFpToG1(input, 5500n);
		expect(result.success).toBe(true);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(63);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(65);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - empty", () => {
		const input = new Uint8Array(0);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(false);
	});

	test("zero field element maps to point", () => {
		const input = new Uint8Array(64);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
		expect(!result.output.every((b) => b === 0)).toBe(true);
	});

	test("field element 1 maps to point", () => {
		const input = new Uint8Array(64);
		input[63] = 1;
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("arbitrary field element maps to point", () => {
		const input = new Uint8Array(64);
		input[60] = 0x12;
		input[61] = 0x34;
		input[62] = 0x56;
		input[63] = 0x78;
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("field element >= modulus fails", () => {
		const input = new Uint8Array(64);
		const modBytes = bigIntToFixedBytes(BLS12_FIELD_MODULUS, 64);
		input.set(modBytes);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(false);
	});

	test("output is always 128 bytes", () => {
		const input = new Uint8Array(64);
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(128);
	});

	test("mapped point is on curve", () => {
		const input = new Uint8Array(64);
		input[63] = 42;
		const result = bls12MapFpToG1(input, 10000n);
		expect(result.success).toBe(true);
		const x = bytesToBigInt(result.output.slice(0, 64));
		const y = bytesToBigInt(result.output.slice(64, 128));
		expect(x < BLS12_FIELD_MODULUS).toBe(true);
		expect(y < BLS12_FIELD_MODULUS).toBe(true);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(64);
		const result = execute(
			PrecompileAddress.BLS12_MAP_FP_TO_G1,
			input,
			10000n,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(5500n);
	});
});

describe("BLS12-381 Map Fp2 to G2 (0x13)", () => {
	test("gas cost is 75000", () => {
		const input = new Uint8Array(128);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.gasUsed).toBe(75000n);
	});

	test("out of gas", () => {
		const input = new Uint8Array(128);
		const result = bls12MapFp2ToG2(input, 74999n);
		expect(result.success).toBe(false);
	});

	test("exact gas", () => {
		const input = new Uint8Array(128);
		const result = bls12MapFp2ToG2(input, 75000n);
		expect(result.success).toBe(true);
	});

	test("invalid input length - too short", () => {
		const input = new Uint8Array(127);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - too long", () => {
		const input = new Uint8Array(129);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(false);
	});

	test("invalid input length - empty", () => {
		const input = new Uint8Array(0);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(false);
	});

	test("zero Fp2 element maps to point", () => {
		const input = new Uint8Array(128);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
		expect(!result.output.every((b) => b === 0)).toBe(true);
	});

	test("Fp2 element (c0=1, c1=0) maps to point", () => {
		const input = new Uint8Array(128);
		input[63] = 1;
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("Fp2 element (c0=0, c1=1) maps to point", () => {
		const input = new Uint8Array(128);
		input[127] = 1;
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("arbitrary Fp2 element maps to point", () => {
		const input = new Uint8Array(128);
		input[60] = 0x12;
		input[61] = 0x34;
		input[62] = 0x56;
		input[63] = 0x78;
		input[124] = 0x9a;
		input[125] = 0xbc;
		input[126] = 0xde;
		input[127] = 0xf0;
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("output is always 256 bytes", () => {
		const input = new Uint8Array(128);
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		expect(result.output.length).toBe(256);
	});

	test("mapped point coordinates are valid", () => {
		const input = new Uint8Array(128);
		input[63] = 42;
		const result = bls12MapFp2ToG2(input, 100000n);
		expect(result.success).toBe(true);
		const xc0 = bytesToBigInt(result.output.slice(0, 64));
		const xc1 = bytesToBigInt(result.output.slice(64, 128));
		const yc0 = bytesToBigInt(result.output.slice(128, 192));
		const yc1 = bytesToBigInt(result.output.slice(192, 256));
		expect(xc0 < BLS12_FIELD_MODULUS).toBe(true);
		expect(xc1 < BLS12_FIELD_MODULUS).toBe(true);
		expect(yc0 < BLS12_FIELD_MODULUS).toBe(true);
		expect(yc1 < BLS12_FIELD_MODULUS).toBe(true);
	});

	test("via execute with address", () => {
		const input = new Uint8Array(128);
		const result = execute(
			PrecompileAddress.BLS12_MAP_FP2_TO_G2,
			input,
			100000n,
		);
		expect(result.success).toBe(true);
		expect(result.gasUsed).toBe(75000n);
	});
});
