/**
 * Fork-aware Blob Fee Market tests:
 * - EIP-7691 (Prague blob schedule)
 * - EIP-7892 (BPO1 / BPO2 mainnet timestamp schedules)
 * - EIP-7918 (Osaka execution-bounded blob base fee reserve price)
 */

import { describe, expect, it } from "vitest";
import { InvalidFormatError, InvalidRangeError } from "../errors/index.js";
import * as Hardfork from "../Hardfork/index.js";
import type { BlobScheduleType } from "./BlobScheduleType.js";
import * as FeeMarket from "./FeeMarket.js";
import { normalizeBlobHardfork } from "./normalizeBlobHardfork.js";

const GAS_PER_BLOB = 131_072n;

type ScheduleKey = "cancun" | "prague" | "bpo1" | "bpo2";

const SCHEDULES: Record<ScheduleKey, BlobScheduleType> = {
	cancun: FeeMarket.BlobSchedule.CANCUN,
	prague: FeeMarket.BlobSchedule.PRAGUE,
	bpo1: FeeMarket.BlobSchedule.BPO1,
	bpo2: FeeMarket.BlobSchedule.BPO2,
};

// Cross-language reference vectors (matching Zig blob.zig and execution-specs)
const BLOB_BASE_FEE_VECTORS: readonly [ScheduleKey, bigint, bigint][] = [
	["cancun", 0n, 1n],
	["cancun", 1n, 1n],
	["cancun", 393_216n, 1n],
	["cancun", 2_314_057n, 1n],
	["cancun", 2_314_058n, 2n],
	["cancun", 10_000_000n, 19n],
	["cancun", 50_000_000n, 3_194_333n],
	["cancun", 100_000_000n, 10_203_769_476_395n],
	[
		"cancun",
		400_000_000n,
		10_840_331_274_704_280_429_132_033_759_016_842_817_414_750_029_778_539n,
	],
	["prague", 0n, 1n],
	["prague", 786_432n, 1n],
	["prague", 10_000_000n, 7n],
	["prague", 50_000_000n, 21_689n],
	["prague", 100_000_000n, 470_442_149n],
	["prague", 250_385_800n, 5_184_705_528_553_908_270_369n],
	["prague", 400_000_000n, 48_980_690_787_953_896_757_236_758_600_209_812n],
	["bpo1", 0n, 1n],
	["bpo1", 10_000_000n, 3n],
	["bpo1", 50_000_000n, 399n],
	["bpo1", 100_000_000n, 159_773n],
	["bpo1", 400_000_000n, 651_652_063_382_501_955_831n],
	["bpo2", 0n, 1n],
	["bpo2", 10_000_000n, 2n],
	["bpo2", 50_000_000n, 72n],
	["bpo2", 100_000_000n, 5_209n],
	["bpo2", 400_000_000n, 736_466_686_905_748n],
];

