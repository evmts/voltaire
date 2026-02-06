import { describe, expect, it } from "vitest";
import * as MultiTokenId from "./index.js";

describe("MultiTokenId", () => {
	describe("from", () => {
		it("creates from bigint", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(tokenId).toBe(1n);
		});

		it("creates from number", () => {
			const tokenId = MultiTokenId.from(100);
			expect(tokenId).toBe(100n);
		});

		it("creates from hex string", () => {
			const tokenId = MultiTokenId.from("0xff");
			expect(tokenId).toBe(255n);
		});

		it("creates from decimal string", () => {
			const tokenId = MultiTokenId.from("1000000");
			expect(tokenId).toBe(1000000n);
		});

		it("allows zero", () => {
			const tokenId = MultiTokenId.from(0n);
			expect(tokenId).toBe(0n);
		});

		it("creates fungible token ID", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(tokenId).toBe(1n);
		});

		it("creates non-fungible token ID", () => {
			const tokenId = MultiTokenId.from(2n ** 128n);
			expect(tokenId).toBe(2n ** 128n);
		});

		it("throws on negative value", () => {
			expect(() => MultiTokenId.from(-1n)).toThrow("cannot be negative");
		});

		it("throws on float number", () => {
			expect(() => MultiTokenId.from(1.5)).toThrow("must be an integer");
		});

		it("throws on value exceeding max", () => {
			const overMax = 1n << 256n;
			expect(() => MultiTokenId.from(overMax)).toThrow("exceeds maximum");
		});
	});

	describe("toNumber", () => {
		it("converts to number", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(MultiTokenId.toNumber(tokenId)).toBe(1);
		});

		it("throws on value exceeding MAX_SAFE_INTEGER", () => {
			const tokenId = MultiTokenId.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
			expect(() => MultiTokenId.toNumber(tokenId)).toThrow("MAX_SAFE_INTEGER");
		});
	});

	describe("toBigInt", () => {
		it("converts to bigint", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(MultiTokenId.toBigInt(tokenId)).toBe(1n);
		});
	});

	describe("toHex", () => {
		it("converts to hex string", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(MultiTokenId.toHex(tokenId)).toBe("0x1");
		});

		it("handles zero", () => {
			const tokenId = MultiTokenId.from(0n);
			expect(MultiTokenId.toHex(tokenId)).toBe("0x0");
		});

		it("handles non-fungible token ID", () => {
			const tokenId = MultiTokenId.from(2n ** 128n);
			expect(MultiTokenId.toHex(tokenId)).toBe(
				"0x100000000000000000000000000000000",
			);
		});
	});

	describe("equals", () => {
		it("returns true for equal token IDs", () => {
			const a = MultiTokenId.from(1n);
			const b = MultiTokenId.from(1n);
			expect(MultiTokenId.equals(a, b)).toBe(true);
		});

		it("returns false for different token IDs", () => {
			const a = MultiTokenId.from(1n);
			const b = MultiTokenId.from(2n);
			expect(MultiTokenId.equals(a, b)).toBe(false);
		});
	});

	describe("compare", () => {
		it("returns -1 when a < b", () => {
			const a = MultiTokenId.from(1n);
			const b = MultiTokenId.from(2n);
			expect(MultiTokenId.compare(a, b)).toBe(-1);
		});

		it("returns 0 when a === b", () => {
			const a = MultiTokenId.from(1n);
			const b = MultiTokenId.from(1n);
			expect(MultiTokenId.compare(a, b)).toBe(0);
		});

		it("returns 1 when a > b", () => {
			const a = MultiTokenId.from(2n);
			const b = MultiTokenId.from(1n);
			expect(MultiTokenId.compare(a, b)).toBe(1);
		});
	});

	describe("isValidFungible", () => {
		it("returns true for fungible token IDs", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(MultiTokenId.isValidFungible(tokenId)).toBe(true);
		});

		it("returns false for zero", () => {
			const tokenId = MultiTokenId.from(0n);
			expect(MultiTokenId.isValidFungible(tokenId)).toBe(false);
		});

		it("returns false for non-fungible token IDs", () => {
			const tokenId = MultiTokenId.from(2n ** 128n);
			expect(MultiTokenId.isValidFungible(tokenId)).toBe(false);
		});

		it("returns true for token IDs just below threshold", () => {
			const tokenId = MultiTokenId.from(2n ** 128n - 1n);
			expect(MultiTokenId.isValidFungible(tokenId)).toBe(true);
		});
	});

	describe("isValidNonFungible", () => {
		it("returns true for non-fungible token IDs", () => {
			const tokenId = MultiTokenId.from(2n ** 128n);
			expect(MultiTokenId.isValidNonFungible(tokenId)).toBe(true);
		});

		it("returns false for fungible token IDs", () => {
			const tokenId = MultiTokenId.from(1n);
			expect(MultiTokenId.isValidNonFungible(tokenId)).toBe(false);
		});

		it("returns false for zero", () => {
			const tokenId = MultiTokenId.from(0n);
			expect(MultiTokenId.isValidNonFungible(tokenId)).toBe(false);
		});

		it("returns true for token IDs at threshold", () => {
			const tokenId = MultiTokenId.from(2n ** 128n);
			expect(MultiTokenId.isValidNonFungible(tokenId)).toBe(true);
		});
	});

	describe("constants", () => {
		it("exports MAX", () => {
			expect(MultiTokenId.constants.MAX).toBe((1n << 256n) - 1n);
		});

		it("exports MIN", () => {
			expect(MultiTokenId.constants.MIN).toBe(0n);
		});

		it("exports FUNGIBLE_THRESHOLD", () => {
			expect(MultiTokenId.constants.FUNGIBLE_THRESHOLD).toBe(2n ** 128n);
		});
	});

	describe("ERC1155_SELECTORS", () => {
		it("exports balanceOf selector", () => {
			expect(MultiTokenId.ERC1155_SELECTORS.balanceOf).toBe("0x00fdd58e");
		});

		it("exports balanceOfBatch selector", () => {
			expect(MultiTokenId.ERC1155_SELECTORS.balanceOfBatch).toBe("0x4e1273f4");
		});

		it("exports safeTransferFrom selector", () => {
			expect(MultiTokenId.ERC1155_SELECTORS.safeTransferFrom).toBe(
				"0xf242432a",
			);
		});

		it("exports safeBatchTransferFrom selector", () => {
			expect(MultiTokenId.ERC1155_SELECTORS.safeBatchTransferFrom).toBe(
				"0x2eb2c2d6",
			);
		});
	});
});
