import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { TransportError, TransportService } from "../Transport/TransportService.js";
import { RawProviderService } from "./RawProviderService.js";
import { RawProviderTransport } from "./RawProviderTransport.js";

describe("RawProvider", () => {
	describe("RawProviderService", () => {
		it("provides direct access via transport", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(method: string, _params?: unknown[]) => {
					if (method === "eth_chainId") {
						return Effect.succeed("0x2a" as T);
					}
					return Effect.fail(
						new TransportError({ code: -32601, message: "Method not found" }),
					);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_chainId", params: [] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(result).toBe("0x2a");
		});

		it("propagates RPC errors", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: 4200, message: "Not supported" }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({
						method: "eth_sign",
						params: ["0x0", "0x0"],
					});
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(TransportError);
				expect((error as TransportError).code).toBe(4200);
			}
		});

		it("passes params correctly", async () => {
			let capturedMethod = "";
			let capturedParams: unknown[] = [];
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(method: string, params?: unknown[]) => {
					capturedMethod = method;
					capturedParams = params ?? [];
					return Effect.succeed("0x1" as T);
				},
			});

			await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({
						method: "eth_getBalance",
						params: ["0x1234", "latest"],
					});
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(capturedMethod).toBe("eth_getBalance");
			expect(capturedParams).toEqual(["0x1234", "latest"]);
		});
	});

	describe("RawProviderShape", () => {
		it("request method signature is correct", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.succeed({ foo: "bar" } as T);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "custom_method" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(result).toEqual({ foo: "bar" });
		});
	});
});
