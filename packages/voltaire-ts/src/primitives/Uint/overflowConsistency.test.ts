/**
 * Issue #67: uniform overflow behavior across every Uint size.
 *
 * Contract under test:
 * - `plus` / `minus` / `times` are checked (throw IntegerOverflowError /
 *   IntegerUnderflowError) by default across ALL 6 widths (Uint8..Uint256).
 * - `plusChecked` / `minusChecked` / `timesChecked` throw on every size.
 * - `plusWrapping` / `minusWrapping` / `timesWrapping` wrap mod 2^bits on every size.
 */

import { describe, expect, it } from "vitest";
import {
	IntegerOverflowError,
	IntegerUnderflowError,
} from "../errors/index.js";
import * as Uint8 from "../Uint8/index.js";
import { Uint8 as Uint8Ctor } from "../Uint8/Uint8.js";
import * as Uint16 from "../Uint16/index.js";
import { Uint16 as Uint16Ctor } from "../Uint16/Uint16.js";
import * as Uint32 from "../Uint32/index.js";
import { Uint32 as Uint32Ctor } from "../Uint32/Uint32.js";
import * as Uint64 from "../Uint64/index.js";
import { Uint64 as Uint64Ctor } from "../Uint64/Uint64.js";
import * as Uint128 from "../Uint128/index.js";
import { Uint128 as Uint128Ctor } from "../Uint128/Uint128.js";
import * as Uint256 from "./index.js";
import { Uint as Uint256Ctor } from "./Uint.js";

type Value = number | bigint;
type Binary = (a: never, b: never) => Value;
type Arithmetic = Record<
	| "plus"
	| "minus"
	| "times"
	| "plusChecked"
	| "minusChecked"
	| "timesChecked"
	| "plusWrapping"
	| "minusWrapping"
	| "timesWrapping",
	Binary
>;

interface Size {
	name: string;
	bits: number;
	big: boolean;
	api: Arithmetic & { MAX: Value };
	ctor: Arithmetic;
}

const sizes: Size[] = [
	{
		name: "Uint8",
		bits: 8,
		big: false,
		api: Uint8,
		ctor: Uint8Ctor,
	},
	{
		name: "Uint16",
		bits: 16,
		big: false,
		api: Uint16,
		ctor: Uint16Ctor,
	},
	{
		name: "Uint32",
		bits: 32,
		big: false,
		api: Uint32,
		ctor: Uint32Ctor,
	},
	{
		name: "Uint64",
		bits: 64,
		big: true,
		api: Uint64,
		ctor: Uint64Ctor,
	},
	{
		name: "Uint128",
		bits: 128,
		big: true,
		api: Uint128,
		ctor: Uint128Ctor,
	},
	{
		name: "Uint256",
		bits: 256,
		big: true,
		api: Uint256,
		ctor: Uint256Ctor,
	},
];

