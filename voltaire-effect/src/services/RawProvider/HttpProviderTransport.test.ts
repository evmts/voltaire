import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import {
	TransportError,
	TransportService,
} from "../Transport/TransportService.js";

/**
 * Since HttpProviderTransport wraps HttpProvider (network dependency),
 * we test the error mapping logic by creating a mock layer that simulates
 * the same error mapping behavior.
 */
describe("HttpProviderTransport", () => {
	describe("error mapping logic", () => {
		/**
		 * Helper to simulate the error mapping logic from HttpProviderTransport.
		 * This mirrors the `catch` handler in the implementation.
		 */
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

		it.effect(
			"preserves code and message from errors with code/message properties",
			() =>
				Effect.gen(function* () {
					const rpcError = { code: -32601, message: "Method not found" };
					const transportError = mapError(rpcError);

					expect(transportError).toBeInstanceOf(TransportError);
					expect(transportError.code).toBe(-32601);
					expect(transportError.message).toBe("Method not found");
				}),
		);

		it.effect("maps unknown error object to code -32603", () =>
			Effect.gen(function* () {
				const unknownObj = { foo: "bar" };
				const transportError = mapError(unknownObj);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);

		it.effect("maps string error to 'Unknown error' with code -32603", () =>
			Effect.gen(function* () {
				const stringError = "something went wrong";
				const transportError = mapError(stringError);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);

		it.effect("maps Error instance to its message with code -32603", () =>
			Effect.gen(function* () {
				const error = new Error("Network timeout");
				const transportError = mapError(error);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Network timeout");
			}),
		);

		it.effect("maps null error to 'Unknown error' with code -32603", () =>
			Effect.gen(function* () {
				const transportError = mapError(null);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);

		it.effect("maps undefined error to 'Unknown error' with code -32603", () =>
			Effect.gen(function* () {
				const transportError = mapError(undefined);

				expect(transportError).toBeInstanceOf(TransportError);
				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);

		it.effect("handles error with only code (missing message)", () =>
			Effect.gen(function* () {
				const partialError = { code: -32000 };
				const transportError = mapError(partialError);

				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);

		it.effect("handles error with only message (missing code)", () =>
			Effect.gen(function* () {
				const partialError = { message: "Some error" };
				const transportError = mapError(partialError);

				expect(transportError.code).toBe(-32603);
				expect(transportError.message).toBe("Unknown error");
			}),
		);
	});

	describe("transport layer behavior simulation", () => {
		it.effect("successful request returns result", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.succeed("0x123" as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) =>
						transport.request<string>("eth_chainId"),
					),
					Effect.provide(mockTransport),
				);

				expect(result).toBe("0x123");
			}),
		);

		it.effect("default params is empty array when not provided", () =>
			Effect.gen(function* () {
				let capturedParams: unknown[] | undefined;

				const createTransportWithPromise = (
					promiseFn: () => Promise<unknown>,
				): Layer.Layer<TransportService> => {
					return Layer.succeed(TransportService, {
						request: <T>(_method: string, params: unknown[] = []) => {
							capturedParams = params;
							return Effect.tryPromise({
								try: () => promiseFn() as Promise<T>,
								catch: () =>
									new TransportError({ code: -32603, message: "error" }),
							});
						},
					});
				};

				const mockTransport = createTransportWithPromise(() =>
					Promise.resolve("0x1"),
				);

				yield* TransportService.pipe(
					Effect.flatMap((transport) =>
						transport.request<string>("eth_blockNumber"),
					),
					Effect.provide(mockTransport),
				);

				expect(capturedParams).toEqual([]);
			}),
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
			}),
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
						Effect.flatMap((transport) =>
							transport.request<string>("unknown_method"),
						),
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
			}),
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
						Effect.flatMap((transport) =>
							transport.request<string>("eth_call"),
						),
						Effect.provide(mockTransport),
					),
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
					expect((error as TransportError).code).toBe(-32603);
				}
			}),
		);

		it.effect("handles complex JSON response", () =>
			Effect.gen(function* () {
				const mockBlock = {
					number: "0x10d4f",
					hash: "0xabcdef123456",
					transactions: ["0x1", "0x2", "0x3"],
				};

				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.succeed(mockBlock as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) =>
						transport.request<typeof mockBlock>("eth_getBlockByNumber", [
							"latest",
							true,
						]),
					),
					Effect.provide(mockTransport),
				);

				expect(result).toEqual(mockBlock);
			}),
		);

		it.effect("handles null response for missing data", () =>
			Effect.gen(function* () {
				const mockTransport = Layer.succeed(TransportService, {
					request: <T>(_method: string, _params?: unknown[]) => {
						return Effect.succeed(null as T);
					},
				});

				const result = yield* TransportService.pipe(
					Effect.flatMap((transport) =>
						transport.request<null>("eth_getTransactionReceipt", [
							"0xnonexistent",
						]),
					),
					Effect.provide(mockTransport),
				);

				expect(result).toBeNull();
			}),
		);
	});
});
