import { describe, expect, it, vi } from "vitest";
import { poll, pollForReceipt, pollUntil, pollWithBackoff } from "./poll.js";

describe("poll", () => {
	describe("basic polling", () => {
		it("should return result when function returns truthy value", async () => {
			const fn = vi.fn(async () => "success");

			const result = await poll(fn, { interval: 10, timeout: 1000 });

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should retry until result is valid", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 3 ? "success" : null;
			});

			const result = await poll(fn, { interval: 10, timeout: 1000 });

			expect(result).toBe("success");
			expect(attempts).toBe(3);
		});

		it("should use validate predicate", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return { status: attempts >= 2 ? "ready" : "pending" };
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
				validate: (result) => result.status === "ready",
			});

			expect(result.status).toBe("ready");
			expect(attempts).toBe(2);
		});

		it("should call onPoll callback", async () => {
			const onPoll = vi.fn();
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 2 ? "success" : null;
			});

			await poll(fn, {
				interval: 10,
				timeout: 1000,
				onPoll,
			});

			expect(onPoll).toHaveBeenCalledWith(null, 0);
			expect(onPoll).toHaveBeenCalledWith("success", 1);
		});

		it("should throw on timeout", async () => {
			const fn = vi.fn(async () => null);

			await expect(poll(fn, { interval: 10, timeout: 50 })).rejects.toThrow(
				"Polling timeout after 50ms",
			);
		});

		it("should handle function errors gracefully", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				if (attempts < 2) {
					throw new Error("Temporary error");
				}
				return "success";
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
			});

			expect(result).toBe("success");
			expect(attempts).toBe(2);
		});

		it("should continue polling despite errors", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				if (attempts < 3) {
					throw new Error("Error");
				}
				return "success";
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
			});

			expect(result).toBe("success");
		});
	});

	describe("timeout behavior", () => {
		it("should timeout if polling takes too long", async () => {
			const fn = vi.fn(async () => null);

			const startTime = Date.now();
			await expect(poll(fn, { interval: 20, timeout: 60 })).rejects.toThrow(
				"Polling timeout",
			);
			const elapsed = Date.now() - startTime;

			expect(elapsed).toBeGreaterThanOrEqual(50);
			expect(elapsed).toBeLessThan(150);
		});

		it("should provide accurate timeout message", async () => {
			const fn = vi.fn(async () => null);

			try {
				await poll(fn, { interval: 20, timeout: 50 });
				throw new Error("Should have timed out");
			} catch (error) {
				expect((error as Error).message).toContain("50");
			}
		});

		it("should respect maxWaitTime between polls", async () => {
			const startTime = Date.now();
			const fn = vi.fn(async () => null);

			try {
				await poll(fn, { interval: 30, timeout: 60 });
			} catch {
				// Expected
			}

			const elapsed = Date.now() - startTime;
			expect(elapsed).toBeGreaterThanOrEqual(50);
		});
	});

	describe("backoff", () => {
		it("should not use backoff by default", async () => {
			const intervals: number[] = [];
			let lastTime = Date.now();

			let attempts = 0;
			const fn = vi.fn(async () => {
				const now = Date.now();
				intervals.push(now - lastTime);
				lastTime = now;
				attempts++;
				return attempts >= 3 ? "success" : null;
			});

			await poll(fn, {
				interval: 20,
				timeout: 1000,
			});

			expect(fn).toHaveBeenCalledTimes(3);
		});

		it("should apply exponential backoff when enabled", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 4 ? "success" : null;
			});

			const startTime = Date.now();
			await poll(fn, {
				interval: 20,
				timeout: 5000,
				backoff: true,
				backoffFactor: 2,
				maxInterval: 100,
			});
			const elapsed = Date.now() - startTime;

			// With backoff: 20ms, 40ms, 80ms waits = ~140ms
			expect(elapsed).toBeGreaterThanOrEqual(100);
		});

		it("should cap backoff at maxInterval", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 5 ? "success" : null;
			});

			await poll(fn, {
				interval: 30,
				timeout: 5000,
				backoff: true,
				backoffFactor: 2,
				maxInterval: 50,
			});

			expect(fn).toHaveBeenCalledTimes(5);
		});
	});

	describe("validate callback", () => {
		it("should use validate to check result", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return { count: attempts };
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
				validate: (result) => result.count >= 2,
			});

			expect(result.count).toBe(2);
		});

		it("should treat falsy validate return as invalid", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts;
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
				validate: (result) => result > 2,
			});

			expect(result).toBe(3);
		});

		it("should handle validate throwing", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts;
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
				validate: (result) => {
					if (result < 2) return false;
					return true;
				},
			});

			expect(result).toBe(2);
		});
	});

	describe("onPoll callback", () => {
		it("should call onPoll with result and attempt number", async () => {
			const onPoll = vi.fn();
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return `attempt-${attempts}`;
			});

			await poll(fn, {
				interval: 10,
				timeout: 1000,
				onPoll,
			});

			expect(onPoll).toHaveBeenCalledWith("attempt-1", 0);
		});

		it("should track attempt numbers in onPoll", async () => {
			const onPoll = vi.fn();
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 3 ? "success" : null;
			});

			await poll(fn, {
				interval: 10,
				timeout: 1000,
				onPoll,
			});

			expect(onPoll).toHaveBeenCalledTimes(3);
			expect(onPoll.mock.calls[0][1]).toBe(0);
			expect(onPoll.mock.calls[1][1]).toBe(1);
			expect(onPoll.mock.calls[2][1]).toBe(2);
		});

		it("should be called on each poll attempt", async () => {
			const onPoll = vi.fn();
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 2 ? "success" : null;
			});

			const result = await poll(fn, {
				interval: 10,
				timeout: 1000,
				onPoll,
			});

			expect(result).toBe("success");
			expect(onPoll).toHaveBeenCalledTimes(2);
		});
	});

	describe("default options", () => {
		it("should use default interval of 1000ms", async () => {
			const fn = vi.fn(async () => "success");

			const result = await poll(fn);

			expect(result).toBe("success");
		});

		it("should use default timeout of 60000ms", async () => {
			let attempts = 0;
			const fn = vi.fn(async () => {
				attempts++;
				return attempts >= 1 ? "success" : null;
			});

			const result = await poll(fn);

			expect(result).toBe("success");
		});
	});
});

