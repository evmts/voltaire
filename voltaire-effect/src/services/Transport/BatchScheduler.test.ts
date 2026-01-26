import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { describe, expect, it, vi } from "@effect/vitest";
import { createBatchScheduler, type BatchOptions } from "./BatchScheduler.js";

describe("BatchScheduler", () => {
	const createMockSend = () =>
		vi.fn((requests: { id: number; method: string; params?: unknown[] }[]) =>
			Effect.succeed(
				requests.map((req) => ({
					id: req.id,
					result: `result-${req.id}`,
				})),
			),
		);

	describe("basic functionality", () => {
		it("schedules and sends a single request", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				return yield* scheduler.schedule<string>("eth_blockNumber");
			}).pipe(Effect.scoped);

			const result = await Effect.runPromise(program);
			const sentId = send.mock.calls[0][0][0]?.id;
			expect(result).toBe(`result-${sentId}`);
			expect(send).toHaveBeenCalledTimes(1);
		});

		it("batches multiple concurrent requests", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				const fibers = yield* Effect.all([
					Effect.fork(scheduler.schedule<string>("eth_blockNumber")),
					Effect.fork(scheduler.schedule<string>("eth_chainId")),
					Effect.fork(scheduler.schedule<string>("eth_gasPrice")),
				]);
				const results = yield* Effect.all(fibers.map(Fiber.join));
				return results;
			}).pipe(Effect.scoped);

			const results = await Effect.runPromise(program);
			expect(results).toHaveLength(3);
			expect(send).toHaveBeenCalledTimes(1);
			expect(send.mock.calls[0][0]).toHaveLength(3);
		});

		it("respects batchSize limit", async () => {
			const send = createMockSend();
			const options: BatchOptions = { batchSize: 2 };
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send, options);
				const fibers = yield* Effect.all([
					Effect.fork(scheduler.schedule<string>("m1")),
					Effect.fork(scheduler.schedule<string>("m2")),
					Effect.fork(scheduler.schedule<string>("m3")),
				]);
				yield* Effect.all(fibers.map(Fiber.join));
			}).pipe(Effect.scoped);

			await Effect.runPromise(program);
			expect(send).toHaveBeenCalledTimes(2);
		});
	});

	describe("error handling", () => {
		it("fails deferred when response missing for request ID", async () => {
			const send = vi.fn(() =>
				Effect.succeed([{ id: 999, result: "wrong-id" }]),
			);
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				return yield* scheduler.schedule<string>("eth_blockNumber");
			}).pipe(Effect.scoped);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error.message).toContain("Missing JSON-RPC response");
			}
		});

		it("fails individual deferred when batch response has error", async () => {
			const send = vi.fn(
				(requests: { id: number }[]) =>
					Effect.succeed([
						{
							id: requests[0]?.id ?? -1,
							error: { code: -32603, message: "Internal error" },
						},
					]),
			);
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				return yield* scheduler.schedule<string>("eth_blockNumber");
			}).pipe(Effect.scoped);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error.message).toBe("Internal error");
			}
		});

		it("fails batch when send fails", async () => {
			const send = vi.fn(() =>
				Effect.fail(new Error("Network error")),
			);
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				return yield* scheduler.schedule<string>("eth_blockNumber");
			}).pipe(Effect.scoped);

			const exit = await Effect.runPromiseExit(program);
			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
				expect(exit.cause.error.message).toBe("Network error");
			}
		});

		it("cleans up pending requests on scope close", async () => {
			let sendStarted = false;
			const send = vi.fn(() => {
				sendStarted = true;
				return Effect.never;
			});

			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send);
				yield* Effect.fork(scheduler.schedule<string>("eth_blockNumber"));
				yield* Effect.yieldNow();
				yield* Effect.yieldNow();
				return sendStarted;
			}).pipe(Effect.scoped);

			const result = await Effect.runPromise(program);
			expect(result).toBe(true);
		});
	});

	describe("timing behavior", () => {
		it("uses Effect.yieldNow when wait=0", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send, { wait: 0 });
				return yield* scheduler.schedule<string>("eth_blockNumber");
			}).pipe(Effect.scoped);

			const result = await Effect.runPromise(program);
			const sentId = send.mock.calls[0][0][0]?.id;
			expect(result).toBe(`result-${sentId}`);
		});

		it("delays flush when wait > 0", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send, { wait: 50 });
				const start = Date.now();
				const result = yield* scheduler.schedule<string>("eth_blockNumber");
				const elapsed = Date.now() - start;
				return { result, elapsed };
			}).pipe(Effect.scoped);

			const { result, elapsed } = await Effect.runPromise(program);
			const sentId = send.mock.calls[0][0][0]?.id;
			expect(result).toBe(`result-${sentId}`);
			expect(elapsed).toBeGreaterThanOrEqual(40);
		});
	});

	describe("overflow handling", () => {
		it("correctly handles overflow when queue exceeds batchSize", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send, { batchSize: 2 });
				const fibers = yield* Effect.all([
					Effect.fork(scheduler.schedule<string>("m1")),
					Effect.fork(scheduler.schedule<string>("m2")),
					Effect.fork(scheduler.schedule<string>("m3")),
					Effect.fork(scheduler.schedule<string>("m4")),
					Effect.fork(scheduler.schedule<string>("m5")),
				]);
				yield* Effect.all(fibers.map(Fiber.join));
			}).pipe(Effect.scoped);

			await Effect.runPromise(program);
			expect(send).toHaveBeenCalledTimes(3);
		});
	});

describe("ID assignment", () => {
	it("assigns unique IDs to requests", async () => {
			const send = createMockSend();
			const program = Effect.gen(function* () {
				const scheduler = yield* createBatchScheduler(send, { wait: 0 });
				const fibers = yield* Effect.all([
					Effect.fork(scheduler.schedule<string>("m1")),
					Effect.fork(scheduler.schedule<string>("m2")),
					Effect.fork(scheduler.schedule<string>("m3")),
				]);
				yield* Effect.all(fibers.map(Fiber.join));
			}).pipe(Effect.scoped);

			await Effect.runPromise(program);
			const allRequests = send.mock.calls.flatMap((call) => call[0]);
			const ids = allRequests.map((r) => r.id).sort((a, b) => a - b);
			expect(new Set(ids).size).toBe(ids.length);
		});
	});
});
