import { describe, expect, it } from "vitest";
import * as Selector from "../../Selector/index.js";
import { getInterfaceId } from "./getInterfaceId.js";
import {
	ERC165_INTERFACE_ID,
	ERC20_INTERFACE_ID,
	ERC721_INTERFACE_ID,
	ERC1155_INTERFACE_ID,
} from "./constants.js";

describe("getInterfaceId", () => {
	it("should compute ERC-165 interface ID", () => {
		// ERC-165: supportsInterface(bytes4)
		const result = getInterfaceId([
			Selector.fromSignature("supportsInterface(bytes4)"),
		]);
		expect(Selector.toHex(result)).toBe(Selector.toHex(ERC165_INTERFACE_ID));
	});

	it("should compute ERC-20 interface ID", () => {
		// ERC-20 function selectors
		const result = getInterfaceId([
			Selector.fromSignature("totalSupply()"),
			Selector.fromSignature("balanceOf(address)"),
			Selector.fromSignature("transfer(address,uint256)"),
			Selector.fromSignature("allowance(address,address)"),
			Selector.fromSignature("approve(address,uint256)"),
			Selector.fromSignature("transferFrom(address,address,uint256)"),
		]);
		expect(Selector.toHex(result)).toBe(Selector.toHex(ERC20_INTERFACE_ID));
	});

	it("should compute ERC-721 interface ID", () => {
		// ERC-721 function selectors
		const result = getInterfaceId([
			Selector.fromSignature("balanceOf(address)"),
			Selector.fromSignature("ownerOf(uint256)"),
			Selector.fromSignature("safeTransferFrom(address,address,uint256,bytes)"),
			Selector.fromSignature("safeTransferFrom(address,address,uint256)"),
			Selector.fromSignature("transferFrom(address,address,uint256)"),
			Selector.fromSignature("approve(address,uint256)"),
			Selector.fromSignature("setApprovalForAll(address,bool)"),
			Selector.fromSignature("getApproved(uint256)"),
			Selector.fromSignature("isApprovedForAll(address,address)"),
		]);
		expect(Selector.toHex(result)).toBe(Selector.toHex(ERC721_INTERFACE_ID));
	});

	it("should compute ERC-1155 interface ID", () => {
		// ERC-1155 function selectors
		const result = getInterfaceId([
			Selector.fromSignature("balanceOf(address,uint256)"),
			Selector.fromSignature("balanceOfBatch(address[],uint256[])"),
			Selector.fromSignature("setApprovalForAll(address,bool)"),
			Selector.fromSignature("isApprovedForAll(address,address)"),
			Selector.fromSignature(
				"safeTransferFrom(address,address,uint256,uint256,bytes)",
			),
			Selector.fromSignature(
				"safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
			),
		]);
		expect(Selector.toHex(result)).toBe(Selector.toHex(ERC1155_INTERFACE_ID));
	});

	it("should accept hex string selectors", () => {
		const result = getInterfaceId([
			"0x70a08231", // balanceOf
			"0xa9059cbb", // transfer
		]);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(4);
	});

	it("should accept Uint8Array selectors", () => {
		const sel1 = new Uint8Array([0x70, 0xa0, 0x82, 0x31]);
		const sel2 = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
		const result = getInterfaceId([sel1, sel2]);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(4);
	});

	it("should handle single selector", () => {
		const result = getInterfaceId([
			Selector.fromSignature("supportsInterface(bytes4)"),
		]);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(4);
	});

	it("should throw on empty array", () => {
		expect(() => getInterfaceId([])).toThrow("At least one selector required");
	});

	it("should XOR correctly (commutative)", () => {
		const sel1 = Selector.fromHex("0x12345678");
		const sel2 = Selector.fromHex("0xabcdef00");

		const result1 = getInterfaceId([sel1, sel2]);
		const result2 = getInterfaceId([sel2, sel1]);

		expect(Selector.toHex(result1)).toBe(Selector.toHex(result2));
	});

	it("should XOR to zero with duplicate selectors", () => {
		const sel = Selector.fromHex("0x12345678");
		const result = getInterfaceId([sel, sel]);
		expect(Selector.toHex(result)).toBe("0x00000000");
	});
});
