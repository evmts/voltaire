// @ts-nocheck - TODO: Fix ABI type inference issues
import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as S from "effect/Schema";
import { fromArray } from "../../primitives/Abi/AbiSchema.js";
import { ProviderService } from "../Provider/index.js";
import { SignerService } from "../Signer/index.js";
import { Contract } from "./Contract.js";

type HexType = `0x${string}`;

const testAddress = Address("0x6B175474E89094C44Da98b954EecdEfaE6E286AB");

// Cast to any to bypass strict ABI type checking - schema returns Item[] not strongly typed ABI
const erc20Abi = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "balance", type: "uint256" }],
	},
	{
		type: "function",
		name: "totalSupply",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "success", type: "bool" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "success", type: "bool" }],
	},
	{
		type: "function",
		name: "deposit",
		stateMutability: "payable",
		inputs: [],
		outputs: [],
	},
	{
		type: "function",
		name: "depositTo",
		stateMutability: "payable",
		inputs: [{ name: "recipient", type: "address" }],
		outputs: [],
	},
	{
		type: "function",
		name: "getReserves",
		stateMutability: "view",
		inputs: [],
		outputs: [
			{ name: "reserve0", type: "uint112" },
			{ name: "reserve1", type: "uint112" },
			{ name: "blockTimestampLast", type: "uint32" },
		],
	},
	{
		type: "function",
		name: "sync",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ name: "owner", type: "address", indexed: true },
			{ name: "spender", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
]) as any;

const mockProvider = {
	call: vi.fn(),
	getLogs: vi.fn(),
	getBlockNumber: vi.fn(),
	getBalance: vi.fn(),
	getBlock: vi.fn(),
	getTransaction: vi.fn(),
	getTransactionReceipt: vi.fn(),
	getTransactionCount: vi.fn(),
	getCode: vi.fn(),
	getStorageAt: vi.fn(),
	estimateGas: vi.fn(),
	getChainId: vi.fn(),
	getGasPrice: vi.fn(),
};

