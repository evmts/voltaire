import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.equals", () => {
	describe("equal selectors", () => {
		it("returns true for same bytes", () => {
			const a = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const b = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			expect(Selector.equals(a, b)).toBe(true);
		});

		it("returns true for same selector from hex", () => {
			const a = Selector.from("0xa9059cbb");
			const b = Selector.from("0xa9059cbb");
			expect(Selector.equals(a, b)).toBe(true);
		});

		it("returns true for transfer selector from different sources", () => {
			const fromSig = Selector.fromSignature("transfer(address,uint256)");
			const fromHex = Selector.from("0xa9059cbb");
			expect(Selector.equals(fromSig, fromHex)).toBe(true);
		});

		it("returns true for approve selector from different sources", () => {
			const fromSig = Selector.fromSignature("approve(address,uint256)");
			const fromHex = Selector.from("0x095ea7b3");
			expect(Selector.equals(fromSig, fromHex)).toBe(true);
		});

		it("returns true for all zeros", () => {
			const a = Selector.from(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
			const b = Selector.from("0x00000000");
			expect(Selector.equals(a, b)).toBe(true);
		});

		it("returns true for all ones", () => {
			const a = Selector.from(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
			const b = Selector.from("0xffffffff");
			expect(Selector.equals(a, b)).toBe(true);
		});
	});

	describe("different selectors", () => {
		it("returns false for transfer vs approve", () => {
			const transfer = Selector.fromSignature("transfer(address,uint256)");
			const approve = Selector.fromSignature("approve(address,uint256)");
			expect(Selector.equals(transfer, approve)).toBe(false);
		});

		it("returns false for different bytes", () => {
			const a = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const b = Selector.from(new Uint8Array([0x09, 0x5e, 0xa7, 0xb3]));
			expect(Selector.equals(a, b)).toBe(false);
		});

		it("returns false for off-by-one", () => {
			const a = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const b = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbc]));
			expect(Selector.equals(a, b)).toBe(false);
		});

		it("returns false for different in first byte", () => {
			const a = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const b = Selector.from(new Uint8Array([0xaa, 0x05, 0x9c, 0xbb]));
			expect(Selector.equals(a, b)).toBe(false);
		});

		it("returns false for different in middle bytes", () => {
			const a = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
			const b = Selector.from(new Uint8Array([0xa9, 0x06, 0x9c, 0xbb]));
			expect(Selector.equals(a, b)).toBe(false);
		});
	});

	describe("common ERC-20 selectors", () => {
		it("distinguishes transfer from approve", () => {
			const transfer = Selector.fromSignature("transfer(address,uint256)");
			const approve = Selector.fromSignature("approve(address,uint256)");
			expect(Selector.equals(transfer, approve)).toBe(false);
		});

		it("distinguishes balanceOf from totalSupply", () => {
			const balanceOf = Selector.fromSignature("balanceOf(address)");
			const totalSupply = Selector.fromSignature("totalSupply()");
			expect(Selector.equals(balanceOf, totalSupply)).toBe(false);
		});

		it("distinguishes transferFrom from transfer", () => {
			const transferFrom = Selector.fromSignature(
				"transferFrom(address,address,uint256)",
			);
			const transfer = Selector.fromSignature("transfer(address,uint256)");
			expect(Selector.equals(transferFrom, transfer)).toBe(false);
		});
	});

	describe("reflexive property", () => {
		it("selector equals itself", () => {
			const selector = Selector.fromSignature("transfer(address,uint256)");
			expect(Selector.equals(selector, selector)).toBe(true);
		});
	});

	describe("symmetric property", () => {
		it("equals is symmetric", () => {
			const a = Selector.from("0xa9059cbb");
			const b = Selector.from("0xa9059cbb");
			expect(Selector.equals(a, b)).toBe(Selector.equals(b, a));
		});

		it("not equals is symmetric", () => {
			const a = Selector.from("0xa9059cbb");
			const b = Selector.from("0x095ea7b3");
			expect(Selector.equals(a, b)).toBe(Selector.equals(b, a));
		});
	});
});
