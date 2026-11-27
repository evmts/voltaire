import { describe, expect, it } from "vitest";
import { Address } from "../primitives/Address/index.js";
import * as Wallet from "./index.js";
import { randomAddress } from "./randomAddress.js";

describe("wallet module exports & randomAddress properties", () => {
	it("re-exports randomAddress from src/wallet/index.ts", () => {
		expect(Wallet.randomAddress).toBe(randomAddress);
	});

	it("returns valid 20-byte AddressType that round-trips through Address helpers", () => {
		const addr = Wallet.randomAddress();
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.byteLength).toBe(20);

		const lowerHex = Address.toHex(addr);
		expect(lowerHex).toMatch(/^0x[0-9a-f]{40}$/);

		const checksummed = Address.toChecksummed(addr);
		expect(Address.isValidChecksum(checksummed)).toBe(true);

		const reparsed = Address.from(checksummed);
		expect(Address.equals(addr, reparsed)).toBe(true);
	});

	it("produces independent high-entropy addresses without repeating prefixes or suffixes", () => {
		const count = 64;
		const seen = new Set<string>();
		const firstBytes = new Set<number>();
		const lastBytes = new Set<number>();

		for (let i = 0; i < count; i++) {
			const addr = Wallet.randomAddress();
			expect(Address.isZero(addr)).toBe(false);
			seen.add(Address.toHex(addr));
			firstBytes.add(addr[0] ?? -1);
			lastBytes.add(addr[19] ?? -1);
		}

		expect(seen.size).toBe(count);
		// With 64 independent uniformly random bytes, expecting > 20 distinct values is overwhelmingly certain
		expect(firstBytes.size).toBeGreaterThan(20);
		expect(lastBytes.size).toBeGreaterThan(20);
	});

	it("allocates a fresh Uint8Array buffer per call so mutating one does not affect subsequent calls", () => {
		const first = Wallet.randomAddress();
		const snapshot = new Uint8Array(first);
		first.fill(0xff);

		const second = Wallet.randomAddress();
		expect(Address.equals(second, first)).toBe(false);
		expect(second.every((b) => b === 0xff)).toBe(false);
		expect(snapshot.every((b) => b === 0xff)).toBe(false);
	});
});