const mockSigner = {
	sendTransaction: vi.fn(),
	signMessage: vi.fn(),
	signTransaction: vi.fn(),
	signTypedData: vi.fn(),
	sendRawTransaction: vi.fn(),
	requestAddresses: vi.fn(),
	switchChain: vi.fn(),
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

const MockSignerLayer = Layer.succeed(SignerService, mockSigner as any);

describe("Contract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Contract factory", () => {
		it("creates contract instance with address and abi", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return contract;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result.address).toBe(testAddress);
			expect(result.abi).toBe(erc20Abi);
		});

		it("has read methods for view functions", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return {
					hasBalanceOf: typeof contract.read.balanceOf === "function",
					hasTotalSupply: typeof contract.read.totalSupply === "function",
				};
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result.hasBalanceOf).toBe(true);
			expect(result.hasTotalSupply).toBe(true);
		});

		it("has write methods for non-view functions", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return {
					hasTransfer: typeof contract.write.transfer === "function",
					hasApprove: typeof contract.write.approve === "function",
				};
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result.hasTransfer).toBe(true);
			expect(result.hasApprove).toBe(true);
		});

		it("has simulate methods for non-view functions", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return {
					hasTransfer: typeof contract.simulate.transfer === "function",
					hasApprove: typeof contract.simulate.approve === "function",
				};
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result.hasTransfer).toBe(true);
			expect(result.hasApprove).toBe(true);
		});

		it("has getEvents method", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return typeof contract.getEvents === "function";
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(true);
		});
	});

	describe("read methods", () => {
		it("calls eth_call with encoded function data", async () => {
			const expectedBalance = 1000000000000000000n;
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const balance = yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
				return balance;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(result).toBe(expectedBalance);
		});

		it("handles view function with no args", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const supply = yield* contract.read.totalSupply();
				return supply;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(typeof result).toBe("bigint");
		});

		it("returns tuple/array for function with multiple outputs", async () => {
			// getReserves returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
			// Encoded: 3 words padded to 32 bytes each
			const reserve0 = 1000000000000000000n;
			const reserve1 = 2000000000000000000n;
			const blockTimestamp = 1234567890n;
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					("0x" +
						reserve0.toString(16).padStart(64, "0") +
						reserve1.toString(16).padStart(64, "0") +
						blockTimestamp.toString(16).padStart(64, "0")) as HexType,
				),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const result = yield* contract.read.getReserves();
				return result;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(Array.isArray(result)).toBe(true);
			const arr = result as unknown as bigint[];
			expect(arr.length).toBe(3);
			expect(arr[0]).toBe(reserve0);
			expect(arr[1]).toBe(reserve1);
			expect(arr[2]).toBe(blockTimestamp);
		});

		it("returns ContractCallError on failure", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail(new Error("execution reverted")),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("returns ContractCallError for malformed return data (empty 0x)", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x" as HexType));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
			}).pipe(
				Effect.catchTag("ContractCallError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});

		it("returns ContractCallError for return data too short", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x1234" as HexType));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
			}).pipe(
				Effect.catchTag("ContractCallError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});

		it("returns ContractCallError for odd-length hex", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x123" as HexType));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
			}).pipe(
				Effect.catchTag("ContractCallError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});
	});

	describe("write methods", () => {
		it("sends transaction with encoded function data", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
				return hash;
			});

			const result = await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			expect(result).toBe(txHash);
		});

		it("returns ContractWriteError on sendTransaction failure", async () => {
			mockSigner.sendTransaction.mockReturnValue(
				Effect.fail(new Error("wallet not connected")),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("sends transaction with value for payable function (no args)", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.deposit({
					value: 1000000000000000000n,
				});
				return hash;
			});

			const result = await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.value).toBe(1000000000000000000n);
			expect(result).toBe(txHash);
		});

		it("sends transaction with value for payable function (with args)", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.depositTo(
					Address("0x1234567890123456789012345678901234567890"),
					{ value: 500000000000000000n },
				);
				return hash;
			});

			const result = await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.value).toBe(500000000000000000n);
			expect(result).toBe(txHash);
		});

		it("sends transaction with custom gas limit", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
					{ gas: 100000n },
				);
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.gasLimit).toBe(100000n);
		});

		it("sends transaction with EIP-1559 fee params", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
					{
						maxFeePerGas: 50000000000n,
						maxPriorityFeePerGas: 2000000000n,
					},
				);
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.maxFeePerGas).toBe(50000000000n);
			expect(txArgs.maxPriorityFeePerGas).toBe(2000000000n);
		});

		it("sends transaction with custom nonce", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
					{ nonce: 42n },
				);
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.nonce).toBe(42n);
		});

		it("sends transaction without options (backwards compatible)", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.value).toBeUndefined();
			expect(txArgs.gasLimit).toBeUndefined();
		});

		it("sends payable function with value (deposit)", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.deposit({
					value: 1000000000000000000n,
				});
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.value).toBe(1000000000000000000n);
		});

		it("sends payable function with value and args (depositTo)", async () => {
			const txHash =
				"0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab" as HexType;
			mockSigner.sendTransaction.mockReturnValue(Effect.succeed(txHash));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const hash = yield* contract.write.depositTo(
					Address("0x1234567890123456789012345678901234567890"),
					{ value: 500000000000000000n },
				);
				return hash;
			});

			await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(mockSigner.sendTransaction).toHaveBeenCalled();
			const txArgs = mockSigner.sendTransaction.mock.calls[0][0];
			expect(txArgs.value).toBe(500000000000000000n);
		});

		it("propagates signer sendTransaction error as ContractWriteError", async () => {
			mockSigner.sendTransaction.mockReturnValue(
				Effect.fail(new Error("user rejected transaction")),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.write.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
			}).pipe(
				Effect.catchTag("ContractWriteError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(result).toContain("caught:");
			expect(result).toContain("user rejected transaction");
		});

		it("propagates signer network error as ContractWriteError", async () => {
			mockSigner.sendTransaction.mockReturnValue(
				Effect.fail(new Error("network error")),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.write.approve(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
			}).pipe(
				Effect.catchTag("ContractWriteError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(
					Effect.provide(MockProviderLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(result).toContain("caught:");
			expect(result).toContain("network error");
		});
	});

	describe("simulate methods", () => {
		it("calls eth_call without sending transaction", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000001" as HexType,
				),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const result = yield* contract.simulate.transfer(
					Address("0x1234567890123456789012345678901234567890"),
					1000n,
				);
				return result;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(mockSigner.sendTransaction).not.toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it("handles zero-output function (sync)", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x" as HexType));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const result = yield* contract.simulate.sync();
				return result;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});

	describe("getEvents", () => {
		it("fetches and decodes events", async () => {
			mockProvider.getLogs.mockReturnValue(
				Effect.succeed([
					{
						address: testAddress,
						topics: [
							"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
							"0x0000000000000000000000001234567890123456789012345678901234567890",
							"0x0000000000000000000000000987654321098765432109876543210987654321",
						],
						data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						blockNumber: 18000000n,
						transactionHash: "0xabcd" as HexType,
						logIndex: 0,
					},
				]),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				const events = yield* contract.getEvents("Transfer", {
					fromBlock: 17000000n,
					toBlock: "latest",
				});
				return events;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.getLogs).toHaveBeenCalled();
			expect(result.length).toBe(1);
			expect(result[0].eventName).toBe("Transfer");
		});

		it("applies event filters", async () => {
			mockProvider.getLogs.mockReturnValue(Effect.succeed([]));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				yield* contract.getEvents("Transfer", {
					fromBlock: 17000000n,
					args: {
						from: Address("0x1234567890123456789012345678901234567890"),
					},
				});
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.getLogs).toHaveBeenCalled();
			const callArgs = mockProvider.getLogs.mock.calls[0][0];
			expect(callArgs.address).toBe(Address.toHex(testAddress));
		});

		it("event not found error is catchable with Effect.catchTag", async () => {
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.getEvents("NonExistentEvent" as any);
			}).pipe(
				Effect.catchTag("ContractEventError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
			expect(result).toContain("NonExistentEvent not found");
		});

		it("handles fromBlock: 0n (genesis block)", async () => {
			mockProvider.getLogs.mockReturnValue(Effect.succeed([]));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				yield* contract.getEvents("Transfer", {
					fromBlock: 0n,
					toBlock: 100n,
				});
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.getLogs).toHaveBeenCalled();
			const callArgs = mockProvider.getLogs.mock.calls[0][0];
			expect(callArgs.fromBlock).toBe("0x0");
		});

		it("handles large block numbers", async () => {
			mockProvider.getLogs.mockReturnValue(Effect.succeed([]));

			const largeBlockNumber = 999999999999999n;
			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				yield* contract.getEvents("Transfer", {
					fromBlock: largeBlockNumber,
				});
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.getLogs).toHaveBeenCalled();
			const callArgs = mockProvider.getLogs.mock.calls[0][0];
			expect(callArgs.fromBlock).toBe(`0x${largeBlockNumber.toString(16)}`);
		});

		it("returns ContractEventError for wrong topics length", async () => {
			mockProvider.getLogs.mockReturnValue(
				Effect.succeed([
					{
						address: testAddress,
						topics: [
							"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
						],
						data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						blockNumber: 18000000n,
						transactionHash: "0xabcd" as HexType,
						logIndex: 0,
					},
				]),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.getEvents("Transfer", {
					fromBlock: 17000000n,
				});
			}).pipe(
				Effect.catchTag("ContractEventError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});

		it("returns ContractEventError for malformed topic hex", async () => {
			mockProvider.getLogs.mockReturnValue(
				Effect.succeed([
					{
						address: testAddress,
						topics: [
							"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
							"invalid-hex",
							"0x0000000000000000000000000987654321098765432109876543210987654321",
						],
						data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
						blockNumber: 18000000n,
						transactionHash: "0xabcd" as HexType,
						logIndex: 0,
					},
				]),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.getEvents("Transfer", {
					fromBlock: 17000000n,
				});
			}).pipe(
				Effect.catchTag("ContractEventError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});
	});

	describe("error handling", () => {
		it("decode error from read method is catchable with Effect.catchTag", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x1234" as HexType));

			const abiWithMissingFn = [
				{
					type: "function",
					name: "unknownMethod",
					stateMutability: "view",
					inputs: [],
					outputs: [{ name: "", type: "uint256" }],
				},
			] as const;

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, abiWithMissingFn);
				return yield* contract.read.unknownMethod();
			}).pipe(
				Effect.catchTag("ContractCallError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});

		it("decode error from simulate method is catchable with Effect.catchTag", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x1234" as HexType));

			const abiWithMissingFn = [
				{
					type: "function",
					name: "unknownMethod",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [{ name: "", type: "uint256" }],
				},
			] as const;

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, abiWithMissingFn);
				return yield* contract.simulate.unknownMethod();
			}).pipe(
				Effect.catchTag("ContractCallError", (e) =>
					Effect.succeed(`caught: ${e.message}`),
				),
			);

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("caught:");
		});
	});
});
