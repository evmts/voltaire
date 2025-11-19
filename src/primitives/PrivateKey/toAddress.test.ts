import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { toAddress } from "./toAddress.js";

describe("BrandedPrivateKey.toAddress", () => {
	it("derives 20 byte address from private key", () => {
		// Known test key
		const pk = from(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);
		const address = toAddress.call(pk);

		expect(address).toBeInstanceOf(Uint8Array);
		expect(address.length).toBe(20);
	});

	it("produces deterministic addresses", () => {
		const pk = from(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);
		const addr1 = toAddress.call(pk);
		const addr2 = toAddress.call(pk);

		expect(addr1.length).toBe(20);
		expect(addr2.length).toBe(20);
		// Check they're equal byte by byte
		expect(addr1.every((byte, i) => byte === addr2[i])).toBe(true);
	});
});