describe("BlobSchedule presets & constants (EIP-7691 / EIP-7892 / EIP-7918)", () => {
	it("exposes exact schedule parameters and constants", () => {
		expect(FeeMarket.BlobSchedule.GAS_PER_BLOB).toBe(131_072n);
		expect(FeeMarket.BlobSchedule.MIN_BLOB_BASE_FEE).toBe(1n);
		expect(FeeMarket.BlobSchedule.BLOB_BASE_COST).toBe(8_192n);
		expect(FeeMarket.Eip4844.GAS_PER_BLOB).toBe(131_072n);
		expect(FeeMarket.Eip4844.BLOB_BASE_COST).toBe(8_192n);

		expect(FeeMarket.BlobSchedule.CANCUN).toEqual({
			target: 3n,
			max: 6n,
			baseFeeUpdateFraction: 3_338_477n,
		});
		expect(FeeMarket.BlobSchedule.PRAGUE).toEqual({
			target: 6n,
			max: 9n,
			baseFeeUpdateFraction: 5_007_716n,
		});
		expect(FeeMarket.BlobSchedule.OSAKA).toEqual(FeeMarket.BlobSchedule.PRAGUE);
		expect(FeeMarket.BlobSchedule.BPO1).toEqual({
			target: 10n,
			max: 15n,
			baseFeeUpdateFraction: 8_346_193n,
		});
		expect(FeeMarket.BlobSchedule.BPO2).toEqual({
			target: 14n,
			max: 21n,
			baseFeeUpdateFraction: 11_684_671n,
		});
		expect(FeeMarket.BlobSchedule.BPO1_TIMESTAMP).toBe(1_765_290_071n);
		expect(FeeMarket.BlobSchedule.BPO2_TIMESTAMP).toBe(1_767_747_671n);
	});

	it("resolves schedules by hardfork name and rejects pre-Cancun forks", () => {
		expect(FeeMarket.getBlobSchedule(Hardfork.CANCUN)).toEqual(
			FeeMarket.BlobSchedule.CANCUN,
		);
		expect(FeeMarket.getBlobSchedule(Hardfork.PRAGUE)).toEqual(
			FeeMarket.BlobSchedule.PRAGUE,
		);
		expect(FeeMarket.getBlobSchedule(Hardfork.OSAKA)).toEqual(
			FeeMarket.BlobSchedule.OSAKA,
		);
		expect(FeeMarket.getBlobSchedule("bpo1")).toEqual(
			FeeMarket.BlobSchedule.BPO1,
		);
		expect(FeeMarket.getBlobSchedule("bpo2")).toEqual(
			FeeMarket.BlobSchedule.BPO2,
		);

		expect(() => FeeMarket.getBlobSchedule(Hardfork.SHANGHAI)).toThrow(
			InvalidRangeError,
		);
		expect(() => FeeMarket.getBlobSchedule(Hardfork.FRONTIER)).toThrow(
			InvalidRangeError,
		);
	});

	it("resolves mainnet schedules by timestamp across Cancun/Prague/Osaka/BPO1/BPO2", () => {
		expect(() =>
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.CANCUN_TIMESTAMP - 1n),
		).toThrow(InvalidRangeError);
		expect(
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.CANCUN_TIMESTAMP),
		).toEqual(FeeMarket.BlobSchedule.CANCUN);
		expect(
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.PRAGUE_TIMESTAMP - 1n),
		).toEqual(FeeMarket.BlobSchedule.CANCUN);
		expect(
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.PRAGUE_TIMESTAMP),
		).toEqual(FeeMarket.BlobSchedule.PRAGUE);
		expect(
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.OSAKA_TIMESTAMP - 1n),
		).toEqual(FeeMarket.BlobSchedule.PRAGUE);
		expect(
			FeeMarket.getBlobSchedule(FeeMarket.BlobSchedule.OSAKA_TIMESTAMP),
		).toEqual(FeeMarket.BlobSchedule.OSAKA);
		expect(FeeMarket.getBlobSchedule(1_765_290_070)).toEqual(
			FeeMarket.BlobSchedule.OSAKA,
		);
		expect(FeeMarket.getBlobSchedule(1_765_290_071)).toEqual(
			FeeMarket.BlobSchedule.BPO1,
		);
		expect(FeeMarket.getBlobSchedule(1_767_747_670n)).toEqual(
			FeeMarket.BlobSchedule.BPO1,
		);
		expect(FeeMarket.getBlobSchedule(1_767_747_671n)).toEqual(
			FeeMarket.BlobSchedule.BPO2,
		);

		// Invalid number timestamps rejected
		expect(() => FeeMarket.getBlobSchedule(-1)).toThrow(InvalidFormatError);
		expect(() => FeeMarket.getBlobSchedule(1.5)).toThrow(InvalidFormatError);
		expect(() => FeeMarket.getBlobSchedule(Number.NaN)).toThrow(
			InvalidFormatError,
		);
	});
});

describe("calculateBlobBaseFee & BlobBaseFee across schedules", () => {
	it("matches exact execution-specs vectors across Cancun, Prague, BPO1, and BPO2", () => {
		for (const [key, excess, expected] of BLOB_BASE_FEE_VECTORS) {
			const schedule = SCHEDULES[key];
			expect(
				FeeMarket.calculateBlobBaseFee(excess, schedule.baseFeeUpdateFraction),
			).toBe(expected);
			expect(FeeMarket.calculateBlobBaseFee(excess, schedule)).toBe(expected);
			expect(FeeMarket.BlobBaseFee(excess, schedule)).toBe(expected);
		}
		// Default 1-arg call uses Cancun
		expect(FeeMarket.calculateBlobBaseFee(10_000_000n)).toBe(19n);
		expect(FeeMarket.BlobBaseFee(10_000_000n)).toBe(19n);
	});
});

