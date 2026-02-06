import { describe, expect, it } from "@effect/vitest";
import { TransactionStreamError } from "./TransactionStreamError.js";

describe("TransactionStreamError", () => {
	describe("constructor", () => {
		it("creates error with message", () => {
			const error = new TransactionStreamError("Transaction stream failed");
			expect(error.message).toBe("Transaction stream failed");
			expect(error.name).toBe("TransactionStreamError");
			expect(error._tag).toBe("TransactionStreamError");
		});

		it("creates error with cause", () => {
			const originalError = new Error("Network timeout");
			const error = new TransactionStreamError("Transaction polling failed", {
				cause: originalError,
			});
			expect(error.cause).toBe(originalError);
		});

		it("creates error with context", () => {
			const context = {
				txHash: "0xabc123",
				confirmations: 3,
				targetConfirmations: 12,
			};
			const error = new TransactionStreamError("Confirmation timeout", {
				context,
			});
			expect(
				(error as unknown as { context: Record<string, unknown> }).context,
			).toEqual(context);
		});

		it("creates error with both cause and context", () => {
			const originalError = new Error("RPC error");
			const context = { method: "eth_getTransactionReceipt" };
			const error = new TransactionStreamError("Receipt fetch failed", {
				cause: originalError,
				context,
			});
			expect(error.cause).toBe(originalError);
			expect(
				(error as unknown as { context: Record<string, unknown> }).context,
			).toEqual(context);
		});
	});

	describe("instanceof checks", () => {
		it("TransactionStreamError is instanceof Error", () => {
			const error = new TransactionStreamError("Error");
			expect(error instanceof Error).toBe(true);
		});

		it("TransactionStreamError is instanceof TransactionStreamError", () => {
			const error = new TransactionStreamError("Error");
			expect(error instanceof TransactionStreamError).toBe(true);
		});
	});

	describe("stack trace", () => {
		it("has stack trace", () => {
			const error = new TransactionStreamError("Error");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("TransactionStreamError");
		});
	});

	describe("edge cases", () => {
		it("handles empty message", () => {
			const error = new TransactionStreamError("");
			expect(error.message).toBe("");
		});

		it("handles long error messages", () => {
			const longMessage = "B".repeat(500);
			const error = new TransactionStreamError(longMessage);
			expect(error.message).toBe(longMessage);
		});

		it("handles undefined options", () => {
			const error = new TransactionStreamError("Error", undefined);
			expect(error.message).toBe("Error");
			expect(error.cause).toBeUndefined();
		});

		it("handles empty context", () => {
			const error = new TransactionStreamError("Error", { context: {} });
			expect(
				(error as unknown as { context: Record<string, unknown> }).context,
			).toEqual({});
		});
	});

	describe("common transaction stream scenarios", () => {
		it("represents transaction dropped/replaced error", () => {
			const error = new TransactionStreamError(
				"Transaction was dropped or replaced",
				{
					context: {
						originalTxHash: "0x111",
						replacementTxHash: "0x222",
					},
				},
			);
			expect(error.message).toContain("dropped or replaced");
		});

		it("represents confirmation timeout error", () => {
			const error = new TransactionStreamError(
				"Transaction confirmation timeout",
				{
					context: {
						txHash: "0xabc",
						waitedBlocks: 100,
						targetConfirmations: 12,
					},
				},
			);
			expect(error.message).toContain("timeout");
		});

		it("represents reverted transaction error", () => {
			const error = new TransactionStreamError("Transaction reverted", {
				context: {
					txHash: "0xdef",
					revertReason: "ERC20: transfer amount exceeds balance",
				},
			});
			expect(error.message).toBe("Transaction reverted");
		});
	});
});
