import { Address, Hash } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { TestTransport } from "../Transport/TestTransport.js";
import {
	TransportError,
	TransportService,
} from "../Transport/TransportService.js";
import { Provider } from "./Provider.js";
import {
	type ProviderError,
	ProviderService,
} from "./ProviderService.js";

const mockTransport = (responses: Record<string, unknown>) =>
	Layer.succeed(TransportService, {
		request: <T>(method: string, _params?: unknown[]) =>
			Effect.try({
				try: () => {
					if (method in responses) return responses[method] as T;
					throw new Error(`Unknown method: ${method}`);
				},
				catch: (e) =>
					new TransportError({ code: -32603, message: (e as Error).message }),
			}),
	});

type MockHandler = (params: unknown[]) => unknown;
type MockResponses = Record<string, unknown | MockHandler>;

const mockTransportWithCapture = (responses: MockResponses) =>
	Layer.succeed(TransportService, {
		request: <T>(method: string, params: unknown[] = []) =>
			Effect.gen(function* () {
				if (!(method in responses)) {
					return yield* Effect.fail(
						new TransportError({
							code: -32601,
							message: `Method not found: ${method}`,
						}),
					);
				}
				const response = responses[method];
				if (typeof response === "function") {
					const result = response(params);
					if (result instanceof Error) {
						return yield* Effect.fail(
							new TransportError({ code: -32603, message: result.message }),
						);
					}
					return result as T;
				}
				return response as T;
			}),
	});

