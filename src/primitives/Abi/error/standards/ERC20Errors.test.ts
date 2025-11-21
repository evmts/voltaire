import { describe, expect, it } from "vitest";
import * as Selector from "../../../Selector/index.js";
import { GetSelector } from "../getSelector.js";
import { keccak256String } from "../../../Hash/BrandedHashIndex.js";
import * as ERC20 from "./ERC20Errors.js";

const getSelector = GetSelector({ keccak256String });

describe("ERC20Errors", () => {
	it("should have correct selector for ERC20InsufficientBalance", () => {
		const selector = getSelector(ERC20.ERC20InsufficientBalance);
		// error ERC20InsufficientBalance(address,uint256,uint256)
		const expected = Selector.fromSignature(
			"ERC20InsufficientBalance(address,uint256,uint256)",
		);
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC20InvalidSender", () => {
		const selector = getSelector(ERC20.ERC20InvalidSender);
		// error ERC20InvalidSender(address)
		const expected = Selector.fromSignature("ERC20InvalidSender(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC20InvalidReceiver", () => {
		const selector = getSelector(ERC20.ERC20InvalidReceiver);
		// error ERC20InvalidReceiver(address)
		const expected = Selector.fromSignature("ERC20InvalidReceiver(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC20InsufficientAllowance", () => {
		const selector = getSelector(ERC20.ERC20InsufficientAllowance);
		// error ERC20InsufficientAllowance(address,uint256,uint256)
		const expected = Selector.fromSignature(
			"ERC20InsufficientAllowance(address,uint256,uint256)",
		);
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC20InvalidApprover", () => {
		const selector = getSelector(ERC20.ERC20InvalidApprover);
		// error ERC20InvalidApprover(address)
		const expected = Selector.fromSignature("ERC20InvalidApprover(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct selector for ERC20InvalidSpender", () => {
		const selector = getSelector(ERC20.ERC20InvalidSpender);
		// error ERC20InvalidSpender(address)
		const expected = Selector.fromSignature("ERC20InvalidSpender(address)");
		expect(Selector.toHex(selector)).toBe(Selector.toHex(expected));
	});

	it("should have correct error structure", () => {
		expect(ERC20.ERC20InsufficientBalance).toEqual({
			type: "error",
			name: "ERC20InsufficientBalance",
			inputs: [
				{ name: "sender", type: "address" },
				{ name: "balance", type: "uint256" },
				{ name: "needed", type: "uint256" },
			],
		});
	});
});
