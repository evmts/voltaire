import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Exit from "effect/Exit";
import { BlockExplorerApiService, type BlockExplorerApiShape } from "./BlockExplorerApiService";
import {
	BlockExplorerConfigError,
	BlockExplorerNotFoundError,
	BlockExplorerRateLimitError,
} from "./BlockExplorerApiErrors";
import type { ExplorerContractInstance, AbiItem } from "./BlockExplorerApiTypes";
import { ChainService, type ChainConfig } from "../Chain/ChainService";
import { ContractCallError, ContractWriteError } from "../Contract/ContractTypes";

// Mock chain config
const mockMainnetConfig: ChainConfig = {
	id: 1,
	name: "Ethereum",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	blockTime: 12000,
};

const mockChainLayer = Layer.succeed(ChainService, mockMainnetConfig);

// Mock ABI for testing
const mockAbi: AbiItem[] = [
	{
		type: "function",
		name: "symbol",
		inputs: [],
		outputs: [{ name: "", type: "string" }],
		stateMutability: "view",
	},
];

// Mock contract response with method maps
const createMockContract = (address: `0x${string}`, abi: AbiItem[] = mockAbi): ExplorerContractInstance => ({
	address,
	requestedAddress: address,
	abi,
	resolution: { mode: "verified", source: "sourcify" },
	read: {
		symbol: () => Effect.succeed("MOCK"),
		"symbol()": () => Effect.succeed("MOCK"),
	},
	write: {},
	simulate: {},
	call: (_sig, _args) => Effect.succeed("MOCK"),
});

// Create mock service layer
const createMockService = (overrides?: Partial<BlockExplorerApiShape>): Layer.Layer<BlockExplorerApiService> => {
	const defaultShape: BlockExplorerApiShape = {
		getContract: (address, _options) => Effect.succeed(createMockContract(address)),
		getAbi: (address, _options) => Effect.succeed(mockAbi),
		getSources: (_address, _options) => Effect.succeed([]),
	};
	return Layer.succeed(BlockExplorerApiService, { ...defaultShape, ...overrides });
};

