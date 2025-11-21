import { describe, expect, it } from "vitest";
import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
import { from, getProgress, isSyncing } from "./index.js";

describe("SyncStatus", () => {
	describe("from", () => {
		it("creates not syncing status", () => {
			const status = from(false);

			expect(status).toBe(false);
		});

		it("creates syncing status from object", () => {
			const status = from({
				startingBlock: 0n,
				currentBlock: 1000n,
				highestBlock: 2000n,
			});

			expect(status).not.toBe(false);
			if (status !== false) {
				expect(status.startingBlock).toBe(0n);
				expect(status.currentBlock).toBe(1000n);
				expect(status.highestBlock).toBe(2000n);
			}
		});

		it("creates syncing status with state trie info", () => {
			const status = from({
				startingBlock: 0n,
				currentBlock: 500n,
				highestBlock: 1000n,
				pulledStates: 10000n,
				knownStates: 20000n,
			});

			expect(status).not.toBe(false);
			if (status !== false) {
				expect(status.pulledStates).toBe(10000n);
				expect(status.knownStates).toBe(20000n);
			}
		});

		it("converts string/number block numbers to bigint", () => {
			const status = from({
				startingBlock: "100",
				currentBlock: 200,
				highestBlock: "300",
			});

			expect(status).not.toBe(false);
			if (status !== false) {
				expect(status.startingBlock).toBe(100n);
				expect(status.currentBlock).toBe(200n);
				expect(status.highestBlock).toBe(300n);
			}
		});

		it("throws on invalid input", () => {
			expect(() => from(null as any)).toThrow("Invalid SyncStatus input");
			expect(() => from(123 as any)).toThrow("Invalid SyncStatus input");
		});
	});

	describe("isSyncing", () => {
		it("returns false when not syncing", () => {
			const status = from(false);

			expect(isSyncing(status)).toBe(false);
		});

		it("returns true when syncing", () => {
			const status = from({
				startingBlock: 0n,
				currentBlock: 1000n,
				highestBlock: 2000n,
			});

			expect(isSyncing(status)).toBe(true);
		});

		it("works with raw boolean", () => {
			expect(isSyncing(false)).toBe(false);
		});

		it("works with raw object", () => {
			expect(
				isSyncing({
					startingBlock: 0n,
					currentBlock: 100n,
					highestBlock: 200n,
				}),
			).toBe(true);
		});
	});

	describe("getProgress", () => {
		it("returns 100 when not syncing", () => {
			const status = from(false);

			expect(getProgress(status)).toBe(100);
		});

		it("calculates progress percentage", () => {
			const status = from({
				startingBlock: 0n,
				currentBlock: 500n,
				highestBlock: 1000n,
			});

			expect(getProgress(status)).toBe(50);
		});

		it("calculates progress with non-zero starting block", () => {
			const status = from({
				startingBlock: 1000n,
				currentBlock: 1500n,
				highestBlock: 2000n,
			});

			expect(getProgress(status)).toBe(50);
		});

		it("returns 100 when current equals highest", () => {
			const status = from({
				startingBlock: 0n,
				currentBlock: 1000n,
				highestBlock: 1000n,
			});

			expect(getProgress(status)).toBe(100);
		});

		it("clamps negative progress to 0", () => {
			const status = from({
				startingBlock: 1000n,
				currentBlock: 500n,
				highestBlock: 2000n,
			});

			// This would be negative, should clamp to 0
			expect(getProgress(status)).toBeGreaterThanOrEqual(0);
		});

		it("handles very large block numbers", () => {
			const status = from({
				startingBlock: 1000000000n,
				currentBlock: 1000000500n,
				highestBlock: 1000001000n,
			});

			expect(getProgress(status)).toBe(50);
		});

		it("works with raw false", () => {
			expect(getProgress(false)).toBe(100);
		});

		it("works with raw object", () => {
			const progress = getProgress({
				startingBlock: 0n,
				currentBlock: 250n,
				highestBlock: 1000n,
			});

			expect(progress).toBe(25);
		});
	});
});
