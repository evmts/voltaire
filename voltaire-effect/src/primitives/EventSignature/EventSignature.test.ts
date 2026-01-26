import { describe, expect, it } from "@effect/vitest";
import * as Schema from "effect/Schema";
import * as EventSignature from "./index.js";

describe("EventSignature.String", () => {
	describe("decode", () => {
		it("parses from event definition string", () => {
			const sig = Schema.decodeSync(EventSignature.String)(
				"Transfer(address,address,uint256)",
			);
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBe(32);
		});

		it("parses from hex string", () => {
			const sig = Schema.decodeSync(EventSignature.String)(
				`0x${"ab".repeat(32)}`,
			);
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBe(32);
		});
	});

	describe("encode", () => {
		it("encodes to hex string", () => {
			const sig = Schema.decodeSync(EventSignature.String)(
				"Transfer(address,address,uint256)",
			);
			const hex = Schema.encodeSync(EventSignature.String)(sig);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(66);
		});
	});
});

describe("pure functions", () => {
	it("toHex converts to hex", () => {
		const sig = Schema.decodeSync(EventSignature.String)(
			"Transfer(address,address,uint256)",
		);
		const hex = EventSignature.toHex(sig);
		expect(hex.startsWith("0x")).toBe(true);
	});

	it("equals compares signatures", () => {
		const a = Schema.decodeSync(EventSignature.String)(
			"Transfer(address,address,uint256)",
		);
		const b = Schema.decodeSync(EventSignature.String)(
			"Transfer(address,address,uint256)",
		);
		expect(EventSignature.equals(a, b)).toBe(true);
	});
});
