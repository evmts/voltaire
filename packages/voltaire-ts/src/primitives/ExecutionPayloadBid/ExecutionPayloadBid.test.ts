import { describe, expect, expectTypeOf, it } from "vitest";
import type { AddressType } from "../Address/AddressType.js";
import type { BlockHashType } from "../BlockHash/BlockHashType.js";
import * as Hex from "../Hex/index.js";
import * as Primitives from "../index.js";
import type { SlotType } from "../Slot/SlotType.js";
import type { ExecutionPayloadBidType } from "./index.js";
import * as ExecutionPayloadBid from "./index.js";

const hex = (byte: string, size: number) => `0x${byte.repeat(size)}`;

const bidLike = () => ({
	parentBlockHash: hex("11", 32),
	parentBlockRoot: hex("22", 32),
	blockHash: hex("33", 32),
	prevRandao: hex("44", 32),
	feeRecipient: hex("55", 20),
	gasLimit: 60_000_000n,
	builderIndex: 7n,
	slot: 13_164_544n,
	value: 1_000_000_000n,
	executionPayment: 0n,
	blobKzgCommitments: [hex("66", 48), hex("77", 48)],
	executionRequestsRoot: hex("88", 32),
});

describe("ExecutionPayloadBid (EIP-7732)", () => {
	it("is exported from the public primitive barrel", () => {
		expect(Primitives.ExecutionPayloadBid.from).toBe(ExecutionPayloadBid.from);
	});

	it("exports the Gloas builder constants", () => {
		expect(ExecutionPayloadBid.BUILDER_INDEX_SELF_BUILD).toBe(2n ** 64n - 1n);
		expect(ExecutionPayloadBid.DOMAIN_BEACON_BUILDER).toBe("0x0B000000");
		expect(ExecutionPayloadBid.KZG_COMMITMENT_SIZE).toBe(48);
		expect(ExecutionPayloadBid.BLS_SIGNATURE_SIZE).toBe(96);
	});

	describe("from", () => {
		it("normalizes hex fields to bytes in the Gloas field order", () => {
			const bid = ExecutionPayloadBid.from(bidLike());
			expect(Object.keys(bid)).toEqual([
				"parentBlockHash",
				"parentBlockRoot",
				"blockHash",
				"prevRandao",
				"feeRecipient",
				"gasLimit",
				"builderIndex",
				"slot",
				"value",
				"executionPayment",
				"blobKzgCommitments",
				"executionRequestsRoot",
			]);
			expect(Hex.fromBytes(bid.parentBlockHash)).toBe(hex("11", 32));
			expect(Hex.fromBytes(bid.parentBlockRoot)).toBe(hex("22", 32));
			expect(Hex.fromBytes(bid.blockHash)).toBe(hex("33", 32));
			expect(Hex.fromBytes(bid.prevRandao)).toBe(hex("44", 32));
			expect(Hex.fromBytes(bid.feeRecipient)).toBe(hex("55", 20));
			expect(bid.gasLimit).toBe(60_000_000n);
			expect(bid.builderIndex).toBe(7n);
			expect(bid.slot).toBe(13_164_544n);
			expect(bid.value).toBe(1_000_000_000n);
			expect(bid.executionPayment).toBe(0n);
			expect(bid.blobKzgCommitments.map((c) => Hex.fromBytes(c))).toEqual([
				hex("66", 48),
				hex("77", 48),
			]);
			expect(Hex.fromBytes(bid.executionRequestsRoot)).toBe(hex("88", 32));
		});

		it("types fields with the shared primitive brands", () => {
			expectTypeOf<
				ExecutionPayloadBidType["blockHash"]
			>().toEqualTypeOf<BlockHashType>();
			expectTypeOf<
				ExecutionPayloadBidType["feeRecipient"]
			>().toEqualTypeOf<AddressType>();
			expectTypeOf<ExecutionPayloadBidType["slot"]>().toEqualTypeOf<SlotType>();
		});

		it("accepts bytes, numbers, and hex quantities", () => {
			const bid = ExecutionPayloadBid.from({
				...bidLike(),
				blockHash: new Uint8Array(32).fill(0x33),
				gasLimit: 60_000_000,
				slot: "0xc8e000",
				blobKzgCommitments: [new Uint8Array(48).fill(0x66)],
			});
			expect(Hex.fromBytes(bid.blockHash)).toBe(hex("33", 32));
			expect(bid.gasLimit).toBe(60_000_000n);
			expect(bid.slot).toBe(13_164_544n);
			expect(bid.blobKzgCommitments).toHaveLength(1);
		});

		it("is idempotent", () => {
			const bid = ExecutionPayloadBid.from(bidLike());
			expect(ExecutionPayloadBid.from(bid)).toEqual(bid);
		});

		it("accepts a self-built bid with no blobs", () => {
			const bid = ExecutionPayloadBid.from({
				...bidLike(),
				builderIndex: ExecutionPayloadBid.BUILDER_INDEX_SELF_BUILD,
				value: 0n,
				blobKzgCommitments: [],
			});
			expect(bid.builderIndex).toBe(2n ** 64n - 1n);
			expect(bid.blobKzgCommitments).toEqual([]);
		});

		it.each([
			["parentBlockHash", hex("11", 31)],
			["parentBlockRoot", hex("22", 33)],
			["blockHash", "0x"],
			["prevRandao", new Uint8Array(31)],
			["feeRecipient", hex("55", 32)],
			["executionRequestsRoot", hex("88", 20)],
			["blockHash", "33".repeat(32)],
			["blockHash", `0x${"zz".repeat(32)}`],
			["blockHash", undefined],
			["blockHash", 5],
		])("rejects %s = %s", (field, value) => {
			expect(() =>
				ExecutionPayloadBid.from({ ...bidLike(), [field]: value } as never),
			).toThrow(ExecutionPayloadBid.InvalidExecutionPayloadBidError);
		});

		it.each([
			["gasLimit", -1n],
			["gasLimit", 2n ** 64n],
			["builderIndex", 1.5],
			["slot", Number.MAX_SAFE_INTEGER + 1],
			["value", "not a number"],
			["value", ""],
			["value", " \t\n"],
			["executionPayment", undefined],
			["executionPayment", null],
		])("rejects %s = %s", (field, value) => {
			expect(() =>
				ExecutionPayloadBid.from({ ...bidLike(), [field]: value } as never),
			).toThrow(ExecutionPayloadBid.InvalidExecutionPayloadBidError);
		});

		it("rejects a KZG commitment that is not 48 bytes and names its index", () => {
			expect(() =>
				ExecutionPayloadBid.from({
					...bidLike(),
					blobKzgCommitments: [hex("66", 48), hex("77", 47)],
				}),
			).toThrow(/blobKzgCommitments\[1\] must be 48 bytes/);
		});

		it("rejects a sparse commitment array and names the missing index", () => {
			const commitments = [hex("66", 48)];
			commitments.length = 2;
			expect(() =>
				ExecutionPayloadBid.from({
					...bidLike(),
					blobKzgCommitments: commitments,
				}),
			).toThrow(/blobKzgCommitments\[1\] must be 48 bytes/);
		});

		it("rejects a missing commitment list and a non-object", () => {
			const { blobKzgCommitments: _c, ...missing } = bidLike();
			expect(() => ExecutionPayloadBid.from(missing as never)).toThrow(
				ExecutionPayloadBid.InvalidExecutionPayloadBidError,
			);
			expect(() => ExecutionPayloadBid.from(null as never)).toThrow(
				ExecutionPayloadBid.InvalidExecutionPayloadBidError,
			);
		});
	});

	describe("fromSigned", () => {
		it("normalizes the message and the 96-byte signature", () => {
			const signed = ExecutionPayloadBid.fromSigned({
				message: bidLike(),
				signature: hex("99", 96),
			});
			expect(signed.message).toEqual(ExecutionPayloadBid.from(bidLike()));
			expect(Hex.fromBytes(signed.signature)).toBe(hex("99", 96));
		});

		it("rejects a signature that is not 96 bytes", () => {
			for (const signature of [hex("99", 95), hex("99", 48), undefined]) {
				expect(() =>
					ExecutionPayloadBid.fromSigned({
						message: bidLike(),
						signature,
					} as never),
				).toThrow(/signature must be 96 bytes/);
			}
		});

		it("rejects a malformed message and a non-object", () => {
			expect(() =>
				ExecutionPayloadBid.fromSigned({
					message: { ...bidLike(), blockHash: "0x00" },
					signature: hex("99", 96),
				}),
			).toThrow(/blockHash must be 32 bytes/);
			expect(() => ExecutionPayloadBid.fromSigned(undefined as never)).toThrow(
				ExecutionPayloadBid.InvalidExecutionPayloadBidError,
			);
		});
	});
});
