import { describe, it, expect } from "vitest";
import { withTimeout, TimeoutError, sleep, createDeferred } from "./timeout.js";

describe("withTimeout", () => {
	it("returns result when promise resolves before timeout", async () => {
		const promise = Promise.resolve("success");

		const result = await withTimeout(promise, { ms: 1000 });

		expect(result).toBe("success");
	});

	it("throws TimeoutError when promise times out", async () => {
		const promise = new Promise((resolve) => setTimeout(resolve, 1000));

		await expect(withTimeout(promise, { ms: 50 })).rejects.toThrow(
			TimeoutError,
		);
	});

	it("uses custom timeout message", async () => {
		const promise = new Promise((resolve) => setTimeout(resolve, 1000));

		await expect(
			withTimeout(promise, {
				ms: 50,
				message: "Custom timeout message",
			}),
		).rejects.toThrow("Custom timeout message");
	});

	it("handles AbortSignal cancellation", async () => {
		const controller = new AbortController();
		const promise = new Promise((resolve) => setTimeout(resolve, 1000));

		const timeoutPromise = withTimeout(promise, {
			ms: 1000,
			signal: controller.signal,
		});

		setTimeout(() => controller.abort(), 50);

		await expect(timeoutPromise).rejects.toThrow("Operation aborted");
	});

	it("rejects immediately if signal already aborted", async () => {
		const controller = new AbortController();
		controller.abort();

		const promise = Promise.resolve("success");

		await expect(
			withTimeout(promise, {
				ms: 1000,
				signal: controller.signal,
			}),
		).rejects.toThrow("Operation aborted");
	});
});

describe("sleep", () => {
	it("sleeps for specified duration", async () => {
		const start = Date.now();
		await sleep(100);
		const elapsed = Date.now() - start;

		expect(elapsed).toBeGreaterThanOrEqual(90);
		expect(elapsed).toBeLessThan(200);
	});

	it("can be cancelled with AbortSignal", async () => {
		const controller = new AbortController();

		const sleepPromise = sleep(1000, controller.signal);

		setTimeout(() => controller.abort(), 50);

		await expect(sleepPromise).rejects.toThrow("Operation aborted");
	});
});

describe("createDeferred", () => {
	it("creates manually controllable promise", async () => {
		const { promise, resolve } = createDeferred<string>();

		setTimeout(() => resolve("resolved"), 10);

		const result = await promise;
		expect(result).toBe("resolved");
	});

	it("can reject promise", async () => {
		const { promise, reject } = createDeferred<string>();

		setTimeout(() => reject(new Error("rejected")), 10);

		await expect(promise).rejects.toThrow("rejected");
	});
});

describe("TimeoutError", () => {
	it("is instance of Error", () => {
		const error = new TimeoutError();
		expect(error).toBeInstanceOf(Error);
	});

	it("has correct name", () => {
		const error = new TimeoutError();
		expect(error.name).toBe("TimeoutError");
	});

	it("uses custom message", () => {
		const error = new TimeoutError("Custom message");
		expect(error.message).toBe("Custom message");
	});

	it("uses default message", () => {
		const error = new TimeoutError();
		expect(error.message).toBe("Operation timed out");
	});
});
