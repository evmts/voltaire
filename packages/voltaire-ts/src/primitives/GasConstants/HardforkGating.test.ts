import { describe, expect, expectTypeOf, it } from "vitest";
import { InvalidRangeError } from "../errors/ValidationError.js";
import * as Hardfork from "../Hardfork/index.js";
import * as Gas from "./index.js";
import { isHardforkAtLeast } from "./isHardforkAtLeast.js";

/** Every canonical fork name in activation order. */
const ORDER: Gas.HardforkName[] = [
	"frontier",
	"homestead",
	"dao",
	"tangerinewhistle",
	"spuriousdragon",
	"byzantium",
	"constantinople",
	"petersburg",
	"istanbul",
	"muirglacier",
	"berlin",
	"london",
	"arrowglacier",
	"grayglacier",
	"merge",
	"shanghai",
	"cancun",
	"prague",
	"osaka",
	"amsterdam",
];

/** Forks that the old Cancun-ending allowlists did not know. */
const POST_CANCUN: Gas.Hardfork[] = [
	"prague",
	"osaka",
	"amsterdam",
	"glamsterdam",
	Hardfork.PRAGUE,
	Hardfork.OSAKA,
	Hardfork.AMSTERDAM,
	Hardfork.DEFAULT,
];

function expectActivation(
	predicate: (hardfork: Gas.Hardfork) => boolean,
	first: Gas.HardforkName,
): void {
	const firstIndex = ORDER.indexOf(first);
	expect(firstIndex).toBeGreaterThan(0);
	ORDER.forEach((fork, index) => {
		expect([fork, predicate(fork)]).toEqual([fork, index >= firstIndex]);
	});
}

describe("GasConstants hardfork predicates", () => {
	it("ORDER matches the canonical hardfork order", () => {
		expect(ORDER).toEqual(Hardfork.allIds());
	});

	it("hasEIP2929 is true from Berlin on", () => {
		expectActivation(Gas.hasEIP2929, "berlin");
	});

	it("hasEIP3529 is true from London on", () => {
		expectActivation(Gas.hasEIP3529, "london");
	});

	it("hasEIP3860 is true from Shanghai on", () => {
		expectActivation(Gas.hasEIP3860, "shanghai");
	});

	it("hasEIP1153 is true from Cancun on", () => {
		expectActivation(Gas.hasEIP1153, "cancun");
	});

	it("hasEIP4844 is true from Cancun on", () => {
		expectActivation(Gas.hasEIP4844, "cancun");
	});

	it("prague, osaka (DEFAULT) and amsterdam include every earlier EIP", () => {
		expect(Hardfork.DEFAULT).toBe(Hardfork.OSAKA);
		for (const fork of POST_CANCUN) {
			expect(Gas.hasEIP2929(fork)).toBe(true);
			expect(Gas.hasEIP3529(fork)).toBe(true);
			expect(Gas.hasEIP3860(fork)).toBe(true);
			expect(Gas.hasEIP1153(fork)).toBe(true);
			expect(Gas.hasEIP4844(fork)).toBe(true);
		}
	});

	it("accepts branded Hardfork constants as well as names", () => {
		expect(Gas.hasEIP2929(Hardfork.ISTANBUL)).toBe(false);
		expect(Gas.hasEIP2929(Hardfork.BERLIN)).toBe(true);
		expect(Gas.hasEIP3529(Hardfork.BERLIN)).toBe(false);
		expect(Gas.hasEIP3529(Hardfork.LONDON)).toBe(true);
		expect(Gas.hasEIP3860(Hardfork.MERGE)).toBe(false);
		expect(Gas.hasEIP3860(Hardfork.SHANGHAI)).toBe(true);
		expect(Gas.hasEIP1153(Hardfork.SHANGHAI)).toBe(false);
		expect(Gas.hasEIP1153(Hardfork.CANCUN)).toBe(true);
		expect(Gas.hasEIP4844(Hardfork.SHANGHAI)).toBe(false);
		expect(Gas.hasEIP4844(Hardfork.CANCUN)).toBe(true);
	});

	it("resolves the paris, constantinoplefix and glamsterdam aliases", () => {
		expect(Gas.hasEIP3529("paris")).toBe(true);
		expect(Gas.hasEIP3860("paris")).toBe(false);
		expect(Gas.hasEIP2929("constantinoplefix")).toBe(false);
		expect(Gas.Precompile.getEcAddCost("constantinoplefix")).toBe(500n);
		expect(Gas.hasEIP4844("glamsterdam")).toBe(true);
	});

	it("throws for an unknown hardfork instead of applying pre-fork costs", () => {
		const unknown = "not-a-fork" as Gas.Hardfork;
		for (const call of [
			() => Gas.hasEIP2929(unknown),
			() => Gas.hasEIP3529(unknown),
			() => Gas.hasEIP3860(unknown),
			() => Gas.hasEIP1153(unknown),
			() => Gas.hasEIP4844(unknown),
			() => Gas.getColdSloadCost(unknown),
			() => Gas.Precompile.getEcAddCost(unknown),
			() => Gas.hasEIP2929("Cancun" as Gas.Hardfork),
			() => Gas.hasEIP2929("toString" as Gas.Hardfork),
			() => Gas.hasEIP2929(undefined as unknown as Gas.Hardfork),
		]) {
			expect(call).toThrow(InvalidRangeError);
		}
	});

	it("isHardforkAtLeast compares against any target fork", () => {
		expect(isHardforkAtLeast("osaka", Hardfork.PRAGUE)).toBe(true);
		expect(isHardforkAtLeast("prague", Hardfork.OSAKA)).toBe(false);
		expect(isHardforkAtLeast("amsterdam", Hardfork.AMSTERDAM)).toBe(true);
		expect(isHardforkAtLeast("frontier", Hardfork.FRONTIER)).toBe(true);
	});

	it("types Hardfork as a fork name or a branded Hardfork value", () => {
		expectTypeOf<"osaka">().toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf<"prague">().toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf<"amsterdam">().toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf<"paris">().toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf(Hardfork.OSAKA).toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf<"not-a-fork">().not.toMatchTypeOf<Gas.Hardfork>();
		expectTypeOf<Gas.Config["hardfork"]>().toEqualTypeOf<Gas.Hardfork>();
	});
});

