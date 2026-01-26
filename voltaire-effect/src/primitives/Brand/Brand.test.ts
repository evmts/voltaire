import { describe, expect, it } from "vitest";
import {
	AddressString,
	BlockNumber,
	ChainId,
	Gas,
	Gwei,
	NonNegativeInt,
	Nonce,
	PositiveInt,
	TxHashString,
	Wei,
} from "./index.js";

describe("Brand", () => {
	describe("PositiveInt", () => {
		it("accepts positive integers", () => {
			expect(PositiveInt(1)).toBe(1);
			expect(PositiveInt(100)).toBe(100);
			expect(PositiveInt(21000)).toBe(21000);
		});

		it("rejects zero", () => {
			expect(() => PositiveInt(0)).toThrow();
		});

		it("rejects negative numbers", () => {
			expect(() => PositiveInt(-1)).toThrow();
		});

		it("rejects non-integers", () => {
			expect(() => PositiveInt(1.5)).toThrow();
		});

		it("provides option method", () => {
			expect(PositiveInt.option(5)._tag).toBe("Some");
			expect(PositiveInt.option(-1)._tag).toBe("None");
		});

		it("provides either method", () => {
			const success = PositiveInt.either(5);
			expect(success._tag).toBe("Right");

			const failure = PositiveInt.either(-1);
			expect(failure._tag).toBe("Left");
		});

		it("provides is method", () => {
			expect(PositiveInt.is(5)).toBe(true);
			expect(PositiveInt.is(-1)).toBe(false);
			expect(PositiveInt.is(1.5)).toBe(false);
		});
	});

	describe("NonNegativeInt", () => {
		it("accepts zero", () => {
			expect(NonNegativeInt(0)).toBe(0);
		});

		it("accepts positive integers", () => {
			expect(NonNegativeInt(100)).toBe(100);
		});

		it("rejects negative numbers", () => {
			expect(() => NonNegativeInt(-1)).toThrow();
		});
	});

	describe("Wei", () => {
		it("accepts positive bigints", () => {
			expect(Wei(1000000000000000000n)).toBe(1000000000000000000n);
		});

		it("accepts zero", () => {
			expect(Wei(0n)).toBe(0n);
		});

		it("rejects negative bigints", () => {
			expect(() => Wei(-1n)).toThrow();
		});
	});

	describe("Gwei", () => {
		it("accepts valid gwei values", () => {
			expect(Gwei(20n)).toBe(20n);
			expect(Gwei(0n)).toBe(0n);
		});

		it("rejects negative values", () => {
			expect(() => Gwei(-1n)).toThrow();
		});
	});

	describe("BlockNumber", () => {
		it("accepts valid block numbers", () => {
			expect(BlockNumber(0n)).toBe(0n);
			expect(BlockNumber(19000000n)).toBe(19000000n);
		});

		it("rejects negative values", () => {
			expect(() => BlockNumber(-1n)).toThrow();
		});
	});

	describe("ChainId", () => {
		it("accepts valid chain IDs", () => {
			expect(ChainId(1n)).toBe(1n);
			expect(ChainId(11155111n)).toBe(11155111n);
		});

		it("rejects zero", () => {
			expect(() => ChainId(0n)).toThrow();
		});

		it("rejects negative values", () => {
			expect(() => ChainId(-1n)).toThrow();
		});
	});

	describe("Nonce", () => {
		it("accepts valid nonces", () => {
			expect(Nonce(0n)).toBe(0n);
			expect(Nonce(42n)).toBe(42n);
		});

		it("rejects negative values", () => {
			expect(() => Nonce(-1n)).toThrow();
		});
	});

	describe("Gas", () => {
		it("accepts valid gas values", () => {
			expect(Gas(21000n)).toBe(21000n);
		});

		it("rejects zero", () => {
			expect(() => Gas(0n)).toThrow();
		});

		it("rejects negative values", () => {
			expect(() => Gas(-1n)).toThrow();
		});
	});

	describe("Nominal types", () => {
		describe("TxHashString", () => {
			it("brands strings without validation", () => {
				const hash = TxHashString("0xabc123");
				expect(hash).toBe("0xabc123");
			});

			it("accepts any string", () => {
				const invalid = TxHashString("not-a-hash");
				expect(invalid).toBe("not-a-hash");
			});
		});

		describe("AddressString", () => {
			it("brands strings without validation", () => {
				const addr = AddressString(
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				);
				expect(addr).toBe("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
			});
		});
	});

	describe("Type safety", () => {
		it("branded types are not assignable to each other", () => {
			const wei: Wei = Wei(100n);
			const gwei: Gwei = Gwei(100n);

			// @ts-expect-error - Wei is not assignable to Gwei
			const _wrongAssignment: Gwei = wei;

			// @ts-expect-error - Gwei is not assignable to Wei
			const _wrongAssignment2: Wei = gwei;

			// Both are bigints at runtime but TypeScript distinguishes them
			expect(wei === 100n).toBe(true);
			expect(gwei === 100n).toBe(true);
		});

		it("branded types can be used as their base type", () => {
			const gas = Gas(21000n);

			// Can use in arithmetic (bigint operations)
			const doubled: bigint = gas * 2n;
			expect(doubled).toBe(42000n);
		});
	});
});
