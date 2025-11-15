import { describe, it, expect, vi } from "vitest";
import { retryWithBackoff, withRetry } from "./retryWithBackoff.js";

describe("retryWithBackoff", () => {
	it("returns result on first success", async () => {
		const fn = vi.fn().mockResolvedValue("success");

		const result = await retryWithBackoff(fn);

		expect(result).toBe("success");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("retries on failure and eventually succeeds", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail 1"))
			.mockRejectedValueOnce(new Error("fail 2"))
			.mockResolvedValue("success");

		const result = await retryWithBackoff(fn, {
			maxRetries: 3,
			initialDelay: 10,
			jitter: false,
		});

		expect(result).toBe("success");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("throws after max retries exhausted", async () => {
		const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));

		await expect(
			retryWithBackoff(fn, {
				maxRetries: 2,
				initialDelay: 10,
				jitter: false,
			}),
		).rejects.toThrow("persistent failure");

		expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
	});

	it("respects shouldRetry predicate", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("retryable"))
			.mockRejectedValueOnce(new Error("non-retryable"))
			.mockResolvedValue("success");

		await expect(
			retryWithBackoff(fn, {
				maxRetries: 5,
				initialDelay: 10,
				shouldRetry: (error: any) => error.message !== "non-retryable",
			}),
		).rejects.toThrow("non-retryable");

		expect(fn).toHaveBeenCalledTimes(2); // Stopped at non-retryable
	});

	it("calls onRetry callback", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue("success");

		const onRetry = vi.fn();

		await retryWithBackoff(fn, {
			maxRetries: 3,
			initialDelay: 10,
			onRetry,
			jitter: false,
		});

		expect(onRetry).toHaveBeenCalledTimes(1);
		expect(onRetry).toHaveBeenCalledWith(
			expect.any(Error),
			1, // Attempt number
			10, // Delay
		);
	});

	it("implements exponential backoff", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail 1"))
			.mockRejectedValueOnce(new Error("fail 2"))
			.mockRejectedValueOnce(new Error("fail 3"))
			.mockResolvedValue("success");

		const delays: number[] = [];
		const onRetry = vi.fn((_, __, delay) => {
			delays.push(delay);
		});

		await retryWithBackoff(fn, {
			maxRetries: 5,
			initialDelay: 100,
			factor: 2,
			jitter: false,
			onRetry,
		});

		expect(delays).toEqual([100, 200, 400]);
	});

	it("caps delay at maxDelay", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail 1"))
			.mockRejectedValueOnce(new Error("fail 2"))
			.mockRejectedValueOnce(new Error("fail 3"))
			.mockResolvedValue("success");

		const delays: number[] = [];
		const onRetry = vi.fn((_, __, delay) => {
			delays.push(delay);
		});

		await retryWithBackoff(fn, {
			maxRetries: 5,
			initialDelay: 100,
			factor: 3,
			maxDelay: 200,
			jitter: false,
			onRetry,
		});

		expect(delays).toEqual([100, 200, 200]); // Capped at 200
	});

	it("applies jitter when enabled", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail 1"))
			.mockRejectedValueOnce(new Error("fail 2"))
			.mockResolvedValue("success");

		const delays: number[] = [];
		const onRetry = vi.fn((_, __, delay) => {
			delays.push(delay);
		});

		await retryWithBackoff(fn, {
			maxRetries: 3,
			initialDelay: 1000,
			factor: 2,
			jitter: true,
			onRetry,
		});

		// Jitter should make delays different from base exponential
		// Base would be [1000, 2000], jitter applies 0.8-1.2 factor
		expect(delays[0]).toBeGreaterThanOrEqual(800);
		expect(delays[0]).toBeLessThanOrEqual(1200);
		expect(delays[1]).toBeGreaterThanOrEqual(1600);
		expect(delays[1]).toBeLessThanOrEqual(2400);
	});
});

describe("withRetry", () => {
	it("wraps function with retry logic", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue("success");

		const wrapped = withRetry(fn, {
			maxRetries: 3,
			initialDelay: 10,
		});

		const result = await wrapped();

		expect(result).toBe("success");
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("passes arguments through", async () => {
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("fail"))
			.mockResolvedValue("result");

		const wrapped = withRetry((a: string, b: number) => fn(a, b), {
			maxRetries: 3,
			initialDelay: 10,
		});

		await wrapped("test", 123);

		expect(fn).toHaveBeenCalledWith("test", 123);
	});
});