describe("GasConstants hardfork-dependent costs after Cancun", () => {
	it("charges EIP-2929 cold access costs", () => {
		for (const fork of POST_CANCUN) {
			expect(Gas.getColdSloadCost(fork)).toBe(2100n);
			expect(Gas.getColdAccountAccessCost(fork)).toBe(2600n);
		}
		expect(Gas.getColdSloadCost("istanbul")).toBe(Gas.Sload);
		expect(Gas.getColdAccountAccessCost("istanbul")).toBe(Gas.ExtStep);
	});

	it("applies EIP-3529 refunds", () => {
		for (const fork of POST_CANCUN) {
			expect(Gas.getSstoreRefund(fork)).toBe(4800n);
			expect(Gas.getSelfdestructRefund(fork)).toBe(0n);
		}
		expect(Gas.getSstoreRefund("berlin")).toBe(15000n);
		expect(Gas.getSelfdestructRefund("berlin")).toBe(24000n);
	});

	it("charges EIP-1108 BN254 costs", () => {
		for (const fork of POST_CANCUN) {
			expect(Gas.Precompile.getEcAddCost(fork)).toBe(150n);
			expect(Gas.Precompile.getEcMulCost(fork)).toBe(6000n);
			expect(Gas.Precompile.calculateEcPairingCost(0n, fork)).toBe(45000n);
			expect(Gas.Precompile.calculateEcPairingCost(2n, fork)).toBe(113000n);
			expect(
				Gas.Precompile.ecPairingCost.call({ pairCount: 1n, hardfork: fork }),
			).toBe(79000n);
		}
	});

	it("charges EIP-196/197 BN254 costs from Byzantium until Istanbul", () => {
		for (const fork of [
			"byzantium",
			"constantinople",
			"petersburg",
		] as Gas.Hardfork[]) {
			expect(Gas.Precompile.getEcAddCost(fork)).toBe(500n);
			expect(Gas.Precompile.getEcMulCost(fork)).toBe(40000n);
			expect(Gas.Precompile.calculateEcPairingCost(0n, fork)).toBe(100000n);
			expect(Gas.Precompile.calculateEcPairingCost(2n, fork)).toBe(260000n);
		}
		for (const fork of [
			"istanbul",
			"muirglacier",
			"berlin",
			"london",
			"paris",
			"merge",
			"shanghai",
			"cancun",
		] as Gas.Hardfork[]) {
			expect(Gas.Precompile.getEcAddCost(fork)).toBe(150n);
			expect(Gas.Precompile.getEcMulCost(fork)).toBe(6000n);
			expect(Gas.Precompile.calculateEcPairingCost(1n, fork)).toBe(79000n);
		}
	});
});

