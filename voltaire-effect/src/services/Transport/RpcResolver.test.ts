import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import {
	GetBalance,
	GetBlockNumber,
	rpc,
	rpcRequest,
	TestTransport,
} from "./index.js";

describe("RpcResolver", () => {
	describe("rpcRequest", () => {
		it("makes a single request", async () => {
			const program = rpcRequest(new GetBlockNumber({})).pipe(
				Effect.provide(TestTransport({ eth_blockNumber: "0x100" })),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x100");
		});

		it("makes request with params", async () => {
			const program = rpcRequest(
				new GetBalance({
					address: "0x1234567890123456789012345678901234567890",
					blockTag: "latest",
				}),
			).pipe(Effect.provide(TestTransport({ eth_getBalance: "0x1000" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1000");
		});
	});

	describe("rpc helpers", () => {
		it("getBlockNumber", async () => {
			const program = rpc
				.getBlockNumber()
				.pipe(Effect.provide(TestTransport({ eth_blockNumber: "0x200" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x200");
		});

		it("getChainId", async () => {
			const program = rpc
				.getChainId()
				.pipe(Effect.provide(TestTransport({ eth_chainId: "0x1" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1");
		});

		it("getGasPrice", async () => {
			const program = rpc
				.getGasPrice()
				.pipe(Effect.provide(TestTransport({ eth_gasPrice: "0x12a05f200" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x12a05f200");
		});

		it("getBalance", async () => {
			const program = rpc
				.getBalance("0x1234567890123456789012345678901234567890")
				.pipe(
					Effect.provide(
						TestTransport({ eth_getBalance: "0xde0b6b3a7640000" }),
					),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xde0b6b3a7640000");
		});

		it("getTransactionCount", async () => {
			const program = rpc
				.getTransactionCount("0x1234567890123456789012345678901234567890")
				.pipe(
					Effect.provide(TestTransport({ eth_getTransactionCount: "0x10" })),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x10");
		});

		it("getCode", async () => {
			const program = rpc
				.getCode("0x1234567890123456789012345678901234567890")
				.pipe(
					Effect.provide(
						TestTransport({ eth_getCode: "0x608060405234801561001057..." }),
					),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x608060405234801561001057...");
		});

		it("getStorageAt", async () => {
			const program = rpc
				.getStorageAt("0x1234567890123456789012345678901234567890", "0x0")
				.pipe(
					Effect.provide(
						TestTransport({
							eth_getStorageAt:
								"0x0000000000000000000000000000000000000000000000000000000000000001",
						}),
					),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
		});

		it("call", async () => {
			const program = rpc
				.call({
					to: "0x1234567890123456789012345678901234567890",
					data: "0x12345678",
				})
				.pipe(Effect.provide(TestTransport({ eth_call: "0xabcdef" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xabcdef");
		});

		it("estimateGas", async () => {
			const program = rpc
				.estimateGas({
					to: "0x1234567890123456789012345678901234567890",
					value: "0x1000",
				})
				.pipe(Effect.provide(TestTransport({ eth_estimateGas: "0x5208" })));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x5208");
		});

		it("getBlockByNumber", async () => {
			const mockBlock = {
				number: "0x100",
				hash: "0xabc",
				transactions: [],
			};
			const program = rpc
				.getBlockByNumber("latest")
				.pipe(
					Effect.provide(TestTransport({ eth_getBlockByNumber: mockBlock })),
				);

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockBlock);
		});

		it("getBlockByHash", async () => {
			const mockBlock = {
				number: "0x100",
				hash: "0xabc",
				transactions: [],
			};
			const program = rpc
				.getBlockByHash("0xabc")
				.pipe(Effect.provide(TestTransport({ eth_getBlockByHash: mockBlock })));

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockBlock);
		});

		it("getTransactionByHash", async () => {
			const mockTx = {
				hash: "0xdef",
				from: "0x123",
				to: "0x456",
			};
			const program = rpc
				.getTransactionByHash("0xdef")
				.pipe(
					Effect.provide(TestTransport({ eth_getTransactionByHash: mockTx })),
				);

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockTx);
		});

		it("getTransactionReceipt", async () => {
			const mockReceipt = {
				transactionHash: "0xdef",
				status: "0x1",
				gasUsed: "0x5208",
			};
			const program = rpc
				.getTransactionReceipt("0xdef")
				.pipe(
					Effect.provide(
						TestTransport({ eth_getTransactionReceipt: mockReceipt }),
					),
				);

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockReceipt);
		});

		it("getLogs", async () => {
			const mockLogs = [
				{ topics: ["0xtopic1"], data: "0xdata1" },
				{ topics: ["0xtopic2"], data: "0xdata2" },
			];
			const program = rpc
				.getLogs({ address: "0x123", fromBlock: "0x0", toBlock: "latest" })
				.pipe(Effect.provide(TestTransport({ eth_getLogs: mockLogs })));

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockLogs);
		});

		it("sendRawTransaction", async () => {
			const program = rpc
				.sendRawTransaction("0xf86c...")
				.pipe(
					Effect.provide(
						TestTransport({ eth_sendRawTransaction: "0xhash123" }),
					),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xhash123");
		});

		it("getFeeHistory", async () => {
			const mockHistory = {
				baseFeePerGas: ["0x100", "0x110"],
				gasUsedRatio: [0.5, 0.6],
				reward: [["0x10"], ["0x20"]],
			};
			const program = rpc
				.getFeeHistory(2, "latest", [50])
				.pipe(Effect.provide(TestTransport({ eth_feeHistory: mockHistory })));

			const result = await Effect.runPromise(program);
			expect(result).toEqual(mockHistory);
		});

		it("generic", async () => {
			const program = rpc
				.generic("custom_method", ["arg1", "arg2"])
				.pipe(
					Effect.provide(TestTransport({ custom_method: "custom_result" })),
				);

			const result = await Effect.runPromise(program);
			expect(result).toBe("custom_result");
		});
	});

	describe("concurrent requests", () => {
		it("makes multiple concurrent requests with Effect.all", async () => {
			const program = Effect.all([
				rpc.getBlockNumber(),
				rpc.getChainId(),
				rpc.getGasPrice(),
			]).pipe(
				Effect.provide(
					TestTransport({
						eth_blockNumber: "0x100",
						eth_chainId: "0x1",
						eth_gasPrice: "0x12a05f200",
					}),
				),
			);

			const [blockNumber, chainId, gasPrice] = await Effect.runPromise(program);
			expect(blockNumber).toBe("0x100");
			expect(chainId).toBe("0x1");
			expect(gasPrice).toBe("0x12a05f200");
		});
	});
});
