/**
 * @fileoverview Tests for block module Effect wrappers.
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportError,
	TransportService,
	type TransportShape,
} from "../services/Transport/index.js";
import { BlockError, BlockNotFoundError } from "./BlockError.js";
import { fetchBlock } from "./fetchBlock.js";
import { fetchBlockByHash } from "./fetchBlockByHash.js";
import { fetchBlockReceipts } from "./fetchBlockReceipts.js";
import { toLightBlock } from "./toLightBlock.js";

const mockBlock = {
	number: "0x112a880",
	hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	parentHash:
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	timestamp: "0x6500e400",
	transactions: ["0xabc", "0xdef"],
};

const mockReceipt = {
	transactionHash: "0xabc",
	status: "0x1",
	gasUsed: "0x5208",
};

describe("block module", () => {
	describe("BlockError", () => {
		it("creates error with message", () => {
			const error = new BlockError("test error");
			expect(error.message).toBe("test error");
			expect(error._tag).toBe("BlockError");
		});

		it("creates error with cause", () => {
			const cause = new Error("underlying");
			const error = new BlockError("test error", { cause });
			expect(error.message).toContain("test error");
			expect(error.cause).toBe(cause);
		});
	});

	describe("BlockNotFoundError", () => {
		it("creates error with block number", () => {
			const error = new BlockNotFoundError(18000000n);
			expect(error.message).toBe("Block 18000000 not found");
			expect(error._tag).toBe("BlockNotFoundError");
			expect(error.identifier).toBe(18000000n);
		});

		it("creates error with block hash", () => {
			const error = new BlockNotFoundError("0x1234");
			expect(error.message).toBe("Block 0x1234 not found");
			expect(error.identifier).toBe("0x1234");
		});
	});

	describe("fetchBlock", () => {
		it("fetches block by number", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					method: string,
					params?: unknown[],
				): Effect.Effect<T, never> => {
					expect(method).toBe("eth_getBlockByNumber");
					expect(params).toEqual(["0x112a880", false]);
					return Effect.succeed(mockBlock as T);
				},
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlock(18000000n, "header").pipe(Effect.provide(TestLayer)),
			);

			expect(result).toEqual(mockBlock);
		});

		it("fetches block with transactions", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					method: string,
					params?: unknown[],
				): Effect.Effect<T, never> => {
					expect(params).toEqual(["0x112a880", true]);
					return Effect.succeed(mockBlock as T);
				},
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlock(18000000n, "transactions").pipe(Effect.provide(TestLayer)),
			);

			expect(result).toEqual(mockBlock);
		});

		it("fails when block not found", async () => {
			const mockTransport: TransportShape = {
				request: <T>(): Effect.Effect<T, never> =>
					Effect.succeed(null as T),
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlock(99999999n, "header").pipe(
					Effect.provide(TestLayer),
					Effect.either,
				),
			);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left).toBeInstanceOf(BlockNotFoundError);
			}
		});
	});

	describe("fetchBlockByHash", () => {
		it("fetches block by hash", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					method: string,
					params?: unknown[],
				): Effect.Effect<T, never> => {
					expect(method).toBe("eth_getBlockByHash");
					expect(params).toEqual([mockBlock.hash, false]);
					return Effect.succeed(mockBlock as T);
				},
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlockByHash(mockBlock.hash, "header").pipe(
					Effect.provide(TestLayer),
				),
			);

			expect(result).toEqual(mockBlock);
		});

		it("fails when block not found", async () => {
			const mockTransport: TransportShape = {
				request: <T>(): Effect.Effect<T, never> =>
					Effect.succeed(null as T),
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlockByHash("0xnotfound", "header").pipe(
					Effect.provide(TestLayer),
					Effect.either,
				),
			);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				expect(result.left).toBeInstanceOf(BlockNotFoundError);
			}
		});
	});

	describe("fetchBlockReceipts", () => {
		it("fetches receipts via eth_getBlockReceipts", async () => {
			const mockTransport: TransportShape = {
				request: <T>(
					method: string,
				): Effect.Effect<T, never> => {
					if (method === "eth_getBlockReceipts") {
						return Effect.succeed([mockReceipt] as T);
					}
					return Effect.succeed([] as T);
				},
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlockReceipts({ hash: mockBlock.hash }).pipe(
					Effect.provide(TestLayer),
				),
			);

			expect(result).toEqual([mockReceipt]);
		});

		it("falls back to individual receipt fetching", async () => {
			let getBlockReceiptsCalled = false;

			const mockTransport: TransportShape = {
				request: <T>(
					method: string,
				): Effect.Effect<T, TransportError> => {
					if (method === "eth_getBlockReceipts") {
						getBlockReceiptsCalled = true;
						return Effect.fail(
							new TransportError(
								{ code: -32601, message: "method not found" },
								"method not found",
							),
						);
					}
					if (method === "eth_getTransactionReceipt") {
						return Effect.succeed(mockReceipt as T);
					}
					return Effect.succeed([] as T);
				},
			};

			const TestLayer = Layer.succeed(TransportService, mockTransport);

			const result = await Effect.runPromise(
				fetchBlockReceipts({
					hash: mockBlock.hash,
					transactions: ["0xabc"],
				}).pipe(Effect.provide(TestLayer)),
			);

			expect(getBlockReceiptsCalled).toBe(true);
			expect(result).toEqual([mockReceipt]);
		});
	});

	describe("toLightBlock", () => {
		it("extracts light block from full block", () => {
			const result = toLightBlock(mockBlock);

			expect(result.number).toBe(18000000n);
			expect(result.hash).toBe(mockBlock.hash);
			expect(result.parentHash).toBe(mockBlock.parentHash);
			expect(result.timestamp).toBe(0x6500e400n);
		});

		it("handles header-wrapped block", () => {
			const headerBlock = {
				hash: mockBlock.hash,
				header: {
					number: "0x112a880",
					parentHash: mockBlock.parentHash,
					timestamp: "0x6500e400",
				},
			};

			const result = toLightBlock(headerBlock);

			expect(result.number).toBe(18000000n);
			expect(result.parentHash).toBe(mockBlock.parentHash);
		});
	});

	describe("exports", () => {
		it("exports all expected items from index", async () => {
			const exports = await import("./index.js");

			expect(exports.BlockError).toBeDefined();
			expect(exports.BlockNotFoundError).toBeDefined();
			expect(exports.fetchBlock).toBeDefined();
			expect(exports.fetchBlockByHash).toBeDefined();
			expect(exports.fetchBlockReceipts).toBeDefined();
			expect(exports.toLightBlock).toBeDefined();
		});
	});
});
