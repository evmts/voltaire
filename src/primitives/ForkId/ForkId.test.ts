import { describe, expect, it } from "vitest";
import * as ForkId from "./index.js";

describe("ForkId", () => {
	describe("from", () => {
		it("should create ForkId from valid input", () => {
			const forkId = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			expect(forkId.hash).toBeInstanceOf(Uint8Array);
			expect(forkId.hash.length).toBe(4);
			expect(forkId.next).toBe(1920000n);
		});

		it("should accept string hash", () => {
			const forkId = ForkId.from({
				hash: "0xfc64ec04",
				next: 1920000n,
			});

			expect(forkId.hash).toBeInstanceOf(Uint8Array);
			expect(forkId.next).toBe(1920000n);
		});

		it("should accept Uint8Array hash", () => {
			const forkId = ForkId.from({
				hash: new Uint8Array([0xfc, 0x64, 0xec, 0x04]),
				next: 1920000n,
			});

			expect(forkId.hash).toBeInstanceOf(Uint8Array);
			expect(forkId.hash.length).toBe(4);
			expect(forkId.next).toBe(1920000n);
		});

		it("should accept number next", () => {
			const forkId = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000,
			});

			expect(forkId.next).toBe(1920000n);
		});

		it("should throw on invalid input", () => {
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			expect(() => ForkId.from(null as any)).toThrow("must be an object");
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			expect(() => ForkId.from({} as any)).toThrow("hash is required");
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			expect(() => ForkId.from({ hash: 0xfc64ec04 } as any)).toThrow(
				"next is required",
			);
			expect(() => ForkId.from({ hash: new Uint8Array(3), next: 0n })).toThrow(
				"must be exactly 4 bytes",
			);
		});
	});

	describe("toBytes", () => {
		it("should encode to 12 bytes", () => {
			const forkId = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			const bytes = ForkId.toBytes(forkId);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(12);
		});

		it("should encode hash and next correctly", () => {
			const forkId = ForkId.from({
				hash: 0x00000001,
				next: 0x0000000000000002n,
			});

			const bytes = ForkId.toBytes(forkId);

			// First 4 bytes: hash
			expect(bytes[0]).toBe(0x00);
			expect(bytes[1]).toBe(0x00);
			expect(bytes[2]).toBe(0x00);
			expect(bytes[3]).toBe(0x01);

			// Last 8 bytes: next (big-endian)
			expect(bytes[4]).toBe(0x00);
			expect(bytes[5]).toBe(0x00);
			expect(bytes[6]).toBe(0x00);
			expect(bytes[7]).toBe(0x00);
			expect(bytes[8]).toBe(0x00);
			expect(bytes[9]).toBe(0x00);
			expect(bytes[10]).toBe(0x00);
			expect(bytes[11]).toBe(0x02);
		});

		it("should handle zero next", () => {
			const forkId = ForkId.from({
				hash: 0xfc64ec04,
				next: 0n,
			});

			const bytes = ForkId.toBytes(forkId);
			expect(bytes.length).toBe(12);

			// Last 8 bytes should be zero
			for (let i = 4; i < 12; i++) {
				expect(bytes[i]).toBe(0);
			}
		});
	});

	describe("matches", () => {
		it("should match identical fork IDs", () => {
			const local = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			const remote = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			expect(ForkId.matches(local, remote)).toBe(true);
		});

		it("should match when remote has no future forks", () => {
			const local = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			const remote = ForkId.from({
				hash: 0xfc64ec04,
				next: 0n,
			});

			expect(ForkId.matches(local, remote)).toBe(true);
		});

		it("should match when local has no future forks", () => {
			const local = ForkId.from({
				hash: 0xfc64ec04,
				next: 0n,
			});

			const remote = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			expect(ForkId.matches(local, remote)).toBe(true);
		});

		it("should not match when hashes match but both have different future forks", () => {
			const local = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			const remote = ForkId.from({
				hash: 0xfc64ec04,
				next: 2000000n,
			});

			expect(ForkId.matches(local, remote)).toBe(false);
		});

		it("should match when remote is ahead on known fork", () => {
			const local = ForkId.from({
				hash: 0x12345678,
				next: 1920000n,
			});

			const remote = ForkId.from({
				hash: 0xabcdef00,
				next: 2000000n,
			});

			expect(ForkId.matches(local, remote)).toBe(true);
		});

		it("should not match incompatible forks", () => {
			const local = ForkId.from({
				hash: 0x12345678,
				next: 2000000n,
			});

			const remote = ForkId.from({
				hash: 0xabcdef00,
				next: 1500000n,
			});

			expect(ForkId.matches(local, remote)).toBe(false);
		});

		it("should not match when local next is 0 and hashes differ", () => {
			const local = ForkId.from({
				hash: 0x12345678,
				next: 0n,
			});

			const remote = ForkId.from({
				hash: 0xabcdef00,
				next: 1500000n,
			});

			expect(ForkId.matches(local, remote)).toBe(false);
		});
	});

	describe("real-world ethereum forks", () => {
		it("should work with mainnet genesis fork", () => {
			// Ethereum mainnet genesis fork
			const genesis = ForkId.from({
				hash: 0xfc64ec04,
				next: 1150000n, // Homestead block
			});

			expect(genesis.hash).toBeInstanceOf(Uint8Array);
			expect(genesis.next).toBe(1150000n);
		});

		it("should validate fork progression", () => {
			// Simulated fork progression
			const frontier = ForkId.from({
				hash: 0xfc64ec04,
				next: 1150000n,
			});

			const homestead = ForkId.from({
				hash: 0x97c2c34c,
				next: 1920000n,
			});

			// Same network, different forks
			expect(ForkId.matches(frontier, homestead)).toBe(true);
		});

		it("should reject different networks", () => {
			const mainnet = ForkId.from({
				hash: 0xfc64ec04,
				next: 1920000n,
			});

			const ropsten = ForkId.from({
				hash: 0x30c7ddbc,
				next: 10n,
			});

			expect(ForkId.matches(mainnet, ropsten)).toBe(false);
		});
	});
});
