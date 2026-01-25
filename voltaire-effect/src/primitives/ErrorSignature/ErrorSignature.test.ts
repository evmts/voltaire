import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as ErrorSignature from "./index.js";

describe("ErrorSignature.String", () => {
	describe("decode", () => {
		it("parses from error definition", () => {
			const sig = Schema.decodeSync(ErrorSignature.String)(
				"InsufficientBalance(uint256,uint256)",
			);
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBe(4);
		});

		it("parses from hex", () => {
			const sig = Schema.decodeSync(ErrorSignature.String)("0x08c379a0");
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBe(4);
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const sig = Schema.decodeSync(ErrorSignature.String)("0x08c379a0");
			const hex = Schema.encodeSync(ErrorSignature.String)(sig);
			expect(hex).toBe("0x08c379a0");
		});
	});
});

describe("pure functions", () => {
	it("toHex converts to hex", () => {
		const sig = Schema.decodeSync(ErrorSignature.String)("0x08c379a0");
		const hex = ErrorSignature.toHex(sig);
		expect(hex).toBe("0x08c379a0");
	});

	it("equals compares signatures", () => {
		const a = Schema.decodeSync(ErrorSignature.String)("0x08c379a0");
		const b = Schema.decodeSync(ErrorSignature.String)("0x08c379a0");
		expect(ErrorSignature.equals(a, b)).toBe(true);
	});
});
