import { describe, expect, it } from "vitest";
import { CallData } from "./index.js";
import type { CallDataType } from "./CallDataType.js";
import {
	InvalidCallDataLengthError,
	InvalidHexFormatError,
	InvalidValueError,
} from "./errors.js";

describe("CallData", () => {
	// Known transfer selector: keccak256("transfer(address,uint256)")[0:4] = 0xa9059cbb
	const TRANSFER_SELECTOR = "0xa9059cbb";
	const TRANSFER_SELECTOR_BYTES = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);

	// Sample transfer calldata: transfer(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 1e18)
	const SAMPLE_CALLDATA =
		"0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000";

	describe("from()", () => {
		it("creates CallData from hex string with 0x prefix", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR);
			expect(calldata).toBeInstanceOf(Uint8Array);
			expect(calldata.length).toBe(4);
		});

		it("creates CallData from hex string without 0x prefix", () => {
			const calldata = CallData.from("a9059cbb");
			expect(calldata.length).toBe(4);
		});

		it("creates CallData from Uint8Array", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR_BYTES);
			expect(calldata.length).toBe(4);
		});

		it("returns same instance if already CallData (idempotent)", () => {
			const calldata1 = CallData.from(TRANSFER_SELECTOR);
			const calldata2 = CallData.from(calldata1);
			expect(calldata1).toBe(calldata2);
		});

		it("throws on invalid hex characters", () => {
			expect(() => CallData.from("0xGGGG")).toThrow();
		});

		it("throws on calldata shorter than 4 bytes", () => {
			expect(() => CallData.from("0x1234")).toThrow(InvalidCallDataLengthError);
		});

		it("throws on unsupported value type", () => {
			expect(() => CallData.from(123 as any)).toThrow(InvalidValueError);
		});
	});

	describe("fromHex()", () => {
		it("creates CallData from hex string", () => {
			const calldata = CallData.fromHex(SAMPLE_CALLDATA);
			expect(calldata.length).toBe(68); // 4 + 32 + 32
		});

		it("handles hex without 0x prefix", () => {
			const calldata = CallData.fromHex("a9059cbb");
			expect(CallData.toHex(calldata)).toBe("0xa9059cbb");
		});

		it("throws on invalid hex", () => {
			expect(() => CallData.fromHex("0xZZZZ")).toThrow(InvalidHexFormatError);
		});
	});

	describe("fromBytes()", () => {
		it("creates CallData from Uint8Array", () => {
			const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb, 0x00]);
			const calldata = CallData.fromBytes(bytes);
			expect(calldata.length).toBe(5);
		});

		it("throws on bytes shorter than 4", () => {
			expect(() => CallData.fromBytes(new Uint8Array([0xa9, 0x05]))).toThrow(
				InvalidCallDataLengthError,
			);
		});
	});

	describe("toHex()", () => {
		it("converts CallData to hex string with 0x prefix", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR_BYTES);
			expect(CallData.toHex(calldata)).toBe("0xa9059cbb");
		});

		it("produces lowercase hex", () => {
			const calldata = CallData.from("0xA9059CBB");
			expect(CallData.toHex(calldata)).toBe("0xa9059cbb");
		});

		it("works as instance method", () => {
			const calldata = CallData(TRANSFER_SELECTOR);
			expect(calldata.toHex()).toBe("0xa9059cbb");
		});
	});

	describe("toBytes()", () => {
		it("returns underlying Uint8Array", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR);
			const bytes = CallData.toBytes(calldata);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(4);
		});

		it("shares same buffer (zero-copy)", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR);
			const bytes = CallData.toBytes(calldata);
			expect(bytes.buffer).toBe(calldata.buffer);
		});

		it("works as instance method", () => {
			const calldata = CallData(TRANSFER_SELECTOR);
			expect(calldata.toBytes().length).toBe(4);
		});
	});

	describe("getSelector()", () => {
		it("extracts first 4 bytes as selector", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			const selector = CallData.getSelector(calldata);
			expect(selector.length).toBe(4);
			expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
		});

		it("returns view (not copy) of first 4 bytes", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			const selector = CallData.getSelector(calldata);
			expect(selector.buffer).toBe(calldata.buffer);
		});

		it("works as instance method", () => {
			const calldata = CallData(SAMPLE_CALLDATA);
			const selector = calldata.getSelector();
			expect(selector.length).toBe(4);
		});
	});

	describe("hasSelector()", () => {
		it("returns true for matching hex selector", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.hasSelector(calldata, "0xa9059cbb")).toBe(true);
		});

		it("returns true for matching hex selector without prefix", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.hasSelector(calldata, "a9059cbb")).toBe(true);
		});

		it("returns true for matching byte selector", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.hasSelector(calldata, TRANSFER_SELECTOR_BYTES)).toBe(
				true,
			);
		});

		it("returns false for non-matching selector", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.hasSelector(calldata, "0x095ea7b3")).toBe(false);
		});

		it("returns false for wrong-length selector", () => {
			const calldata = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.hasSelector(calldata, "0xa905")).toBe(false);
		});

		it("works as instance method", () => {
			const calldata = CallData(SAMPLE_CALLDATA);
			expect(calldata.hasSelector("0xa9059cbb")).toBe(true);
		});
	});

	describe("equals()", () => {
		it("returns true for identical calldata", () => {
			const calldata1 = CallData.from(SAMPLE_CALLDATA);
			const calldata2 = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.equals(calldata1, calldata2)).toBe(true);
		});

		it("returns false for different calldata", () => {
			const calldata1 = CallData.from(TRANSFER_SELECTOR);
			const calldata2 = CallData.from("0x095ea7b3");
			expect(CallData.equals(calldata1, calldata2)).toBe(false);
		});

		it("returns false for different lengths", () => {
			const calldata1 = CallData.from(TRANSFER_SELECTOR);
			const calldata2 = CallData.from(SAMPLE_CALLDATA);
			expect(CallData.equals(calldata1, calldata2)).toBe(false);
		});

		it("works as instance method", () => {
			const calldata1 = CallData(TRANSFER_SELECTOR);
			const calldata2 = CallData(TRANSFER_SELECTOR);
			expect(calldata1.equals(calldata2)).toBe(true);
		});
	});

	describe("is()", () => {
		it("returns true for CallData instance", () => {
			const calldata = CallData.from(TRANSFER_SELECTOR);
			expect(CallData.is(calldata)).toBe(true);
		});

		it("returns false for plain Uint8Array", () => {
			const bytes = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			expect(CallData.is(bytes)).toBe(false);
		});

		it("returns false for string", () => {
			expect(CallData.is(TRANSFER_SELECTOR)).toBe(false);
		});

		it("returns false for null/undefined", () => {
			expect(CallData.is(null)).toBe(false);
			expect(CallData.is(undefined)).toBe(false);
		});

		it("narrows type in TypeScript", () => {
			const value: unknown = CallData.from(TRANSFER_SELECTOR);
			if (CallData.is(value)) {
				// TypeScript should know value is CallDataType here
				const hex: string = CallData.toHex(value);
				expect(hex).toBe("0xa9059cbb");
			}
		});
	});

	describe("isValid()", () => {
		it("returns true for valid hex string (4+ bytes)", () => {
			expect(CallData.isValid("0xa9059cbb")).toBe(true);
			expect(CallData.isValid("a9059cbb")).toBe(true);
			expect(CallData.isValid(SAMPLE_CALLDATA)).toBe(true);
		});

		it("returns false for hex string too short", () => {
			expect(CallData.isValid("0xa905")).toBe(false);
			expect(CallData.isValid("0x1234")).toBe(false);
		});

		it("returns false for invalid hex characters", () => {
			expect(CallData.isValid("0xGGGG")).toBe(false);
			expect(CallData.isValid("0xzzzz")).toBe(false);
		});

		it("returns false for odd-length hex", () => {
			expect(CallData.isValid("0xa9059cb")).toBe(false);
		});

		it("returns true for valid Uint8Array (4+ bytes)", () => {
			expect(CallData.isValid(new Uint8Array(4))).toBe(true);
			expect(CallData.isValid(new Uint8Array(100))).toBe(true);
		});

		it("returns false for Uint8Array too short", () => {
			expect(CallData.isValid(new Uint8Array(3))).toBe(false);
			expect(CallData.isValid(new Uint8Array(0))).toBe(false);
		});

		it("returns false for non-string/non-Uint8Array", () => {
			expect(CallData.isValid(null)).toBe(false);
			expect(CallData.isValid(undefined)).toBe(false);
			expect(CallData.isValid(123)).toBe(false);
			expect(CallData.isValid({})).toBe(false);
		});
	});

	describe("encode()", () => {
		it("encodes function call with no parameters", () => {
			// totalSupply() selector: 0x18160ddd
			const calldata = CallData.encode("totalSupply()", []);
			expect(calldata.length).toBe(4);
		});

		it("encodes function call with address parameter", () => {
			// balanceOf(address) selector: 0x70a08231
			const calldata = CallData.encode("balanceOf(address)", [
				"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			]);
			expect(calldata.length).toBe(4 + 32); // selector + 1 word
		});

		it("encodes function call with multiple parameters", () => {
			const calldata = CallData.encode("transfer(address,uint256)", [
				"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
				1000000000000000000n,
			]);
			expect(calldata.length).toBe(4 + 32 + 32); // selector + 2 words
			// Verify selector matches known transfer selector
			expect(CallData.hasSelector(calldata, "0xa9059cbb")).toBe(true);
		});

		it("throws on parameter count mismatch", () => {
			expect(() =>
				CallData.encode("transfer(address,uint256)", ["0x70997970..."]),
			).toThrow("Parameter count mismatch");
		});

		it("throws on invalid signature format", () => {
			expect(() => CallData.encode("invalid", [])).toThrow(
				"Invalid function signature",
			);
		});
	});

	describe("decode()", () => {
		const abi = [
			{
				name: "transfer",
				type: "function" as const,
				inputs: [
					{ name: "to", type: "address" },
					{ name: "amount", type: "uint256" },
				],
			},
			{
				name: "balanceOf",
				type: "function" as const,
				inputs: [{ name: "account", type: "address" }],
			},
		];

		it("decodes calldata with ABI", () => {
			const calldata = CallData.encode("transfer(address,uint256)", [
				"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
				1000000000000000000n,
			]);

			const decoded = CallData.decode(calldata, abi as any);

			expect(decoded.signature).toBe("transfer(address,uint256)");
			expect(decoded.selector.length).toBe(4);
			expect(decoded.parameters.length).toBe(2);
			expect((decoded.parameters[0] as string).toLowerCase()).toBe(
				"0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
			);
			expect(decoded.parameters[1]).toBe(1000000000000000000n);
		});

		it("throws on unknown selector", () => {
			const calldata = CallData.from("0x12345678");
			expect(() => CallData.decode(calldata, abi as any)).toThrow(
				"Function not found in ABI",
			);
		});
	});

	describe("constructor function CallData()", () => {
		it("creates CallData with prototype methods", () => {
			const calldata = CallData(TRANSFER_SELECTOR);
			expect(typeof calldata.toHex).toBe("function");
			expect(typeof calldata.toBytes).toBe("function");
			expect(typeof calldata.getSelector).toBe("function");
			expect(typeof calldata.hasSelector).toBe("function");
			expect(typeof calldata.equals).toBe("function");
		});

		it("inherits from Uint8Array", () => {
			const calldata = CallData(TRANSFER_SELECTOR);
			expect(calldata).toBeInstanceOf(Uint8Array);
			expect(calldata.length).toBe(4);
			expect(calldata[0]).toBe(0xa9);
		});
	});

	describe("constants", () => {
		it("exports MIN_SIZE as 4", () => {
			expect(CallData.MIN_SIZE).toBe(4);
		});

		it("exports SELECTOR_SIZE as 4", () => {
			expect(CallData.SELECTOR_SIZE).toBe(4);
		});
	});
});
