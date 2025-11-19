import { describe, it, expect } from "vitest";
import * as TransactionStatus from "./index.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";

describe("TransactionStatus", () => {
	describe("pending", () => {
		it("creates pending status", () => {
			const status = TransactionStatus.pending();
			expect(status.type).toBe("pending");
			expect(TransactionStatus.isPending(status)).toBe(true);
			expect(TransactionStatus.isSuccess(status)).toBe(false);
			expect(TransactionStatus.isFailed(status)).toBe(false);
		});
	});

	describe("success", () => {
		it("creates success status", () => {
			const gasUsed = 21000n as Uint256Type;
			const status = TransactionStatus.success(gasUsed);
			expect(status.type).toBe("success");
			expect(TransactionStatus.isSuccess(status)).toBe(true);
			expect(TransactionStatus.isPending(status)).toBe(false);
			expect(TransactionStatus.isFailed(status)).toBe(false);
			if (TransactionStatus.isSuccess(status)) {
				expect(status.gasUsed).toBe(gasUsed);
			}
		});
	});

	describe("failed", () => {
		it("creates failed status without reason", () => {
			const status = TransactionStatus.failed();
			expect(status.type).toBe("failed");
			expect(TransactionStatus.isFailed(status)).toBe(true);
			expect(TransactionStatus.isPending(status)).toBe(false);
			expect(TransactionStatus.isSuccess(status)).toBe(false);
		});

		it("creates failed status with reason", () => {
			const status = TransactionStatus.failed("out of gas");
			expect(status.type).toBe("failed");
			expect(TransactionStatus.isFailed(status)).toBe(true);
			if (TransactionStatus.isFailed(status)) {
				expect(status.revertReason).toBe("out of gas");
			}
		});
	});
});
