import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as ContractCode from "./index.js";

describe("ContractCode.Hex", () => {
	describe("decode", () => {
		it("decodes hex string", () => {
			const result = S.decodeSync(ContractCode.Hex)(
				"0x608060405234801561001057600080fd5b50",
			);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("handles empty hex string", () => {
			const result = S.decodeSync(ContractCode.Hex)("0x");
			expect(result.length).toBe(0);
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const code = S.decodeSync(ContractCode.Hex)("0x6080604052");
			const hex = S.encodeSync(ContractCode.Hex)(code);
			expect(hex).toBe("0x6080604052");
		});
	});
});

describe("ContractCode.Bytes", () => {
	describe("decode", () => {
		it("decodes Uint8Array", () => {
			const input = new Uint8Array([0x60, 0x80, 0x60, 0x40]);
			const result = S.decodeSync(ContractCode.Bytes)(input);
			expect([...result]).toEqual([...input]);
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const code = S.decodeSync(ContractCode.Hex)("0x6001");
			const bytes = S.encodeSync(ContractCode.Bytes)(code);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});
	});
});
