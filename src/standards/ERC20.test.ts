import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../crypto/Keccak256/hash.js";
import { Address } from "../primitives/Address/index.js";
import * as Hex from "../primitives/Hex/index.js";
import * as Uint256 from "../primitives/Uint/index.js";
import * as ERC20 from "./ERC20.js";

describe("ERC20", () => {
	describe("SELECTORS", () => {
		it("has correct totalSupply selector", () => {
			const sig = "totalSupply()";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = Hex.fromBytes(hash.slice(0, 4));
			expect(ERC20.SELECTORS.totalSupply).toBe(selector);
		});

		it("has correct balanceOf selector", () => {
			const sig = "balanceOf(address)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = Hex.fromBytes(hash.slice(0, 4));
			expect(ERC20.SELECTORS.balanceOf).toBe(selector);
		});

		it("has correct transfer selector", () => {
			const sig = "transfer(address,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = Hex.fromBytes(hash.slice(0, 4));
			expect(ERC20.SELECTORS.transfer).toBe(selector);
		});

		it("has correct approve selector", () => {
			const sig = "approve(address,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = Hex.fromBytes(hash.slice(0, 4));
			expect(ERC20.SELECTORS.approve).toBe(selector);
		});

		it("has correct permit selector (EIP-2612)", () => {
			const sig =
				"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = Hex.fromBytes(hash.slice(0, 4));
			expect(ERC20.SELECTORS.permit).toBe(selector);
		});
	});

	describe("EVENTS", () => {
		it("has correct Transfer event signature", () => {
			const sig = "Transfer(address,address,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = Hex.fromBytes(hash);
			expect(ERC20.EVENTS.Transfer).toBe(eventSig);
		});

		it("has correct Approval event signature", () => {
			const sig = "Approval(address,address,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = Hex.fromBytes(hash);
			expect(ERC20.EVENTS.Approval).toBe(eventSig);
		});
	});

	describe("encodeTransfer", () => {
		it("encodes transfer calldata", () => {
			const to = Address.fromHex("0x1234567890123456789012345678901234567890");
			const amount = Uint256.fromBigInt(1000000n);

			const calldata = ERC20.encodeTransfer(to, amount);

			expect(calldata).toMatch(/^0xa9059cbb/); // transfer selector
			expect(calldata.length).toBe(138); // 10 (0x + selector) + 64 (to) + 64 (amount)
		});
	});

	describe("encodeApprove", () => {
		it("encodes approve calldata", () => {
			const spender = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);
			const amount = Uint256.fromBigInt(1000000n);

			const calldata = ERC20.encodeApprove(spender, amount);

			expect(calldata).toMatch(/^0x095ea7b3/); // approve selector
			expect(calldata.length).toBe(138); // 10 + 64 + 64
		});
	});

	describe("encodeTransferFrom", () => {
		it("encodes transferFrom calldata", () => {
			const from = Address.fromHex(
				"0x1111111111111111111111111111111111111111",
			);
			const to = Address.fromHex("0x2222222222222222222222222222222222222222");
			const amount = Uint256.fromBigInt(1000000n);

			const calldata = ERC20.encodeTransferFrom(from, to, amount);

			expect(calldata).toMatch(/^0x23b872dd/); // transferFrom selector
			expect(calldata.length).toBe(202); // 10 + 64 + 64 + 64
		});
	});

	describe("encodeBalanceOf", () => {
		it("encodes balanceOf calldata", () => {
			const account = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);

			const calldata = ERC20.encodeBalanceOf(account);

			expect(calldata).toMatch(/^0x70a08231/); // balanceOf selector
			expect(calldata.length).toBe(74); // 10 + 64
		});
	});

	describe("decodeTransferEvent", () => {
		it("decodes Transfer event", () => {
			const log = {
				topics: [
					ERC20.EVENTS.Transfer,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // from
					"0x0000000000000000000000002222222222222222222222222222222222222222", // to
				],
				data: "0x00000000000000000000000000000000000000000000000000000000000f4240", // 1000000
			};

			const decoded = ERC20.decodeTransferEvent(log);

			expect(decoded.from).toBe("0x1111111111111111111111111111111111111111");
			expect(decoded.to).toBe("0x2222222222222222222222222222222222222222");
			expect(decoded.value).toBe(1000000n);
		});
	});

	describe("decodeApprovalEvent", () => {
		it("decodes Approval event", () => {
			const log = {
				topics: [
					ERC20.EVENTS.Approval,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // owner
					"0x0000000000000000000000002222222222222222222222222222222222222222", // spender
				],
				data: "0x00000000000000000000000000000000000000000000000000000000000f4240", // 1000000
			};

			const decoded = ERC20.decodeApprovalEvent(log);

			expect(decoded.owner).toBe("0x1111111111111111111111111111111111111111");
			expect(decoded.spender).toBe(
				"0x2222222222222222222222222222222222222222",
			);
			expect(decoded.value).toBe(1000000n);
		});
	});

	describe("decodeUint256", () => {
		it("decodes uint256 value", () => {
			const data =
				"0x00000000000000000000000000000000000000000000000000000000000f4240";
			const decoded = ERC20.decodeUint256(data);
			expect(decoded).toBe(1000000n);
		});
	});

	describe("decodeBool", () => {
		it("decodes true", () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			expect(ERC20.decodeBool(data)).toBe(true);
		});

		it("decodes false", () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			expect(ERC20.decodeBool(data)).toBe(false);
		});
	});
});
