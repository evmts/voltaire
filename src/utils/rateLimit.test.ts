import { describe, it, expect, vi, beforeEach } from "vitest";
import { throttle, debounce, RateLimiter } from "./rateLimit.js";

describe("throttle", () => {
	describe("basic throttling", () => {
		it("should execute function immediately", () => {
			const fn = vi.fn(() => "result");

			const throttled = throttle(fn, 1000);
			const result = throttled();

			expect(result).toBe("result");
			expect(fn).toHaveBeenCalledOnce();
		});

		it("should ignore calls within wait period", () => {
			const fn = vi.fn(() => "result");

			const throttled = throttle(fn, 100);

			throttled();
			const result2 = throttled();
			const result3 = throttled();

			expect(fn).toHaveBeenCalledOnce();
			expect(result2).toBeUndefined();
			expect(result3).toBeUndefined();
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

		it("should return last result when throttled", () => {
			const fn = vi.fn((x: number) => x * 2);

			const throttled = throttle(fn, 1000);

			const result1 = throttled(5);
			const result2 = throttled(10);
			const result3 = throttled(15);

			expect(result1).toBe(10);
			expect(result2).toBe(10); // Returns previous result
			expect(result3).toBe(10); // Returns previous result
		});

		it("should handle multiple throttled functions independently", () => {
			const fn1 = vi.fn(() => "fn1");
			const fn2 = vi.fn(() => "fn2");

			const throttled1 = throttle(fn1, 1000);
			const throttled2 = throttle(fn2, 1000);

			throttled1();
			throttled2();
			throttled1();
			throttled2();

			expect(fn1).toHaveBeenCalledOnce();
			expect(fn2).toHaveBeenCalledOnce();
		});
	});

	describe("with arguments", () => {
		it("should preserve arguments", () => {
			const fn = vi.fn((a: number, b: string) => `${a}-${b}`);

			const throttled = throttle(fn, 1000);
			const result = throttled(42, "test");

			expect(result).toBe("42-test");
		});

		it("should use last arguments when throttled", () => {
			const fn = vi.fn((x: number) => x);

			const throttled = throttle(fn, 1000);

			const result1 = throttled(1);
			throttled(2);
			throttled(3);

			expect(result1).toBe(1);
			expect(fn).toHaveBeenCalledOnce();
			expect(fn).toHaveBeenCalledWith(1);
		});

		it("should handle variable arguments", () => {
			const fn = vi.fn((x: number, y?: number) => (y ? x + y : x));

			const throttled = throttle(fn, 1000);

			const result1 = throttled(5);
			const result2 = throttled(5, 3);
			const result3 = throttled(10);

			expect(result1).toBe(5);
			expect(result2).toBeUndefined();
			expect(result3).toBeUndefined();
		});
	});

	describe("timing", () => {
		it("should respect wait time", async () => {
			const fn = vi.fn(() => "result");
			const throttled = throttle(fn, 80);

			throttled(); // t=0, called
			throttled(); // t=0, ignored

			await new Promise((resolve) => setTimeout(resolve, 40));
			throttled(); // t=40, ignored

			await new Promise((resolve) => setTimeout(resolve, 50));
			throttled(); // t=90, called

			expect(fn).toHaveBeenCalledTimes(2);
		});

		it("should work with small wait times", async () => {
			const fn = vi.fn(() => "result");
			const throttled = throttle(fn, 10);

			throttled();
			throttled();
			expect(fn).toHaveBeenCalledTimes(1);

			await new Promise((resolve) => setTimeout(resolve, 20));
			throttled();
			expect(fn).toHaveBeenCalledTimes(2);
		});
	});

	describe("edge cases", () => {
		it("should handle zero wait time", () => {
			const fn = vi.fn(() => "result");
			const throttled = throttle(fn, 0);

			throttled();
			throttled();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should return undefined for initial throttled calls", () => {
			const fn = vi.fn(() => 42);
			const throttled = throttle(fn, 1000);

			throttled();
			const result = throttled();

			expect(result).toBeUndefined();
		});

		it("should handle function throwing", () => {
			const fn = vi.fn(() => {
				throw new Error("Function error");
			});

			const throttled = throttle(fn, 1000);

			expect(() => throttled()).toThrow("Function error");
		});
	});
});

describe("debounce", () => {
	describe("basic debouncing", () => {
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

		it("should use last arguments", async () => {
			const fn = vi.fn((x: number) => x);

			const debounced = debounce(fn, 50);
			debounced(1);
			debounced(2);
			debounced(3);

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledOnce();
			expect(fn).toHaveBeenCalledWith(3);
		});

		it("should execute debounced function", async () => {
			const fn = vi.fn((x: number) => x * 2);

			const debounced = debounce(fn, 50);
			debounced(5);

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledOnce();
			expect(fn).toHaveBeenCalledWith(5);
		});
	});

	describe("cancel method", () => {
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

		it("should clear timeout on cancel", async () => {
			const fn = vi.fn();

			const debounced = debounce(fn, 50);
			debounced();
			debounced.cancel();
			debounced();

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledOnce();
		});

		it("should allow multiple cancels", async () => {
			const fn = vi.fn();

			const debounced = debounce(fn, 50);
			debounced();
			debounced.cancel();
			debounced.cancel();

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe("with arguments", () => {
		it("should preserve arguments", async () => {
			const fn = vi.fn((a: number, b: string) => `${a}-${b}`);

			const debounced = debounce(fn, 50);
			debounced(42, "test");

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledWith(42, "test");
		});

		it("should use most recent arguments", async () => {
			const fn = vi.fn((x: number) => x);

			const debounced = debounce(fn, 50);
			debounced(1);
			debounced(2);
			debounced(3);

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledWith(3);
		});

		it("should handle variable arguments", async () => {
			const fn = vi.fn();

			const debounced = debounce(fn, 50);
			debounced(1, "two", true);

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn).toHaveBeenCalledWith(1, "two", true);
		});
	});

	describe("timing", () => {
		it("should respect wait time exactly", async () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 100);

			debounced();

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(fn).not.toHaveBeenCalled();

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

		it("should work with small wait times", async () => {
			const fn = vi.fn();
			const debounced = debounce(fn, 10);

			debounced();
			debounced();
			debounced();

			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(fn).toHaveBeenCalledOnce();
		});
	});

	describe("edge cases", () => {
		it("should handle multiple instances independently", async () => {
			const fn1 = vi.fn();
			const fn2 = vi.fn();

			const debounced1 = debounce(fn1, 50);
			const debounced2 = debounce(fn2, 50);

			debounced1();
			debounced2();

			await new Promise((resolve) => setTimeout(resolve, 60));
			expect(fn1).toHaveBeenCalledOnce();
			expect(fn2).toHaveBeenCalledOnce();
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
	});
});

describe("RateLimiter", () => {
	describe("basic rate limiting", () => {
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

		it("should queue request when limit exceeded", async () => {
			const fn = vi.fn(async () => "result");

			const limiter = new RateLimiter({
				maxRequests: 1,
				interval: 100,
			});

			const p1 = limiter.execute(fn);
			const p2 = limiter.execute(fn);

			const [result1, result2] = await Promise.all([p1, p2]);

			expect(result1).toBe("result");
			expect(result2).toBe("result");
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it("should handle multiple requests per interval", async () => {
			const fn = vi.fn(async () => "result");

			const limiter = new RateLimiter({
				maxRequests: 3,
				interval: 100,
			});

			const promises = [
				limiter.execute(fn),
				limiter.execute(fn),
				limiter.execute(fn),
				limiter.execute(fn),
			];

			const results = await Promise.all(promises);

			expect(results.length).toBe(4);
			expect(fn).toHaveBeenCalledTimes(4);
		});
	});

	describe("strategies", () => {
		it("should queue by default", async () => {
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
	});

	describe("token management", () => {
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

		it("should cap tokens at maxRequests", async () => {
			const limiter = new RateLimiter({
				maxRequests: 2,
				interval: 100,
			});

			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(limiter.getTokens()).toBe(2);
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

		it("should clear queue", async () => {
			const limiter = new RateLimiter({
				maxRequests: 1,
				interval: 100,
			});

			limiter.clearQueue();

			expect(limiter.getQueueLength()).toBe(0);
		});
	});

	describe("wrap method", () => {
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

		it("should preserve function arguments", async () => {
			const fn = vi.fn(async (a: number, b: string) => `${a}-${b}`);

			const limiter = new RateLimiter({
				maxRequests: 2,
				interval: 100,
			});

			const wrapped = limiter.wrap(fn);
			const result = await wrapped(42, "test");

			expect(result).toBe("42-test");
		});
	});

	describe("error handling", () => {
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

		it("should continue processing after error", async () => {
			const fn = vi.fn(async (shouldError: boolean) => {
				if (shouldError) throw new Error("Error");
				return "success";
			});

			const limiter = new RateLimiter({
				maxRequests: 2,
				interval: 100,
			});

			const p1 = limiter.execute(async () => fn(true));
			const p2 = limiter.execute(async () => fn(false));

			const results = await Promise.allSettled([p1, p2]);

			expect(results[0].status).toBe("rejected");
			expect(results[1].status).toBe("fulfilled");
		});
	});

	describe("concurrency", () => {
		it("should respect max concurrent requests", async () => {
			let maxConcurrent = 0;
			let current = 0;

			const fn = vi.fn(async () => {
				current++;
				maxConcurrent = Math.max(maxConcurrent, current);
				await new Promise((resolve) => setTimeout(resolve, 20));
				current--;
			});

			const limiter = new RateLimiter({
				maxRequests: 2,
				interval: 100,
			});

			const promises = Array.from({ length: 6 }, () => limiter.execute(fn));
			await Promise.all(promises);

			expect(maxConcurrent).toBeLessThanOrEqual(2);
		});
	});

	describe("integration tests", () => {
		it("should handle burst then backoff", async () => {
			const fn = vi.fn(async () => "result");

			const limiter = new RateLimiter({
				maxRequests: 2,
				interval: 100,
				strategy: "queue",
			});

			// Burst of 4 requests
			const promises = Array.from({ length: 4 }, () => limiter.execute(fn));
			const results = await Promise.all(promises);

			expect(results.length).toBe(4);
			expect(fn).toHaveBeenCalledTimes(4);
		});

		it("should rate limit with wrap", async () => {
			const getBalance = vi.fn(async (address: string) => `balance-${address}`);

			const limiter = new RateLimiter({
				maxRequests: 3,
				interval: 100,
			});

			const wrappedGetBalance = limiter.wrap(getBalance);

			const results = await Promise.all([
				wrappedGetBalance("0x1"),
				wrappedGetBalance("0x2"),
				wrappedGetBalance("0x3"),
				wrappedGetBalance("0x4"),
			]);

			expect(results).toHaveLength(4);
		});
	});
});
