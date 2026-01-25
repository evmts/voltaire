import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.Hex", () => {
	describe("decode", () => {
		it("parses valid hex string", () => {
			const result = S.decodeSync(Selector.Hex)("0xa9059cbb");
			expect(result.length).toBe(4);
		});

		it("parses uppercase hex", () => {
			const result = S.decodeSync(Selector.Hex)("0xA9059CBB");
			expect(result.length).toBe(4);
		});

		it("fails on wrong size", () => {
			expect(() => S.decodeSync(Selector.Hex)("0x1234")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to hex with prefix", () => {
			const selector = S.decodeSync(Selector.Hex)("0xa9059cbb");
			const hex = S.encodeSync(Selector.Hex)(selector);
			expect(hex).toBe("0xa9059cbb");
		});
	});
});

describe("Selector.Bytes", () => {
	describe("decode", () => {
		it("parses 4-byte Uint8Array", () => {
			const input = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const result = S.decodeSync(Selector.Bytes)(input);
			expect(result.length).toBe(4);
			expect([...result]).toEqual([...input]);
		});

		it("fails on wrong length bytes", () => {
			const input = new Uint8Array([0xa9, 0x05]);
			expect(() => S.decodeSync(Selector.Bytes)(input)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const selector = S.decodeSync(Selector.Hex)("0xa9059cbb");
			const bytes = S.encodeSync(Selector.Bytes)(selector);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(4);
		});
	});
});

describe("Selector.Signature", () => {
	describe("decode", () => {
		it("computes selector from function signature", () => {
			const result = S.decodeSync(Selector.Signature)(
				"transfer(address,uint256)",
			);
			expect(result.length).toBe(4);
			const hex = S.encodeSync(Selector.Hex)(result);
			expect(hex).toBe("0xa9059cbb");
		});

		it("computes selector for balanceOf", () => {
			const result = S.decodeSync(Selector.Signature)("balanceOf(address)");
			const hex = S.encodeSync(Selector.Hex)(result);
			expect(hex).toBe("0x70a08231");
		});
	});
});

describe("pure functions", () => {
	it("equals returns true for equal selectors", () => {
		const a = S.decodeSync(Selector.Hex)("0xa9059cbb");
		const b = S.decodeSync(Selector.Hex)("0xa9059cbb");
		expect(Selector.equals(a, b)).toBe(true);
	});

	it("equals returns false for different selectors", () => {
		const a = S.decodeSync(Selector.Hex)("0xa9059cbb");
		const b = S.decodeSync(Selector.Hex)("0x70a08231");
		expect(Selector.equals(a, b)).toBe(false);
	});

	it("equals works with Signature-decoded selectors", () => {
		const a = S.decodeSync(Selector.Hex)("0xa9059cbb");
		const b = S.decodeSync(Selector.Signature)("transfer(address,uint256)");
		expect(Selector.equals(a, b)).toBe(true);
	});
});
