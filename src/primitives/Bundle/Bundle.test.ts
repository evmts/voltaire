import { describe, expect, it } from "vitest";
import { InvalidBundleError, MissingCryptoDependencyError } from "./errors.js";
import * as Bundle from "./index.js";

describe("Bundle", () => {
	const tx1 = new Uint8Array([1, 2, 3, 4]);
	const tx2 = new Uint8Array([5, 6, 7, 8]);

	describe("from", () => {
		it("creates bundle from transaction array", () => {
			const bundle = Bundle.from({
				transactions: [tx1, tx2],
			});

			expect(bundle.transactions).toHaveLength(2);
			expect(bundle.transactions[0]).toEqual(tx1);
			expect(bundle.transactions[1]).toEqual(tx2);
		});

		it("creates bundle with blockNumber", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				blockNumber: 123456n,
			});

			expect(bundle.blockNumber).toBe(123456n);
		});

		it("creates bundle with timestamps", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				minTimestamp: 1000000n,
				maxTimestamp: 2000000n,
			});

			expect(bundle.minTimestamp).toBe(1000000n);
			expect(bundle.maxTimestamp).toBe(2000000n);
		});

		it("creates bundle with reverting tx hashes", () => {
			const hash1 = new Uint8Array(32).fill(1);
			const bundle = Bundle.from({
				transactions: [tx1, tx2],
				revertingTxHashes: [hash1],
			});

			expect(bundle.revertingTxHashes).toHaveLength(1);
			expect(bundle.revertingTxHashes?.[0]).toEqual(hash1);
		});

		it("converts hex string transactions to bytes", () => {
			const bundle = Bundle.from({
				transactions: ["0x01020304", "0x05060708"],
			});

			expect(bundle.transactions).toHaveLength(2);
			expect(bundle.transactions[0]).toEqual(tx1);
			expect(bundle.transactions[1]).toEqual(tx2);
		});

		it("converts blockNumber from number", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				blockNumber: 123,
			});

			expect(bundle.blockNumber).toBe(123n);
		});

		it("converts blockNumber from hex string", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				blockNumber: "0x1e240",
			});

			expect(bundle.blockNumber).toBe(123456n);
		});

		it("throws on empty transactions array", () => {
			expect(() =>
				Bundle.from({
					transactions: [],
				}),
			).toThrow("must contain at least one transaction");
		});

		it("throws on invalid transactions type", () => {
			expect(() =>
				Bundle.from({
					// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
					transactions: "not an array" as any,
				}),
			).toThrow("transactions must be an array");
		});

		it("throws on invalid transaction format", () => {
			expect(() =>
				Bundle.from({
					// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
					transactions: [123 as any],
				}),
			).toThrow("must be Uint8Array or hex string");
		});
	});

	describe("addTransaction", () => {
		it("adds transaction to bundle", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
			});

			const newBundle = Bundle.addTransaction(bundle, tx2);

			expect(newBundle.transactions).toHaveLength(2);
			expect(newBundle.transactions[0]).toEqual(tx1);
			expect(newBundle.transactions[1]).toEqual(tx2);
			// Original bundle unchanged
			expect(bundle.transactions).toHaveLength(1);
		});

		it("adds hex string transaction", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
			});

			const newBundle = Bundle.addTransaction(bundle, "0x05060708");

			expect(newBundle.transactions).toHaveLength(2);
			expect(newBundle.transactions[1]).toEqual(tx2);
		});

		it("preserves bundle metadata", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				blockNumber: 123n,
				minTimestamp: 1000n,
			});

			const newBundle = Bundle.addTransaction(bundle, tx2);

			expect(newBundle.blockNumber).toBe(123n);
			expect(newBundle.minTimestamp).toBe(1000n);
		});
	});

	describe("size", () => {
		it("returns number of transactions", () => {
			const bundle = Bundle.from({
				transactions: [tx1, tx2],
			});

			expect(Bundle.size(bundle)).toBe(2);
		});

		it("returns 1 for single transaction", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
			});

			expect(Bundle.size(bundle)).toBe(1);
		});
	});

	describe("toHash", () => {
		it("computes bundle hash", () => {
			const bundle = Bundle.from({
				transactions: [tx1, tx2],
			});

			const mockKeccak = (data: Uint8Array) => {
				const hash = new Uint8Array(32);
				hash[0] = data[0];
				return hash;
			};

			const hash = Bundle.toHash(bundle, { keccak256: mockKeccak });

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("throws MissingCryptoDependencyError if keccak256 not provided", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
			});

			try {
				// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
				Bundle.toHash(bundle, {} as any);
				expect.fail("Should have thrown");
			} catch (e) {
				expect(e).toBeInstanceOf(MissingCryptoDependencyError);
				expect((e as MissingCryptoDependencyError).name).toBe(
					"MissingCryptoDependencyError",
				);
				expect((e as MissingCryptoDependencyError).message).toContain(
					"keccak256 not provided",
				);
			}
		});
	});

	describe("toFlashbotsParams", () => {
		it("converts bundle to Flashbots params", () => {
			const bundle = Bundle.from({
				transactions: [tx1, tx2],
				blockNumber: 123456n,
			});

			const params = Bundle.toFlashbotsParams(bundle);

			expect(params.txs).toHaveLength(2);
			expect(params.txs[0]).toBe("0x01020304");
			expect(params.txs[1]).toBe("0x05060708");
			expect(params.blockNumber).toBe("0x1e240");
		});

		it("includes timestamps", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
				minTimestamp: 1000000n,
				maxTimestamp: 2000000n,
			});

			const params = Bundle.toFlashbotsParams(bundle);

			expect(params.minTimestamp).toBe(1000000);
			expect(params.maxTimestamp).toBe(2000000);
		});

		it("includes reverting tx hashes", () => {
			const hash1 = new Uint8Array(32).fill(15);
			const bundle = Bundle.from({
				transactions: [tx1],
				revertingTxHashes: [hash1],
			});

			const params = Bundle.toFlashbotsParams(bundle);

			expect(params.revertingTxHashes).toHaveLength(1);
			expect(params.revertingTxHashes?.[0]).toBe(
				"0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f",
			);
		});

		it("omits optional fields when not present", () => {
			const bundle = Bundle.from({
				transactions: [tx1],
			});

			const params = Bundle.toFlashbotsParams(bundle);

			expect(params.blockNumber).toBeUndefined();
			expect(params.minTimestamp).toBeUndefined();
			expect(params.maxTimestamp).toBeUndefined();
			expect(params.revertingTxHashes).toBeUndefined();
		});
	});
});
