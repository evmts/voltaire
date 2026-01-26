import { describe, expect, it } from "@effect/vitest";
import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as ERC1155 from "./ERC1155.js";

const testAddressHex = "0x1234567890123456789012345678901234567890";
const testAddress2Hex = "0x0987654321098765432109876543210987654321";
const testAddress3Hex = "0x1111111111111111111111111111111111111111";
const testAddress = Address(testAddressHex);
const testAddress2 = Address(testAddress2Hex);
const testTokenId = 1n;
const testAmount = 100n;

describe("ERC1155", () => {
	describe("SELECTORS", () => {
		it("exports correct function selectors", () => {
			expect(ERC1155.SELECTORS.balanceOf).toBe("0x00fdd58e");
			expect(ERC1155.SELECTORS.balanceOfBatch).toBe("0x4e1273f4");
			expect(ERC1155.SELECTORS.safeTransferFrom).toBe("0xf242432a");
			expect(ERC1155.SELECTORS.safeBatchTransferFrom).toBe("0x2eb2c2d6");
			expect(ERC1155.SELECTORS.setApprovalForAll).toBe("0xa22cb465");
			expect(ERC1155.SELECTORS.isApprovedForAll).toBe("0xe985e9c5");
			expect(ERC1155.SELECTORS.uri).toBe("0x0e89341c");
		});
	});

	describe("EVENTS", () => {
		it("exports correct event signatures", () => {
			expect(ERC1155.EVENTS.TransferSingle).toBe(
				"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
			);
			expect(ERC1155.EVENTS.TransferBatch).toBe(
				"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb",
			);
			expect(ERC1155.EVENTS.ApprovalForAll).toBe(
				"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
			);
			expect(ERC1155.EVENTS.URI).toBe(
				"0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b",
			);
		});
	});

	describe("encodeBalanceOf", () => {
		it("encodes balanceOf calldata", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeBalanceOf(testAddress, testTokenId),
			);
			expect(result).toMatch(/^0x00fdd58e/);
		});
	});

	describe("encodeBalanceOfBatch", () => {
		it("encodes balanceOfBatch calldata", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeBalanceOfBatch(
					[testAddress, testAddress2],
					[testTokenId, 2n],
				),
			);
			expect(result).toMatch(/^0x4e1273f4/);
		});

		it("encodes balanceOfBatch with empty arrays", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeBalanceOfBatch([], []),
			);
			expect(result).toMatch(/^0x4e1273f4/);
		});
	});

	describe("encodeSetApprovalForAll", () => {
		it("encodes setApprovalForAll with true", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeSetApprovalForAll(testAddress, true),
			);
			expect(result).toMatch(/^0xa22cb465/);
		});

		it("encodes setApprovalForAll with false", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeSetApprovalForAll(testAddress, false),
			);
			expect(result).toMatch(/^0xa22cb465/);
		});
	});

	describe("encodeSafeTransferFrom", () => {
		it("encodes safeTransferFrom calldata without data", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeSafeTransferFrom(
					testAddress,
					testAddress2,
					testTokenId,
					testAmount,
				),
			);
			expect(result).toMatch(/^0xf242432a/);
		});

		it("encodes safeTransferFrom calldata with data", async () => {
			const data = new Uint8Array([1, 2, 3, 4]);
			const result = await Effect.runPromise(
				ERC1155.encodeSafeTransferFrom(
					testAddress,
					testAddress2,
					testTokenId,
					testAmount,
					data,
				),
			);
			expect(result).toMatch(/^0xf242432a/);
		});
	});

	describe("encodeSafeBatchTransferFrom", () => {
		it("encodes safeBatchTransferFrom calldata without data", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeSafeBatchTransferFrom(
					testAddress,
					testAddress2,
					[1n, 2n],
					[10n, 20n],
				),
			);
			expect(result).toMatch(/^0x2eb2c2d6/);
		});

		it("encodes safeBatchTransferFrom calldata with data", async () => {
			const data = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]);
			const result = await Effect.runPromise(
				ERC1155.encodeSafeBatchTransferFrom(
					testAddress,
					testAddress2,
					[1n],
					[100n],
					data,
				),
			);
			expect(result).toMatch(/^0x2eb2c2d6/);
			expect(result.toLowerCase()).toContain("cafebabe");
		});
	});

	describe("encodeIsApprovedForAll", () => {
		it("encodes isApprovedForAll calldata", async () => {
			const result = await Effect.runPromise(
				ERC1155.encodeIsApprovedForAll(testAddress, testAddress2),
			);
			expect(result).toMatch(/^0xe985e9c5/);
		});
	});

	describe("encodeURI", () => {
		it("encodes uri calldata", async () => {
			const result = await Effect.runPromise(ERC1155.encodeURI(testTokenId));
			expect(result).toMatch(/^0x0e89341c/);
		});
	});

	describe("decodeBalanceOfBatchResult", () => {
		it("decodes array of balances", async () => {
			const encoded =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000003" +
				"0000000000000000000000000000000000000000000000000000000000000064" +
				"00000000000000000000000000000000000000000000000000000000000000c8" +
				"000000000000000000000000000000000000000000000000000000000000012c";
			const result = await Effect.runPromise(
				ERC1155.decodeBalanceOfBatchResult(encoded),
			);
			expect(result).toEqual([100n, 200n, 300n]);
		});

		it("decodes empty array", async () => {
			const encoded =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000000";
			const result = await Effect.runPromise(
				ERC1155.decodeBalanceOfBatchResult(encoded),
			);
			expect(result).toEqual([]);
		});
	});

	describe("decodeTransferSingleEvent", () => {
		it("decodes TransferSingle event log", async () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferSingle,
					"0x0000000000000000000000001111111111111111111111111111111111111111",
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data:
					"0x0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000064",
			};

			const result = await Effect.runPromise(
				ERC1155.decodeTransferSingleEvent(log),
			);
			expect(result.operator).toBe(
				"0x1111111111111111111111111111111111111111",
			);
			expect(result.from).toBe("0x1234567890123456789012345678901234567890");
			expect(result.to).toBe("0x0987654321098765432109876543210987654321");
			expect(result.id).toBe(1n);
			expect(result.value).toBe(100n);
		});

		it("fails on invalid event signature", async () => {
			const log = {
				topics: ["0x1234", "0x0000", "0x0000", "0x0000"],
				data: "0x0000",
			};

			const result = await Effect.runPromiseExit(
				ERC1155.decodeTransferSingleEvent(log),
			);
			expect(result._tag).toBe("Failure");
		});
	});

	describe("decodeTransferBatchEvent", () => {
		it("decodes TransferBatch event log", async () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferBatch,
					`0x000000000000000000000000${testAddress3Hex.slice(2)}`,
					`0x000000000000000000000000${testAddressHex.slice(2)}`,
					`0x000000000000000000000000${testAddress2Hex.slice(2)}`,
				],
				data:
					"0x" +
					"0000000000000000000000000000000000000000000000000000000000000040" +
					"0000000000000000000000000000000000000000000000000000000000000080" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001" +
					"000000000000000000000000000000000000000000000000000000000000000a",
			};

			const result = await Effect.runPromise(
				ERC1155.decodeTransferBatchEvent(log),
			);
			expect(result.operator.toLowerCase()).toBe(testAddress3Hex.toLowerCase());
			expect(result.from.toLowerCase()).toBe(testAddressHex.toLowerCase());
			expect(result.to.toLowerCase()).toBe(testAddress2Hex.toLowerCase());
			expect(result.ids).toEqual([1n]);
			expect(result.values).toEqual([10n]);
		});

		it("fails on invalid event signature", async () => {
			const result = await Effect.runPromiseExit(
				ERC1155.decodeTransferBatchEvent({ topics: ["0x1234"], data: "0x" }),
			);
			expect(result._tag).toBe("Failure");
		});
	});

	describe("decodeApprovalForAllEvent", () => {
		it("decodes ApprovalForAll event log with approved=true", async () => {
			const log = {
				topics: [
					ERC1155.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000001",
			};

			const result = await Effect.runPromise(
				ERC1155.decodeApprovalForAllEvent(log),
			);
			expect(result.account).toBe("0x1234567890123456789012345678901234567890");
			expect(result.operator).toBe(
				"0x0987654321098765432109876543210987654321",
			);
			expect(result.approved).toBe(true);
		});

		it("decodes ApprovalForAll event log with approved=false", async () => {
			const log = {
				topics: [
					ERC1155.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const result = await Effect.runPromise(
				ERC1155.decodeApprovalForAllEvent(log),
			);
			expect(result.approved).toBe(false);
		});
	});

	describe("decodeURIEvent", () => {
		it("decodes URI event log", async () => {
			const log = {
				topics: [
					ERC1155.EVENTS.URI,
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				],
				data:
					"0x" +
					"0000000000000000000000000000000000000000000000000000000000000020" +
					"0000000000000000000000000000000000000000000000000000000000000023" +
					"68747470733a2f2f6578616d706c652e636f6d2f6d657461646174612f312e6a736f6e" +
					"000000000000000000000000000000000000000000000000000000",
			};

			const result = await Effect.runPromise(ERC1155.decodeURIEvent(log));
			expect(result.id).toBe(1n);
			expect(result.value).toBe("https://example.com/metadata/1.json");
		});
	});
});