describe.each(sizes)("$name overflow semantics", (size) => {
	const modulus = 2n ** BigInt(size.bits);
	const max = modulus - 1n;
	/** Convert a bigint model value into the size's runtime representation. */
	const v = (n: bigint): Value => (size.big ? n : Number(n));
	const call = (fn: Binary, a: bigint, b: bigint): Value =>
		(fn as (a: Value, b: Value) => Value)(v(a), v(b));
	const half = 2n ** BigInt(size.bits / 2);

	it("exposes MAX as 2^bits - 1", () => {
		expect(size.api.MAX).toBe(v(max));
	});

	describe("checked", () => {
		it("returns exact results that fit", () => {
			expect(call(size.api.plusChecked, max - 1n, 1n)).toBe(v(max));
			expect(call(size.api.minusChecked, max, max)).toBe(v(0n));
			expect(call(size.api.timesChecked, half - 1n, half)).toBe(
				v((half - 1n) * half),
			);
			expect(call(size.api.timesChecked, max, 1n)).toBe(v(max));
			expect(call(size.api.timesChecked, max, 0n)).toBe(v(0n));
		});

		it("plusChecked throws IntegerOverflowError past MAX", () => {
			expect(() => call(size.api.plusChecked, max, 1n)).toThrow(
				IntegerOverflowError,
			);
			expect(() => call(size.api.plusChecked, max, max)).toThrow(
				IntegerOverflowError,
			);
		});

		it("minusChecked throws IntegerUnderflowError below zero", () => {
			expect(() => call(size.api.minusChecked, 0n, 1n)).toThrow(
				IntegerUnderflowError,
			);
			expect(() => call(size.api.minusChecked, 1n, max)).toThrow(
				IntegerUnderflowError,
			);
		});

		it("timesChecked throws IntegerOverflowError past MAX", () => {
			expect(() => call(size.api.timesChecked, half, half)).toThrow(
				IntegerOverflowError,
			);
			expect(() => call(size.api.timesChecked, max, 2n)).toThrow(
				IntegerOverflowError,
			);
			expect(() => call(size.api.timesChecked, max, max)).toThrow(
				IntegerOverflowError,
			);
		});
	});

	describe("wrapping", () => {
		const cases: Array<[bigint, bigint]> = [
			[0n, 0n],
			[0n, 1n],
			[1n, max],
			[max, 1n],
			[max, 2n],
			[max, max],
			[half, half],
			[half + 1n, half - 1n],
			[max - 1n, half + 3n],
		];

		it.each(cases)("plusWrapping(%s, %s) = (a + b) mod 2^bits", (a, b) => {
			expect(call(size.api.plusWrapping, a, b)).toBe(v((a + b) % modulus));
		});

		it.each(cases)("minusWrapping(%s, %s) = (a - b) mod 2^bits", (a, b) => {
			expect(call(size.api.minusWrapping, a, b)).toBe(
				v((((a - b) % modulus) + modulus) % modulus),
			);
		});

		it.each(cases)("timesWrapping(%s, %s) = (a * b) mod 2^bits", (a, b) => {
			expect(call(size.api.timesWrapping, a, b)).toBe(v((a * b) % modulus));
		});
	});

	describe("uniform checked default", () => {
		it("plus, minus and times throw on overflow/underflow for every width", () => {
			expect(() => call(size.api.plus, max, 1n)).toThrow(IntegerOverflowError);
			expect(() => call(size.api.plus, max, max)).toThrow(IntegerOverflowError);
			expect(() => call(size.api.minus, 0n, 1n)).toThrow(IntegerUnderflowError);
			expect(() => call(size.api.minus, 1n, max)).toThrow(
				IntegerUnderflowError,
			);
			expect(() => call(size.api.times, half, half)).toThrow(
				IntegerOverflowError,
			);
			expect(() => call(size.api.times, max, 2n)).toThrow(IntegerOverflowError);
			expect(() => call(size.api.times, max, max)).toThrow(
				IntegerOverflowError,
			);
		});

		it("handles 0 and MAX boundaries without throwing", () => {
			expect(call(size.api.plus, 0n, 0n)).toBe(v(0n));
			expect(call(size.api.plus, max, 0n)).toBe(v(max));
			expect(call(size.api.plus, max - 1n, 1n)).toBe(v(max));
			expect(call(size.api.minus, 0n, 0n)).toBe(v(0n));
			expect(call(size.api.minus, max, 0n)).toBe(v(max));
			expect(call(size.api.minus, max, max)).toBe(v(0n));
			expect(call(size.api.times, max, 0n)).toBe(v(0n));
			expect(call(size.api.times, max, 1n)).toBe(v(max));
		});

		it("agrees with *Checked in range", () => {
			expect(call(size.api.plus, 7n, 9n)).toBe(
				call(size.api.plusChecked, 7n, 9n),
			);
			expect(call(size.api.minus, 9n, 7n)).toBe(
				call(size.api.minusChecked, 9n, 7n),
			);
			expect(call(size.api.times, 7n, 9n)).toBe(
				call(size.api.timesChecked, 7n, 9n),
			);
		});
	});

	it("constructor exposes the same functions as the namespace", () => {
		for (const name of [
			"plusChecked",
			"minusChecked",
			"timesChecked",
			"plusWrapping",
			"minusWrapping",
			"timesWrapping",
		] as const) {
			expect(typeof size.ctor[name]).toBe("function");
			expect(call(size.ctor[name], 3n, 2n)).toBe(call(size.api[name], 3n, 2n));
		}
	});
});
