import { describe, expect, it } from "@effect/vitest";
import * as Cause from "effect/Cause";
import * as Chunk from "effect/Chunk";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { TransportError } from "../../Transport/TransportError.js";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { addChain, type ChainConfig } from "./addChain.js";

const polygonChain: ChainConfig = {
	id: 137,
	name: "Polygon",
	nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
	rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
	blockExplorers: {
		default: { name: "Polygonscan", url: "https://polygonscan.com" },
	},
};

const minimalChain: ChainConfig = {
	id: 42161,
	name: "Arbitrum",
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
};

describe("addChain", () => {
	it("sends wallet_addEthereumChain request with correct params", async () => {
		let capturedMethod: string | undefined;
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(
				method: string,
				params?: unknown[],
			): Effect.Effect<T, never> => {
				capturedMethod = method;
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const program = addChain(polygonChain);

		await Effect.runPromise(Effect.provide(program, TestLayer));

		expect(capturedMethod).toBe("wallet_addEthereumChain");
		expect(capturedParams).toBeDefined();

		const params = capturedParams?.[0] as {
			chainId: string;
			chainName: string;
			nativeCurrency: { name: string; symbol: string; decimals: number };
			rpcUrls: string[];
			blockExplorerUrls?: string[];
		};

		expect(params.chainId).toBe("0x89"); // 137 in hex
		expect(params.chainName).toBe("Polygon");
		expect(params.nativeCurrency).toEqual({
			name: "MATIC",
			symbol: "MATIC",
			decimals: 18,
		});
		expect(params.rpcUrls).toEqual(["https://polygon-rpc.com"]);
		expect(params.blockExplorerUrls).toEqual(["https://polygonscan.com"]);
	});

	it("works without block explorers", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(
				_method: string,
				params?: unknown[],
			): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const program = addChain(minimalChain);

		await Effect.runPromise(Effect.provide(program, TestLayer));

		const params = capturedParams?.[0] as { blockExplorerUrls?: string[] };
		expect(params.blockExplorerUrls).toBeUndefined();
	});

	it("converts chain ID to hex correctly", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(
				_method: string,
				params?: unknown[],
			): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const mainnetChain: ChainConfig = {
			id: 1,
			name: "Ethereum",
			nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
			rpcUrls: { default: { http: ["https://eth.merkle.io"] } },
		};

		await Effect.runPromise(Effect.provide(addChain(mainnetChain), TestLayer));

		const params = capturedParams?.[0] as { chainId: string };
		expect(params.chainId).toBe("0x1");
	});

	it("handles user rejection errors", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError({
						code: 4001,
						message: "User rejected the request",
					}),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const program = addChain(polygonChain);

		const result = await Effect.runPromiseExit(
			Effect.provide(program, TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("User rejected the request");
			const failures = Cause.failures(result.cause);
			const firstFailure = Chunk.head(failures);
			expect(Option.isSome(firstFailure) && firstFailure.value.code).toBe(4001);
		}
	});

	it("handles non-rejection transport errors", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError({ code: -32000, message: "RPC error" }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(addChain(polygonChain), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to add chain");
			const failures = Cause.failures(result.cause);
			const firstFailure = Chunk.head(failures);
			expect(Option.isSome(firstFailure) && firstFailure.value.code).toBe(
				-32000,
			);
		}
	});
});
