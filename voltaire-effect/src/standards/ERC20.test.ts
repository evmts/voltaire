import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import * as ERC20 from "./ERC20.js";

const testAddress = Address("0x1234567890123456789012345678901234567890");
const testAddress2 = Address("0x0987654321098765432109876543210987654321");
const testAmount = 1000000000000000000n;

describe("ERC20", () => {
	describe("SELECTORS", () => {
		it("exports correct function selectors", () => {
			expect(ERC20.SELECTORS.transfer).toBe("0xa9059cbb");
			expect(ERC20.SELECTORS.approve).toBe("0x095ea7b3");
			expect(ERC20.SELECTORS.balanceOf).toBe("0x70a08231");
			expect(ERC20.SELECTORS.transferFrom).toBe("0x23b872dd");
			expect(ERC20.SELECTORS.allowance).toBe("0xdd62ed3e");
		});
	});

	describe("EVENTS", () => {
		it("exports correct event signatures", () => {
			expect(ERC20.EVENTS.Transfer).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			expect(ERC20.EVENTS.Approval).toBe(
				"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			);
		});
	});

	describe("encodeTransfer", () => {
		it("encodes transfer calldata", async () => {
			const result = await Effect.runPromise(
				ERC20.encodeTransfer(testAddress, testAmount),
			);
			expect(result).toMatch(/^0xa9059cbb/);
		});
	});

	describe("encodeApprove", () => {
		it("encodes approve calldata", async () => {
			const result = await Effect.runPromise(
				ERC20.encodeApprove(testAddress, testAmount),
			);
			expect(result).toMatch(/^0x095ea7b3/);
		});
	});

	describe("encodeTransferFrom", () => {
		it("encodes transferFrom calldata", async () => {
			const result = await Effect.runPromise(
				ERC20.encodeTransferFrom(testAddress, testAddress2, testAmount),
			);
			expect(result).toMatch(/^0x23b872dd/);
		});
	});

	describe("encodeBalanceOf", () => {
		it("encodes balanceOf calldata", async () => {
			const result = await Effect.runPromise(ERC20.encodeBalanceOf(testAddress));
			expect(result).toMatch(/^0x70a08231/);
		});
	});

	describe("encodeAllowance", () => {
		it("encodes allowance calldata", async () => {
			const result = await Effect.runPromise(
				ERC20.encodeAllowance(testAddress, testAddress2),
			);
			expect(result).toMatch(/^0xdd62ed3e/);
		});
	});

	describe("decodeTransferEvent", () => {
		it("decodes Transfer event log", async () => {
			const log = {
				topics: [
					ERC20.EVENTS.Transfer,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
			};

			const result = await Effect.runPromise(ERC20.decodeTransferEvent(log));
			expect(result.from).toBe("0x1234567890123456789012345678901234567890");
			expect(result.to).toBe("0x0987654321098765432109876543210987654321");
			expect(result.value).toBe(1000000000000000000n);
		});

		it("fails on invalid event signature", async () => {
			const log = {
				topics: ["0x1234", "0x0000", "0x0000"],
				data: "0x0000",
			};

			const result = await Effect.runPromiseExit(ERC20.decodeTransferEvent(log));
			expect(result._tag).toBe("Failure");
		});
	});

	describe("decodeApprovalEvent", () => {
		it("decodes Approval event log", async () => {
			const log = {
				topics: [
					ERC20.EVENTS.Approval,
					"0x0000000000000000000000001234567890123456789012345678901234567890",
					"0x0000000000000000000000000987654321098765432109876543210987654321",
				],
				data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
			};

			const result = await Effect.runPromise(ERC20.decodeApprovalEvent(log));
			expect(result.owner).toBe("0x1234567890123456789012345678901234567890");
			expect(result.spender).toBe("0x0987654321098765432109876543210987654321");
			expect(result.value).toBe(1000000000000000000n);
		});
	});

	describe("decodeUint256", () => {
		it("decodes uint256 return value", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";
			const result = await Effect.runPromise(ERC20.decodeUint256(data));
			expect(result).toBe(1000000000000000000n);
		});
	});

	describe("decodeBool", () => {
		it("decodes true", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			const result = await Effect.runPromise(ERC20.decodeBool(data));
			expect(result).toBe(true);
		});

		it("decodes false", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const result = await Effect.runPromise(ERC20.decodeBool(data));
			expect(result).toBe(false);
		});
	});

	describe("decodeAddress", () => {
		it("decodes address return value", async () => {
			const data =
				"0x0000000000000000000000001234567890123456789012345678901234567890";
			const result = await Effect.runPromise(ERC20.decodeAddress(data));
			expect(result).toBe("0x1234567890123456789012345678901234567890");
		});
	});

	describe("decodeString", () => {
		it("decodes string return value", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000020" +
				"0000000000000000000000000000000000000000000000000000000000000005" +
				"48656c6c6f000000000000000000000000000000000000000000000000000000";
			const result = await Effect.runPromise(ERC20.decodeString(data));
			expect(result).toBe("Hello");
		});
	});
});
