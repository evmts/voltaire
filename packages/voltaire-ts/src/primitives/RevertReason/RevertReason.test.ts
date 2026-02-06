import { describe, expect, it } from "vitest";
import * as ReturnData from "../ReturnData/index.js";
import * as RevertReason from "./index.js";

describe("RevertReason", () => {
	describe("fromReturnData - Error(string)", () => {
		it("decodes Error(string) revert", () => {
			// Error(string) "Insufficient balance"
			// Selector: 0x08c379a0
			// Offset: 0x20 (32)
			// Length: 0x14 (20)
			// Data: "Insufficient balance" (20 bytes)
			const hex =
				"0x08c379a0" + // selector
				"0000000000000000000000000000000000000000000000000000000000000020" + // offset
				"0000000000000000000000000000000000000000000000000000000000000014" + // length = 20
				"496e73756666696369656e742062616c616e6365000000000000000000000000"; // "Insufficient balance"

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Error");
			if (reason.type === "Error") {
				expect(reason.message).toBe("Insufficient balance");
			}
		});

		it("decodes empty Error(string)", () => {
			const hex =
				"0x08c379a0" + // selector
				"0000000000000000000000000000000000000000000000000000000000000020" + // offset
				"0000000000000000000000000000000000000000000000000000000000000000"; // length = 0

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Error");
			if (reason.type === "Error") {
				expect(reason.message).toBe("");
			}
		});
	});

	describe("fromReturnData - Panic(uint256)", () => {
		it("decodes Panic with overflow code (0x11)", () => {
			const hex =
				"0x4e487b71" + // selector
				"0000000000000000000000000000000000000000000000000000000000000011"; // code = 0x11

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Panic");
			if (reason.type === "Panic") {
				expect(reason.code).toBe(0x11);
				expect(reason.description).toBe("Arithmetic overflow/underflow");
			}
		});

		it("decodes Panic with division by zero (0x12)", () => {
			const hex =
				"0x4e487b71" + // selector
				"0000000000000000000000000000000000000000000000000000000000000012"; // code = 0x12

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Panic");
			if (reason.type === "Panic") {
				expect(reason.code).toBe(0x12);
				expect(reason.description).toBe("Division by zero");
			}
		});

		it("decodes Panic with assertion failed (0x01)", () => {
			const hex =
				"0x4e487b71" + // selector
				"0000000000000000000000000000000000000000000000000000000000000001"; // code = 0x01

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Panic");
			if (reason.type === "Panic") {
				expect(reason.code).toBe(0x01);
				expect(reason.description).toBe("Assertion failed");
			}
		});

		it("handles unknown panic code", () => {
			const hex =
				"0x4e487b71" + // selector
				"00000000000000000000000000000000000000000000000000000000000000ff"; // code = 0xff

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Panic");
			if (reason.type === "Panic") {
				expect(reason.code).toBe(0xff);
				expect(reason.description).toContain("Unknown panic code");
			}
		});
	});

	describe("fromReturnData - Custom error", () => {
		it("decodes custom error", () => {
			// Custom error: MyError(uint256,address)
			// Selector: 0x12345678
			const hex =
				"0x12345678" + // custom selector
				"0000000000000000000000000000000000000000000000000000000000000123" + // uint256
				"000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3"; // address

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Custom");
			if (reason.type === "Custom") {
				expect(reason.selector).toBe("0x12345678");
				expect(reason.data.length).toBe(64); // 2 * 32 bytes
			}
		});

		it("handles custom error with no data", () => {
			const hex = "0xabcdef00"; // custom selector only

			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Custom");
			if (reason.type === "Custom") {
				expect(reason.selector).toBe("0xabcdef00");
				expect(reason.data.length).toBe(0);
			}
		});
	});

	describe("fromReturnData - Unknown", () => {
		it("handles empty data", () => {
			const returnData = ReturnData.fromHex("0x");
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Unknown");
			if (reason.type === "Unknown") {
				expect(reason.data.length).toBe(0);
			}
		});

		it("handles data shorter than 4 bytes", () => {
			const returnData = ReturnData.fromHex("0x1234");
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Unknown");
			if (reason.type === "Unknown") {
				expect(reason.data.length).toBe(2);
			}
		});

		it("handles malformed Error(string)", () => {
			// Error selector but truncated data
			const hex = "0x08c379a00000";
			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Unknown");
		});

		it("handles malformed Panic(uint256)", () => {
			// Panic selector but truncated data
			const hex = "0x4e487b710000";
			const returnData = ReturnData.fromHex(hex);
			const reason = RevertReason.fromReturnData(returnData);

			expect(reason.type).toBe("Unknown");
		});
	});

	describe("from", () => {
		it("accepts hex string", () => {
			const hex =
				"0x08c379a0" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000000";
			const reason = RevertReason.from(hex);
			expect(reason.type).toBe("Error");
		});

		it("accepts Uint8Array", () => {
			const bytes = new Uint8Array([0x08, 0xc3, 0x79, 0xa0]);
			const reason = RevertReason.from(bytes);
			expect(reason.type).toBe("Unknown"); // too short
		});

		it("accepts ReturnData", () => {
			const returnData = ReturnData.fromHex("0x");
			const reason = RevertReason.from(returnData);
			expect(reason.type).toBe("Unknown");
		});
	});

	describe("toString", () => {
		it("formats Error reason", () => {
			const reason: RevertReason.ErrorRevertReason = {
				type: "Error",
				message: "Test error",
			};
			expect(RevertReason.toString(reason)).toBe("Error: Test error");
		});

		it("formats Panic reason", () => {
			const reason: RevertReason.PanicRevertReason = {
				type: "Panic",
				code: 0x11,
				description: "Arithmetic overflow/underflow",
			};
			expect(RevertReason.toString(reason)).toBe(
				"Panic(0x11): Arithmetic overflow/underflow",
			);
		});

		it("formats Custom reason", () => {
			const reason: RevertReason.CustomRevertReason = {
				type: "Custom",
				selector: "0x12345678",
				data: new Uint8Array(32),
			};
			expect(RevertReason.toString(reason)).toBe(
				"Custom error: 0x12345678 (32 bytes data)",
			);
		});

		it("formats Unknown reason", () => {
			const reason: RevertReason.UnknownRevertReason = {
				type: "Unknown",
				data: new Uint8Array([1, 2, 3]),
			};
			expect(RevertReason.toString(reason)).toBe("Unknown revert: 0x010203");
		});
	});

	describe("constants", () => {
		it("has correct ERROR_SELECTOR", () => {
			expect(RevertReason.ERROR_SELECTOR).toBe("0x08c379a0");
		});

		it("has correct PANIC_SELECTOR", () => {
			expect(RevertReason.PANIC_SELECTOR).toBe("0x4e487b71");
		});

		it("has all panic codes", () => {
			expect(RevertReason.PANIC_CODES[0x00]).toBe("Generic panic");
			expect(RevertReason.PANIC_CODES[0x01]).toBe("Assertion failed");
			expect(RevertReason.PANIC_CODES[0x11]).toBe(
				"Arithmetic overflow/underflow",
			);
			expect(RevertReason.PANIC_CODES[0x12]).toBe("Division by zero");
			expect(RevertReason.PANIC_CODES[0x21]).toBe("Invalid enum value");
			expect(RevertReason.PANIC_CODES[0x22]).toBe("Invalid storage encoding");
			expect(RevertReason.PANIC_CODES[0x31]).toBe("Array pop on empty array");
			expect(RevertReason.PANIC_CODES[0x32]).toBe("Array out of bounds");
			expect(RevertReason.PANIC_CODES[0x41]).toBe("Out of memory");
			expect(RevertReason.PANIC_CODES[0x51]).toBe("Invalid internal function");
		});
	});
});
