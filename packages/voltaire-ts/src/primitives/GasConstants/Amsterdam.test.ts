import { describe, expect, expectTypeOf, it } from "vitest";
import { GasConstants } from "../index.js";

describe("Amsterdam EIP-8037 state gas constants", () => {
	it("exports the EIP-8037 parameters", () => {
		expect(GasConstants.AmsterdamCostPerStateByte).toBe(1530n);
		expect(GasConstants.AmsterdamStateBytesPerStorageSet).toBe(64n);
		expect(GasConstants.AmsterdamStateBytesPerNewAccount).toBe(120n);
		expect(GasConstants.AmsterdamStateBytesPerAuthBase).toBe(23n);
		expect(GasConstants.AmsterdamSystemMaxSstoresPerCall).toBe(16n);
		expect(GasConstants.AmsterdamTxMaxTotalGasLimit).toBe(2n ** 32n - 1n);
	});

	it("derives state gas as state bytes times cost per state byte", () => {
		const cpsb = GasConstants.AmsterdamCostPerStateByte;
		expect(GasConstants.AmsterdamStateGasStorageSet).toBe(97920n);
		expect(GasConstants.AmsterdamStateGasStorageSet).toBe(
			GasConstants.AmsterdamStateBytesPerStorageSet * cpsb,
		);
		expect(GasConstants.AmsterdamStateGasNewAccount).toBe(183600n);
		expect(GasConstants.AmsterdamStateGasNewAccount).toBe(
			GasConstants.AmsterdamStateBytesPerNewAccount * cpsb,
		);
		expect(GasConstants.AmsterdamStateGasAuthBase).toBe(35190n);
		expect(GasConstants.AmsterdamStateGasAuthBase).toBe(
			GasConstants.AmsterdamStateBytesPerAuthBase * cpsb,
		);
		expect(GasConstants.AmsterdamStateGasCodeDepositByte).toBe(cpsb);
	});

	it("derives the system call gas limit from sixteen new slots", () => {
		expect(GasConstants.AmsterdamSystemCallGasLimit).toBe(31566720n);
		expect(GasConstants.AmsterdamSystemCallGasLimit).toBe(
			30_000_000n +
				GasConstants.AmsterdamStateGasStorageSet *
					GasConstants.AmsterdamSystemMaxSstoresPerCall,
		);
	});

	it("derives the regular gas per authorization", () => {
		expect(GasConstants.AmsterdamExecutionPerAuthBase).toBe(7816n);
		expect(GasConstants.AmsterdamExecutionPerAuthBase).toBe(
			101n * 16n +
				3000n +
				GasConstants.AmsterdamColdAccountAccess +
				2n * GasConstants.AmsterdamWarmAccess,
		);
	});
});

describe("Amsterdam EIP-8038 state access gas constants", () => {
	it("exports the repriced parameters", () => {
		expect(GasConstants.AmsterdamColdAccountAccess).toBe(3000n);
		expect(GasConstants.AmsterdamColdStorageAccess).toBe(2100n);
		expect(GasConstants.AmsterdamWarmAccess).toBe(100n);
		expect(GasConstants.AmsterdamAccountWrite).toBe(9000n);
		expect(GasConstants.AmsterdamStorageWrite).toBe(10000n);
	});

	it("satisfies the EIP-8038 derivations", () => {
		expect(GasConstants.AmsterdamCreateAccess).toBe(12000n);
		expect(GasConstants.AmsterdamCreateAccess).toBe(
			GasConstants.AmsterdamAccountWrite +
				GasConstants.AmsterdamColdAccountAccess,
		);
		expect(GasConstants.AmsterdamCallValue).toBe(11300n);
		expect(GasConstants.AmsterdamCallValue).toBe(
			GasConstants.AmsterdamAccountWrite + GasConstants.CallStipend,
		);
		expect(GasConstants.AmsterdamStorageClearRefund).toBe(11616n);
		expect(GasConstants.AmsterdamStorageClearRefund).toBe(
			((GasConstants.AmsterdamStorageWrite +
				GasConstants.AmsterdamColdStorageAccess) *
				4800n) /
				5000n,
		);
		expect(GasConstants.AmsterdamAccessListAddress).toBe(2900n);
		expect(GasConstants.AmsterdamAccessListAddress).toBe(
			GasConstants.AmsterdamColdAccountAccess -
				GasConstants.AmsterdamWarmAccess,
		);
		expect(GasConstants.AmsterdamAccessListStorageKey).toBe(2000n);
		expect(GasConstants.AmsterdamAccessListStorageKey).toBe(
			GasConstants.AmsterdamColdStorageAccess -
				GasConstants.AmsterdamWarmAccess,
		);
	});

	it("leaves the pre-Amsterdam constants in place", () => {
		expect(GasConstants.ColdAccountAccess).toBe(2600n);
		expect(GasConstants.Create).toBe(32000n);
		expect(GasConstants.TxGasLimitOsaka).toBe(16777216n);
	});

	it("preserves literal bigint types", () => {
		expectTypeOf(GasConstants.AmsterdamCostPerStateByte).toEqualTypeOf<1530n>();
		expectTypeOf(
			GasConstants.AmsterdamColdAccountAccess,
		).toEqualTypeOf<3000n>();
	});
});
