import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { ChainService, type ChainConfig } from "./ChainService.js";
import {
	mainnet,
	mainnetConfig,
	sepolia,
	sepoliaConfig,
	arbitrum,
	arbitrumConfig,
	base,
	baseConfig,
	optimism,
	optimismConfig,
	polygon,
	polygonConfig,
} from "./chains/index.js";

describe("ChainService", () => {
	describe("mainnet", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(mainnet));

			const result = await Effect.runPromise(program);
			expect(result).toBe(1);
		});

		it("provides correct chain name", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.name;
			}).pipe(Effect.provide(mainnet));

			const result = await Effect.runPromise(program);
			expect(result).toBe("Ethereum");
		});

		it("provides correct native currency", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.nativeCurrency;
			}).pipe(Effect.provide(mainnet));

			const result = await Effect.runPromise(program);
			expect(result).toEqual({ name: "Ether", symbol: "ETH", decimals: 18 });
		});

		it("provides multicall3 contract address", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.contracts?.multicall3;
			}).pipe(Effect.provide(mainnet));

			const result = await Effect.runPromise(program);
			expect(result?.address).toBe("0xca11bde05977b3631167028862be2a173976ca11");
			expect(result?.blockCreated).toBe(14_353_601);
		});

		it("provides block explorer", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.blockExplorers?.default;
			}).pipe(Effect.provide(mainnet));

			const result = await Effect.runPromise(program);
			expect(result?.name).toBe("Etherscan");
			expect(result?.url).toBe("https://etherscan.io");
		});

		it("has correct block time", () => {
			expect(mainnetConfig.blockTime).toBe(12_000);
		});

		it("is not a testnet", () => {
			expect(mainnetConfig.testnet).toBeUndefined();
		});
	});

	describe("sepolia", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(sepolia));

			const result = await Effect.runPromise(program);
			expect(result).toBe(11_155_111);
		});

		it("is marked as testnet", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.testnet;
			}).pipe(Effect.provide(sepolia));

			const result = await Effect.runPromise(program);
			expect(result).toBe(true);
		});

		it("has correct native currency", () => {
			expect(sepoliaConfig.nativeCurrency).toEqual({
				name: "Sepolia Ether",
				symbol: "ETH",
				decimals: 18,
			});
		});
	});

	describe("arbitrum", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(arbitrum));

			const result = await Effect.runPromise(program);
			expect(result).toBe(42_161);
		});

		it("has fast block time", () => {
			expect(arbitrumConfig.blockTime).toBe(250);
		});

		it("provides Arbiscan explorer", () => {
			expect(arbitrumConfig.blockExplorers?.default.name).toBe("Arbiscan");
			expect(arbitrumConfig.blockExplorers?.default.url).toBe("https://arbiscan.io");
		});
	});

	describe("base", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(base));

			const result = await Effect.runPromise(program);
			expect(result).toBe(8453);
		});

		it("has 2 second block time", () => {
			expect(baseConfig.blockTime).toBe(2_000);
		});

		it("has multicall3 contract", () => {
			expect(baseConfig.contracts?.multicall3?.address).toBe(
				"0xca11bde05977b3631167028862be2a173976ca11",
			);
		});
	});

	describe("optimism", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(optimism));

			const result = await Effect.runPromise(program);
			expect(result).toBe(10);
		});

		it("has correct chain name", () => {
			expect(optimismConfig.name).toBe("OP Mainnet");
		});

		it("has multicall3 contract", () => {
			expect(optimismConfig.contracts?.multicall3?.blockCreated).toBe(4_286_263);
		});
	});

	describe("polygon", () => {
		it("provides correct chain ID", async () => {
			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return chain.id;
			}).pipe(Effect.provide(polygon));

			const result = await Effect.runPromise(program);
			expect(result).toBe(137);
		});

		it("has POL as native currency", () => {
			expect(polygonConfig.nativeCurrency).toEqual({
				name: "POL",
				symbol: "POL",
				decimals: 18,
			});
		});

		it("has PolygonScan explorer", () => {
			expect(polygonConfig.blockExplorers?.default.name).toBe("PolygonScan");
		});
	});

	describe("custom chain", () => {
		it("allows creating custom chain layer", async () => {
			const customConfig: ChainConfig = {
				id: 99999,
				name: "Custom Chain",
				nativeCurrency: { name: "Custom", symbol: "CUST", decimals: 18 },
				blockTime: 1_000,
				rpcUrls: { default: { http: ["https://rpc.custom.io"] } },
			};

			const customChain = Layer.succeed(ChainService, customConfig);

			const program = Effect.gen(function* () {
				const chain = yield* ChainService;
				return { id: chain.id, name: chain.name };
			}).pipe(Effect.provide(customChain));

			const result = await Effect.runPromise(program);
			expect(result).toEqual({ id: 99999, name: "Custom Chain" });
		});
	});

	describe("config exports", () => {
		it("exports mainnetConfig", () => {
			expect(mainnetConfig).toBeDefined();
			expect(mainnetConfig.id).toBe(1);
		});

		it("exports sepoliaConfig", () => {
			expect(sepoliaConfig).toBeDefined();
			expect(sepoliaConfig.id).toBe(11_155_111);
		});

		it("exports arbitrumConfig", () => {
			expect(arbitrumConfig).toBeDefined();
			expect(arbitrumConfig.id).toBe(42_161);
		});

		it("exports baseConfig", () => {
			expect(baseConfig).toBeDefined();
			expect(baseConfig.id).toBe(8453);
		});

		it("exports optimismConfig", () => {
			expect(optimismConfig).toBeDefined();
			expect(optimismConfig.id).toBe(10);
		});

		it("exports polygonConfig", () => {
			expect(polygonConfig).toBeDefined();
			expect(polygonConfig.id).toBe(137);
		});
	});

	describe("all chains have multicall3", () => {
		const chains = [
			{ name: "mainnet", config: mainnetConfig },
			{ name: "sepolia", config: sepoliaConfig },
			{ name: "arbitrum", config: arbitrumConfig },
			{ name: "base", config: baseConfig },
			{ name: "optimism", config: optimismConfig },
			{ name: "polygon", config: polygonConfig },
		];

		for (const { name, config } of chains) {
			it(`${name} has multicall3 at standard address`, () => {
				expect(config.contracts?.multicall3?.address.toLowerCase()).toBe(
					"0xca11bde05977b3631167028862be2a173976ca11",
				);
			});
		}
	});

	describe("all chains have valid block explorers", () => {
		const chains = [
			{ name: "mainnet", config: mainnetConfig },
			{ name: "sepolia", config: sepoliaConfig },
			{ name: "arbitrum", config: arbitrumConfig },
			{ name: "base", config: baseConfig },
			{ name: "optimism", config: optimismConfig },
			{ name: "polygon", config: polygonConfig },
		];

		for (const { name, config } of chains) {
			it(`${name} has block explorer with valid URL`, () => {
				expect(config.blockExplorers?.default.url).toMatch(/^https:\/\//);
			});
		}
	});
});