describe("Gas.Precompile BLS12-381 (final EIP-2537)", () => {
	it("exports the final fixed costs", () => {
		expect(Gas.Precompile.Bls12G1Add).toBe(375n);
		expect(Gas.Precompile.Bls12G1MsmBase).toBe(12000n);
		expect(Gas.Precompile.Bls12G2Add).toBe(600n);
		expect(Gas.Precompile.Bls12G2MsmBase).toBe(22500n);
		expect(Gas.Precompile.Bls12PairingBase).toBe(37700n);
		expect(Gas.Precompile.Bls12PairingPerPair).toBe(32600n);
		expect(Gas.Precompile.Bls12MapFpToG1).toBe(5500n);
		expect(Gas.Precompile.Bls12MapFp2ToG2).toBe(23800n);
		expect(Gas.Precompile.Bls12MsmMultiplier).toBe(1000n);
	});

	it("no longer exports the removed G1MUL and G2MUL costs", () => {
		expect("Bls12G1Mul" in Gas.Precompile).toBe(false);
		expect("Bls12G2Mul" in Gas.Precompile).toBe(false);
	});

	it("holds 128-entry integer discount tables with the EIP max_discount", () => {
		const g1 = Gas.Precompile.Bls12G1MsmDiscountTable;
		const g2 = Gas.Precompile.Bls12G2MsmDiscountTable;
		for (const table of [g1, g2]) {
			expect(table.length).toBe(128);
			expect(Object.isFrozen(table)).toBe(true);
			expect(table.every((d) => typeof d === "bigint")).toBe(true);
			// Discounts never increase with k.
			for (let i = 1; i < table.length; i++) {
				expect((table[i] as bigint) <= (table[i - 1] as bigint)).toBe(true);
			}
		}
		expect(g1.slice(0, 8)).toEqual([
			1000n,
			949n,
			848n,
			797n,
			764n,
			750n,
			738n,
			728n,
		]);
		expect(g1[127]).toBe(519n);
		expect(g1.reduce((a, b) => a + b, 0n)).toBe(76517n);
		expect(g2.slice(0, 8)).toEqual([
			1000n,
			1000n,
			923n,
			884n,
			855n,
			832n,
			812n,
			796n,
		]);
		expect(g2[127]).toBe(524n);
		expect(g2.reduce((a, b) => a + b, 0n)).toBe(78436n);
	});

	it("calculates G1 MSM gas as k * 12000 * discount / 1000", () => {
		const cases: Array<[bigint, bigint]> = [
			[0n, 0n],
			[1n, 12000n],
			[2n, 22776n],
			[3n, 30528n],
			[4n, 38256n],
			[8n, 69888n],
			[16n, 129984n],
			[32n, 240768n],
			[128n, 797184n],
		];
		for (const [k, gas] of cases) {
			expect(Gas.Precompile.calculateBls12G1MsmCost(k)).toBe(gas);
		}
	});

	it("calculates G2 MSM gas as k * 22500 * discount / 1000, floored", () => {
		const cases: Array<[bigint, bigint]> = [
			[0n, 0n],
			[1n, 22500n],
			[2n, 45000n],
			[3n, 62302n],
			[4n, 79560n],
			[5n, 96187n],
			[8n, 143280n],
			[16n, 258120n],
			[32n, 465120n],
			[128n, 1509120n],
		];
		for (const [k, gas] of cases) {
			expect(Gas.Precompile.calculateBls12G2MsmCost(k)).toBe(gas);
		}
	});

	it("caps the discount at max_discount above 128 pairs, with no extrapolation", () => {
		for (const k of [129n, 130n, 200n, 1000n, 1_000_000n, 2n ** 64n]) {
			expect(Gas.Precompile.calculateBls12G1MsmCost(k)).toBe(
				(k * 12000n * 519n) / 1000n,
			);
			expect(Gas.Precompile.calculateBls12G2MsmCost(k)).toBe(
				(k * 22500n * 524n) / 1000n,
			);
		}
	});

	it("calculates pairing gas as 32600 * k + 37700", () => {
		expect(Gas.Precompile.calculateBls12PairingCost(1n)).toBe(70300n);
		expect(Gas.Precompile.calculateBls12PairingCost(2n)).toBe(102900n);
		expect(Gas.Precompile.calculateBls12PairingCost(3n)).toBe(135500n);
	});
});
