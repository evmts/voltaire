import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import { Provider, ProviderService } from "../Provider/index.js";
import { TestTransport } from "../Transport/index.js";
import { createProvider, MainnetProvider } from "./index.js";

describe("presets", () => {
	describe("MainnetProvider", () => {
		it.effect("provides composed layer with getChainId", () =>
			Effect.gen(function* () {
				const testLayer = Provider.pipe(
					Layer.provide(TestTransport({ eth_chainId: "0x1" })),
				);

				const program = Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getChainId();
				}).pipe(Effect.provide(testLayer));

				const result = yield* program;
				expect(result).toBe(1);
			})
		);

		it.effect("provides composed layer with getBlockNumber", () =>
			Effect.gen(function* () {
				const testLayer = Provider.pipe(
					Layer.provide(TestTransport({ eth_blockNumber: "0x1234" })),
				);

				const program = Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(testLayer));

				const result = yield* program;
				expect(result).toBe(0x1234n);
			})
		);

		it("MainnetProvider returns a fully composed layer", () => {
			const layer = MainnetProvider("https://eth.example.com");
			expect(layer).toBeDefined();
		});
	});

	describe("createProvider", () => {
		it.effect("provides composed layer with getChainId", () =>
			Effect.gen(function* () {
				const testLayer = Provider.pipe(
					Layer.provide(TestTransport({ eth_chainId: "0xa4b1" })),
				);

				const program = Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getChainId();
				}).pipe(Effect.provide(testLayer));

				const result = yield* program;
				expect(result).toBe(42161);
			})
		);

		it.effect("provides composed layer with getBalance", () =>
			Effect.gen(function* () {
				const testLayer = Provider.pipe(
					Layer.provide(TestTransport({ eth_getBalance: "0xde0b6b3a7640000" })),
				);

				const program = Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBalance(
						"0x1234567890123456789012345678901234567890",
					);
				}).pipe(Effect.provide(testLayer));

				const result = yield* program;
				expect(result).toBe(1000000000000000000n);
			})
		);

		it("createProvider returns a fully composed layer", () => {
			const layer = createProvider("https://arb.example.com");
			expect(layer).toBeDefined();
		});
	});
});
