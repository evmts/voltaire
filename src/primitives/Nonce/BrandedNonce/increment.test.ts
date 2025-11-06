import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { increment } from "./increment.js";
import { toNumber } from "./toNumber.js";

describe("BrandedNonce.increment", () => {
	it("increments nonce by 1", () => {
		const nonce = from(0);
		const next = increment.call(nonce);
		expect(toNumber.call(next)).toBe(1);
	});

	it("increments multiple times", () => {
		let nonce = from(5);
		nonce = increment.call(nonce);
		nonce = increment.call(nonce);
		nonce = increment.call(nonce);
		expect(toNumber.call(nonce)).toBe(8);
	});

	it("handles large nonces", () => {
		const nonce = from(999999n);
		const next = increment.call(nonce);
		expect(toNumber.call(next)).toBe(1000000);
	});
});
