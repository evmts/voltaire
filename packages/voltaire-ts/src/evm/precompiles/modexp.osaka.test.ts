import { describe, expect, it } from "vitest";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import { execute, modexp, PrecompileAddress } from "./precompiles.js";

function header(base: bigint, exponent: bigint, modulus: bigint): Uint8Array {
	const input = new Uint8Array(96);
	for (const [field, value] of [base, exponent, modulus].entries()) {
		let remaining = value;
		for (let byte = 31; byte >= 0; byte--) {
			input[field * 32 + byte] = Number(remaining & 255n);
			remaining >>= 8n;
		}
	}
	return input;
}

describe("Osaka ModExp execution", () => {
	it("dispatches the fork and charges exact minimum gas", () => {
		expect(
			execute(PrecompileAddress.MODEXP, new Uint8Array(), 500n, Hardfork.OSAKA),
		).toEqual({
			success: true,
			output: new Uint8Array(),
			gasUsed: 500n,
		});
		const failure = modexp(new Uint8Array(), 499n, Hardfork.OSAKA);
		expect(failure.success).toBe(false);
		expect(failure.gasUsed).toBe(499n);
	});
	it("rejects each oversized declared operand before empty-result shortcuts", () => {
		for (const length of [1025n, (1n << 256n) - 1n]) {
			for (let operand = 0; operand < 3; operand++) {
				const lengths: [bigint, bigint, bigint] = [0n, 0n, 0n];
				lengths[operand] = length;
				const result = modexp(
					header(lengths[0], lengths[1], lengths[2]),
					1_000_000n,
					Hardfork.OSAKA,
				);
				expect(result.success).toBe(false);
				expect(result.output).toEqual(new Uint8Array());
				expect(result.gasUsed).toBe(1_000_000n);
			}
		}
	});
	it("accepts exact operand boundaries and retains Prague behavior", () => {
		for (let operand = 0; operand < 3; operand++) {
			for (const [length, fork] of [
				[1024n, Hardfork.OSAKA],
				[1025n, Hardfork.PRAGUE],
			] as const) {
				const lengths: [bigint, bigint, bigint] = [0n, 0n, 0n];
				lengths[operand] = length;
				const result = modexp(
					header(lengths[0], lengths[1], lengths[2]),
					1_000_000n,
					fork,
				);
				expect(result.success).toBe(true);
				expect(result.output).toEqual(
					new Uint8Array(operand === 2 ? Number(length) : 0),
				);
			}
		}
	});
	it("charges for a long exponent even when output is empty", () => {
		const input = header(0n, 1024n, 0n);
		expect(modexp(input, 253952n, Hardfork.OSAKA)).toEqual({
			success: true,
			output: new Uint8Array(),
			gasUsed: 253952n,
		});
		expect(modexp(input, 253951n, Hardfork.OSAKA).success).toBe(false);
	});
	it("right-pads a partially supplied modulus", () => {
		const input = new Uint8Array([...header(1n, 1n, 2n), 2, 3, 1]);
		expect(modexp(input, 500n, Hardfork.OSAKA)).toEqual({
			success: true,
			output: new Uint8Array([0, 8]),
			gasUsed: 500n,
		});
	});
});
