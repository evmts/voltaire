import { describe, expect, it } from "vitest";
import { Address } from "../primitives/Address/index.js";
import * as WalletIndex from "./index.js";
import { randomAddress } from "./randomAddress.js";

describe("randomAddress", () => {
	it("should generate valid Ethereum address", () => {
		const addr = randomAddress();
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});

	it("should generate different addresses on each call", () => {
		const addr1 = randomAddress();
		const addr2 = randomAddress();
		expect(Address.equals(addr1, addr2)).toBe(false);
	});

	it("should generate addresses that are not zero", () => {
		const addr = randomAddress();
		expect(Address.isZero(addr)).toBe(false);
	});

	it("should generate valid checksummed hex", () => {
		const addr = randomAddress();
		const hex = Address.toChecksummed(addr);
		expect(hex).toMatch(/^0x[0-9a-fA-F]{40}$/);
		expect(Address.isValidChecksum(hex)).toBe(true);
	});

	it("should generate multiple unique addresses", () => {
		const addresses = new Set<string>();
		for (let i = 0; i < 100; i++) {
			const addr = randomAddress();
			const hex = Address.toHex(addr);
			addresses.add(hex);
		}
		expect(addresses.size).toBe(100);
	});

	it("should round-trip cleanly through hex and checksum representations", () => {
		for (let i = 0; i < 20; i++) {
			const addr = randomAddress();
			const hex = Address.toHex(addr);
			const checksum = Address.toChecksummed(addr);
			const parsedHex = Address.fromHex(hex);
			const parsedChecksum = Address.fromHex(checksum);
			expect(Address.equals(addr, parsedHex)).toBe(true);
			expect(Address.equals(addr, parsedChecksum)).toBe(true);
		}
	});

	it("should produce independent byte buffers that can be mutated safely", () => {
		const addr1 = randomAddress();
		const addr2 = randomAddress();
		const snapshot2 = new Uint8Array(addr2);
		addr1.fill(0xff);
		expect(Array.from(addr2)).toEqual(Array.from(snapshot2));
	});

	it("should exhibit healthy byte entropy across generated addresses", () => {
		const seenFirstBytes = new Set<number>();
		const seenLastBytes = new Set<number>();
		for (let i = 0; i < 64; i++) {
			const addr = randomAddress();
			seenFirstBytes.add(addr[0] ?? 0);
			seenLastBytes.add(addr[19] ?? 0);
		}
		expect(seenFirstBytes.size).toBeGreaterThan(20);
		expect(seenLastBytes.size).toBeGreaterThan(20);
	});

	it("should be exported from wallet index module", () => {
		expect(WalletIndex.randomAddress).toBe(randomAddress);
		const addr = WalletIndex.randomAddress();
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
		expect(Address.isZero(addr)).toBe(false);
	});

	it("should produce valid lowercase hex strings of length 42", () => {
		for (let i = 0; i < 16; i++) {
			const hex = Address.toHex(randomAddress());
			expect(hex).toHaveLength(42);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
			expect(Address.isValid(hex)).toBe(true);
		}
	});

	it("should produce distinct checksums for distinct random addresses", () => {
		const checksums = new Set<string>();
		for (let i = 0; i < 64; i++) {
			const addr = randomAddress();
			const checksum = Address.toChecksummed(addr);
			expect(Address.isValidChecksum(checksum)).toBe(true);
			checksums.add(checksum);
		}
		expect(checksums.size).toBe(64);
	});

	it("should work with Address helper operations (short hex, clone, u256, compare)", () => {
		const a = randomAddress();
		const b = randomAddress();

		const shortHex = Address.toShortHex(a);
		expect(shortHex).toMatch(/^0x[0-9a-f]{6}\.\.\.[0-9a-f]{4}$/);

		const cloned = Address.clone(a);
		expect(Address.equals(a, cloned)).toBe(true);
		cloned[0] = (cloned[0] ?? 0) ^ 0xff;
		expect(Address.equals(a, cloned)).toBe(false);

		const asBigInt = Address.toU256(a);
		expect(asBigInt).toBeGreaterThan(0n);
		expect(asBigInt).toBeLessThan(1n << 160n);

		const cmp = Address.compare(a, b);
		expect(cmp === -1 || cmp === 1).toBe(true);
		expect(Address.compare(a, a)).toBe(0);
	});
});
