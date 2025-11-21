import { describe, expect, it } from "vitest";
import * as Selector from "../../../Selector/index.js";
import { GetSelector } from "../getSelector.js";
import { keccak256String } from "../../../Hash/BrandedHashIndex.js";
import * as ERC1155 from "./ERC1155Errors.js";

const getSelector = GetSelector({ keccak256String });

describe("ERC1155Errors", () => {
	it("should have correct selector for ERC1155InsufficientBalance", () => {
		const selector = getSelector(ERC1155.ERC1155InsufficientBalance);
		const expected = Selector.fromSignature(
			"ERC1155InsufficientBalance(address,uint256,uint256,uint256)",
		);
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155InvalidSender", () => {
		const selector = getSelector(ERC1155.ERC1155InvalidSender);
		const expected = Selector.fromSignature("ERC1155InvalidSender(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155InvalidReceiver", () => {
		const selector = getSelector(ERC1155.ERC1155InvalidReceiver);
		const expected = Selector.fromSignature("ERC1155InvalidReceiver(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155MissingApprovalForAll", () => {
		const selector = getSelector(ERC1155.ERC1155MissingApprovalForAll);
		const expected = Selector.fromSignature(
			"ERC1155MissingApprovalForAll(address,address)",
		);
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155InvalidApprover", () => {
		const selector = getSelector(ERC1155.ERC1155InvalidApprover);
		const expected = Selector.fromSignature("ERC1155InvalidApprover(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155InvalidOperator", () => {
		const selector = getSelector(ERC1155.ERC1155InvalidOperator);
		const expected = Selector.fromSignature("ERC1155InvalidOperator(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC1155InvalidArrayLength", () => {
		const selector = getSelector(ERC1155.ERC1155InvalidArrayLength);
		const expected = Selector.fromSignature(
			"ERC1155InvalidArrayLength(uint256,uint256)",
		);
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct error structure", () => {
		expect(ERC1155.ERC1155InsufficientBalance).toEqual({
			type: "error",
			name: "ERC1155InsufficientBalance",
			inputs: [
				{ name: "sender", type: "address" },
				{ name: "balance", type: "uint256" },
				{ name: "needed", type: "uint256" },
				{ name: "tokenId", type: "uint256" },
			],
		});
	});
});
