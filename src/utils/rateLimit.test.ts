import { describe, it, expect, vi } from "vitest";
import { throttle, debounce, RateLimiter } from "./rateLimit.js";

describe("throttle", () => {
	it("should execute function immediately", () => {
		const fn = vi.fn(() => "result");

		const throttled = throttle(fn, 1000);
		const result = throttled();

		expect(result).toBe("result");
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should return cached result for subsequent calls", () => {
		const fn = vi.fn(() => "result");

		const throttled = throttle(fn, 1000);

		const result1 = throttled();
		const result2 = throttled();

		expect(result1).toBe("result");
		expect(result2).toBe("result");
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should allow new call after wait period", async () => {
		const fn = vi.fn((x: number) => x * 2);

		const throttled = throttle(fn, 50);

		const result1 = throttled(5);
		expect(result1).toBe(10);
		expect(fn).toHaveBeenCalledTimes(1);

		await new Promise((resolve) => setTimeout(resolve, 60));

		const result2 = throttled(10);
		expect(result2).toBe(20);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("should preserve arguments", () => {
		const fn = vi.fn((a: number, b: string) => `${a}-${b}`);

		const throttled = throttle(fn, 1000);
		const result = throttled(42, "test");

		expect(result).toBe("42-test");
	});

	it("should respect wait time", async () => {
		const fn = vi.fn(() => "result");
		const throttled = throttle(fn, 80);

		throttled();
		throttled();

		await new Promise((resolve) => setTimeout(resolve, 40));
		throttled();

		await new Promise((resolve) => setTimeout(resolve, 50));
		throttled();

		expect(fn).toHaveBeenCalledTimes(2);
	});
});

describe("debounce", () => {
	it("should delay execution", async () => {
		const fn = vi.fn();

		const debounced = debounce(fn, 50);
		debounced();

		expect(fn).not.toHaveBeenCalled();

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should reset timer on new call", async () => {
		const fn = vi.fn();

		const debounced = debounce(fn, 50);
		debounced();
		await new Promise((resolve) => setTimeout(resolve, 30));
		debounced();
		await new Promise((resolve) => setTimeout(resolve, 30));

		expect(fn).not.toHaveBeenCalled();

		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should use most recent arguments", async () => {
		const fn = vi.fn((x: number) => x);

		const debounced = debounce(fn, 50);
		debounced(1);
		debounced(2);
		debounced(3);

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(fn).toHaveBeenCalledOnce();
		expect(fn).toHaveBeenCalledWith(3);
	});

	it("should have cancel method", () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);

		expect(typeof debounced.cancel).toBe("function");
	});

	it("should cancel pending execution", async () => {
		const fn = vi.fn();

		const debounced = debounce(fn, 50);
		debounced();
		debounced.cancel();

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(fn).not.toHaveBeenCalled();
	});

	it("should handle rapid calls", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 50);

		for (let i = 0; i < 100; i++) {
			debounced();
		}

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should work with zero wait time", async () => {
		const fn = vi.fn();
		const debounced = debounce(fn, 0);

		debounced();

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(fn).toHaveBeenCalledOnce();
	});
});

describe("RateLimiter", () => {
	it("should execute immediate request", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
		});

		const result = await limiter.execute(fn);

		expect(result).toBe("result");
		expect(fn).toHaveBeenCalledOnce();
	});

	it("should queue requests when limit exceeded", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
			strategy: "queue",
		});

		const p1 = limiter.execute(fn);
		const p2 = limiter.execute(fn);

		const results = await Promise.all([p1, p2]);

		expect(results).toEqual(["result", "result"]);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("should reject when strategy is reject", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
			strategy: "reject",
		});

		await limiter.execute(fn);

		await expect(limiter.execute(fn)).rejects.toThrow("Rate limit exceeded");
	});

	it("should drop silently when strategy is drop", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
			strategy: "drop",
		});

		const result1 = await limiter.execute(fn);
		const result2 = await limiter.execute(fn);

		expect(result1).toBe("result");
		expect(result2).toBeUndefined();
	});

	it("should refill tokens over time", async () => {
		const limiter = new RateLimiter({
			maxRequests: 2,
			interval: 100,
		});

		expect(limiter.getTokens()).toBe(2);

		await new Promise((resolve) => setTimeout(resolve, 50));
		const tokens = limiter.getTokens();

		expect(tokens).toBeGreaterThanOrEqual(1);
		expect(tokens).toBeLessThanOrEqual(2);
	});

	it("should get queue length", async () => {
		const fn = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
			strategy: "queue",
		});

		limiter.execute(fn);
		limiter.execute(fn);
		limiter.execute(fn);

		expect(limiter.getQueueLength()).toBe(2);
	});

	it("should wrap async function", async () => {
		const fn = vi.fn(async (x: number) => x * 2);

		const limiter = new RateLimiter({
			maxRequests: 2,
			interval: 100,
		});

		const wrapped = limiter.wrap(fn);
		const result = await wrapped(21);

		expect(result).toBe(42);
	});

	it("should propagate function errors", async () => {
		const fn = vi.fn(async () => {
			throw new Error("Function error");
		});

		const limiter = new RateLimiter({
			maxRequests: 2,
			interval: 100,
		});

		await expect(limiter.execute(fn)).rejects.toThrow("Function error");
	});

	it("should handle burst of requests", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 2,
			interval: 100,
			strategy: "queue",
		});

		const promises = Array.from({ length: 4 }, () => limiter.execute(fn));
		const results = await Promise.all(promises);

		expect(results.length).toBe(4);
		expect(fn).toHaveBeenCalledTimes(4);
	});

	it("should apply rate limit to wrapped function", async () => {
		const fn = vi.fn(async () => "result");

		const limiter = new RateLimiter({
			maxRequests: 1,
			interval: 100,
			strategy: "queue",
		});

		const wrapped = limiter.wrap(fn);

		const p1 = wrapped();
		const p2 = wrapped();

		const results = await Promise.all([p1, p2]);

		expect(results).toEqual(["result", "result"]);
		expect(fn).toHaveBeenCalledTimes(2);
	});
});
