/**
 * @fileoverview Tests for BlockNumber Effect Schemas.
 * @module BlockNumber/BlockNumber.test
 */

import { BlockNumber } from "@tevm/voltaire";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { BigInt as BigIntSchema } from "./BigInt.js";
import { Hex } from "./Hex.js";
import { Number as NumberSchema } from "./Number.js";

describe("BlockNumber.Number", () => {
	it("decodes safe integer", () => {
		const result = S.decodeSync(NumberSchema)(12345);
		expect(BlockNumber.toNumber(result)).toBe(12345);
	});

	it("decodes zero", () => {
		const result = S.decodeSync(NumberSchema)(0);
		expect(BlockNumber.toNumber(result)).toBe(0);
	});

	it("decodes MAX_SAFE_INTEGER", () => {
		const result = S.decodeSync(NumberSchema)(globalThis.Number.MAX_SAFE_INTEGER);
		expect(BlockNumber.toBigInt(result)).toBe(
			BigInt(globalThis.Number.MAX_SAFE_INTEGER),
		);
	});

	it("rejects number exceeding MAX_SAFE_INTEGER", () => {
		const unsafeNumber = globalThis.Number.MAX_SAFE_INTEGER + 10;
		expect(() => S.decodeSync(NumberSchema)(unsafeNumber)).toThrow("exceeds");
	});

	it("rejects Infinity", () => {
		expect(() => S.decodeSync(NumberSchema)(Infinity)).toThrow();
	});

	it("rejects NaN", () => {
		expect(() => S.decodeSync(NumberSchema)(NaN)).toThrow();
	});

	it("encodes back to number", () => {
		const blockNum = S.decodeSync(NumberSchema)(12345);
		const num = S.encodeSync(NumberSchema)(blockNum);
		expect(num).toBe(12345);
	});

	it("round-trips block number", () => {
		const original = 1000000;
		const decoded = S.decodeSync(NumberSchema)(original);
		const encoded = S.encodeSync(NumberSchema)(decoded);
		expect(encoded).toBe(original);
	});
});

describe("BlockNumber.BigInt", () => {
	it("decodes bigint", () => {
		const result = S.decodeSync(BigIntSchema)(12345n);
		expect(BlockNumber.toBigInt(result)).toBe(12345n);
	});

	it("decodes large bigint", () => {
		const largeNum = BigInt(globalThis.Number.MAX_SAFE_INTEGER) + 1000n;
		const result = S.decodeSync(BigIntSchema)(largeNum);
		expect(BlockNumber.toBigInt(result)).toBe(largeNum);
	});

	it("encodes back to bigint", () => {
		const blockNum = S.decodeSync(BigIntSchema)(12345n);
		const bi = S.encodeSync(BigIntSchema)(blockNum);
		expect(bi).toBe(12345n);
	});

	it("round-trips large block number", () => {
		const original = BigInt(globalThis.Number.MAX_SAFE_INTEGER) * 2n;
		const decoded = S.decodeSync(BigIntSchema)(original);
		const encoded = S.encodeSync(BigIntSchema)(decoded);
		expect(encoded).toBe(original);
	});
});

describe("BlockNumber.Hex", () => {
	it("decodes hex string", () => {
		const result = S.decodeSync(Hex)("0x3039");
		expect(BlockNumber.toNumber(result)).toBe(12345);
	});

	it("decodes hex zero", () => {
		const result = S.decodeSync(Hex)("0x0");
		expect(BlockNumber.toNumber(result)).toBe(0);
	});

	it("decodes large hex", () => {
		const result = S.decodeSync(Hex)("0xffffffffffff");
		expect(BlockNumber.toBigInt(result)).toBe(281474976710655n);
	});

	it("encodes back to hex", () => {
		const blockNum = S.decodeSync(Hex)("0x3039");
		const hex = S.encodeSync(Hex)(blockNum);
		expect(hex.toLowerCase()).toBe("0x3039");
	});

	it("rejects invalid hex", () => {
		expect(() => S.decodeSync(Hex)("not-hex")).toThrow();
	});

	it("rejects hex without 0x prefix", () => {
		expect(() => S.decodeSync(Hex)("3039")).toThrow();
	});

	it("round-trips through hex", () => {
		const original = "0xabcdef";
		const decoded = S.decodeSync(Hex)(original);
		const encoded = S.encodeSync(Hex)(decoded);
		expect(encoded.toLowerCase()).toBe(original);
	});
});
