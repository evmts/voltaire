import { describe, expect, it } from "@effect/vitest";
import * as S from "effect/Schema";
import * as CallData from "./index.js";

describe("CallData.Hex", () => {
	describe("decode", () => {
		it("decodes hex string", () => {
			const result = S.decodeSync(CallData.Hex)(
				"0xa9059cbb000000000000000000000000",
			);
			expect(typeof result).toBe("string");
			expect(result.startsWith("0x")).toBe(true);
		});

		it("handles empty hex string", () => {
			const result = S.decodeSync(CallData.Hex)("0x");
			expect(result).toBe("0x");
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const data = S.decodeSync(CallData.Hex)("0xa9059cbb");
			const hex = S.encodeSync(CallData.Hex)(data);
			expect(hex).toBe("0xa9059cbb");
		});
	});
});

describe("CallData.empty", () => {
	it("returns empty call data", () => {
		const result = CallData.empty();
		expect(result).toBe("0x");
	});
});
