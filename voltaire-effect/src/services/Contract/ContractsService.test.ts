import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	ContractRegistryService,
	makeContractRegistry,
	type ContractFactory,
	type ContractRegistryConfig,
	type InferContractRegistry,
} from "./ContractsService.js";
import { ProviderService } from "../Provider/index.js";
import type { ContractInstance } from "./ContractTypes.js";

const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ type: "address", name: "account" }],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ type: "address", name: "to" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "approve",
		inputs: [
			{ type: "address", name: "spender" },
			{ type: "uint256", name: "amount" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ type: "address", indexed: true, name: "from" },
			{ type: "address", indexed: true, name: "to" },
			{ type: "uint256", indexed: false, name: "value" },
		],
	},
] as const;

const wethAbi = [
	...erc20Abi,
	{
		type: "function",
		name: "deposit",
		inputs: [],
		outputs: [],
		stateMutability: "payable",
	},
	{
		type: "function",
		name: "withdraw",
		inputs: [{ type: "uint256", name: "wad" }],
		outputs: [],
		stateMutability: "nonpayable",
	},
] as const;

// Mock provider that returns encoded responses
const MockProvider = Layer.succeed(ProviderService, {
	request: <T>(method: string, _params?: unknown[]) => {
		if (method === "eth_call") {
			// Return encoded uint256(1000)
			return Effect.succeed(
				"0x00000000000000000000000000000000000000000000000000000000000003e8" as T,
			);
		}
		return Effect.succeed(null as T);
	},
});

describe("ContractRegistryService", () => {
	// Composed test layer to avoid chained Effect.provide anti-pattern
	const createTestLayer = (Contracts: ReturnType<typeof makeContractRegistry>) =>
		Layer.merge(Contracts, MockProvider);

	describe("makeContractRegistry", () => {
		it("creates registry with addressed contracts", async () => {
			const config = {
				USDC: {
					abi: erc20Abi,
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
				},
				WETH: {
					abi: wethAbi,
					address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const,
				},
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				expect(contracts.USDC).toBeDefined();
				expect(contracts.WETH).toBeDefined();
				// Addressed contracts should have read/write methods
				const usdc = contracts.USDC as ContractInstance<typeof erc20Abi>;
				expect(usdc.read).toBeDefined();
				expect(usdc.read.balanceOf).toBeDefined();
				expect(usdc.write).toBeDefined();
				expect(usdc.write.transfer).toBeDefined();
				expect(usdc.simulate).toBeDefined();
				expect(usdc.getEvents).toBeDefined();
				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});

		it("creates registry with factory contracts (no address)", async () => {
			const config = {
				ERC20: { abi: erc20Abi },
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				expect(contracts.ERC20).toBeDefined();
				// Factory contracts should have at() method
				const factory = contracts.ERC20 as ContractFactory<typeof erc20Abi>;
				expect(factory.at).toBeDefined();
				expect(typeof factory.at).toBe("function");
				expect(factory.abi).toEqual(erc20Abi);
				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});

		it("creates registry with mixed addressed and factory contracts", async () => {
			const config = {
				USDC: {
					abi: erc20Abi,
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
				},
				ERC20: { abi: erc20Abi }, // factory - no address
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;

				// USDC should be a full instance
				const usdc = contracts.USDC as ContractInstance<typeof erc20Abi>;
				expect(usdc.read).toBeDefined();
				expect(usdc.address).toBeDefined();

				// ERC20 should be a factory
				const factory = contracts.ERC20 as ContractFactory<typeof erc20Abi>;
				expect(factory.at).toBeDefined();
				expect(factory.abi).toBeDefined();

				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});

		it("factory.at creates contract instance", async () => {
			const config = {
				ERC20: { abi: erc20Abi },
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				const factory = contracts.ERC20 as ContractFactory<typeof erc20Abi>;
				const token = yield* factory.at(
					"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				);
				expect(token.read).toBeDefined();
				expect(token.read.balanceOf).toBeDefined();
				expect(token.write).toBeDefined();
				expect(token.address).toBeDefined();
				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});

		it("addressed contract read methods work", async () => {
			const config = {
				USDC: {
					abi: erc20Abi,
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
				},
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				const usdc = contracts.USDC as ContractInstance<typeof erc20Abi>;
				const balance = yield* usdc.read.balanceOf(
					"0x1234567890123456789012345678901234567890",
				);
				expect(balance).toBe(1000n);
				return balance;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(1000n);
		});

		it("factory-created contract read methods work", async () => {
			const config = {
				ERC20: { abi: erc20Abi },
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				const factory = contracts.ERC20 as ContractFactory<typeof erc20Abi>;
				const token = yield* factory.at(
					"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
				);
				const balance = yield* token.read.balanceOf(
					"0x1234567890123456789012345678901234567890",
				);
				expect(balance).toBe(1000n);
				return balance;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(1000n);
		});

		it("handles empty config", async () => {
			const config = {} as const;
			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				expect(Object.keys(contracts)).toHaveLength(0);
				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});

		it("each contract instance is independent", async () => {
			const config = {
				TokenA: {
					abi: erc20Abi,
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
				},
				TokenB: {
					abi: erc20Abi,
					address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const,
				},
			} as const;

			const Contracts = makeContractRegistry(config);

			const program = Effect.gen(function* () {
				const contracts = yield* ContractRegistryService;
				const tokenA = contracts.TokenA as ContractInstance<typeof erc20Abi>;
				const tokenB = contracts.TokenB as ContractInstance<typeof erc20Abi>;

				// They should be different instances
				expect(tokenA).not.toBe(tokenB);
				expect(tokenA.address).not.toEqual(tokenB.address);
				return true;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(createTestLayer(Contracts))),
			);
			expect(result).toBe(true);
		});
	});

	describe("type inference", () => {
		it("InferContractRegistry type works correctly", () => {
			const config = {
				USDC: {
					abi: erc20Abi,
					address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
				},
				ERC20: { abi: erc20Abi },
			} as const;

			// This is a compile-time check - if it compiles, the types work
			type Registry = InferContractRegistry<typeof config>;

			// Type assertions (these are compile-time checks)
			const _checkUsdc: Registry["USDC"] extends ContractInstance<
				typeof erc20Abi
			>
				? true
				: false = true;
			const _checkErc20: Registry["ERC20"] extends ContractFactory<
				typeof erc20Abi
			>
				? true
				: false = true;

			expect(_checkUsdc).toBe(true);
			expect(_checkErc20).toBe(true);
		});

		it("ContractRegistryConfig type is correctly constrained", () => {
			// Valid config
			const validConfig: ContractRegistryConfig = {
				Token: { abi: erc20Abi },
				TokenWithAddress: {
					abi: erc20Abi,
					address: "0x1234567890123456789012345678901234567890",
				},
			};

			expect(validConfig.Token.abi).toBeDefined();
			expect(validConfig.TokenWithAddress.address).toBeDefined();
		});
	});
});
