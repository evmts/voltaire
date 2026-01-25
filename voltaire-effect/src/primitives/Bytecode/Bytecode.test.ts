import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Bytecode from "./index.js";

describe("Bytecode.Hex", () => {
	describe("decode", () => {
		it("decodes hex string", () => {
			const result = S.decodeSync(Bytecode.Hex)("0x60016002");
			expect([...result]).toEqual([0x60, 0x01, 0x60, 0x02]);
		});

		it("handles empty hex string", () => {
			const result = S.decodeSync(Bytecode.Hex)("0x");
			expect(result.length).toBe(0);
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const code = S.decodeSync(Bytecode.Hex)("0x60016002");
			const hex = S.encodeSync(Bytecode.Hex)(code);
			expect(hex).toBe("0x60016002");
		});
	});
});

describe("Bytecode.Bytes", () => {
	describe("decode", () => {
		it("decodes Uint8Array", () => {
			const input = new Uint8Array([0x60, 0x01, 0x60, 0x02]);
			const result = S.decodeSync(Bytecode.Bytes)(input);
			expect([...result]).toEqual([...input]);
		});

		it("handles empty bytecode", () => {
			const result = S.decodeSync(Bytecode.Bytes)(new Uint8Array(0));
			expect(result.length).toBe(0);
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const code = S.decodeSync(Bytecode.Hex)("0x6001");
			const bytes = S.encodeSync(Bytecode.Bytes)(code);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect([...bytes]).toEqual([0x60, 0x01]);
		});
	});
});
