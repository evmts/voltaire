import { describe, expect, it } from "vitest";
import { Ether } from "./Ether.js";
import { Ether as BrandedEther } from "./ether-index.js";
import { Gwei } from "./Gwei.js";
import { Wei } from "./Wei.js";

const MAX_UINT256 = 2n ** 256n - 1n;
type EtherValue = ReturnType<typeof Ether.from>;
type BrandedEtherValue = ReturnType<typeof BrandedEther.from>;

describe("Ether.toU256 range (regression: negative bigint branded as Uint256)", () => {
	it.each(["-1", "-0.000000000000000001", "-1e-18", -1, -1n, "-123.5"])(
		"Ether.js rejects negative %s",
		(value) => {
			expect(() => Ether.toU256(Ether.from(value))).toThrow(
				"cannot be negative",
			);
		},
	);

	it("Ether.js accepts zero, negative zero and the Uint256 maximum", () => {
		expect(Ether.toU256(Ether.from("0"))).toBe(0n);
		expect(Ether.toU256(Ether.from("-0"))).toBe(0n);
		expect(Ether.toU256(Ether.from("1.5"))).toBe(1_500_000_000_000_000_000n);
		expect(Ether.toU256(Ether.fromWei(Wei(MAX_UINT256)))).toBe(MAX_UINT256);
	});

	it("Ether.js rejects values above the Uint256 maximum", () => {
		// 2^256 wei is one above the maximum.
		const over = `${(MAX_UINT256 + 1n) / 10n ** 18n + 1n}` as EtherValue;
		expect(() => Ether.toU256(over)).toThrow("exceeds Uint256 maximum");
	});

	it("ether-index toU256 rejects a negative value cast past from()", () => {
		expect(() => BrandedEther.from("-1")).toThrow("cannot be negative");
		expect(() => BrandedEther.toU256("-1" as BrandedEtherValue)).toThrow(
			"cannot be negative",
		);
		expect(BrandedEther.toU256(BrandedEther.from("1"))).toBe(10n ** 18n);
	});
});

describe("Gwei.js whole-gwei consistency", () => {
	it("from requires a non-negative whole amount and returns a bigint", () => {
		expect(Gwei.from(21n)).toBe(21n);
		expect(Gwei.from("21")).toBe(21n);
		expect(() => Gwei.from("1.5")).toThrow();
		expect(() => Gwei.from(1.5)).toThrow();
		expect(() => Gwei.from(-1n)).toThrow();
	});

	it("fromWei converts whole gwei and rejects a fractional remainder", () => {
		expect(Gwei.fromWei(Wei(21_000_000_000n))).toBe(21n);
		expect(Gwei.fromWei(Wei(0n))).toBe(0n);
		// 1.5 gwei used to truncate to 1 gwei, losing 0.5 gwei.
		expect(() => Gwei.fromWei(Wei(1_500_000_000n))).toThrow(
			"not a whole number of Gwei",
		);
		expect(() => Gwei.fromWei(Wei(1n))).toThrow("not a whole number of Gwei");
	});

	it("Wei.toGwei agrees with Gwei.fromWei", () => {
		expect(Wei.toGwei(Wei(21_000_000_000n))).toBe(21n);
		expect(() => Wei.toGwei(Wei(1_500_000_000n))).toThrow(
			"not a whole number of Gwei",
		);
	});

	it("toWei multiplies exactly and rejects overflow instead of wrapping", () => {
		expect(Gwei.toWei(Gwei.from(21n))).toBe(21_000_000_000n);
		const maxGwei = MAX_UINT256 / 1_000_000_000n;
		expect(Gwei.toWei(Gwei.from(maxGwei))).toBe(maxGwei * 1_000_000_000n);
		// Used to wrap modulo 2^256.
		expect(() => Gwei.toWei(Gwei.from(maxGwei + 1n))).toThrow(
			"exceeds Uint256 maximum",
		);
	});

	it("toWei rejects a decimal-string gwei cast to the bigint type", () => {
		expect(() =>
			Gwei.toWei("1.5" as unknown as ReturnType<typeof Gwei.from>),
		).toThrow("non-negative whole bigint");
	});

	it("round-trips through Wei and Ether", () => {
		const gwei = Gwei.from(1_500_000_000n);
		expect(Gwei.fromWei(Gwei.toWei(gwei))).toBe(gwei);
		expect(Gwei.toEther(gwei)).toBe("1.5");
		expect(Gwei.fromEther(Ether.from("1.5"))).toBe(gwei);
	});
});
