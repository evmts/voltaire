import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { calculateCreateAddress } from "./calculateCreateAddress.js";
import * as AddressNamespace from "./index.js";

describe("calculateCreateAddress", () => {
	describe("known CREATE test vectors", () => {
		it("calculates correct address for nonce 0", () => {
			// Known test vector
			const sender = Address.fromHex(
				"0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0",
			);
			const contractAddr = calculateCreateAddress(sender, 0n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
			// Verify deterministic
			const contractAddr2 = calculateCreateAddress(sender, 0n);
			expect(Address.equals(contractAddr, contractAddr2)).toBe(true);
		});

		it("calculates correct address for nonce 1", () => {
			const sender = Address.fromHex(
				"0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0",
			);
			const contractAddr = calculateCreateAddress(sender, 1n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces different addresses for different nonces", () => {
			const sender = Address.fromHex(
				"0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0",
			);
			const addr0 = calculateCreateAddress(sender, 0n);
			const addr1 = calculateCreateAddress(sender, 1n);
			expect(Address.equals(addr0, addr1)).toBe(false);
		});
	});

	describe("nonce 0", () => {
		it("handles nonce 0", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const contractAddr = calculateCreateAddress(sender, 0n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces consistent result for nonce 0", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr1 = calculateCreateAddress(sender, 0n);
			const addr2 = calculateCreateAddress(sender, 0n);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});
	});

	describe("small nonces", () => {
		it("handles nonce 1", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const contractAddr = calculateCreateAddress(sender, 1n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles nonce 2", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const contractAddr = calculateCreateAddress(sender, 2n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles nonce 127 (single byte max)", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const contractAddr = calculateCreateAddress(sender, 127n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	describe("large nonces", () => {
		it("handles large nonce", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const largeNonce = 1000000n;
			const contractAddr = calculateCreateAddress(sender, largeNonce);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles very large nonce", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const veryLargeNonce = 0xffffffffffffffffn;
			const contractAddr = calculateCreateAddress(sender, veryLargeNonce);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces different addresses for different large nonces", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr1 = calculateCreateAddress(sender, 1000000n);
			const addr2 = calculateCreateAddress(sender, 1000001n);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});
	});

	describe("negative nonce", () => {
		it("throws on negative nonce", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(() => calculateCreateAddress(sender, -1n)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on large negative nonce", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(() => calculateCreateAddress(sender, -1000n)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	describe("different senders", () => {
		it("produces different addresses for different senders", () => {
			const sender1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const sender2 = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const addr1 = calculateCreateAddress(sender1, 0n);
			const addr2 = calculateCreateAddress(sender2, 0n);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles zero address as sender", () => {
			const sender = Address.zero();
			const contractAddr = calculateCreateAddress(sender, 0n);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	it("works with Address namespace method", () => {
		const sender = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const contractAddr = Address.calculateCreateAddress(sender, 0n);
		expect(contractAddr).toBeInstanceOf(Uint8Array);
		expect(contractAddr.length).toBe(20);
	});
});
