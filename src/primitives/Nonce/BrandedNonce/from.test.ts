import { describe, expect, it } from "vitest";
import { from } from "./from.js";

describe("BrandedNonce.from", () => {
	it("creates nonce from number", () => {
		const nonce = from(0);
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(0n);
	});

	it("creates nonce from bigint", () => {
		const nonce = from(42n);
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(42n);
	});

	it("creates nonce from hex string", () => {
		const nonce = from("0x2a");
		expect(typeof nonce).toBe("bigint");
		expect(nonce).toBe(42n);
	});

	it("handles zero nonce", () => {
		const nonce = from(0);
		expect(nonce).toBe(0n);
	});
});
