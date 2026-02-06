import { describe, expect, it } from "vitest";
import * as ReturnData from "../ReturnData/index.js";
import type * as RevertReason from "../RevertReason/index.js";
import * as ContractResult from "./index.js";

describe("ContractResult", () => {
	describe("success", () => {
		it("creates successful result", () => {
			const data = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(data);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe(data);
			}
		});
	});

	describe("failure", () => {
		it("creates failed result", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			const result = ContractResult.failure(revertReason);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.revertReason).toBe(revertReason);
			}
		});
	});

	describe("from", () => {
		it("creates success result from flag and data", () => {
			const result = ContractResult.from(true, "0x00000001");

			expect(result.success).toBe(true);
			if (result.success) {
				expect(ReturnData.toHex(result.data)).toBe("0x00000001");
			}
		});

		it("creates failure result from flag and revert data", () => {
			// Error(string) "Test"
			const hex =
				"0x08c379a0" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000004" +
				"5465737400000000000000000000000000000000000000000000000000000000"; // "Test"

			const result = ContractResult.from(false, hex);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.revertReason.type).toBe("Error");
				if (result.revertReason.type === "Error") {
					expect(result.revertReason.message).toBe("Test");
				}
			}
		});

		it("accepts Uint8Array", () => {
			const bytes = new Uint8Array([0, 0, 0, 1]);
			const result = ContractResult.from(true, bytes);

			expect(result.success).toBe(true);
		});

		it("accepts ReturnData", () => {
			const returnData = ReturnData.fromHex("0x00000001");
			const result = ContractResult.from(true, returnData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe(returnData);
			}
		});
	});

	describe("isSuccess", () => {
		it("returns true for success result", () => {
			const data = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(data);

			expect(ContractResult.isSuccess(result)).toBe(true);
		});

		it("returns false for failure result", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test",
			};
			const result = ContractResult.failure(revertReason);

			expect(ContractResult.isSuccess(result)).toBe(false);
		});

		it("narrows type correctly", () => {
			const result = ContractResult.from(true, "0x00000001");

			if (ContractResult.isSuccess(result)) {
				// TypeScript should know result.data exists
				expect(result.data).toBeDefined();
			}
		});
	});

	describe("isFailure", () => {
		it("returns true for failure result", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test",
			};
			const result = ContractResult.failure(revertReason);

			expect(ContractResult.isFailure(result)).toBe(true);
		});

		it("returns false for success result", () => {
			const data = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(data);

			expect(ContractResult.isFailure(result)).toBe(false);
		});

		it("narrows type correctly", () => {
			const result = ContractResult.from(false, "0x");

			if (ContractResult.isFailure(result)) {
				// TypeScript should know result.revertReason exists
				expect(result.revertReason).toBeDefined();
			}
		});
	});

	describe("unwrap", () => {
		it("returns data for success result", () => {
			const data = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(data);

			const unwrapped = ContractResult.unwrap(result);
			expect(unwrapped).toBe(data);
		});

		it("throws ContractRevertError for failure result", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			const result = ContractResult.failure(revertReason);

			expect(() => ContractResult.unwrap(result)).toThrow(
				ContractResult.ContractRevertError,
			);
		});

		it("error contains revert reason", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			const result = ContractResult.failure(revertReason);

			try {
				ContractResult.unwrap(result);
				expect.fail("Should have thrown");
			} catch (error) {
				if (error instanceof ContractResult.ContractRevertError) {
					expect(error.revertReason).toEqual(revertReason);
					expect(error.message).toContain("Test error");
				} else {
					throw error;
				}
			}
		});

		it("error message includes panic code", () => {
			const revertReason: RevertReason.PanicRevertReason = {
				type: "Panic",
				code: 0x11,
				description: "Arithmetic overflow/underflow",
			};
			const result = ContractResult.failure(revertReason);

			try {
				ContractResult.unwrap(result);
				expect.fail("Should have thrown");
			} catch (error) {
				if (error instanceof ContractResult.ContractRevertError) {
					expect(error.message).toContain("Panic(0x11)");
					expect(error.message).toContain("Arithmetic overflow/underflow");
				} else {
					throw error;
				}
			}
		});
	});

	describe("unwrapOr", () => {
		it("returns data for success result", () => {
			const data = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(data);
			const defaultData = ReturnData.fromHex("0xffffffff");

			const unwrapped = ContractResult.unwrapOr(result, defaultData);
			expect(unwrapped).toBe(data);
		});

		it("returns default for failure result", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			const result = ContractResult.failure(revertReason);
			const defaultData = ReturnData.fromHex("0xffffffff");

			const unwrapped = ContractResult.unwrapOr(result, defaultData);
			expect(unwrapped).toBe(defaultData);
		});

		it("does not throw on failure", () => {
			const revertReason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			const result = ContractResult.failure(revertReason);
			const defaultData = ReturnData.fromHex("0x");

			expect(() => ContractResult.unwrapOr(result, defaultData)).not.toThrow();
		});
	});

	describe("integration", () => {
		it("full success flow", () => {
			const returnData = ReturnData.fromHex("0x00000001");
			const result = ContractResult.success(returnData);

			expect(ContractResult.isSuccess(result)).toBe(true);
			const data = ContractResult.unwrap(result);
			expect(ReturnData.toHex(data)).toBe("0x00000001");
		});

		it("full failure flow with Error", () => {
			const hex =
				"0x08c379a0" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000014" + // length = 20
				"496e73756666696369656e742062616c616e6365000000000000000000000000"; // "Insufficient balance"

			const result = ContractResult.from(false, hex);

			expect(ContractResult.isFailure(result)).toBe(true);

			try {
				ContractResult.unwrap(result);
				expect.fail("Should have thrown");
			} catch (error) {
				if (error instanceof ContractResult.ContractRevertError) {
					expect(error.revertReason.type).toBe("Error");
					if (error.revertReason.type === "Error") {
						expect(error.revertReason.message).toBe("Insufficient balance");
					}
				} else {
					throw error;
				}
			}
		});

		it("full failure flow with Panic", () => {
			const hex =
				"0x4e487b71" +
				"0000000000000000000000000000000000000000000000000000000000000011";

			const result = ContractResult.from(false, hex);

			expect(ContractResult.isFailure(result)).toBe(true);

			if (ContractResult.isFailure(result)) {
				expect(result.revertReason.type).toBe("Panic");
				if (result.revertReason.type === "Panic") {
					expect(result.revertReason.code).toBe(0x11);
				}
			}
		});
	});
});
