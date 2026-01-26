import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it, vi } from "@effect/vitest";
import { FallbackTransport } from "./FallbackTransport.js";
import { TransportError } from "./TransportError.js";
import { TransportService } from "./TransportService.js";
import { TestTransport } from "./TestTransport.js";

describe("FallbackTransport", () => {
	describe("empty transports array", () => {
		it("fails layer when no transports provided", async () => {
			const program = Effect.gen(function* () {
				const transport = yield* TransportService;
				return yield* transport.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(FallbackTransport([])));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(TransportError);
				expect((exit.cause.error as TransportError).message).toContain(
					"at least one transport",
				);
			}
		});
	});

	describe("single transport", () => {
		it("works with single transport", async () => {
			const transport = FallbackTransport([
				TestTransport({ eth_blockNumber: "0x1234" }),
			]);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1234");
		});

		it("fails when single transport fails", async () => {
			const transport = FallbackTransport(
				[
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "Failed",
						}),
					}),
				],
				{ retryCount: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
		});
	});

	describe("fallover behavior", () => {
		it("falls back to second transport when first fails", async () => {
			const transport = FallbackTransport(
				[
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "First failed",
						}),
					}),
					TestTransport({ eth_blockNumber: "0x5678" }),
				],
				{ retryCount: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x5678");
		});

		it("falls back through multiple transports", async () => {
			const transport = FallbackTransport(
				[
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "First failed",
						}),
					}),
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "Second failed",
						}),
					}),
					TestTransport({ eth_blockNumber: "0x9999" }),
				],
				{ retryCount: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x9999");
		});

		it("fails when all transports fail", async () => {
			const transport = FallbackTransport(
				[
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "First failed",
						}),
					}),
					TestTransport({
						eth_blockNumber: new TransportError({
							code: -32603,
							message: "Second failed",
						}),
					}),
				],
				{ retryCount: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect((exit.cause.error as TransportError).message).toContain(
					"All 2 transports failed",
				);
			}
		});
	});

	describe("retry behavior", () => {
		it("retries specified number of times before fallback", async () => {
			let callCount = 0;
			const failingTransport = Layer.succeed(TransportService, {
				request: <T>(): Effect.Effect<T, TransportError> => {
					callCount++;
					return Effect.fail(
						new TransportError({ code: -32603, message: "Failed" }),
					);
				},
			});

			const transport = FallbackTransport(
				[failingTransport, TestTransport({ eth_blockNumber: "0x1234" })],
				{ retryCount: 3, retryDelay: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			await Effect.runPromise(program);
			expect(callCount).toBe(3);
		});

		it("uses default retryCount of 3", async () => {
			let callCount = 0;
			const failingTransport = Layer.succeed(TransportService, {
				request: <T>(): Effect.Effect<T, TransportError> => {
					callCount++;
					return Effect.fail(
						new TransportError({ code: -32603, message: "Failed" }),
					);
				},
			});

			const transport = FallbackTransport(
				[failingTransport, TestTransport({ eth_blockNumber: "0x1234" })],
				{ retryDelay: 1 },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			await Effect.runPromise(program);
			expect(callCount).toBe(3);
		});
	});

	describe("recovery behavior", () => {
		it("resets failure count on successful request", async () => {
			let attemptCount = 0;
			const unstableTransport = Layer.succeed(TransportService, {
				request: <T>(): Effect.Effect<T, TransportError> => {
					attemptCount++;
					if (attemptCount === 1) {
						return Effect.fail(
							new TransportError({ code: -32603, message: "Temporary failure" }),
						);
					}
					return Effect.succeed("0x1234" as T);
				},
			});

			const transport = FallbackTransport([unstableTransport], {
				retryCount: 2,
				retryDelay: 1,
			});

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1234");
		});

		it("transport can recover after previous failures", async () => {
			let callCount = 0;
			const recoveringTransport = Layer.succeed(TransportService, {
				request: <T>(): Effect.Effect<T, TransportError> => {
					callCount++;
					if (callCount <= 2) {
						return Effect.fail(
							new TransportError({ code: -32603, message: "Failing" }),
						);
					}
					return Effect.succeed("0x9999" as T);
				},
			});

			const transport = FallbackTransport([recoveringTransport], {
				retryCount: 3,
				retryDelay: 1,
			});

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x9999");
			expect(callCount).toBe(3);
		});
	});

	describe("ranking behavior", () => {
		it("enables rank option without error", async () => {
			const transport = FallbackTransport(
				[TestTransport({ eth_blockNumber: "0x1234" })],
				{ rank: true },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				return yield* t.request<string>("eth_blockNumber");
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x1234");
		});

		it("tracks latency for ordering decisions", async () => {
			const transport = FallbackTransport(
				[
					TestTransport({ eth_blockNumber: "0x1111" }),
					TestTransport({ eth_blockNumber: "0x2222" }),
				],
				{ rank: true },
			);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				const r1 = yield* t.request<string>("eth_blockNumber");
				const r2 = yield* t.request<string>("eth_blockNumber");
				return [r1, r2];
			}).pipe(Effect.provide(transport));

			const results = await Effect.runPromise(program);
			expect(results[0]).toBe("0x1111");
			expect(results[1]).toBe("0x1111");
		});
	});

	describe("latency tracking", () => {
		it("updates latency ref after successful request", async () => {
			const transport = FallbackTransport([
				TestTransport({ eth_blockNumber: "0x1234" }),
			]);

			const program = Effect.gen(function* () {
				const t = yield* TransportService;
				yield* t.request<string>("eth_blockNumber");
				yield* t.request<string>("eth_blockNumber");
				return "done";
			}).pipe(Effect.provide(transport));

			const result = await Effect.runPromise(program);
			expect(result).toBe("done");
		});
	});
});
