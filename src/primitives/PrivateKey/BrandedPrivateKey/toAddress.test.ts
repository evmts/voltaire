import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { toAddress } from "./toAddress.js";
import * as Hex from "../../Hex/index.js";

describe("BrandedPrivateKey.toAddress", () => {
	it("derives correct address from private key", () => {
		// Known test key
		const pk = from(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);
		const address = toAddress.call(pk);

		expect(address.length).toBe(20);
		// Known address for this key (from hardhat)
		const expectedAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
		expect(Hex.fromBytes(address).toLowerCase()).toBe(
			expectedAddress.toLowerCase(),
		);
	});

	it("produces deterministic addresses", () => {
		const pk = from(
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		);
		const addr1 = toAddress.call(pk);
		const addr2 = toAddress.call(pk);

		expect(Hex.fromBytes(addr1)).toBe(Hex.fromBytes(addr2));
	});
});