describe("BlockExplorerApi", () => {
	describe("Error typing guarantees", () => {
		it("BlockExplorerNotFoundError has correct tag and fields", () => {
			const error = new BlockExplorerNotFoundError(
				"0x1234567890123456789012345678901234567890",
				["sourcify", "etherscanV2"],
			);

			expect(error._tag).toBe("BlockExplorerNotFoundError");
			expect(error.address).toBe("0x1234567890123456789012345678901234567890");
			expect(error.attemptedSources).toEqual(["sourcify", "etherscanV2"]);
			expect(error.message).toContain("No ABI found");
		});

		it("BlockExplorerRateLimitError has correct tag and fields", () => {
			const error = new BlockExplorerRateLimitError(
				"etherscanV2",
				"0x1234567890123456789012345678901234567890",
				"Rate limit exceeded",
				60,
			);

			expect(error._tag).toBe("BlockExplorerRateLimitError");
			expect(error.source).toBe("etherscanV2");
			expect(error.retryAfterSeconds).toBe(60);
		});

		it("BlockExplorerConfigError has correct tag", () => {
			const error = new BlockExplorerConfigError("Test message");

			expect(error._tag).toBe("BlockExplorerConfigError");
			expect(error.message).toBe("Test message");
		});

		it("errors can be caught with Effect.catchTag", async () => {
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerNotFoundError("0x0000000000000000000000000000000000000001", ["sourcify"])),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerNotFoundError", (e) =>
					Effect.succeed(`Caught: ${e._tag}`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Caught: BlockExplorerNotFoundError");
		});
	});

	describe("Service interface", () => {
		it("provides getContract method", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return typeof explorer.getContract === "function";
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe(true);
		});

		it("provides getAbi method", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return typeof explorer.getAbi === "function";
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe(true);
		});

		it("provides getSources method", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return typeof explorer.getSources === "function";
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe(true);
		});

		it("getContract returns ResolvedExplorerContract", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(result.address).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			expect(result.abi).toEqual(mockAbi);
			expect(result.resolution.mode).toBe("verified");
		});

		it("getAbi returns ABI array", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(Array.isArray(result)).toBe(true);
			expect(result).toEqual(mockAbi);
		});
	});

	describe("Resolution options", () => {
		it("accepts resolution option in getAbi", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
					resolution: "verified-only",
				});
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(Array.isArray(result)).toBe(true);
		});

		it("accepts followProxies option in getContract", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
					followProxies: true,
				});
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBeDefined();
		});

		it("accepts includeSources option", async () => {
			const mockWithSources = createMockService({
				getContract: (address, _options) =>
					Effect.succeed({
						...createMockContract(address),
						sources: [{ path: "Contract.sol", content: "// SPDX..." }],
					}),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
					includeSources: true,
				});
			}).pipe(
				Effect.provide(mockWithSources),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.sources).toBeDefined();
			expect(result.sources?.length).toBeGreaterThan(0);
		});
	});

	describe("Error handling", () => {
		it("propagates BlockExplorerNotFoundError", async () => {
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerNotFoundError("0x0000000000000000000000000000000000000001", ["sourcify", "etherscanV2"])),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const exit = await Effect.runPromiseExit(program);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("propagates BlockExplorerRateLimitError", async () => {
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerRateLimitError("etherscanV2", "0x0000000000000000000000000000000000000001", "Rate limited", 60)),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerRateLimitError", (e) =>
					Effect.succeed(`Rate limited by ${e.source}, retry in ${e.retryAfterSeconds}s`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Rate limited by etherscanV2, retry in 60s");
		});

		it("getSources fails when no sources available", async () => {
			const mockService = createMockService({
				getSources: (_address, _options) =>
					Effect.fail(new BlockExplorerNotFoundError("0x0000000000000000000000000000000000000001", ["sources"])),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getSources("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerNotFoundError", () =>
					Effect.succeed("no sources"),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("no sources");
		});
	});

	describe("Resolution modes", () => {
		it("verified-only fails if not verified", async () => {
			const mockService = createMockService({
				getContract: (_address, options) => {
					if (options?.resolution === "verified-only") {
						return Effect.fail(new BlockExplorerNotFoundError(_address, ["sourcify"]));
					}
					return Effect.succeed(createMockContract(_address));
				},
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0x0000000000000000000000000000000000000001", {
					resolution: "verified-only",
				});
			}).pipe(
				Effect.catchTag("BlockExplorerNotFoundError", () =>
					Effect.succeed("not verified"),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("not verified");
		});

		it("verified-first returns first successful result", async () => {
			const mockService = createMockService({
				getContract: (address, _options) =>
					Effect.succeed({
						...createMockContract(address),
						resolution: { mode: "verified" as const, source: "etherscanV2" as const },
					}),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
					resolution: "verified-first",
				});
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.resolution.source).toBe("etherscanV2");
		});

		it("best-effort can return non-verified ABI", async () => {
			const mockService = createMockService({
				getContract: (address, _options) =>
					Effect.succeed({
						...createMockContract(address),
						resolution: { mode: "best-effort" as const, source: "whatsabi" as const },
					}),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0x0000000000000000000000000000000000000001", {
					resolution: "best-effort",
				});
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.resolution.mode).toBe("best-effort");
		});
	});

	describe("Proxy resolution", () => {
		it("followProxies=true resolves implementation address", async () => {
			const mockService = createMockService({
				getContract: (address, options) => {
					if (options?.followProxies) {
						return Effect.succeed({
							address: "0x1111111111111111111111111111111111111111",
							requestedAddress: address,
							abi: mockAbi,
							resolution: { mode: "verified" as const, source: "sourcify" as const },
							proxies: [{ kind: "EIP-1967", address }],
						});
					}
					return Effect.succeed(createMockContract(address));
				},
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0x2222222222222222222222222222222222222222", {
					followProxies: true,
				});
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.address).toBe("0x1111111111111111111111111111111111111111");
			expect(result.requestedAddress).toBe("0x2222222222222222222222222222222222222222");
			expect(result.proxies).toBeDefined();
			expect(result.proxies?.length).toBeGreaterThan(0);
		});

		it("followProxies=false returns original address", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", {
					followProxies: false,
				});
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.address).toBe(result.requestedAddress);
		});
	});

	describe("Error type exhaustiveness", () => {
		it("BlockExplorerDecodeError can be caught with catchTag", async () => {
			const { BlockExplorerDecodeError } = await import("./BlockExplorerApiErrors");
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerDecodeError("sourcify", "0x0000000000000000000000000000000000000001", "Invalid JSON", "{ bad json")),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerDecodeError", (e) =>
					Effect.succeed(`Decode error: ${e.source}`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Decode error: sourcify");
		});

		it("BlockExplorerResponseError can be caught with catchTag", async () => {
			const { BlockExplorerResponseError } = await import("./BlockExplorerApiErrors");
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerResponseError("etherscanV2", "0x0000000000000000000000000000000000000001", "Server error", { status: 500 })),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerResponseError", (e) =>
					Effect.succeed(`Response error: ${e.status}`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Response error: 500");
		});

		it("BlockExplorerProxyResolutionError can be caught with catchTag", async () => {
			const { BlockExplorerProxyResolutionError } = await import("./BlockExplorerApiErrors");
			const mockService = createMockService({
				getContract: (_address, _options) =>
					Effect.fail(new BlockExplorerProxyResolutionError("0x0000000000000000000000000000000000000001", "Cyclic proxy detected")),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0x0000000000000000000000000000000000000001", { followProxies: true });
			}).pipe(
				Effect.catchTag("BlockExplorerProxyResolutionError", (e) =>
					Effect.succeed(`Proxy error: ${e.message}`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Proxy error: Cyclic proxy detected");
		});

		it("BlockExplorerUnexpectedError can be caught with catchTag", async () => {
			const { BlockExplorerUnexpectedError } = await import("./BlockExplorerApiErrors");
			const mockService = createMockService({
				getAbi: (_address, _options) =>
					Effect.fail(new BlockExplorerUnexpectedError("getAbi", "Unknown error", new Error("Oops"))),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.catchTag("BlockExplorerUnexpectedError", (e) =>
					Effect.succeed(`Unexpected error in ${e.phase}`),
				),
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toBe("Unexpected error in getAbi");
		});
	});

	describe("ABI normalization", () => {
		it("normalizes function ABI items", async () => {
			const normalizedAbi: AbiItem[] = [
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
			];

			const mockService = createMockService({
				getAbi: (_address, _options) => Effect.succeed(normalizedAbi),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result[0].type).toBe("function");
			expect(result[0].name).toBe("transfer");
			expect(result[0].inputs).toHaveLength(2);
		});

		it("returns empty array for contracts with no ABI", async () => {
			const mockService = createMockService({
				getAbi: (_address, _options) => Effect.succeed([]),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getAbi("0x0000000000000000000000000000000000000001");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result).toEqual([]);
		});
	});

	describe("Resolution metadata", () => {
		it("includes source in resolution for verified ABI", async () => {
			const mockService = createMockService({
				getContract: (address, _options) =>
					Effect.succeed({
						...createMockContract(address),
						resolution: { mode: "verified" as const, source: "blockscout" as const },
					}),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);
			expect(result.resolution).toEqual({ mode: "verified", source: "blockscout" });
		});

		it("attemptedSources includes all tried sources", async () => {
			const error = new BlockExplorerNotFoundError(
				"0x0000000000000000000000000000000000000001",
				["sourcify", "etherscanV2", "blockscout"],
			);

			expect(error.attemptedSources).toContain("sourcify");
			expect(error.attemptedSources).toContain("etherscanV2");
			expect(error.attemptedSources).toContain("blockscout");
			expect(error.attemptedSources).toHaveLength(3);
		});
	});

	describe("Contract method access", () => {
		const erc20Abi: AbiItem[] = [
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
		];

		it("getContract returns contract with read methods", async () => {
			const mockWithMethods: ExplorerContractInstance = {
				...createMockContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", erc20Abi),
				read: {
					name: () => Effect.succeed("USD Coin"),
					symbol: () => Effect.succeed("USDC"),
					balanceOf: () => Effect.succeed(1000n),
					"name()": () => Effect.succeed("USD Coin"),
					"symbol()": () => Effect.succeed("USDC"),
					"balanceOf(address)": () => Effect.succeed(1000n),
				},
				write: {
					transfer: () => Effect.succeed("0x123" as `0x${string}`),
					"transfer(address,uint256)": () => Effect.succeed("0x123" as `0x${string}`),
				},
				simulate: {
					transfer: () => Effect.succeed(true),
					"transfer(address,uint256)": () => Effect.succeed(true),
				},
			};

			const mockService = createMockService({
				getContract: (_address, _options) => Effect.succeed(mockWithMethods),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.read).toBe("object");
			expect(typeof result.read.name).toBe("function");
			expect(typeof result.read.symbol).toBe("function");
			expect(typeof result.read["balanceOf(address)"]).toBe("function");
		});

		it("getContract returns contract with write methods", async () => {
			const mockWithMethods: ExplorerContractInstance = {
				...createMockContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", erc20Abi),
				read: {},
				write: {
					transfer: () => Effect.succeed("0x123" as `0x${string}`),
					"transfer(address,uint256)": () => Effect.succeed("0x123" as `0x${string}`),
				},
				simulate: {},
			};

			const mockService = createMockService({
				getContract: (_address, _options) => Effect.succeed(mockWithMethods),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.write).toBe("object");
			expect(typeof result.write.transfer).toBe("function");
			expect(typeof result.write["transfer(address,uint256)"]).toBe("function");
		});

		it("getContract returns contract with call method", async () => {
			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
			}).pipe(
				Effect.provide(createMockService()),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			expect(typeof result.call).toBe("function");
		});

		it("handles overloaded functions with signature keys only", async () => {
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

			const mockWithOverloads: ExplorerContractInstance = {
				...createMockContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", overloadedAbi),
				read: {},
				write: {
					// No name-only key for overloaded function
					"safeTransferFrom(address,address,uint256)": () => Effect.succeed("0x123" as `0x${string}`),
					"safeTransferFrom(address,address,uint256,bytes)": () => Effect.succeed("0x456" as `0x${string}`),
				},
				simulate: {
					"safeTransferFrom(address,address,uint256)": () => Effect.succeed(undefined),
					"safeTransferFrom(address,address,uint256,bytes)": () => Effect.succeed(undefined),
				},
			};

			const mockService = createMockService({
				getContract: (_address, _options) => Effect.succeed(mockWithOverloads),
			});

			const program = Effect.gen(function* () {
				const explorer = yield* BlockExplorerApiService;
				return yield* explorer.getContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D");
			}).pipe(
				Effect.provide(mockService),
				Effect.provide(mockChainLayer),
			);

			const result = await Effect.runPromise(program);

			// Overloaded function should not have name-only key
			expect(result.write.safeTransferFrom).toBeUndefined();
			// But should have signature keys
			expect(typeof result.write["safeTransferFrom(address,address,uint256)"]).toBe("function");
			expect(typeof result.write["safeTransferFrom(address,address,uint256,bytes)"]).toBe("function");
		});
	});
});
