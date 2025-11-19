import { describe, expect, it } from "vitest";
import * as BuilderBid from "./index.js";

describe("BuilderBid", () => {
	const validBid = {
		slot: 123456n,
		parentHash: new Uint8Array(32).fill(1),
		blockHash: new Uint8Array(32).fill(2),
		builderPubkey: new Uint8Array(48).fill(3),
		proposerPubkey: new Uint8Array(48).fill(4),
		proposerFeeRecipient: new Uint8Array(20).fill(5),
		gasLimit: 30000000n,
		gasUsed: 25000000n,
		value: 1000000000000000000n, // 1 ETH
		signature: new Uint8Array(96).fill(6),
	};

	describe("from", () => {
		it("creates BuilderBid from object", () => {
			const bid = BuilderBid.from(validBid);

			expect(bid.slot).toBe(123456n);
			expect(bid.parentHash).toEqual(validBid.parentHash);
			expect(bid.blockHash).toEqual(validBid.blockHash);
			expect(bid.builderPubkey).toEqual(validBid.builderPubkey);
			expect(bid.proposerPubkey).toEqual(validBid.proposerPubkey);
			expect(bid.proposerFeeRecipient).toEqual(validBid.proposerFeeRecipient);
			expect(bid.gasLimit).toBe(30000000n);
			expect(bid.gasUsed).toBe(25000000n);
			expect(bid.value).toBe(1000000000000000000n);
			expect(bid.signature).toEqual(validBid.signature);
		});

		it("converts slot from number", () => {
			const bid = BuilderBid.from({
				...validBid,
				slot: 123456,
			});

			expect(bid.slot).toBe(123456n);
		});

		it("converts slot from hex string", () => {
			const bid = BuilderBid.from({
				...validBid,
				slot: "0x1e240",
			});

			expect(bid.slot).toBe(123456n);
		});

		it("converts hashes from hex strings", () => {
			const bid = BuilderBid.from({
				...validBid,
				parentHash:
					"0x1111111111111111111111111111111111111111111111111111111111111111",
				blockHash:
					"0x2222222222222222222222222222222222222222222222222222222222222222",
			});

			expect(bid.parentHash[0]).toBe(0x11);
			expect(bid.blockHash[0]).toBe(0x22);
		});

		it("converts pubkeys from hex strings", () => {
			const bid = BuilderBid.from({
				...validBid,
				builderPubkey: "0x" + "33".repeat(48),
				proposerPubkey: "0x" + "44".repeat(48),
			});

			expect(bid.builderPubkey[0]).toBe(0x33);
			expect(bid.proposerPubkey[0]).toBe(0x44);
		});

		it("converts fee recipient from hex string", () => {
			const bid = BuilderBid.from({
				...validBid,
				proposerFeeRecipient: "0x" + "55".repeat(20),
			});

			expect(bid.proposerFeeRecipient[0]).toBe(0x55);
		});

		it("converts signature from hex string", () => {
			const bid = BuilderBid.from({
				...validBid,
				signature: "0x" + "66".repeat(96),
			});

			expect(bid.signature[0]).toBe(0x66);
		});

		it("throws on invalid parentHash length", () => {
			expect(() =>
				BuilderBid.from({
					...validBid,
					parentHash: new Uint8Array(16),
				}),
			).toThrow("must be 32 bytes");
		});

		it("throws on invalid builderPubkey length", () => {
			expect(() =>
				BuilderBid.from({
					...validBid,
					builderPubkey: new Uint8Array(32),
				}),
			).toThrow("must be 48 bytes");
		});

		it("throws on invalid signature length", () => {
			expect(() =>
				BuilderBid.from({
					...validBid,
					signature: new Uint8Array(64),
				}),
			).toThrow("must be 96 bytes");
		});

		it("throws on non-object input", () => {
			expect(() => BuilderBid.from("invalid" as any)).toThrow(
				"must be an object",
			);
		});
	});

	describe("getValue", () => {
		it("returns bid value", () => {
			const bid = BuilderBid.from(validBid);
			const value = BuilderBid.getValue(bid);

			expect(value).toBe(1000000000000000000n);
		});
	});

	describe("verify", () => {
		it("verifies valid signature", () => {
			const bid = BuilderBid.from(validBid);

			const mockBlsVerify = (
				pubkey: Uint8Array,
				message: Uint8Array,
				signature: Uint8Array,
			) => {
				expect(pubkey).toEqual(bid.builderPubkey);
				expect(message).toBeInstanceOf(Uint8Array);
				expect(signature).toEqual(bid.signature);
				return true;
			};

			const valid = BuilderBid.verify(bid, { blsVerify: mockBlsVerify });

			expect(valid).toBe(true);
		});

		it("returns false for invalid signature", () => {
			const bid = BuilderBid.from(validBid);

			const mockBlsVerify = () => false;

			const valid = BuilderBid.verify(bid, { blsVerify: mockBlsVerify });

			expect(valid).toBe(false);
		});

		it("throws if blsVerify not provided", () => {
			const bid = BuilderBid.from(validBid);

			expect(() => BuilderBid.verify(bid, {} as any)).toThrow(
				"blsVerify not provided",
			);
		});
	});

	describe("toHex", () => {
		it("converts BuilderBid to hex format", () => {
			const bid = BuilderBid.from(validBid);
			const hex = BuilderBid.toHex(bid);

			expect(hex.slot).toBe("0x1e240");
			expect(hex.parent_hash).toBe("0x" + "01".repeat(32));
			expect(hex.block_hash).toBe("0x" + "02".repeat(32));
			expect(hex.builder_pubkey).toBe("0x" + "03".repeat(48));
			expect(hex.proposer_pubkey).toBe("0x" + "04".repeat(48));
			expect(hex.proposer_fee_recipient).toBe("0x" + "05".repeat(20));
			expect(hex.gas_limit).toBe("0x1c9c380");
			expect(hex.gas_used).toBe("0x17d7840");
			expect(hex.value).toBe("0xde0b6b3a7640000");
			expect(hex.signature).toBe("0x" + "06".repeat(96));
		});

		it("uses snake_case for RPC compatibility", () => {
			const bid = BuilderBid.from(validBid);
			const hex = BuilderBid.toHex(bid);

			expect(hex).toHaveProperty("parent_hash");
			expect(hex).toHaveProperty("block_hash");
			expect(hex).toHaveProperty("builder_pubkey");
			expect(hex).toHaveProperty("proposer_pubkey");
			expect(hex).toHaveProperty("proposer_fee_recipient");
			expect(hex).toHaveProperty("gas_limit");
			expect(hex).toHaveProperty("gas_used");
		});
	});
});
