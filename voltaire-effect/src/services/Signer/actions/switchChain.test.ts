import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { TransportError } from "../../Transport/TransportError.js";
import { switchChain } from "./switchChain.js";

describe("switchChain", () => {
	it("sends wallet_switchEthereumChain request with correct chainId", async () => {
		let capturedMethod: string | undefined;
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedMethod = method;
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		await Effect.runPromise(
			Effect.provide(switchChain(137), TestLayer),
		);

		expect(capturedMethod).toBe("wallet_switchEthereumChain");
		expect(capturedParams).toBeDefined();

		const params = capturedParams![0] as { chainId: string };
		expect(params.chainId).toBe("0x89"); // 137 in hex
	});

	it("converts mainnet chain ID correctly", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(_method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		await Effect.runPromise(
			Effect.provide(switchChain(1), TestLayer),
		);

		const params = capturedParams![0] as { chainId: string };
		expect(params.chainId).toBe("0x1");
	});

	it("converts large chain IDs correctly", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(_method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed(null as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		// Sepolia chain ID: 11155111
		await Effect.runPromise(
			Effect.provide(switchChain(11155111), TestLayer),
		);

		const params = capturedParams![0] as { chainId: string };
		expect(params.chainId).toBe("0xaa36a7"); // 11155111 in hex
	});

	it("handles chain not added error", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("Unrecognized chain ID", { code: 4902 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(switchChain(999999), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to switch chain");
		}
	});

	it("handles user rejection", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("User rejected the request", { code: 4001 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(switchChain(137), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("User rejected the request");
			expect(result.cause.error.code).toBe(4001);
		}
	});
});
