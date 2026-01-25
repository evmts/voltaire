import { describe, expect, it } from "vitest";
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
	});

	describe("EventStreamAbortedError", () => {
		it("creates with correct message", () => {
			const error = new Stream.EventStreamAbortedError();
			expect(error.name).toBe("EventStreamAbortedError");
			expect(error.message).toBe("Event stream was aborted");
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
		});
	});

	describe("BlockStreamAbortedError", () => {
		it("creates with correct message", () => {
			const error = new Stream.BlockStreamAbortedError();
			expect(error.name).toBe("BlockStreamAbortedError");
			expect(error.message).toBe("Block stream was aborted");
			expect(error).toBeInstanceOf(Stream.StreamAbortedError);
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
	});
});
