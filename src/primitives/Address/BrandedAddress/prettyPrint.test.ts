import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { prettyPrint } from "./prettyPrint.js";

describe("prettyPrint", () => {
	it("formats address with EIP-55 checksum", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const formatted = prettyPrint(addr);
		expect(formatted).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
	});

	it("returns checksummed format for lowercase input", () => {
		const addr = Address.fromHex("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed");
		const formatted = prettyPrint(addr);
		expect(formatted).toMatch(/^0x[0-9a-fA-F]{40}$/);
		expect(formatted).not.toBe("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed");
	});

	it("formats zero address", () => {
		const addr = Address.zero();
		const formatted = prettyPrint(addr);
		expect(formatted).toBe("0x0000000000000000000000000000000000000000");
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const formatted = Address.prettyPrint(addr);
		expect(formatted).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
	});

	it("works with instance method", () => {
		const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const formatted = prettyPrint(addr);
		expect(formatted).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
	});

	it("produces valid checksummed addresses", () => {
		const addresses = [
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			"0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
		];

		for (const input of addresses) {
			const addr = Address.fromHex(input);
			const formatted = prettyPrint(addr);
			expect(formatted).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(Address.isValidChecksum(formatted)).toBe(true);
		}
	});
});
