import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { TransportError } from "../../Transport/TransportError.js";
import { watchAsset, type WatchAssetParams } from "./watchAsset.js";

const usdcAsset: WatchAssetParams = {
	type: "ERC20",
	options: {
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		symbol: "USDC",
		decimals: 6,
		image: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
	},
};

const minimalAsset: WatchAssetParams = {
	type: "ERC20",
	options: {
		address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		symbol: "USDT",
		decimals: 6,
	},
};

describe("watchAsset", () => {
	it("sends wallet_watchAsset request with correct params", async () => {
		let capturedMethod: string | undefined;
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedMethod = method;
				capturedParams = params;
				return Effect.succeed(true as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(watchAsset(usdcAsset), TestLayer),
		);

		expect(result).toBe(true);
		expect(capturedMethod).toBe("wallet_watchAsset");
		expect(capturedParams).toBeDefined();

		const params = capturedParams![0] as {
			type: string;
			options: {
				address: string;
				symbol: string;
				decimals: number;
				image?: string;
			};
		};

		expect(params.type).toBe("ERC20");
		expect(params.options.address).toBe(
			"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		);
		expect(params.options.symbol).toBe("USDC");
		expect(params.options.decimals).toBe(6);
		expect(params.options.image).toBe(
			"https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
		);
	});

	it("works without image", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(_method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed(true as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		await Effect.runPromise(
			Effect.provide(watchAsset(minimalAsset), TestLayer),
		);

		const params = capturedParams![0] as {
			options: { image?: string };
		};
		expect(params.options.image).toBeUndefined();
	});

	it("returns false when user rejects", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> => Effect.succeed(false as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(watchAsset(usdcAsset), TestLayer),
		);

		expect(result).toBe(false);
	});

	it("handles transport errors", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("User rejected the request", { code: 4001 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(watchAsset(usdcAsset), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to watch asset");
		}
	});

	it("handles unsupported asset type error", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("Asset type not supported", { code: -32602 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(watchAsset(usdcAsset), TestLayer),
		);

		expect(result._tag).toBe("Failure");
	});
});
