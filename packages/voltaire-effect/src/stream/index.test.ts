import { describe, expect, it } from "@effect/vitest";
import * as Stream from "./index.js";

describe("Stream module", () => {
	describe("StreamAbortedError", () => {
		it("creates with default message", () => {
			const error = new Stream.StreamAbortedError();
			expect(error.name).toBe("StreamAbortedError");
			expect(error.message).toBe("Stream was aborted");
			expect(error).toBeInstanceOf(Error);
		});

		it("creates with custom message", () => {
			const error = new Stream.StreamAbortedError("Custom abort");
			expect(error.message).toBe("Custom abort");
		});

		it("is instanceof Error", () => {
			const error = new Stream.StreamAbortedError();
			expect(error instanceof Error).toBe(true);
		});

		it("has correct stack trace", () => {
			const error = new Stream.StreamAbortedError();
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("StreamAbortedError");
		});
	});

	describe("EventStreamAbortedError", () => {
		it("creates with correct message", () => {
			const error = new Stream.EventStreamAbortedError();
			expect(error.name).toBe("EventStreamAbortedError");
			expect(error.message).toBe("Event stream was aborted");
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
		});

		it("is instanceof StreamAbortedError", () => {
			const error = new Stream.EventStreamAbortedError();
			expect(error instanceof Stream.StreamAbortedError).toBe(true);
		});

		it("is instanceof Error", () => {
			const error = new Stream.EventStreamAbortedError();
			expect(error instanceof Error).toBe(true);
		});
	});

	describe("BlockStreamAbortedError", () => {
		it("creates with correct message", () => {
			const error = new Stream.BlockStreamAbortedError();
			expect(error.name).toBe("BlockStreamAbortedError");
			expect(error.message).toBe("Block stream was aborted");
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
		});

		it("is instanceof StreamAbortedError", () => {
			const error = new Stream.BlockStreamAbortedError();
			expect(error instanceof Stream.StreamAbortedError).toBe(true);
		});

		it("is instanceof Error", () => {
			const error = new Stream.BlockStreamAbortedError();
			expect(error instanceof Error).toBe(true);
		});
	});

	describe("BlockRangeTooLargeError", () => {
		it("creates with block range", () => {
			const error = new Stream.BlockRangeTooLargeError(100n, 200n);
			expect(error.name).toBe("BlockRangeTooLargeError");
			expect(error.message).toBe("Block range too large: 100 to 200");
			expect(error.fromBlock).toBe(100n);
			expect(error.toBlock).toBe(200n);
		});

		it("creates with cause", () => {
			const cause = new Error("RPC error");
			const error = new Stream.BlockRangeTooLargeError(1n, 1000000n, cause);
			expect(error.cause).toBe(cause);
		});

		it("handles large block numbers", () => {
			const largeFrom = 18_000_000_000n;
			const largeTo = 18_000_000_001n;
			const error = new Stream.BlockRangeTooLargeError(largeFrom, largeTo);
			expect(error.fromBlock).toBe(largeFrom);
			expect(error.toBlock).toBe(largeTo);
			expect(error.message).toContain("18000000000");
		});

		it("handles zero block numbers", () => {
			const error = new Stream.BlockRangeTooLargeError(0n, 0n);
			expect(error.fromBlock).toBe(0n);
			expect(error.toBlock).toBe(0n);
		});

		it("is instanceof Error", () => {
			const error = new Stream.BlockRangeTooLargeError(1n, 2n);
			expect(error instanceof Error).toBe(true);
		});
	});

	describe("UnrecoverableReorgError", () => {
		it("creates with reorg details", () => {
			const error = new Stream.UnrecoverableReorgError(100n, 50n);
			expect(error.name).toBe("UnrecoverableReorgError");
			expect(error.message).toBe(
				"Unrecoverable reorg: depth 100 exceeds tracked history of 50 blocks",
			);
			expect(error.reorgDepth).toBe(100n);
			expect(error.trackedDepth).toBe(50n);
		});

		it("handles edge case where depths are equal", () => {
			const error = new Stream.UnrecoverableReorgError(50n, 50n);
			expect(error.reorgDepth).toBe(50n);
			expect(error.trackedDepth).toBe(50n);
		});

		it("handles large reorg depths", () => {
			const error = new Stream.UnrecoverableReorgError(1000n, 10n);
			expect(error.reorgDepth).toBe(1000n);
			expect(error.trackedDepth).toBe(10n);
		});

		it("is instanceof Error", () => {
			const error = new Stream.UnrecoverableReorgError(10n, 5n);
			expect(error instanceof Error).toBe(true);
		});
	});

	describe("StreamError type", () => {
		it("includes all error types in union", () => {
			const errors: Stream.StreamError[] = [
				new Stream.StreamAbortedError(),
				new Stream.EventStreamAbortedError(),
				new Stream.BlockStreamAbortedError(),
				new Stream.BlockRangeTooLargeError(1n, 2n),
				new Stream.UnrecoverableReorgError(10n, 5n),
			];
			expect(errors).toHaveLength(5);
		});

		it("can pattern match on error name", () => {
			const errors: Stream.StreamError[] = [
				new Stream.StreamAbortedError(),
				new Stream.BlockRangeTooLargeError(1n, 2n),
			];

			for (const error of errors) {
				if (error.name === "StreamAbortedError") {
					expect(error).toBeInstanceOf(Stream.StreamAbortedError);
				} else if (error.name === "BlockRangeTooLargeError") {
					expect((error as Stream.BlockRangeTooLargeError).fromBlock).toBe(1n);
				}
			}
		});

		it("all errors have name property", () => {
			const errors: Stream.StreamError[] = [
				new Stream.StreamAbortedError(),
				new Stream.EventStreamAbortedError(),
				new Stream.BlockStreamAbortedError(),
				new Stream.BlockRangeTooLargeError(1n, 2n),
				new Stream.UnrecoverableReorgError(10n, 5n),
			];

			for (const error of errors) {
				expect(error.name).toBeDefined();
				expect(typeof error.name).toBe("string");
			}
		});

		it("all errors have message property", () => {
			const errors: Stream.StreamError[] = [
				new Stream.StreamAbortedError(),
				new Stream.EventStreamAbortedError(),
				new Stream.BlockStreamAbortedError(),
				new Stream.BlockRangeTooLargeError(1n, 2n),
				new Stream.UnrecoverableReorgError(10n, 5n),
			];

			for (const error of errors) {
				expect(error.message).toBeDefined();
				expect(typeof error.message).toBe("string");
			}
		});
	});

	describe("error inheritance hierarchy", () => {
		it("EventStreamAbortedError extends StreamAbortedError", () => {
			const error = new Stream.EventStreamAbortedError();
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
		});

		it("BlockStreamAbortedError extends StreamAbortedError", () => {
			const error = new Stream.BlockStreamAbortedError();
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
		});

		it("can catch specific stream errors", () => {
			const throwAndCatch = () => {
				try {
					throw new Stream.EventStreamAbortedError();
				} catch (e) {
					if (e instanceof Stream.StreamAbortedError) {
						return "caught as StreamAbortedError";
					}
					return "not caught";
				}
			};
			expect(throwAndCatch()).toBe("caught as StreamAbortedError");
		});
	});
});
