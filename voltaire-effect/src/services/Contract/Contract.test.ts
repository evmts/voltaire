import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderService } from "../Provider/index.js";
import { SignerService } from "../Signer/index.js";
import { Contract } from "./Contract.js";

type HexType = `0x${string}`;

const testAddress = Address("0x6B175474E89094C44Da98b954EecdEfaE6E286AB");

const erc20Abi = [
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
] as const;

const mockPublicClient = {
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

const MockPublicClientLayer = Layer.succeed(
	PublicClientService,
	mockPublicClient as any,
);

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
				program.pipe(Effect.provide(MockPublicClientLayer)),
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(result).toBe(true);
		});
	});

	describe("read methods", () => {
		it("calls eth_call with encoded function data", async () => {
			const expectedBalance = 1000000000000000000n;
			mockPublicClient.call.mockReturnValue(
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(mockPublicClient.call).toHaveBeenCalled();
			expect(result).toBe(expectedBalance);
		});

		it("handles view function with no args", async () => {
			mockPublicClient.call.mockReturnValue(
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(mockPublicClient.call).toHaveBeenCalled();
			expect(typeof result).toBe("bigint");
		});

		it("returns ContractCallError on failure", async () => {
			mockPublicClient.call.mockReturnValue(
				Effect.fail(new Error("execution reverted")),
			);

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				return yield* contract.read.balanceOf(
					Address("0x1234567890123456789012345678901234567890"),
				);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(exit._tag).toBe("Failure");
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
					Effect.provide(MockPublicClientLayer),
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
					Effect.provide(MockPublicClientLayer),
					Effect.provide(MockSignerLayer),
				),
			);

			expect(exit._tag).toBe("Failure");
		});
	});

	describe("simulate methods", () => {
		it("calls eth_call without sending transaction", async () => {
			mockPublicClient.call.mockReturnValue(
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(mockPublicClient.call).toHaveBeenCalled();
			expect(mockSigner.sendTransaction).not.toHaveBeenCalled();
			expect(result).toBe(true);
		});
	});

	describe("getEvents", () => {
		it("fetches and decodes events", async () => {
			mockPublicClient.getLogs.mockReturnValue(
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
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(mockPublicClient.getLogs).toHaveBeenCalled();
			expect(result.length).toBe(1);
			expect(result[0].eventName).toBe("Transfer");
		});

		it("applies event filters", async () => {
			mockPublicClient.getLogs.mockReturnValue(Effect.succeed([]));

			const program = Effect.gen(function* () {
				const contract = yield* Contract(testAddress, erc20Abi);
				yield* contract.getEvents("Transfer", {
					fromBlock: 17000000n,
					args: {
						from: Address("0x1234567890123456789012345678901234567890"),
					},
				});
			});

			await Effect.runPromise(
				program.pipe(Effect.provide(MockPublicClientLayer)),
			);

			expect(mockPublicClient.getLogs).toHaveBeenCalled();
			const callArgs = mockPublicClient.getLogs.mock.calls[0][0];
			expect(callArgs.address).toBe(Address.toHex(testAddress));
		});
	});
});
