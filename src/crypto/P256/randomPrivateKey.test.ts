import { describe, expect, it } from "vitest";
import { randomPrivateKey } from "./randomPrivateKey.js";
import { validatePrivateKey } from "./validatePrivateKey.js";

describe("P256.randomPrivateKey", () => {
	it("returns 32 bytes", () => {
		const key = randomPrivateKey();
		expect(key.length).toBe(32);
	});

	it("returns a valid private key", () => {
		const key = randomPrivateKey();
		expect(validatePrivateKey(key)).toBe(true);
	});

	it("returns unique keys", () => {
		const key1 = randomPrivateKey();
		const key2 = randomPrivateKey();
		expect(key1).not.toEqual(key2);
	});

	it("generates multiple valid keys", () => {
		for (let i = 0; i < 10; i++) {
			const key = randomPrivateKey();
			expect(key.length).toBe(32);
			expect(validatePrivateKey(key)).toBe(true);
		}
	});
});
