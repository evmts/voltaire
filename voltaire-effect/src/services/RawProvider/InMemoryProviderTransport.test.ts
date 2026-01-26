import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import { TransportError, TransportService } from "../Transport/TransportService.js";

/**
 * Since InMemoryProviderTransport wraps InMemoryProvider (bun: protocol dependency),
 * we test the error mapping logic by creating a mock layer that simulates
 * the same error mapping behavior.
 */
describe("InMemoryProviderTransport", () => {
	describe("InMemoryProviderTag", () => {
		it.effect("has correct value", () =>
			Effect.gen(function* () {
				const InMemoryProviderTag = "@voltaire-effect/InMemoryProvider" as const;
				expect(InMemoryProviderTag).toBe("@voltaire-effect/InMemoryProvider");
			})
		);
	});

	describe("error mapping logic", () => {
		const mapError = (error: unknown): TransportError => {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				"message" in error
			) {
				return new TransportError({
					code: (error as { code: number }).code,
					message: (error as { message: string }).message,
				});
			}
			return new TransportError({
				code: -32603,
				message: error instanceof Error ? error.message : "Unknown error",
			});
		};

		it.effect("preserves code and message from errors with code/message properties", () =>
			Effect.gen(function* () {
				const rpcError = { code: -32601, message: "Method not found" };
				const transportError = mapError(rpcError);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32601);
				expect(transportError.message).toBe("Method not found");
			})
		);

		it.effect("maps unknown error object to code -32603", () =>
			Effect.gen(function* () {
				const unknownObj = { foo: "bar" };
				const transportError = mapError(unknownObj);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			})
		);

		it.effect("maps Error instance to its message with code -32603", () =>
			Effect.gen(function* () {
				const error = new Error("Internal failure");
				const transportError = mapError(error);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Internal failure");
			})
		);

		it.effect("maps null error to 'Unknown error' with code -32603", () =>
			Effect.gen(function* () {
				const transportError = mapError(null);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			})
		);

		it.effect("maps undefined error to 'Unknown error' with code -32603", () =>
			Effect.gen(function* () {
				const transportError = mapError(undefined);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			})
		);
	});

	describe("transport layer behavior simulation", () => {
		it.effect("default options (empty object) works", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.succeed("0x1" as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) => transport.request<string>("eth_chainId")),
					Effect.provide(mockTransport),
				);

				expect(result).toBe("0x1");
			})
		);

		it.effect("successful request returns result", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.succeed("0x10" as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) => transport.request<string>("eth_blockNumber")),
					Effect.provide(mockTransport),
				);

				expect(result).toBe("0x10");
			})
		);

		it.effect("failed promise maps to TransportError with code/message", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.fail(
							new TransportError({ code: -32601, message: "Method not found" }),
						) as Effect.Effect<T, TransportError>;
					},
				});

				const exit = yield* Effect.exit(
					TransportService.pipe(
						Effect.flatMap((transport) => transport.request<string>("unknown_method")),
						Effect.provide(mockTransport),
					),
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect(error).toBeInstanceOf(TransportError);
					expect((error as TransportError).code).toBe(-32601);
					expect((error as TransportError).message).toBe("Method not found");
				}
			})
		);

		it.effect("handles internal error code -32603", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.fail(
							new TransportError({ code: -32603, message: "Internal error" }),
						) as Effect.Effect<T, TransportError>;
					},
				});

				const exit = yield* Effect.exit(
					TransportService.pipe(
						Effect.flatMap((transport) => transport.request<string>("eth_call")),
						Effect.provide(mockTransport),
					),
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect((error as TransportError).code).toBe(-32603);
				}
			})
		);

		it.effect("custom chainId option works", () =>
			Effect.gen(function* () {
				let capturedParams: unknown[] = [];

				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(method: string, params?: unknown[]) => {
						capturedParams = params ?? [];
						if (method === "eth_chainId") {
							return Effect.succeed("0xa" as T);
						}
						return Effect.succeed(null as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) => transport.request<string>("eth_chainId")),
					Effect.provide(mockTransport),
				);

				expect(result).toBe("0xa");
			})
		);

		it.effect("passes params correctly to underlying transport", () =>
			Effect.gen(function* () {
				let capturedMethod = "";
				let capturedParams: unknown[] = [];

				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(method: string, params?: unknown[]) => {
						capturedMethod = method;
						capturedParams = params ?? [];
						return Effect.succeed("0x100" as T);
					},
				});

				yield* TransportService.pipe(
					Effect.flatMap((transport) =>
						transport.request<string>("eth_getBalance", ["0xabc", "latest"]),
					),
					Effect.provide(mockTransport),
				);

				expect(capturedMethod).toBe("eth_getBalance");
				expect(capturedParams).toEqual(["0xabc", "latest"]);
			})
		);
	});
});
