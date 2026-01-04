import { describe, expect, it } from "vitest";
import * as Address from "../Address/internal-index.js";
import * as BlockHash from "../BlockHash/index.js";
import * as BlockNumber from "../BlockNumber/index.js";
import * as TransactionHash from "../TransactionHash/index.js";
import * as TransactionIndex from "../TransactionIndex/index.js";
import * as TransactionStatus from "../TransactionStatus/index.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
import { InvalidReceiptError, InvalidReceiptLengthError } from "./errors.js";
import * as Receipt from "./index.js";

describe("Receipt", () => {
	const mockReceipt = {
		transactionHash: TransactionHash.fromHex(
			"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		),
		transactionIndex: TransactionIndex.from(0),
		blockHash: BlockHash.fromHex(
			"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
		),
		blockNumber: BlockNumber.from(100n),
		from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
		to: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"),
		cumulativeGasUsed: 21000n as Uint256Type,
		gasUsed: 21000n as Uint256Type,
		contractAddress: null,
		logs: [],
		logsBloom: new Uint8Array(256),
		status: TransactionStatus.success(21000n as Uint256Type),
		effectiveGasPrice: 1000000000n as Uint256Type,
		type: "legacy" as const,
	};

	describe("from", () => {
		it("creates receipt from valid data", () => {
			const receipt = Receipt.from(mockReceipt);
			expect(receipt.transactionHash).toBe(mockReceipt.transactionHash);
			expect(receipt.blockNumber).toBe(mockReceipt.blockNumber);
		});

		it("throws on missing transactionHash", () => {
			const invalid = { ...mockReceipt, transactionHash: undefined };
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			expect(() => Receipt.from(invalid as any)).toThrow(
				"transactionHash is required",
			);
		});

		it("throws on missing blockHash", () => {
			const invalid = { ...mockReceipt, blockHash: undefined };
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			expect(() => Receipt.from(invalid as any)).toThrow(
				"blockHash is required",
			);
		});

		it("throws on invalid logsBloom length", () => {
			const invalid = { ...mockReceipt, logsBloom: new Uint8Array(100) };
			try {
				// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
				Receipt.from(invalid as any);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(InvalidReceiptLengthError);
				if (err instanceof InvalidReceiptLengthError) {
					expect(err.name).toBe("InvalidReceiptLengthError");
					expect(err.message).toContain("logsBloom must be 256 bytes");
				}
			}
		});

		it("handles contract creation receipt", () => {
			const creation = {
				...mockReceipt,
				to: null,
				contractAddress: Address.fromHex(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3",
				),
			};
			const receipt = Receipt.from(creation);
			expect(receipt.to).toBeNull();
			expect(receipt.contractAddress).not.toBeNull();
		});

		it("handles EIP-4844 receipt with blob fields", () => {
			const eip4844 = {
				...mockReceipt,
				type: "eip4844" as const,
				blobGasUsed: 131072n as Uint256Type,
				blobGasPrice: 1n as Uint256Type,
			};
			const receipt = Receipt.from(eip4844);
			expect(receipt.type).toBe("eip4844");
			expect(receipt.blobGasUsed).toBe(131072n);
		});

		it("accepts failed transaction (status=failed)", () => {
			const failedReceipt = {
				...mockReceipt,
				status: TransactionStatus.failed("execution reverted"),
			};
			const receipt = Receipt.from(failedReceipt);
			expect(receipt.status.type).toBe("failed");
		});

		it("accepts gasUsed=0 and cumulativeGasUsed=0", () => {
			const zeroGasReceipt = {
				...mockReceipt,
				gasUsed: 0n as Uint256Type,
				cumulativeGasUsed: 0n as Uint256Type,
			};
			const receipt = Receipt.from(zeroGasReceipt);
			expect(receipt.gasUsed).toBe(0n);
			expect(receipt.cumulativeGasUsed).toBe(0n);
		});
	});

	describe("error types", () => {
		it("InvalidReceiptError extends InvalidFormatError", () => {
			const err = new InvalidReceiptError("test error");
			expect(err.name).toBe("InvalidReceiptError");
			expect(typeof err.code).toBe("string");
			expect(err.code).toBe("RECEIPT_INVALID");
		});

		it("InvalidReceiptLengthError extends InvalidLengthError", () => {
			const err = new InvalidReceiptLengthError("logsBloom", 256, 100);
			expect(err.name).toBe("InvalidReceiptLengthError");
			expect(err.code).toBe("RECEIPT_INVALID_LENGTH");
			expect(err.message).toContain("logsBloom must be 256 bytes");
		});
	});
});
