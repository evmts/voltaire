import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import * as ERC721 from "./ERC721.js";

const testAddress = Address("0x1234567890123456789012345678901234567890");
const testAddress2 = Address("0x0987654321098765432109876543210987654321");
const testTokenId = 42n;

describe("ERC721", () => {
	describe("SELECTORS", () => {
		it("exports correct function selectors", () => {
			expect(ERC721.SELECTORS.ownerOf).toBe("0x6352211e");
			expect(ERC721.SELECTORS.transferFrom).toBe("0x23b872dd");
			expect(ERC721.SELECTORS.safeTransferFrom).toBe("0x42842e0e");
			expect(ERC721.SELECTORS.approve).toBe("0x095ea7b3");
			expect(ERC721.SELECTORS.setApprovalForAll).toBe("0xa22cb465");
			expect(ERC721.SELECTORS.tokenURI).toBe("0xc87b56dd");
		});
	});

	describe("EVENTS", () => {
		it("exports correct event signatures", () => {
			expect(ERC721.EVENTS.Transfer).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			expect(ERC721.EVENTS.Approval).toBe(
				"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			);
			expect(ERC721.EVENTS.ApprovalForAll).toBe(
				"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
			);
		});
	});

	describe("encodeTransferFrom", () => {
		it("encodes transferFrom calldata", async () => {
			const result = await Effect.runPromise(
				ERC721.encodeTransferFrom(testAddress, testAddress2, testTokenId),
			);
			expect(result).toMatch(/^0x23b872dd/);
		});
	});

	describe("encodeSafeTransferFrom", () => {
		it("encodes safeTransferFrom calldata", async () => {
			const result = await Effect.runPromise(
				ERC721.encodeSafeTransferFrom(testAddress, testAddress2, testTokenId),
			);
			expect(result).toMatch(/^0x42842e0e/);
		});
	});

	describe("encodeApprove", () => {
		it("encodes approve calldata", async () => {
			const result = await Effect.runPromise(
				ERC721.encodeApprove(testAddress, testTokenId),
			);
			expect(result).toMatch(/^0x095ea7b3/);
		});
	});

	describe("encodeSetApprovalForAll", () => {
		it("encodes setApprovalForAll with true", async () => {
			const result = await Effect.runPromise(
				ERC721.encodeSetApprovalForAll(testAddress, true),
			);
			expect(result).toMatch(/^0xa22cb465/);
		});

		it("encodes setApprovalForAll with false", async () => {
			const result = await Effect.runPromise(
				ERC721.encodeSetApprovalForAll(testAddress, false),
			);
			expect(result).toMatch(/^0xa22cb465/);
		});
	});

	describe("encodeOwnerOf", () => {
		it("encodes ownerOf calldata", async () => {
			const result = await Effect.runPromise(ERC721.encodeOwnerOf(testTokenId));
			expect(result).toMatch(/^0x6352211e/);
		});
	});

	describe("encodeTokenURI", () => {
		it("encodes tokenURI calldata", async () => {
			const result = await Effect.runPromise(ERC721.encodeTokenURI(testTokenId));
			expect(result).toMatch(/^0xc87b56dd/);
		});
	});

	describe("decodeTransferEvent", () => {
		it("decodes Transfer event log", async () => {
			const log = {
				topics: [
					ERC721.EVENTS.Transfer,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
					"0x000000000000000000000000000000000000000000000000000000000000002a",
				],
				data: "0x",
			};

			const result = await Effect.runPromise(ERC721.decodeTransferEvent(log));
			expect(result.from).toBe("0x1234567890123456789012345678901234567890");
			expect(result.to).toBe("0x0987654321098765432109876543210987654321");
			expect(result.tokenId).toBe(42n);
		});

		it("fails on invalid event signature", async () => {
			const log = {
				topics: ["0x1234", "0x0000", "0x0000", "0x0000"],
				data: "0x",
			};

			const result = await Effect.runPromiseExit(ERC721.decodeTransferEvent(log));
			expect(result._tag).toBe("Failure");
		});
	});

	describe("decodeApprovalEvent", () => {
		it("decodes Approval event log", async () => {
			const log = {
				topics: [
					ERC721.EVENTS.Approval,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
					"0x000000000000000000000000000000000000000000000000000000000000002a",
				],
				data: "0x",
			};

			const result = await Effect.runPromise(ERC721.decodeApprovalEvent(log));
			expect(result.owner).toBe("0x1234567890123456789012345678901234567890");
			expect(result.approved).toBe("0x0987654321098765432109876543210987654321");
			expect(result.tokenId).toBe(42n);
		});
	});

	describe("decodeApprovalForAllEvent", () => {
		it("decodes ApprovalForAll event log with approved=true", async () => {
			const log = {
				topics: [
					ERC721.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000001",
			};

			const result = await Effect.runPromise(
				ERC721.decodeApprovalForAllEvent(log),
			);
			expect(result.owner).toBe("0x1234567890123456789012345678901234567890");
			expect(result.operator).toBe("0x0987654321098765432109876543210987654321");
			expect(result.approved).toBe(true);
		});

		it("decodes ApprovalForAll event log with approved=false", async () => {
			const log = {
				topics: [
					ERC721.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const result = await Effect.runPromise(
				ERC721.decodeApprovalForAllEvent(log),
			);
			expect(result.approved).toBe(false);
		});
	});
});