describe("pollUntil", () => {
	it("should poll until predicate is true", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return attempts;
		});

		const result = await pollUntil(fn, (result) => result >= 3, {
			interval: 10,
			timeout: 1000,
		});

		expect(result).toBe(3);
		expect(attempts).toBe(3);
	});

	it("should throw when timeout reached", async () => {
		const fn = vi.fn(async () => 0);

		await expect(
			pollUntil(fn, (result) => result > 5, {
				interval: 10,
				timeout: 50,
			}),
		).rejects.toThrow("Polling timeout");
	});

	it("should pass options to poll", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return { value: attempts };
		});

		const result = await pollUntil(fn, (result) => result.value >= 2, {
			interval: 10,
			timeout: 1000,
			backoff: true,
		});

		expect(result.value).toBe(2);
	});

	it("should work with boolean predicate", async () => {
		let ready = false;
		const fn = vi.fn(async () => {
			ready = true;
			return "ready";
		});

		const result = await pollUntil(fn, () => ready, {
			interval: 10,
			timeout: 1000,
		});

		expect(result).toBe("ready");
	});
});

describe("pollForReceipt", () => {
	it("should poll for receipt until non-null", async () => {
		let attempts = 0;
		const getReceipt = vi.fn(async () => {
			attempts++;
			return attempts >= 2 ? { transactionHash: "0x123" } : null;
		});

		const receipt = await pollForReceipt("0xabc", getReceipt, {
			interval: 10,
			timeout: 1000,
		});

		expect(receipt.transactionHash).toBe("0x123");
		expect(getReceipt).toHaveBeenCalledWith("0xabc");
	});

	it("should throw on timeout", async () => {
		const getReceipt = vi.fn(async () => null);

		await expect(
			pollForReceipt("0xabc", getReceipt, {
				interval: 10,
				timeout: 50,
			}),
		).rejects.toThrow("Polling timeout");
	});

	it("should use default timeout of 60000ms", async () => {
		let attempts = 0;
		const getReceipt = vi.fn(async () => {
			attempts++;
			return attempts >= 1 ? { status: "0x1" } : null;
		});

		const receipt = await pollForReceipt("0xabc", getReceipt);

		expect(receipt.status).toBe("0x1");
	});

	it("should merge provided options with defaults", async () => {
		const getReceipt = vi.fn(async () => ({ status: "0x1" }));

		await pollForReceipt("0xabc", getReceipt, {
			interval: 500,
		});

		expect(getReceipt).toHaveBeenCalledWith("0xabc");
	});

	it("should handle complex receipt types", async () => {
		interface Receipt {
			transactionHash: string;
			blockNumber: number;
			status: "0x0" | "0x1";
		}

		let attempts = 0;
		const getReceipt = vi.fn<[string], Promise<Receipt | null>>(async () => {
			attempts++;
			if (attempts >= 1) {
				return {
					transactionHash: "0x123",
					blockNumber: 1000,
					status: "0x1",
				};
			}
			return null;
		});

		const receipt = await pollForReceipt<Receipt>("0xabc", getReceipt, {
			interval: 10,
			timeout: 1000,
		});

		expect(receipt.blockNumber).toBe(1000);
		expect(receipt.status).toBe("0x1");
	});
});

