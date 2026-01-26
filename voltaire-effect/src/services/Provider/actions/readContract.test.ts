import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as S from "effect/Schema";
import { fromArray } from "../../../primitives/Abi/AbiSchema.js";
import { ProviderService } from "../ProviderService.js";
import { readContract } from "./readContract.js";

type HexType = `0x${string}`;

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
		name: "decimals",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "uint8" }],
	},
	{
		type: "function",
		name: "name",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "string" }],
	},
	{
		type: "function",
		name: "allowance",
		stateMutability: "view",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ name: "", type: "uint256" }],
	},
]);

const pairAbi = S.decodeUnknownSync(fromArray)([
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
		name: "token0",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "address" }],
	},
]);

const extendedAbi = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "owner",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "address" }],
	},
	{
		type: "function",
		name: "paused",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "bool" }],
	},
	{
		type: "function",
		name: "merkleRoot",
		stateMutability: "view",
		inputs: [],
		outputs: [{ name: "", type: "bytes32" }],
	},
	{
		type: "function",
		name: "getBalances",
		stateMutability: "view",
		inputs: [{ name: "user", type: "address" }],
		outputs: [{ name: "", type: "uint256[]" }],
	},
	{
		type: "function",
		name: "getPosition",
		stateMutability: "view",
		inputs: [{ name: "tokenId", type: "uint256" }],
		outputs: [
			{
				name: "",
				type: "tuple",
				components: [
					{ name: "owner", type: "address" },
					{ name: "liquidity", type: "uint128" },
					{ name: "tickLower", type: "int24" },
					{ name: "tickUpper", type: "int24" },
				],
			},
		],
	},
	{
		type: "function",
		name: "execute",
		stateMutability: "nonpayable",
		inputs: [{ name: "data", type: "bytes" }],
		outputs: [],
	},
]);

const complexAbi = S.decodeUnknownSync(fromArray)([
	{
		type: "function",
		name: "getPositions",
		stateMutability: "view",
		inputs: [{ name: "tokenIds", type: "uint256[]" }],
		outputs: [
			{ name: "amounts", type: "uint256[]" },
			{ name: "owners", type: "address[]" },
		],
	},
	{
		type: "function",
		name: "getUserData",
		stateMutability: "view",
		inputs: [
			{ name: "user", type: "address" },
			{ name: "includeHistory", type: "bool" },
		],
		outputs: [
			{ name: "balance", type: "uint256" },
			{ name: "nonce", type: "uint256" },
		],
	},
]);

