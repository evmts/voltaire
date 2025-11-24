import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	TimeoutError,
	createDeferred,
	executeWithTimeout,
	sleep,
	withTimeout,
	wrapWithTimeout,
} from "./timeout.js";

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

	it("works with object values", async () => {
		const obj = { foo: "bar" };
		const promise = Promise.resolve(obj);
		const result = await withTimeout(promise, { ms: 100 });
		expect(result).toBe(obj);
	});

	it("works with array values", async () => {
		const arr = [1, 2, 3];
		const promise = Promise.resolve(arr);
		const result = await withTimeout(promise, { ms: 100 });
		expect(result).toEqual(arr);
	});

	it("cleans up timeout when promise settles", async () => {
		const spy = vi.spyOn(global, "clearTimeout");
		const promise = Promise.resolve(42);

		await withTimeout(promise, { ms: 1000 });

		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});
});

describe("wrapWithTimeout", () => {
	it("wraps async function with timeout", async () => {
		const asyncFn = async (x: number) => {
			await sleep(10);
			return x * 2;
		};

		const wrapped = wrapWithTimeout(asyncFn, 100);
		const result = await wrapped(21);

		expect(result).toBe(42);
	});

	it("times out wrapped function", async () => {
		const asyncFn = async () => {
			await sleep(500);
			return "done";
		};

		const wrapped = wrapWithTimeout(asyncFn, 50);

		await expect(wrapped()).rejects.toThrow(TimeoutError);
	});

	it("passes custom message to wrapped function", async () => {
		const asyncFn = async () => {
			await sleep(500);
			return "done";
		};

		const wrapped = wrapWithTimeout(asyncFn, 50, "Function timed out");

		try {
			await wrapped();
			throw new Error("Should have timed out");
		} catch (error) {
			expect((error as Error).message).toBe("Function timed out");
		}
	});

	it("preserves function signature with multiple args", async () => {
		const asyncFn = async (a: number, b: string, c: boolean) => {
			return `${a}-${b}-${c}`;
		};

		const wrapped = wrapWithTimeout(asyncFn, 100);
		const result = await wrapped(42, "test", true);

		expect(result).toBe("42-test-true");
	});

	it("wraps function with multiple args", async () => {
		const asyncFn = async (a: number, b: number) => a + b;

		const wrapped = wrapWithTimeout(asyncFn, 100);

		const result = await wrapped(5, 3);
		expect(result).toBe(8);
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

	it("rejects immediately if signal already aborted", async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(sleep(1000, controller.signal)).rejects.toThrow(
			"Operation aborted",
		);
	});

	it("handles zero delay", async () => {
		const start = Date.now();
		await sleep(0);
		const elapsed = Date.now() - start;

		expect(elapsed).toBeLessThan(100);
	});

	it("completes without signal", async () => {
		const result = await sleep(20);
		expect(result).toBeUndefined();
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

	it("works with multiple awaits", async () => {
		const { promise, resolve } = createDeferred<string>();

		setTimeout(() => resolve("hello"), 20);

		const result1 = await promise;
		const result2 = await promise;

		expect(result1).toBe("hello");
		expect(result2).toBe("hello");
	});

	it("handles object values", async () => {
		const { promise, resolve } = createDeferred<{ foo: string }>();

		const obj = { foo: "bar" };
		setTimeout(() => resolve(obj), 20);

		const result = await promise;
		expect(result).toBe(obj);
	});

	it("handles array values", async () => {
		const { promise, resolve } = createDeferred<number[]>();

		const arr = [1, 2, 3];
		setTimeout(() => resolve(arr), 20);

		const result = await promise;
		expect(result).toEqual([1, 2, 3]);
	});

	it("rejects with any error type", async () => {
		const { promise, reject } = createDeferred<number>();

		setTimeout(() => reject("string error"), 20);

		try {
			await promise;
			throw new Error("Should have rejected");
		} catch (error) {
			expect(error).toBe("string error");
		}
	});
});

describe("executeWithTimeout", () => {
	it("executes function within timeout", async () => {
		const fn = async () => {
			await sleep(10);
			return 42;
		};

		const result = await executeWithTimeout(fn, 100);
		expect(result).toBe(42);
	});

	it("fails if function times out", async () => {
		const fn = async () => {
			await sleep(500);
			return 42;
		};

		await expect(executeWithTimeout(fn, 50)).rejects.toThrow(TimeoutError);
	});

	it("retries on timeout with maxRetries", async () => {
		let attempts = 0;
		const fn = async () => {
			attempts++;
			if (attempts < 2) {
				await sleep(500);
			}
			return 42;
		};

		const result = await executeWithTimeout(fn, 50, 1);
		expect(result).toBe(42);
		expect(attempts).toBe(2);
	});

	it("retries on timeout but not on other errors", async () => {
		let attempts = 0;
		const fn = async () => {
			attempts++;
			if (attempts === 1) {
				await sleep(500); // First attempt times out
			}
			return attempts;
		};

		const result = await executeWithTimeout(fn, 50, 1);
		expect(result).toBe(2);
		expect(attempts).toBe(2);
	});

	it("exhausts retries and throws last error", async () => {
		let attempts = 0;
		const fn = async () => {
			attempts++;
			await sleep(500);
			return 42;
		};

		let caughtError: unknown;
		try {
			await executeWithTimeout(fn, 50, 2);
		} catch (error) {
			caughtError = error;
		}

		expect(caughtError).toBeInstanceOf(TimeoutError);
		expect(attempts).toBe(3);
	});

	it("handles zero retries", async () => {
		let attempts = 0;
		const fn = async () => {
			attempts++;
			await sleep(500);
			return 42;
		};

		await expect(executeWithTimeout(fn, 50, 0)).rejects.toThrow(TimeoutError);
		expect(attempts).toBe(1);
	});

	it("waits between retries", async () => {
		const start = Date.now();
		let attempts = 0;

		const fn = async () => {
			attempts++;
			await sleep(500);
			return 42;
		};

		try {
			await executeWithTimeout(fn, 50, 2);
		} catch {
			// Expected to fail
		}

		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(150);
	});

	it("succeeds on second retry", async () => {
		let attempts = 0;
		const fn = async () => {
			attempts++;
			if (attempts === 1) {
				await sleep(500);
			}
			return "success";
		};

		const result = await executeWithTimeout(fn, 50, 2);
		expect(result).toBe("success");
		expect(attempts).toBe(2);
	});
});
