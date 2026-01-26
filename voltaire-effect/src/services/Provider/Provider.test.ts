import { Address, Hash } from "@tevm/voltaire";
import { InvalidBlobCountError } from "@tevm/voltaire/Blob";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import { TestTransport } from "../Transport/TestTransport.js";
import {
	TransportError,
	TransportService,
} from "../Transport/TransportService.js";
import { Provider } from "./Provider.js";
import { calculateBlobGasPrice, estimateBlobGas } from "./getBlobBaseFee.js";
import { type ProviderError, ProviderService } from "./ProviderService.js";

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

		it("returns block by tag", async () => {
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

		it("fetches block by hash", async () => {
			let capturedMethod = "";
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getBlockByHash: (params: unknown[]) => {
					capturedMethod = "eth_getBlockByHash";
					capturedParams = params;
					return mockBlock;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const blockHash =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlock({ blockHash });
				}).pipe(Effect.provide(layer)),
			);

			expect(capturedMethod).toBe("eth_getBlockByHash");
			expect(capturedParams[0]).toBe(blockHash);
			expect(capturedParams[1]).toBe(false);
			expect(result.number).toBe("0x10");
		});
	});

	describe("getLogs", () => {
		const mockLogs: unknown[] = [];

		it("formats single topic correctly", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getLogs: (params: unknown[]) => {
					capturedParams = params;
					return mockLogs;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const topic =
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({ topics: [topic] });
				}).pipe(Effect.provide(layer)),
			);

			const filter = capturedParams[0] as Record<string, unknown>;
			expect(filter.topics).toEqual([topic]);
		});

		it("formats array topics (OR condition) correctly", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getLogs: (params: unknown[]) => {
					capturedParams = params;
					return mockLogs;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const topic1 =
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
			const topic2 =
				"0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";
			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({ topics: [[topic1, topic2]] });
				}).pipe(Effect.provide(layer)),
			);

			const filter = capturedParams[0] as Record<string, unknown>;
			expect(filter.topics).toEqual([[topic1, topic2]]);
		});

		it("formats null wildcard topics correctly", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getLogs: (params: unknown[]) => {
					capturedParams = params;
					return mockLogs;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const topic =
				"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045";
			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({ topics: [null, topic] });
				}).pipe(Effect.provide(layer)),
			);

			const filter = capturedParams[0] as Record<string, unknown>;
			expect(filter.topics).toEqual([null, topic]);
		});

		it("formats mixed topics correctly", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getLogs: (params: unknown[]) => {
					capturedParams = params;
					return mockLogs;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const topic1 =
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
			const topic2 =
				"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045";
			const topic3 =
				"0x0000000000000000000000001234567890123456789012345678901234567890";
			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({
						topics: [topic1, [topic2, topic3], null],
					});
				}).pipe(Effect.provide(layer)),
			);

			const filter = capturedParams[0] as Record<string, unknown>;
			expect(filter.topics).toEqual([topic1, [topic2, topic3], null]);
		});
	});

	describe("filter subscriptions", () => {
		it("creates event filter with formatted params", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_newFilter: (params: unknown[]) => {
					capturedParams = params;
					return "0x1";
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const addressHex = "0x1234567890123456789012345678901234567890";
			const address = Address(addressHex);
			const address2 = "0x0000000000000000000000000000000000000001";
			const topicHex =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			const topic2 =
				"0x0000000000000000000000000000000000000000000000000000000000000002";
			const topic = Hash(topicHex);

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.createEventFilter({
						address: [address, address2],
						topics: [topic, [topic2], null],
						fromBlock: "latest",
						toBlock: "0x10",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0x1");
			const filter = capturedParams[0] as Record<string, unknown>;
			expect(filter.address).toEqual([addressHex, address2]);
			expect(filter.topics).toEqual([topicHex, [topic2], null]);
			expect(filter.fromBlock).toBe("latest");
			expect(filter.toBlock).toBe("0x10");
		});

		it("creates block and pending transaction filters", async () => {
			const captured: Record<string, unknown[]> = {};
			const transport = mockTransportWithCapture({
				eth_newBlockFilter: (params: unknown[]) => {
					captured.block = params;
					return "0x2";
				},
				eth_newPendingTransactionFilter: (params: unknown[]) => {
					captured.pending = params;
					return "0x3";
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					const block = yield* provider.createBlockFilter();
					const pending = yield* provider.createPendingTransactionFilter();
					return { block, pending };
				}).pipe(Effect.provide(layer)),
			);

			expect(result.block).toBe("0x2");
			expect(result.pending).toBe("0x3");
			expect(captured.block).toEqual([]);
			expect(captured.pending).toEqual([]);
		});

		it("requests filter changes/logs and uninstalls", async () => {
			const captured: Record<string, unknown[]> = {};
			const transport = mockTransportWithCapture({
				eth_getFilterChanges: (params: unknown[]) => {
					captured.changes = params;
					return [];
				},
				eth_getFilterLogs: (params: unknown[]) => {
					captured.logs = params;
					return [];
				},
				eth_uninstallFilter: (params: unknown[]) => {
					captured.uninstall = params;
					return true;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const filterId = "0x1";
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					const changes = yield* provider.getFilterChanges(filterId);
					const logs = yield* provider.getFilterLogs(filterId);
					const removed = yield* provider.uninstallFilter(filterId);
					return { changes, logs, removed };
				}).pipe(Effect.provide(layer)),
			);

			expect(result.changes).toEqual([]);
			expect(result.logs).toEqual([]);
			expect(result.removed).toBe(true);
			expect(captured.changes).toEqual([filterId]);
			expect(captured.logs).toEqual([filterId]);
			expect(captured.uninstall).toEqual([filterId]);
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
					return yield* provider.getBlockTransactionCount({
						blockTag: "latest",
					});
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
					return yield* provider.getBlockTransactionCount({
						blockTag: "latest",
					});
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
			const transport = mockTransport({
				eth_getTransactionReceipt: mockReceipt,
			});
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
			expect(result[0].address).toBe(
				"0x1234567890123456789012345678901234567890",
			);
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
			const transport = mockTransport({
				eth_maxPriorityFeePerGas: "0x3b9aca00",
			});
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

	describe("waitForTransactionReceipt", () => {
		const mockReceipt = {
			transactionHash: "0xabc",
			transactionIndex: "0x0",
			blockHash: "0xdef",
			blockNumber: "0x64",
			from: "0x1111111111111111111111111111111111111111",
			to: "0x2222222222222222222222222222222222222222",
			cumulativeGasUsed: "0x5208",
			gasUsed: "0x5208",
			contractAddress: null,
			logs: [],
			logsBloom: "0x0",
			status: "0x1",
		};

		it("returns receipt when transaction is mined", async () => {
			const transport = mockTransport({
				eth_getTransactionReceipt: mockReceipt,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(result.transactionHash).toBe("0xabc");
			expect(result.status).toBe("0x1");
		});

		it("polls until transaction is mined", async () => {
			let callCount = 0;
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => {
					callCount++;
					if (callCount < 3) return null;
					return mockReceipt;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(callCount).toBe(3);
			expect(result.transactionHash).toBe("0xabc");
		});

		it("waits for confirmations", async () => {
			let blockNumberCalls = 0;
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => mockReceipt,
				eth_blockNumber: () => {
					blockNumberCalls++;
					const blockNum = 100 + blockNumberCalls - 1;
					return `0x${blockNum.toString(16)}`;
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc", {
						confirmations: 3,
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(blockNumberCalls).toBeGreaterThanOrEqual(2);
			expect(result.transactionHash).toBe("0xabc");
		});

		it("times out in receipt phase", async () => {
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => null,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc", {
						timeout: 2000,
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
			}
		});

		it("times out in confirmations phase", async () => {
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => mockReceipt,
				eth_blockNumber: () => "0x64",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc", {
						confirmations: 5,
						timeout: 2000,
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails fast if confirmations < 1", async () => {
			const transport = mockTransport({
				eth_getTransactionReceipt: mockReceipt,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc", {
						confirmations: 0,
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
			}
		});

		it("respects single deadline across phases", async () => {
			let receiptCalls = 0;
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => {
					receiptCalls++;
					if (receiptCalls < 2) return null;
					return mockReceipt;
				},
				eth_blockNumber: () => "0x64",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const start = Date.now();
			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.waitForTransactionReceipt("0xabc", {
						timeout: 3000,
						confirmations: 5,
					});
				}).pipe(Effect.provide(layer)),
			);

			const elapsed = Date.now() - start;
			expect(Exit.isFailure(exit)).toBe(true);
			expect(elapsed).toBeLessThan(4500);
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

			expect(capturedParams[0]).toBe(
				"0x1234567890123456789012345678901234567890",
			);
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

	describe("getFeeHistory validation", () => {
		it("fails if blockCount is not a positive integer", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(0, "latest", [25, 50, 75]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"blockCount must be a positive integer",
				);
			}
		});

		it("fails if blockCount is negative", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(-1, "latest", [25, 50, 75]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"blockCount must be a positive integer",
				);
			}
		});

		it("fails if blockCount is not an integer", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(1.5, "latest", [25, 50, 75]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"blockCount must be a positive integer",
				);
			}
		});

		it("fails if rewardPercentiles contains value below 0", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(4, "latest", [-1, 50, 75]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"rewardPercentiles values must be between 0 and 100",
				);
			}
		});

		it("fails if rewardPercentiles contains value above 100", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(4, "latest", [25, 50, 101]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"rewardPercentiles values must be between 0 and 100",
				);
			}
		});

		it("fails if rewardPercentiles are not sorted ascending", async () => {
			const transport = mockTransport({});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(4, "latest", [75, 50, 25]);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).message).toContain(
					"rewardPercentiles should be sorted in ascending order",
				);
			}
		});

		it("succeeds with valid inputs", async () => {
			const mockFeeHistory = {
				oldestBlock: "0x1",
				baseFeePerGas: ["0x1", "0x2"],
				gasUsedRatio: [0.5, 0.6],
				reward: [["0x1"]],
			};
			const transport = mockTransport({ eth_feeHistory: mockFeeHistory });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getFeeHistory(4, "latest", [25, 50, 75]);
				}).pipe(Effect.provide(layer)),
			);

			expect(result.oldestBlock).toBe("0x1");
		});
	});

	describe("error code propagation", () => {
		it("propagates error code from TransportError to ProviderError", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({
							code: -32005,
							message: "Rate limit exceeded",
						}),
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
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).not.toBeNull();
				expect((error as ProviderError).code).toBe(-32005);
				expect((error as ProviderError).message).toContain(
					"Rate limit exceeded",
				);
			}
		});

		it("preserves error code through retry logic", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({
							code: -32000,
							message: "Server error",
						}),
					) as Effect.Effect<T, TransportError>,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as ProviderError).code).toBe(-32000);
			}
		});
	});

	describe("sendRawTransaction", () => {
		it("sends raw transaction and returns hash", async () => {
			const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const transport = mockTransport({ eth_sendRawTransaction: txHash });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.sendRawTransaction("0xf86c...");
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(txHash);
		});

		it("fails with nonce too low error", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({
							code: -32000,
							message: "nonce too low",
						}),
					) as Effect.Effect<T, TransportError>,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.sendRawTransaction("0xf86c...");
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with insufficient funds error", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({
							code: -32000,
							message: "insufficient funds for gas * price + value",
						}),
					) as Effect.Effect<T, TransportError>,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.sendRawTransaction("0xf86c...");
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("getUncleBlock", () => {
		it("returns uncle block by number and index", async () => {
			const mockUncle = {
				number: "0x10",
				hash: "0xuncle",
				parentHash: "0xparent",
			};
			const transport = mockTransport({ eth_getUncleByBlockNumberAndIndex: mockUncle });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getUncle({ blockTag: "latest" }, "0x0");
				}).pipe(Effect.provide(layer)),
			);

			expect(result.hash).toBe("0xuncle");
		});
	});

	describe("getProof", () => {
		it("returns account proof", async () => {
			const mockProof = {
				address: "0x1234567890123456789012345678901234567890",
				accountProof: ["0x1", "0x2"],
				balance: "0xde0b6b3a7640000",
				codeHash: "0xabc",
				nonce: "0x1",
				storageHash: "0xdef",
				storageProof: [],
			};
			const transport = mockTransport({ eth_getProof: mockProof });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getProof(
						"0x1234567890123456789012345678901234567890",
						["0x0"],
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result.address).toBe("0x1234567890123456789012345678901234567890");
			expect(result.accountProof).toHaveLength(2);
		});
	});

	describe("getBlobBaseFee", () => {
		it("returns blob base fee as bigint", async () => {
			const transport = mockTransport({ eth_blobBaseFee: "0x3b9aca00" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlobBaseFee();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1000000000n);
		});

		it("falls back to block excessBlobGas when RPC method is missing", async () => {
			const transport = mockTransportWithCapture({
				eth_getBlockByNumber: () => ({
					number: "0x1",
					excessBlobGas: "0x0",
				}),
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlobBaseFee();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(1n);
		});

		it("fails on pre-Dencun blocks without excessBlobGas", async () => {
			const transport = mockTransportWithCapture({
				eth_getBlockByNumber: () => ({
					number: "0x1",
				}),
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlobBaseFee();
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("estimateBlobGas", () => {
		it("estimates blob gas from blob count", () => {
			expect(estimateBlobGas(3)).toBe(393216n);
		});

		it("throws for invalid blob count", () => {
			expect(() => estimateBlobGas(7)).toThrow(InvalidBlobCountError);
		});
	});

	describe("calculateBlobGasPrice", () => {
		it("calculates total blob fee", () => {
			expect(calculateBlobGasPrice(10n, 2n)).toBe(20n);
		});
	});

	describe("getTransactionConfirmations", () => {
		it("returns confirmations for mined transaction", async () => {
			const mockReceipt = {
				transactionHash: "0xabc",
				blockNumber: "0x64", // block 100
				status: "0x1",
			};
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => mockReceipt,
				eth_blockNumber: () => "0x69", // block 105
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionConfirmations("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(6n); // 105 - 100 + 1 = 6 confirmations
		});

		it("returns 0 for pending transaction", async () => {
			const transport = mockTransportWithCapture({
				eth_getTransactionReceipt: () => null,
				eth_blockNumber: () => "0x64",
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionConfirmations("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(0n);
		});
	});

	describe("concurrent requests", () => {
		it("handles multiple concurrent getBalance calls", async () => {
			let callCount = 0;
			const transport = mockTransportWithCapture({
				eth_getBalance: (params: unknown[]) => {
					callCount++;
					return "0xde0b6b3a7640000";
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const addresses = [
				"0x1111111111111111111111111111111111111111",
				"0x2222222222222222222222222222222222222222",
				"0x3333333333333333333333333333333333333333",
			];

			const results = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* Effect.all(
						addresses.map((addr) => provider.getBalance(addr)),
						{ concurrency: "unbounded" },
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(results).toHaveLength(3);
			expect(callCount).toBe(3);
			for (const result of results) {
				expect(result).toBe(1000000000000000000n);
			}
		});
	});

	describe("edge cases", () => {
		it("handles zero balance", async () => {
			const transport = mockTransport({ eth_getBalance: "0x0" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(0n);
		});

		it("handles empty code (EOA)", async () => {
			const transport = mockTransport({ eth_getCode: "0x" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getCode(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0x");
		});

		it("fails when transaction receipt is null (pending)", async () => {
			const transport = mockTransport({ eth_getTransactionReceipt: null });
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getTransactionReceipt("0xabc");
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("handles empty logs array", async () => {
			const transport = mockTransport({ eth_getLogs: [] });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getLogs({
						address: "0x1234567890123456789012345678901234567890",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toHaveLength(0);
		});

		it("handles very large block numbers", async () => {
			const transport = mockTransport({ eth_blockNumber: "0xffffffffffffff" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(0xffffffffffffffn);
		});

		it("handles very large gas estimates", async () => {
			const transport = mockTransport({ eth_estimateGas: "0xffffffffffff" });
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.estimateGas({
						to: "0x1234567890123456789012345678901234567890",
					});
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe(0xffffffffffffn);
		});
	});

	describe("block identifier formats", () => {
		it("accepts block number as bigint", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getBlockByNumber: (params: unknown[]) => {
					capturedParams = params;
					return {
						number: "0x10",
						hash: "0xabc",
						parentHash: "0xdef",
						transactions: [],
					};
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlock({ blockNumber: 16n });
				}).pipe(Effect.provide(layer)),
			);

			expect(capturedParams[0]).toBe("0x10");
		});

		it("accepts block tag as string", async () => {
			let capturedParams: unknown[] = [];
			const transport = mockTransportWithCapture({
				eth_getBlockByNumber: (params: unknown[]) => {
					capturedParams = params;
					return {
						number: "0x10",
						hash: "0xabc",
						parentHash: "0xdef",
						transactions: [],
					};
				},
			});
			const layer = Provider.pipe(Layer.provide(transport));

			await Effect.runPromise(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlock({ blockTag: "pending" });
				}).pipe(Effect.provide(layer)),
			);

			expect(capturedParams[0]).toBe("pending");
		});
	});
});