const mockProvider = {
	call: vi.fn(),
	getLogs: vi.fn(),
	getBlockNumber: vi.fn(),
	getBalance: vi.fn(),
	getBlock: vi.fn(),
	getTransaction: vi.fn(),
	getTransactionReceipt: vi.fn(),
	waitForTransactionReceipt: vi.fn(),
	getTransactionCount: vi.fn(),
	getCode: vi.fn(),
	getStorageAt: vi.fn(),
	estimateGas: vi.fn(),
	createAccessList: vi.fn(),
	getChainId: vi.fn(),
	getGasPrice: vi.fn(),
	getMaxPriorityFeePerGas: vi.fn(),
	getFeeHistory: vi.fn(),
	getBlockTransactionCount: vi.fn(),
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

describe("readContract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("ERC-20 balanceOf", () => {
		it("reads balance with single argument", async () => {
			const expectedBalance = 1000000000000000000n;
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(result).toBe(expectedBalance);
		});

		it("accepts branded address input", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const address = Address("0x6B175474E89094C44Da98b954EecdEfaE6E286AB");
			const program = readContract({
				address,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(1000000000000000000n);
		});
	});

	describe("functions with no arguments", () => {
		it("reads totalSupply without args", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x00000000000000000000000000000000000000000000d3c21bcecceda1000000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "totalSupply",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(typeof result).toBe("bigint");
		});

		it("reads decimals", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000012" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "decimals",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(18n);
		});
	});

	describe("multi-return functions", () => {
		it("reads getReserves with multiple return values", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					("0x" +
						"00000000000000000000000000000000000000000000021e19e0c9bab2400000" +
						"000000000000000000000000000000000000000000000000016345785d8a0000" +
						"0000000000000000000000000000000000000000000000000000000065b8f000") as HexType,
				),
			);

			const program = readContract({
				address: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
				abi: pairAbi,
				functionName: "getReserves",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(Array.isArray(result)).toBe(true);
			expect((result as readonly unknown[]).length).toBe(3);
		});
	});

	describe("complex arguments", () => {
		it("handles two address arguments", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "allowance",
				args: [
					"0x1234567890123456789012345678901234567890",
					"0x0987654321098765432109876543210987654321",
				],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(mockProvider.call).toHaveBeenCalled();
			expect(typeof result).toBe("bigint");
		});

		it("handles mixed argument types (address + bool)", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					("0x" +
						"0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
						"0000000000000000000000000000000000000000000000000000000000000005") as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: complexAbi,
				functionName: "getUserData",
				args: ["0x1234567890123456789012345678901234567890", true],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("block tag", () => {
		it("passes block tag to provider.call", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
				blockTag: "finalized",
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.call).toHaveBeenCalledWith(
				expect.any(Object),
				"finalized",
			);
		});

		it("uses latest by default", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			await Effect.runPromise(program.pipe(Effect.provide(MockProviderLayer)));

			expect(mockProvider.call).toHaveBeenCalledWith(
				expect.any(Object),
				undefined,
			);
		});
	});

	describe("error handling", () => {
		it("returns ProviderError on call failure", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({ message: "execution reverted", code: -32000 }),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("includes context in error", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({ message: "execution reverted", code: -32000 }),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			if (exit._tag === "Failure") {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
			}
		});

		it("fails when function not found in ABI", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as HexType,
				),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "nonexistent" as any,
				args: [],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("handles contract revert with reason string", async () => {
			const revertData =
				"0x08c379a0" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000012" +
				"496e73756666696369656e742062616c616e63650000000000000000000000";
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "execution reverted",
					code: 3,
					data: revertData,
				}),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("handles contract revert with custom error", async () => {
			const customErrorSelector = "0xcf479181";
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "execution reverted",
					code: 3,
					data: customErrorSelector,
				}),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates transport errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "network error: connection refused",
					code: -32603,
				}),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates timeout errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "request timeout",
					code: -32000,
				}),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("propagates rate limit errors", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail({
					message: "rate limit exceeded",
					code: 429,
				}),
			);

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("handles empty return data (0x) for function expecting outputs", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x" as HexType));

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});

		it("handles malformed hex (odd length)", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x123" as HexType));

			const program = readContract({
				address: "0x6B175474E89094C44Da98b954EecdEfaE6E286AB",
				abi: erc20Abi,
				functionName: "balanceOf",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(exit._tag).toBe("Failure");
		});
	});

	describe("output type handling", () => {
		it("handles address output type", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045" as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "owner",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBeDefined();
			expect(typeof result).toBe("object");
		});

		it("handles bool output type - true", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000001" as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "paused",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(true);
		});

		it("handles bool output type - false", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000000" as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "paused",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(false);
		});

		it("handles bytes32 output type", async () => {
			const merkleRoot =
				"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
			mockProvider.call.mockReturnValue(Effect.succeed(merkleRoot as HexType));

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "merkleRoot",
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBeDefined();
		});

		it("handles dynamic array (uint256[]) output", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					("0x" +
						"0000000000000000000000000000000000000000000000000000000000000020" +
						"0000000000000000000000000000000000000000000000000000000000000003" +
						"0000000000000000000000000000000000000000000000000000000000000064" +
						"00000000000000000000000000000000000000000000000000000000000000c8" +
						"000000000000000000000000000000000000000000000000000000000000012c") as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "getBalances",
				args: ["0x1234567890123456789012345678901234567890"],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(Array.isArray(result)).toBe(true);
			expect((result as unknown as bigint[]).length).toBe(3);
			expect((result as unknown as bigint[])[0]).toBe(100n);
			expect((result as unknown as bigint[])[1]).toBe(200n);
			expect((result as unknown as bigint[])[2]).toBe(300n);
		});

		it("handles tuple/struct output", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					("0x" +
						"000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045" +
						"0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
						"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0bb8" +
						"0000000000000000000000000000000000000000000000000000000000000bb8") as HexType,
				),
			);

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "getPosition",
				args: [1n],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBeDefined();
			expect(typeof result).toBe("object");
		});

		it("handles zero output function", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x" as HexType));

			const program = readContract({
				address: "0x1234567890123456789012345678901234567890",
				abi: extendedAbi,
				functionName: "execute",
				args: ["0x1234"],
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBeUndefined();
		});
	});
});