describe("ProviderService", () => {
	describe("getBlockNumber", () => {
		it("returns block number as bigint", async () => {
			const transport = mockTransport({ eth_blockNumber: "0x10" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(16n);
		});
	});

	describe("getBalance", () => {
		it("returns balance as bigint", async () => {
			const transport = mockTransport({ eth_getBalance: "0xde0b6b3a7640000" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1000000000000000000n);
		});

		it("accepts AddressType branded type", async () => {
			const transport = mockTransport({ eth_getBalance: "0xde0b6b3a7640000" });
			const layer = Provider.pipe(Layer.provide(transport));
			const addr = Address("0x1234567890123456789012345678901234567890");

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(addr);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1000000000000000000n);
		});
	});

	describe("getBlock", () => {
		it("returns block by tag", async () => {
			const mockBlock = {
				number: "0x10",
				hash: "0xabc",
				parentHash: "0xdef",
				nonce: "0x0",
				sha3Uncles: "0x0",
				logsBloom: "0x0",
				transactionsRoot: "0x0",
				stateRoot: "0x0",
				receiptsRoot: "0x0",
				miner: "0x0",
				difficulty: "0x0",
				totalDifficulty: "0x0",
				extraData: "0x",
				size: "0x0",
				gasLimit: "0x0",
				gasUsed: "0x0",
				timestamp: "0x0",
				transactions: [],
				uncles: [],
			};
			const transport = mockTransport({ eth_getBlockByNumber: mockBlock });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlock({ blockTag: "latest" });
				}).pipe(Effect.provide(layer)),
			);

			expect(result.number).toBe("0x10");
			expect(result.hash).toBe("0xabc");
		});
	});

	describe("getTransactionCount", () => {
		it("returns nonce as bigint", async () => {
			const transport = mockTransport({ eth_getTransactionCount: "0x5" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionCount(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(5n);
		});

		it("handles large transaction counts correctly (no overflow)", async () => {
			const transport = mockTransport({
				eth_getTransactionCount: "0xffffffffffffffff",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionCount(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(18446744073709551615n);
			expect(typeof result).toBe("bigint");
		});
	});

	describe("getBlockTransactionCount", () => {
		it("returns transaction count as bigint", async () => {
			const transport = mockTransport({
				eth_getBlockTransactionCountByNumber: "0x10",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockTransactionCount({ blockTag: "latest" });
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(16n);
		});

		it("handles large block transaction counts correctly (no overflow)", async () => {
			const transport = mockTransport({
				eth_getBlockTransactionCountByNumber: "0xffffffffffffffff",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockTransactionCount({ blockTag: "latest" });
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(18446744073709551615n);
			expect(typeof result).toBe("bigint");
		});
	});

	describe("getCode", () => {
		it("returns contract bytecode as HexType", async () => {
			const transport = mockTransport({ eth_getCode: "0x6080604052" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getCode(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0x6080604052");
		});

		it("accepts AddressType branded type", async () => {
			const transport = mockTransport({ eth_getCode: "0x6080604052" });
			const layer = Provider.pipe(Layer.provide(transport));
			const addr = Address("0x1234567890123456789012345678901234567890");

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getCode(addr);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0x6080604052");
		});
	});

	describe("getStorageAt", () => {
		it("returns storage value", async () => {
			const transport = mockTransport({
				eth_getStorageAt:
					"0x0000000000000000000000000000000000000000000000000000000000000001",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getStorageAt(
						"0x1234567890123456789012345678901234567890",
						"0x0000000000000000000000000000000000000000000000000000000000000000",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
		});
	});

	describe("getTransaction", () => {
		it("returns transaction by hash", async () => {
			const mockTx = {
				hash: "0xabc",
				nonce: "0x5",
				blockHash: "0xdef",
				blockNumber: "0x10",
				transactionIndex: "0x0",
				from: "0x1111111111111111111111111111111111111111",
				to: "0x2222222222222222222222222222222222222222",
				value: "0xde0b6b3a7640000",
				gas: "0x5208",
				gasPrice: "0x3b9aca00",
				input: "0x",
			};
			const transport = mockTransport({ eth_getTransactionByHash: mockTx });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransaction("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(result.hash).toBe("0xabc");
			expect(result.nonce).toBe("0x5");
		});
	});

	describe("getTransactionReceipt", () => {
		it("returns receipt by hash", async () => {
			const mockReceipt = {
				transactionHash: "0xabc",
				transactionIndex: "0x0",
				blockHash: "0xdef",
				blockNumber: "0x10",
				from: "0x1111111111111111111111111111111111111111",
				to: "0x2222222222222222222222222222222222222222",
				cumulativeGasUsed: "0x5208",
				gasUsed: "0x5208",
				contractAddress: null,
				logs: [],
				logsBloom: "0x0",
				status: "0x1",
			};
			const transport = mockTransport({ eth_getTransactionReceipt: mockReceipt });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionReceipt("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(result.transactionHash).toBe("0xabc");
			expect(result.status).toBe("0x1");
		});
	});

	describe("call", () => {
		it("returns call result", async () => {
			const transport = mockTransport({
				eth_call:
					"0x0000000000000000000000000000000000000000000000000000000000000064",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.call({
						to: "0x1234567890123456789012345678901234567890",
						data: "0x18160ddd",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000064",
			);
		});
	});

	describe("estimateGas", () => {
		it("returns gas estimate as bigint", async () => {
			const transport = mockTransport({ eth_estimateGas: "0x5208" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.estimateGas({
						to: "0x1234567890123456789012345678901234567890",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(21000n);
		});
	});

	describe("getLogs", () => {
		it("returns logs matching filter", async () => {
			const mockLogs = [
				{
					address: "0x1234567890123456789012345678901234567890",
					topics: ["0xddf252ad"],
					data: "0x",
					blockNumber: "0x10",
					transactionHash: "0xabc",
					transactionIndex: "0x0",
					blockHash: "0xdef",
					logIndex: "0x0",
					removed: false,
				},
			];
			const transport = mockTransport({ eth_getLogs: mockLogs });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({
						address: "0x1234567890123456789012345678901234567890",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toHaveLength(1);
			expect(result[0].address).toBe("0x1234567890123456789012345678901234567890");
		});
	});

	describe("getChainId", () => {
		it("returns chain id as number", async () => {
			const transport = mockTransport({ eth_chainId: "0x1" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getChainId();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1);
		});

		it("fails for chain id exceeding safe integer", async () => {
			const transport = mockTransport({
				eth_chainId: "0xffffffffffffffff",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getChainId();
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("getGasPrice", () => {
		it("returns gas price as bigint", async () => {
			const transport = mockTransport({ eth_gasPrice: "0x3b9aca00" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getGasPrice();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1000000000n);
		});
	});

	describe("getMaxPriorityFeePerGas", () => {
		it("returns max priority fee as bigint", async () => {
			const transport = mockTransport({ eth_maxPriorityFeePerGas: "0x3b9aca00" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getMaxPriorityFeePerGas();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1000000000n);
		});
	});

	describe("getFeeHistory", () => {
		it("returns fee history", async () => {
			const mockFeeHistory = {
				oldestBlock: "0x10",
				baseFeePerGas: ["0x3b9aca00", "0x3b9aca01"],
				gasUsedRatio: [0.5, 0.6],
				reward: [["0x3b9aca00"], ["0x3b9aca01"]],
			};
			const transport = mockTransport({ eth_feeHistory: mockFeeHistory });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(2, "latest", [50]);
				}).pipe(Effect.provide(layer)),
			);

			expect(result.oldestBlock).toBe("0x10");
			expect(result.baseFeePerGas).toHaveLength(2);
		});
	});

	describe("createAccessList", () => {
		it("returns access list", async () => {
			const mockAccessList = {
				accessList: [
					{
						address: "0x1234567890123456789012345678901234567890",
						storageKeys: ["0x0"],
					},
				],
				gasUsed: "0x5208",
			};
			const transport = mockTransport({ eth_createAccessList: mockAccessList });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.createAccessList({
						to: "0x1234567890123456789012345678901234567890",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result.accessList).toHaveLength(1);
			expect(result.gasUsed).toBe("0x5208");
		});
	});

	describe("error handling", () => {
		it("wraps transport errors in ProviderError", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({ code: -32000, message: "RPC error" }),
					) as Effect.Effect<T, TransportError>,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				expect(error._tag).toBe("Fail");
			}
		});
	});

	describe("TestTransport integration", () => {
		it("works with TestTransport for getBlockNumber", async () => {
			const transport = TestTransport({ eth_blockNumber: "0x1234" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(0x1234n);
		});

		it("works with TestTransport for multiple methods", async () => {
			const transport = TestTransport({
				eth_blockNumber: "0x100",
				eth_chainId: "0x1",
				eth_gasPrice: "0x3b9aca00",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const [blockNumber, chainId, gasPrice] = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					const block = yield* provider.getBlockNumber();
					const chain = yield* provider.getChainId();
					const gas = yield* provider.getGasPrice();
					return [block, chain, gas] as const;
				}).pipe(Effect.provide(layer)),
			);

			expect(blockNumber).toBe(256n);
			expect(chainId).toBe(1);
			expect(gasPrice).toBe(1000000000n);
		});

		it("TestTransport simulates TransportError correctly", async () => {
			const transport = TestTransport({
				eth_call: new TransportError({
					code: -32000,
					message: "execution reverted",
				}),
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.call({
						to: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("branded type conversion", () => {
		it("converts AddressType to hex for RPC", async () => {
			let capturedParams: unknown[] = [];
			const transport = Layer.succeed(TransportService, {
				request: <T>(method: string, params?: unknown[]) => {
					if (method === "eth_getBalance") {
						capturedParams = params ?? [];
						return Effect.succeed("0x0" as T);
					}
					return Effect.fail(
						new TransportError({ code: -32601, message: "not found" }),
					);
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));
			const addr = Address("0x1234567890123456789012345678901234567890");

			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(addr);
				}).pipe(Effect.provide(layer)),
			);

			expect(capturedParams[0]).toBe("0x1234567890123456789012345678901234567890");
		});

		it("converts HashType to hex for RPC", async () => {
			let capturedParams: unknown[] = [];
			const transport = Layer.succeed(TransportService, {
				request: <T>(method: string, params?: unknown[]) => {
					if (method === "eth_getStorageAt") {
						capturedParams = params ?? [];
						return Effect.succeed("0x0" as T);
					}
					return Effect.fail(
						new TransportError({ code: -32601, message: "not found" }),
					);
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));
			const hash = Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);

			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getStorageAt(
						"0x1234567890123456789012345678901234567890",
						hash,
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(capturedParams[1]).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
		});
	});
});
