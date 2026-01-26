import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it, vi } from "@effect/vitest";
import { TransportError, TransportService } from "../Transport/index.js";
import {
	EthBlockNumber,
	EthChainId,
	EthGetBalance,
	EthGetTransactionCount,
	GenericRpcRequest,
	RpcBatch,
	RpcBatchService,
} from "./index.js";

const createMockTransport = (
	handler: (
		method: string,
		params?: unknown[],
	) => unknown | Promise<unknown>,
): Layer.Layer<TransportService> =>
	Layer.succeed(TransportService, {
		request: <T>(method: string, params?: unknown[]) =>
			Effect.gen(function* () {
				const result = handler(method, params);
				const resolved =
					result instanceof Promise
						? yield* Effect.promise(() => result)
						: result;
				if (resolved instanceof TransportError) {
					return yield* Effect.fail(resolved);
				}
				return resolved as T;
			}),
	});

describe("RpcBatch", () => {
	describe("single requests", () => {
		it("handles single request without batching", async () => {
			const handler = vi.fn().mockReturnValue("0x1234");

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* batch.request(new EthBlockNumber({}));
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1234");
			expect(handler).toHaveBeenCalledWith("eth_blockNumber", []);
		});

		it("handles request with parameters", async () => {
			const handler = vi.fn().mockReturnValue("0x100");

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* batch.request(
					new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
				);
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x100");
			expect(handler).toHaveBeenCalledWith("eth_getBalance", [
				"0xabc",
				"latest",
			]);
		});
	});

	describe("batching", () => {
		it("batches multiple concurrent requests", async () => {
			const handler = vi.fn().mockImplementation((method, params) => {
				if (method === "__batch__") {
					const batch = params as Array<{
						id: number;
						method: string;
						params: unknown[];
					}>;
					return batch.map((req) => ({
						jsonrpc: "2.0" as const,
						id: req.id,
						result:
							req.method === "eth_blockNumber"
								? "0x100"
								: req.method === "eth_chainId"
									? "0x1"
									: "0x50",
					}));
				}
				return null;
			});

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;

				const results = yield* Effect.all(
					[
						batch.request(new EthBlockNumber({})),
						batch.request(new EthChainId({})),
						batch.request(
							new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
						),
					],
					{ concurrency: "unbounded" },
				);

				return results;
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const [blockNumber, chainId, balance] = await Effect.runPromise(program);
			expect(blockNumber).toBe("0x100");
			expect(chainId).toBe("0x1");
			expect(balance).toBe("0x50");
			expect(handler).toHaveBeenCalledWith("__batch__", expect.any(Array));
		});

		it("deduplicates identical requests", async () => {
			let batchCallCount = 0;
			const handler = vi.fn().mockImplementation((method, params) => {
				if (method === "__batch__") {
					batchCallCount++;
					const batch = params as Array<{
						id: number;
						method: string;
						params: unknown[];
					}>;
					return batch.map((req) => ({
						jsonrpc: "2.0" as const,
						id: req.id,
						result: "0x100",
					}));
				}
				return "0x100";
			});

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;

				const results = yield* Effect.all(
					[
						batch.request(
							new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
						),
						batch.request(
							new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
						),
						batch.request(
							new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
						),
					],
					{ concurrency: "unbounded" },
				);

				return results;
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const [r1, r2, r3] = await Effect.runPromise(program);
			expect(r1).toBe("0x100");
			expect(r2).toBe("0x100");
			expect(r3).toBe("0x100");
		});
	});

	describe("error handling", () => {
		it("handles transport-level error", async () => {
			const handler = vi
				.fn()
				.mockReturnValue(
					new TransportError({ code: -32000, message: "Server error" }),
				);

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* batch.request(new EthBlockNumber({}));
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});

		it("handles per-request errors in batch", async () => {
			const handler = vi.fn().mockImplementation((method, params) => {
				if (method === "__batch__") {
					return [
						{ jsonrpc: "2.0", id: 0, result: "0x100" },
						{
							jsonrpc: "2.0",
							id: 1,
							error: { code: -32000, message: "execution reverted" },
						},
						{ jsonrpc: "2.0", id: 2, result: "0x200" },
					];
				}
				return null;
			});

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;

				const result1 = yield* batch.request(new EthBlockNumber({}));

				const result2Exit = yield* Effect.either(
					batch.request(new EthChainId({})),
				);

				const result3 = yield* batch.request(
					new EthGetBalance({ address: "0xabc", blockTag: "latest" }),
				);

				return { result1, result2Exit, result3 };
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const { result1, result2Exit, result3 } =
				await Effect.runPromise(program);
			expect(result1).toBe("0x100");
			expect(result2Exit._tag).toBe("Left");
			expect(result3).toBe("0x200");
		});

		it("handles missing response for request", async () => {
			const handler = vi.fn().mockImplementation((method, params) => {
				if (method === "__batch__") {
					return [{ jsonrpc: "2.0", id: 0, result: "0x100" }];
				}
				return null;
			});

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;

				const results = yield* Effect.all(
					[
						Effect.either(batch.request(new EthBlockNumber({}))),
						Effect.either(batch.request(new EthChainId({}))),
					],
					{ concurrency: "unbounded" },
				);

				return results;
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const [r1, r2] = await Effect.runPromise(program);
			expect(r1._tag).toBe("Right");
			expect(r2._tag).toBe("Left");
		});
	});

	describe("request types", () => {
		it("handles EthGetTransactionCount", async () => {
			const handler = vi.fn().mockReturnValue("0x5");

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* batch.request(
					new EthGetTransactionCount({ address: "0xabc", blockTag: "pending" }),
				);
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x5");
			expect(handler).toHaveBeenCalledWith("eth_getTransactionCount", [
				"0xabc",
				"pending",
			]);
		});

		it("handles GenericRpcRequest for custom methods", async () => {
			const handler = vi.fn().mockReturnValue({ version: "1.0.0" });

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* batch.request(
					new GenericRpcRequest({ method: "web3_clientVersion", params: [] }),
				);
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const result = await Effect.runPromise(program);
			expect(result).toEqual({ version: "1.0.0" });
			expect(handler).toHaveBeenCalledWith("web3_clientVersion", []);
		});
	});

	describe("resolver direct usage", () => {
		it("can use resolver directly with Effect.request", async () => {
			const handler = vi.fn().mockReturnValue("0x999");

			const program = Effect.gen(function* () {
				const batch = yield* RpcBatchService;
				return yield* Effect.request(new EthBlockNumber({}), batch.resolver);
			}).pipe(
				Effect.provide(RpcBatch),
				Effect.provide(createMockTransport(handler)),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x999");
		});
	});
});
