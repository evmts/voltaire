import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
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
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(1);
			}).pipe(Effect.provide(mainnet))
		);

		it.effect("provides correct chain name", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.name).toBe("Ethereum");
			}).pipe(Effect.provide(mainnet))
		);

		it.effect("provides correct native currency", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.nativeCurrency).toEqual({ name: "Ether", symbol: "ETH", decimals: 18 });
			}).pipe(Effect.provide(mainnet))
		);

		it.effect("provides multicall3 contract address", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.contracts?.multicall3?.address).toBe("0xca11bde05977b3631167028862be2a173976ca11");
				expect(chain.contracts?.multicall3?.blockCreated).toBe(14_353_601);
			}).pipe(Effect.provide(mainnet))
		);

		it.effect("provides block explorer", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.blockExplorers?.default?.name).toBe("Etherscan");
				expect(chain.blockExplorers?.default?.url).toBe("https://etherscan.io");
			}).pipe(Effect.provide(mainnet))
		);

		it("has correct block time", () => {
			expect(mainnetConfig.blockTime).toBe(12_000);
		});

		it("is not a testnet", () => {
			expect(mainnetConfig.testnet).toBeUndefined();
		});
	});

	describe("sepolia", () => {
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(11_155_111);
			}).pipe(Effect.provide(sepolia))
		);

		it.effect("is marked as testnet", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.testnet).toBe(true);
			}).pipe(Effect.provide(sepolia))
		);

		it("has correct native currency", () => {
			expect(sepoliaConfig.nativeCurrency).toEqual({
				name: "Sepolia Ether",
				symbol: "ETH",
				decimals: 18,
			});
		});
	});

	describe("arbitrum", () => {
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(42_161);
			}).pipe(Effect.provide(arbitrum))
		);

		it("has fast block time", () => {
			expect(arbitrumConfig.blockTime).toBe(250);
		});

		it("provides Arbiscan explorer", () => {
			expect(arbitrumConfig.blockExplorers?.default.name).toBe("Arbiscan");
			expect(arbitrumConfig.blockExplorers?.default.url).toBe("https://arbiscan.io");
		});
	});

	describe("base", () => {
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(8453);
			}).pipe(Effect.provide(base))
		);

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
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(10);
			}).pipe(Effect.provide(optimism))
		);

		it("has correct chain name", () => {
			expect(optimismConfig.name).toBe("OP Mainnet");
		});

		it("has multicall3 contract", () => {
			expect(optimismConfig.contracts?.multicall3?.blockCreated).toBe(4_286_263);
		});
	});

	describe("polygon", () => {
		it.effect("provides correct chain ID", () =>
			Effect.gen(function* () {
				const chain = yield* ChainService;
				expect(chain.id).toBe(137);
			}).pipe(Effect.provide(polygon))
		);

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
		it.effect("allows creating custom chain layer", () =>
			Effect.gen(function* () {
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

				const result = yield* program;
				expect(result).toEqual({ id: 99999, name: "Custom Chain" });
			})
		);
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