describe("calculateExcessBlobGas (EIP-4844 / EIP-7691 / EIP-7892 / EIP-7918)", () => {
	it("preserves 100% backwards-compatible 2-arg Cancun behavior", () => {
		expect(FeeMarket.calculateExcessBlobGas(0n, 0n)).toBe(0n);
		expect(FeeMarket.calculateExcessBlobGas(0n, 3n * GAS_PER_BLOB)).toBe(0n);
		expect(FeeMarket.calculateExcessBlobGas(0n, 4n * GAS_PER_BLOB)).toBe(
			GAS_PER_BLOB,
		);
		expect(
			FeeMarket.calculateExcessBlobGas(GAS_PER_BLOB, 3n * GAS_PER_BLOB),
		).toBe(GAS_PER_BLOB);
	});

	it("enforces strict '>' reserve price inequality (16 wei vs 17 wei at 1 wei blob fee)", () => {
		const target = 6n * GAS_PER_BLOB;

		// Below target always returns 0 even with huge execution base fee
		expect(
			FeeMarket.calculateExcessBlobGas(0n, target - 1n, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 1_000_000_000n,
			}),
		).toBe(0n);

		// 8192 * 16 == 131072 * 1 -> strict '>' is FALSE -> normal formula (0)
		expect(
			FeeMarket.calculateExcessBlobGas(0n, target, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 16n,
			}),
		).toBe(0n);

		// 8192 * 17 == 139264 > 131072 * 1 -> strict '>' is TRUE -> reserve formula:
		// 0 + 786432 * (9 - 6) / 9 = 262144
		expect(
			FeeMarket.calculateExcessBlobGas(0n, target, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(262_144n);

		// Existing excess = 1 blob, used = 6 blobs
		expect(
			FeeMarket.calculateExcessBlobGas(GAS_PER_BLOB, target, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 16n,
			}),
		).toBe(GAS_PER_BLOB);
		expect(
			FeeMarket.calculateExcessBlobGas(GAS_PER_BLOB, target, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(393_216n);

		// Floor division check: 7 * 131072 * 3 / 9 = 305834
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 7n * GAS_PER_BLOB, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(305_834n);

		// Full block (9 blobs): 9 * 131072 * 3 / 9 = 393216
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 9n * GAS_PER_BLOB, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(393_216n);
	});

	it("does NOT apply EIP-7918 reserve price on Cancun or Prague", () => {
		const target = 6n * GAS_PER_BLOB;
		expect(
			FeeMarket.calculateExcessBlobGas(0n, target, {
				hardfork: Hardfork.PRAGUE,
				parentBaseFeePerGas: 1_000_000_000n,
			}),
		).toBe(0n);
		expect(
			FeeMarket.calculateExcessBlobGas(0n, target, {
				hardfork: Hardfork.CANCUN,
				parentBaseFeePerGas: 1_000_000_000n,
			}),
		).toBe(3n * GAS_PER_BLOB);
	});

	it("switches schedule and update fraction at exact BPO1 and BPO2 timestamps", () => {
		// BPO1 transition: 27 excess blobs, 0 used, 17 wei execution base fee
		const bpo1Excess = 27n * GAS_PER_BLOB;
		expect(
			FeeMarket.calculateExcessBlobGas(bpo1Excess, 0n, {
				timestamp: FeeMarket.BlobSchedule.BPO1_TIMESTAMP - 1n,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(21n * GAS_PER_BLOB);
		expect(
			FeeMarket.calculateExcessBlobGas(bpo1Excess, 0n, {
				timestamp: FeeMarket.BlobSchedule.BPO1_TIMESTAMP,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(bpo1Excess);

		// BPO2 transition: 50 excess blobs, 0 used, 17 wei execution base fee
		const bpo2Excess = 50n * GAS_PER_BLOB;
		expect(
			FeeMarket.calculateExcessBlobGas(bpo2Excess, 0n, {
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP - 1n,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(40n * GAS_PER_BLOB);
		expect(
			FeeMarket.calculateExcessBlobGas(bpo2Excess, 0n, {
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(bpo2Excess);
	});

	it("supports custom schedules, direct EIP-7918 helper, extreme excess values, and error validation", () => {
		const custom: BlobScheduleType = {
			target: 2n,
			max: 5n,
			baseFeeUpdateFraction: 3_000_000n,
		};
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 3n * GAS_PER_BLOB, {
				schedule: custom,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(235_929n);
		expect(
			FeeMarket.calculateExcessBlobGasEip7918(
				0n,
				3n * GAS_PER_BLOB,
				17n,
				custom,
			),
		).toBe(235_929n);

		// Extreme parentExcessBlobGas terminates rapidly via early-exit ceiling bound
		const hugeExcess = (1n << 64n) - 1n;
		const hugeBaseFee = (1n << 256n) - 1n;
		expect(
			FeeMarket.calculateExcessBlobGasEip7918(
				hugeExcess,
				0n,
				hugeBaseFee,
				FeeMarket.BlobSchedule.OSAKA,
			),
		).toBe(hugeExcess - 6n * GAS_PER_BLOB);

		// Missing parentBaseFeePerGas on Osaka throws
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 6n * GAS_PER_BLOB, {
				hardfork: Hardfork.OSAKA,
			}),
		).toThrow(InvalidRangeError);

		// Invalid custom schedule throws
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 0n, {
				schedule: { target: 5n, max: 3n, baseFeeUpdateFraction: 1n },
			}),
		).toThrow(InvalidRangeError);
	});
});

describe("fork context precedence and normalization (Neon H-6 / Fable F-08 / Astra F-15)", () => {
	const GWEI = 1_000_000_000n;

	it("timestamp wins over hardfork: { hardfork: 'osaka', timestamp: BPO1_TIMESTAMP }", () => {
		// 1 wei parent base fee: reserve bound is inactive, so target decides
		// BPO1 target 10 -> 0; Osaka target 6 would give 4 blobs
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 10n * GAS_PER_BLOB, {
				hardfork: "osaka",
				timestamp: FeeMarket.BlobSchedule.BPO1_TIMESTAMP,
				parentBaseFeePerGas: 1n,
			}),
		).toBe(0n);
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 15n * GAS_PER_BLOB, {
				hardfork: "osaka",
				timestamp: FeeMarket.BlobSchedule.BPO1_TIMESTAMP,
				parentBaseFeePerGas: 1n,
			}),
		).toBe(5n * GAS_PER_BLOB);
	});

	it("timestamp wins over hardfork: { hardfork: 'osaka', timestamp: BPO2_TIMESTAMP }", () => {
		// BPO2 target 14 -> 0; Osaka target 6 would give 8 blobs
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 14n * GAS_PER_BLOB, {
				hardfork: "osaka",
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
				parentBaseFeePerGas: 1n,
			}),
		).toBe(0n);
		// 1 gwei parent base fee: EIP-7918 reserve branch, BPO2 21 blobs
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 14n * GAS_PER_BLOB, {
				hardfork: "osaka",
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
				parentBaseFeePerGas: GWEI,
			}),
		).toBe((14n * GAS_PER_BLOB * 7n) / 21n);
	});

	it("timestamp also gates EIP-7918 over hardfork", () => {
		// Prague timestamp: no reserve price even though hardfork says osaka
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 6n * GAS_PER_BLOB, {
				hardfork: "osaka",
				timestamp: FeeMarket.BlobSchedule.PRAGUE_TIMESTAMP,
				parentBaseFeePerGas: GWEI,
			}),
		).toBe(0n);
	});

	it("{ hardfork: 'bpo2', parentBaseFeePerGas } applies BPO2 schedule and EIP-7918", () => {
		// At target: plain formula gives 0; EIP-7918 gives 14 * 7 / 21 blobs
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 14n * GAS_PER_BLOB, {
				hardfork: "bpo2",
				parentBaseFeePerGas: GWEI,
			}),
		).toBe(611_669n);
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 14n * GAS_PER_BLOB, {
				hardfork: "BPO1",
				parentBaseFeePerGas: GWEI,
			}),
		).toBe((14n * GAS_PER_BLOB * 5n) / 15n);
		// bpo2 without parentBaseFeePerGas throws: EIP-7918 is active
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 0n, { hardfork: "bpo2" }),
		).toThrow(InvalidRangeError);
	});

	it("{ hardfork: 'Osaka', parentBaseFeePerGas } is case-insensitive", () => {
		const expected = (6n * GAS_PER_BLOB * 3n) / 9n;
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 6n * GAS_PER_BLOB, {
				hardfork: "Osaka",
				parentBaseFeePerGas: GWEI,
			}),
		).toBe(expected);
		expect(
			FeeMarket.calculateExcessBlobGas(0n, 6n * GAS_PER_BLOB, {
				hardfork: "OSAKA",
				parentBaseFeePerGas: GWEI,
			}),
		).toBe(expected);
		expect(FeeMarket.getBlobSchedule("Prague")).toEqual(
			FeeMarket.BlobSchedule.PRAGUE,
		);
		expect(FeeMarket.getBlobSchedule("Amsterdam")).toEqual(
			FeeMarket.BlobSchedule.BPO2,
		);
	});

	it.each(["constructor", "__proto__", "toString"])(
		"rejects %s as a hardfork name",
		(name) => {
			expect(() => normalizeBlobHardfork(name)).toThrow(InvalidRangeError);
		},
	);

	it("throws on unknown hardfork names", () => {
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 0n, {
				hardfork: "osakaa",
				parentBaseFeePerGas: GWEI,
			}),
		).toThrow(InvalidRangeError);
		// Validated even when timestamp decides the schedule
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 0n, {
				hardfork: "bpo3",
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
				parentBaseFeePerGas: GWEI,
			}),
		).toThrow(InvalidRangeError);
		expect(() => FeeMarket.getBlobSchedule("notafork")).toThrow(
			InvalidRangeError,
		);
		expect(() => FeeMarket.normalizeBlobHardfork("")).toThrow(
			InvalidRangeError,
		);
	});

	it("rejects invalid number timestamps even with an explicit schedule", () => {
		expect(() =>
			FeeMarket.calculateExcessBlobGas(0n, 0n, {
				schedule: FeeMarket.BlobSchedule.PRAGUE,
				timestamp: 1.5,
			}),
		).toThrow(InvalidFormatError);
	});

	it("normalizes names and classifies Osaka+ forks", () => {
		expect(FeeMarket.normalizeBlobHardfork("Osaka")).toBe("osaka");
		expect(FeeMarket.normalizeBlobHardfork("BPO2")).toBe("bpo2");
		expect(FeeMarket.normalizeBlobHardfork("Paris")).toBe("merge");
		expect(FeeMarket.isBlobForkAtLeastOsaka("bpo1")).toBe(true);
		expect(FeeMarket.isBlobForkAtLeastOsaka("bpo2")).toBe(true);
		expect(FeeMarket.isBlobForkAtLeastOsaka(Hardfork.AMSTERDAM)).toBe(true);
		expect(FeeMarket.isBlobForkAtLeastOsaka(Hardfork.PRAGUE)).toBe(false);
	});
});

