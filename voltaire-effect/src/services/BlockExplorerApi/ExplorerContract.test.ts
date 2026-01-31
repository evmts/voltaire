import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Exit from "effect/Exit";
import { ExplorerContract, type ExplorerContractInstance } from "./ExplorerContract";
import { BlockExplorerApiService, type BlockExplorerApiShape } from "./BlockExplorerApiService";
import type { ResolvedExplorerContract, AbiItem } from "./BlockExplorerApiTypes";
import { ChainService, type ChainConfig } from "../Chain/ChainService";

const mockMainnetConfig: ChainConfig = {
	id: 1,
	name: "Ethereum",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 12000,
};

const mockChainLayer = Layer.succeed(ChainService, mockMainnetConfig);

const mockErc20Abi: AbiItem[] = [
	{
		type: "function",
		name: "name",
		inputs: [],
		outputs: [{ name: "", type: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "symbol",
		inputs: [],
		outputs: [{ name: "", type: "string" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "decimals",
		inputs: [],
		outputs: [{ name: "", type: "uint8" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "approve",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
];

const createMockExplorerService = (mockContract: ResolvedExplorerContract): Layer.Layer<BlockExplorerApiService> => {
	const mockShape: BlockExplorerApiShape = {
		getContract: (_address, _options) => Effect.succeed(mockContract),
		getAbi: (_address, _options) => Effect.succeed(mockContract.abi),
		getSources: (_address, _options) => Effect.succeed(mockContract.sources ?? []),
	};
	return Layer.succeed(BlockExplorerApiService, mockShape);
};

describe("ExplorerContract", () => {
	describe("Contract instance creation", () => {
		it("creates contract instance with read methods", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(result.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			expect(result.abi).toEqual(mockErc20Abi);
			expect(typeof result.read).toBe("object");
			expect(typeof result.write).toBe("object");
			expect(typeof result.simulate).toBe("object");
			expect(typeof result.call).toBe("function");
		});

		it("exposes read methods by name for non-overloaded functions", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.read.name).toBe("function");
			expect(typeof result.read.symbol).toBe("function");
			expect(typeof result.read.decimals).toBe("function");
			expect(typeof result.read.balanceOf).toBe("function");
		});

		it("exposes read methods by signature", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.read["name()"]).toBe("function");
			expect(typeof result.read["symbol()"]).toBe("function");
			expect(typeof result.read["balanceOf(address)"]).toBe("function");
		});

		it("exposes write methods for nonpayable/payable functions", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.write.transfer).toBe("function");
			expect(typeof result.write.approve).toBe("function");
			expect(typeof result.write["transfer(address,uint256)"]).toBe("function");
		});

		it("provides call() for explicit signature-based access", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.call).toBe("function");
		});
	});

	describe("Overload handling", () => {
		it("only exposes signature keys for overloaded functions", async () => {
			const overloadedAbi: AbiItem[] = [
				{
					type: "function",
					name: "safeTransferFrom",
					inputs: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "tokenId", type: "uint256" },
					],
					outputs: [],
					stateMutability: "nonpayable",
				},
				{
					type: "function",
					name: "safeTransferFrom",
					inputs: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "tokenId", type: "uint256" },
						{ name: "data", type: "bytes" },
					],
					outputs: [],
					stateMutability: "nonpayable",
				},
			];

			const mockContract: ResolvedExplorerContract = {
				address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
				requestedAddress: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
				abi: overloadedAbi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(result.write.safeTransferFrom).toBeUndefined();
			expect(typeof result.write["safeTransferFrom(address,address,uint256)"]).toBe("function");
			expect(typeof result.write["safeTransferFrom(address,address,uint256,bytes)"]).toBe("function");
		});
	});

	describe("Resolution metadata", () => {
		it("preserves resolution mode in contract instance", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				requestedAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "etherscanV2" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(result.resolution.mode).toBe("verified");
			expect(result.resolution.source).toBe("etherscanV2");
		});

		it("preserves requestedAddress distinct from resolved address", async () => {
			const mockContract: ResolvedExplorerContract = {
				address: "0x1111111111111111111111111111111111111111",
				requestedAddress: "0x2222222222222222222222222222222222222222",
				abi: mockErc20Abi,
				resolution: { mode: "verified", source: "sourcify" },
			};

			const program = Effect.gen(function* () {
				const contract = yield* ExplorerContract("0x2222222222222222222222222222222222222222");
				return contract;
			}).pipe(
				Effect.provide(createMockExplorerService(mockContract)),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(result.address).toBe("0x1111111111111111111111111111111111111111");
			expect(result.requestedAddress).toBe("0x2222222222222222222222222222222222222222");
		});
	});

	describe("Error propagation", () => {
		it("propagates BlockExplorerNotFoundError", async () => {
			const mockShape: BlockExplorerApiShape = {
				getContract: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
				getAbi: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
				getSources: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
			};
			const mockLayer = Layer.succeed(BlockExplorerApiService, mockShape);

			const program = Effect.gen(function* () {
				return yield* ExplorerContract("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.provide(mockLayer),
				Effect.provide(mockChainLayer),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("can catch BlockExplorerNotFoundError with catchTag", async () => {
			const mockShape: BlockExplorerApiShape = {
				getContract: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
				getAbi: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
				getSources: (_address, _options) =>
					Effect.fail({
						_tag: "BlockExplorerNotFoundError",
						address: _address,
						attemptedSources: ["sourcify"],
						message: "Not found",
					} as const),
			};
			const mockLayer = Layer.succeed(BlockExplorerApiService, mockShape);

			const program = Effect.gen(function* () {
				return yield* ExplorerContract("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerNotFoundError", () =>
					Effect.succeed("caught"),
				),
				Effect.provide(mockLayer),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("caught");
		});
	});
});
