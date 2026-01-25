import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as ContractSignature from "./index.js";

describe("ContractSignature.Struct", () => {
	it("validates input structure", () => {
		const input = {
			hash: new Uint8Array(32).fill(1),
			signature: new Uint8Array(65).fill(2),
			expectedSigner: new Uint8Array(20).fill(3),
			returnData: new Uint8Array(32).fill(4),
		};
		const result = Schema.decodeSync(ContractSignature.Struct)(input);
		expect(result.hash).toEqual(input.hash);
		expect(result.signature).toEqual(input.signature);
	});
});

describe("ERC1271_MAGIC_VALUE", () => {
	it("has correct value", () => {
		expect(ContractSignature.ERC1271_MAGIC_VALUE).toBeDefined();
	});
});

describe("checkReturnData", () => {
	it("returns true for magic value", () => {
		const magicValue = new Uint8Array([0x16, 0x26, 0xba, 0x7e]);
		expect(ContractSignature.checkReturnData(magicValue)).toBe(true);
	});

	it("returns false for wrong value", () => {
		const wrongValue = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
		expect(ContractSignature.checkReturnData(wrongValue)).toBe(false);
	});

	it("returns false for short data", () => {
		const shortData = new Uint8Array([0x16, 0x26]);
		expect(ContractSignature.checkReturnData(shortData)).toBe(false);
	});
});
