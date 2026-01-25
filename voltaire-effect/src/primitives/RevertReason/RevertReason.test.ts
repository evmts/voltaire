import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as RevertReason from "./index.js";

describe("RevertReason.Hex", () => {
	describe("decode", () => {
		it("parses Error(string) revert", () => {
			const errorData =
				"0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001454657374206572726f72206d657373616765000000000000000000000000000000";
			const result = S.decodeSync(RevertReason.Hex)(errorData);
			expect(result.type).toBe("Error");
			if (result.type === "Error") {
				expect(result.message.replace(/\0/g, "")).toBe("Test error message");
			}
		});

		it("parses Unknown for short data", () => {
			const result = S.decodeSync(RevertReason.Hex)("0x1234");
			expect(result.type).toBe("Unknown");
		});
	});
});

describe("RevertReason.Bytes", () => {
	describe("decode", () => {
		it("parses Unknown for empty bytes", () => {
			const result = S.decodeSync(RevertReason.Bytes)(new Uint8Array(0));
			expect(result.type).toBe("Unknown");
		});
	});
});

describe("RevertReason.toString", () => {
	it("converts Error to string", () => {
		const errorData =
			"0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001454657374206572726f72206d657373616765000000000000000000000000000000";
		const reason = S.decodeSync(RevertReason.Hex)(errorData);
		const str = RevertReason.toString(reason);
		expect(typeof str).toBe("string");
		expect(str.length).toBeGreaterThan(0);
	});
});
