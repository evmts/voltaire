import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as InitCode from "./index.js";

describe("InitCode.Hex", () => {
	describe("decode", () => {
		it("decodes hex string", () => {
			const result = S.decodeSync(InitCode.Hex)(
				"0x608060405234801561001057600080fd5b50",
			);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("handles empty hex string", () => {
			const result = S.decodeSync(InitCode.Hex)("0x");
			expect(result.length).toBe(0);
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const code = S.decodeSync(InitCode.Hex)("0x6080604052");
			const hex = S.encodeSync(InitCode.Hex)(code);
			expect(hex).toBe("0x6080604052");
		});
	});
});

describe("InitCode.Bytes", () => {
	describe("decode", () => {
		it("decodes Uint8Array", () => {
			const input = new Uint8Array([0x60, 0x80, 0x60, 0x40]);
			const result = S.decodeSync(InitCode.Bytes)(input);
			expect([...result]).toEqual([...input]);
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const code = S.decodeSync(InitCode.Hex)("0x6001");
			const bytes = S.encodeSync(InitCode.Bytes)(code);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});
	});
});
