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

		it("handles empty params array", async () => {
			let capturedParams: unknown[] | undefined;
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(method: string, params?: unknown[]) => {
					capturedParams = params;
					return Effect.succeed("0x1" as T);
				},
			});

			await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_blockNumber", params: [] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(capturedParams).toEqual([]);
		});

		it("handles undefined params", async () => {
			let capturedParams: unknown[] | undefined;
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(method: string, params?: unknown[]) => {
					capturedParams = params;
					return Effect.succeed("0x1" as T);
				},
			});

			await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_blockNumber" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(capturedParams).toBeUndefined();
		});

		it("handles complex response objects", async () => {
			const mockBlock = {
				number: "0x10",
				hash: "0xabc",
				parentHash: "0xdef",
				transactions: ["0x1", "0x2"],
			};
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.succeed(mockBlock as T);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_getBlockByNumber", params: ["0x10", true] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(result).toEqual(mockBlock);
		});

		it("handles null responses", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.succeed(null as T);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_getTransactionReceipt", params: ["0xabc"] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(result).toBeNull();
		});

		it("handles array responses", async () => {
			const accounts = ["0x1234", "0x5678", "0x9abc"];
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.succeed(accounts as T);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_accounts" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(result).toEqual(accounts);
		});

		it("propagates error code from transport", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32603, message: "Internal error" }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_blockNumber" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).code).toBe(-32603);
			}
		});

		it("propagates error data from transport", async () => {
			const errorData = { reason: "execution reverted", data: "0x08c379a0..." };
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32000, message: "reverted", data: errorData }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_call" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).data).toEqual(errorData);
			}
		});

		it("handles multiple sequential requests", async () => {
			let callCount = 0;
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(method: string, _params?: unknown[]) => {
					callCount++;
					if (method === "eth_blockNumber") {
						return Effect.succeed("0x100" as T);
					}
					if (method === "eth_chainId") {
						return Effect.succeed("0x1" as T);
					}
					return Effect.succeed("0x0" as T);
				},
			});

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					const blockNum = yield* raw.request({ method: "eth_blockNumber" });
					const chainId = yield* raw.request({ method: "eth_chainId" });
					return { blockNum, chainId };
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(callCount).toBe(2);
			expect(result.blockNum).toBe("0x100");
			expect(result.chainId).toBe("0x1");
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

	describe("error handling", () => {
		it("handles method not found error", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32601, message: "Method not found" }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "unknown_method" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).code).toBe(-32601);
			}
		});

		it("handles invalid params error", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32602, message: "Invalid params" }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_getBalance", params: ["invalid"] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).code).toBe(-32602);
			}
		});

		it("handles execution reverted error", async () => {
			const revertData = "0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000094e6f7420656e6f756768000000000000000000000000000000000000000000";
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32000, message: "execution reverted", data: revertData }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_call", params: [] });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).code).toBe(-32000);
				expect((error as TransportError).data).toBe(revertData);
			}
		});

		it("handles rate limit error", async () => {
			const mockTransport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) => {
					return Effect.fail(
						new TransportError({ code: -32005, message: "Rate limit exceeded" }),
					) as Effect.Effect<T, TransportError>;
				},
			});

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const raw = yield* RawProviderService;
					return yield* raw.request({ method: "eth_blockNumber" });
				}).pipe(
					Effect.provide(RawProviderTransport),
					Effect.provide(mockTransport),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as TransportError).code).toBe(-32005);
			}
		});
	});
});