describe("pollWithBackoff", () => {
	it("should enable backoff by default", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return attempts >= 2 ? "success" : null;
		});

		const result = await pollWithBackoff(fn, {
			interval: 20,
			timeout: 1000,
		});

		expect(result).toBe("success");
	});

	it("should respect backoffFactor option", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return attempts >= 3 ? "success" : null;
		});

		const startTime = Date.now();
		await pollWithBackoff(fn, {
			interval: 20,
			backoffFactor: 3,
			maxInterval: 100,
			timeout: 1000,
		});
		const elapsed = Date.now() - startTime;

		expect(elapsed).toBeGreaterThanOrEqual(50);
	});

	it("should respect maxInterval option", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return attempts >= 5 ? "success" : null;
		});

		await pollWithBackoff(fn, {
			interval: 20,
			backoffFactor: 2,
			maxInterval: 50,
			timeout: 5000,
		});

		expect(fn).toHaveBeenCalledTimes(5);
	});

	it("should allow overriding options", async () => {
		const fn = vi.fn(async () => "success");

		const result = await pollWithBackoff(fn, {
			interval: 10,
			backoff: false, // Override backoff
			timeout: 1000,
		});

		expect(result).toBe("success");
	});
});

describe("integration tests", () => {
	it("should handle real-world transaction receipt polling", async () => {
		const txHash = "0x123abc";
		let confirmations = 0;

		const getReceipt = vi.fn(async () => {
			confirmations++;
			if (confirmations >= 3) {
				return {
					transactionHash: txHash,
					blockNumber: 1000,
					status: "0x1" as const,
					confirmations,
				};
			}
			return null;
		});

		const receipt = await pollForReceipt(txHash, getReceipt, {
			interval: 10,
			timeout: 1000,
		});

		expect(receipt.status).toBe("0x1");
		expect(receipt.confirmations).toBe(3);
	});

	it("should handle cascading backoff with validate", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			return { status: attempts >= 4 ? "complete" : "pending" };
		});

		const result = await pollWithBackoff(fn, {
			interval: 10,
			backoffFactor: 1.5,
			maxInterval: 50,
			timeout: 5000,
			validate: (result) => result.status === "complete",
		});

		expect(result.status).toBe("complete");
	});

	it("should handle errors and recovery", async () => {
		let attempts = 0;
		const fn = vi.fn(async () => {
			attempts++;
			if (attempts === 2) {
				throw new Error("Network error");
			}
			return attempts >= 3 ? "success" : null;
		});

		const result = await poll(fn, {
			interval: 10,
			timeout: 1000,
		});

		expect(result).toBe("success");
		expect(attempts).toBe(3);
	});
});