describe("fork-aware state helpers (Fable F-04 / Astra F-16)", () => {
	const GWEI = 1_000_000_000n;
	const state = (blobs: bigint, excessBlobGas = 0n): FeeMarket.State => ({
		gasUsed: 15_000_000n,
		gasLimit: 30_000_000n,
		baseFee: GWEI,
		excessBlobGas,
		blobGasUsed: blobs * GAS_PER_BLOB,
	});

	it("nextState keeps Cancun behavior without context", () => {
		expect(FeeMarket.nextState(state(21n)).excessBlobGas).toBe(
			18n * GAS_PER_BLOB,
		);
	});

	it("nextState uses fork schedule and EIP-7918 with state.baseFee on Osaka+", () => {
		// Prague: 9 blobs, target 6, no reserve price
		expect(
			FeeMarket.nextState(state(9n), { hardfork: "prague" }).excessBlobGas,
		).toBe(3n * GAS_PER_BLOB);
		// Prague at target: 0
		expect(
			FeeMarket.nextState(state(6n), { hardfork: "prague" }).excessBlobGas,
		).toBe(0n);
		// Osaka at target with 1 gwei parent base fee: EIP-7918 reserve branch
		expect(
			FeeMarket.nextState(state(6n), { hardfork: "osaka" }).excessBlobGas,
		).toBe(2n * GAS_PER_BLOB);
		// BPO1 / BPO2 by timestamp
		expect(
			FeeMarket.nextState(state(15n), {
				timestamp: FeeMarket.BlobSchedule.BPO1_TIMESTAMP,
			}).excessBlobGas,
		).toBe(5n * GAS_PER_BLOB);
		expect(
			FeeMarket.nextState(state(14n), { hardfork: "bpo2" }).excessBlobGas,
		).toBe(611_669n);
		// Explicit schedule without fork: no reserve price unless requested
		expect(
			FeeMarket.nextState(state(14n), {
				schedule: FeeMarket.BlobSchedule.BPO2,
			}).excessBlobGas,
		).toBe(0n);
		expect(
			FeeMarket.nextState(state(14n), {
				schedule: FeeMarket.BlobSchedule.BPO2,
				reservePrice: true,
			}).excessBlobGas,
		).toBe(611_669n);
		// State.next convenience form forwards context
		expect(
			FeeMarket.State.next.call(state(14n), { hardfork: "bpo2" }).excessBlobGas,
		).toBe(611_669n);
	});

	it("validateState accepts 7..21-blob blocks on Prague/Osaka/BPO1/BPO2", () => {
		expect(FeeMarket.validateState(state(7n))).toEqual([
			"blobGasUsed cannot exceed 786432",
		]);
		expect(FeeMarket.validateState(state(9n), { hardfork: "prague" })).toEqual(
			[],
		);
		expect(FeeMarket.validateState(state(10n), { hardfork: "osaka" })).toEqual([
			"blobGasUsed cannot exceed 1179648",
		]);
		expect(FeeMarket.validateState(state(15n), { hardfork: "bpo1" })).toEqual(
			[],
		);
		expect(FeeMarket.validateState(state(16n), { hardfork: "bpo1" })).toEqual([
			"blobGasUsed cannot exceed 1966080",
		]);
		expect(
			FeeMarket.validateState(state(21n), {
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
			}),
		).toEqual([]);
		expect(FeeMarket.validateState(state(22n), { hardfork: "bpo2" })).toEqual([
			"blobGasUsed cannot exceed 2752512",
		]);
	});

	it("getBlobBaseFee uses the fork update fraction", () => {
		const s = state(0n, 100_000_000n);
		expect(FeeMarket.State.getBlobBaseFee.call(s)).toBe(10_203_769_476_395n);
		expect(FeeMarket.State.getBlobBaseFee.call(s, { hardfork: "prague" })).toBe(
			470_442_149n,
		);
		expect(FeeMarket.State.getBlobBaseFee.call(s, { hardfork: "bpo1" })).toBe(
			159_773n,
		);
		expect(
			FeeMarket.State.getBlobBaseFee.call(s, {
				timestamp: FeeMarket.BlobSchedule.BPO2_TIMESTAMP,
			}),
		).toBe(5_209n);
	});

	it("isAboveBlobGasTarget uses the fork target", () => {
		expect(FeeMarket.State.isAboveBlobGasTarget.call(state(4n))).toBe(true);
		expect(
			FeeMarket.State.isAboveBlobGasTarget.call(state(4n), {
				hardfork: "prague",
			}),
		).toBe(false);
		expect(
			FeeMarket.State.isAboveBlobGasTarget.call(state(7n), {
				hardfork: "osaka",
			}),
		).toBe(true);
		expect(
			FeeMarket.State.isAboveBlobGasTarget.call(state(10n), {
				hardfork: "bpo1",
			}),
		).toBe(false);
		expect(
			FeeMarket.State.isAboveBlobGasTarget.call(state(15n), {
				hardfork: "bpo2",
			}),
		).toBe(true);
	});
});
