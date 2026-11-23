import { describe, expect, it } from "vitest";
import * as Hardfork from "../Hardfork/index.js";
import * as BlobModule from "./index.js";

describe("Blob re-exports for fork-aware blob schedules (EIP-7691 / EIP-7892 / EIP-7918)", () => {
	it("exposes BlobSchedule, getBlobSchedule, and fee helpers from Blob module and namespace", () => {
		expect(BlobModule.BlobSchedule.CANCUN.target).toBe(3n);
		expect(BlobModule.BlobSchedule.PRAGUE.target).toBe(6n);
		expect(BlobModule.BlobSchedule.OSAKA.target).toBe(6n);
		expect(BlobModule.BlobSchedule.BPO1.target).toBe(10n);
		expect(BlobModule.BlobSchedule.BPO2.target).toBe(14n);

		expect(BlobModule.getBlobSchedule(Hardfork.OSAKA)).toEqual(
			BlobModule.BlobSchedule.OSAKA,
		);
		expect(BlobModule.getBlobSchedule(1_765_290_071n)).toEqual(
			BlobModule.BlobSchedule.BPO1,
		);
		expect(BlobModule.getBlobSchedule(1_767_747_671n)).toEqual(
			BlobModule.BlobSchedule.BPO2,
		);

		expect(BlobModule.Blob.BlobSchedule).toBe(BlobModule.BlobSchedule);
		expect(BlobModule.Blob.getBlobSchedule).toBe(BlobModule.getBlobSchedule);
		expect(
			BlobModule.calculateExcessBlobGas(0n, 6n * 131_072n, {
				hardfork: Hardfork.OSAKA,
				parentBaseFeePerGas: 17n,
			}),
		).toBe(262_144n);
	});
});
