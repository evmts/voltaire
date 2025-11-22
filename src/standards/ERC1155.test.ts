import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../crypto/Keccak256/hash.js";
import { Address } from "../primitives/Address/index.js";
import * as Uint256 from "../primitives/Uint/index.js";
import * as ERC1155 from "./ERC1155.js";

describe("ERC1155", () => {
	describe("SELECTORS", () => {
		it("has correct balanceOf selector", () => {
			const sig = "balanceOf(address,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.balanceOf).toBe(selector);
		});

		it("has correct balanceOfBatch selector", () => {
			const sig = "balanceOfBatch(address[],uint256[])";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.balanceOfBatch).toBe(selector);
		});

		it("has correct setApprovalForAll selector", () => {
			const sig = "setApprovalForAll(address,bool)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.setApprovalForAll).toBe(selector);
		});

		it("has correct isApprovedForAll selector", () => {
			const sig = "isApprovedForAll(address,address)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.isApprovedForAll).toBe(selector);
		});

		it("has correct safeTransferFrom selector", () => {
			const sig = "safeTransferFrom(address,address,uint256,uint256,bytes)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.safeTransferFrom).toBe(selector);
		});

		it("has correct safeBatchTransferFrom selector", () => {
			const sig =
				"safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.safeBatchTransferFrom).toBe(selector);
		});

		it("has correct uri selector (Metadata)", () => {
			const sig = "uri(uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const selector = `0x${Buffer.from(hash.slice(0, 4)).toString("hex")}`;
			expect(ERC1155.SELECTORS.uri).toBe(selector);
		});
	});

	describe("EVENTS", () => {
		it("has correct TransferSingle event signature", () => {
			const sig = "TransferSingle(address,address,address,uint256,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = `0x${Buffer.from(hash).toString("hex")}`;
			expect(ERC1155.EVENTS.TransferSingle).toBe(eventSig);
		});

		it("has correct TransferBatch event signature", () => {
			const sig = "TransferBatch(address,address,address,uint256[],uint256[])";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = `0x${Buffer.from(hash).toString("hex")}`;
			expect(ERC1155.EVENTS.TransferBatch).toBe(eventSig);
		});

		it("has correct ApprovalForAll event signature", () => {
			const sig = "ApprovalForAll(address,address,bool)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = `0x${Buffer.from(hash).toString("hex")}`;
			expect(ERC1155.EVENTS.ApprovalForAll).toBe(eventSig);
		});

		it("has correct URI event signature", () => {
			const sig = "URI(string,uint256)";
			const hash = keccak256(new TextEncoder().encode(sig));
			const eventSig = `0x${Buffer.from(hash).toString("hex")}`;
			expect(ERC1155.EVENTS.URI).toBe(eventSig);
		});
	});

	describe("encodeBalanceOf", () => {
		it("encodes balanceOf calldata", () => {
			const account = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);
			const id = Uint256.fromBigInt(1n);

			const calldata = ERC1155.encodeBalanceOf(account, id);

			expect(calldata).toMatch(/^0x00fdd58e/); // balanceOf selector
			expect(calldata.length).toBe(138); // 10 + 64 + 64
		});

		it("encodes balanceOf with different addresses and IDs", () => {
			const account = Address.fromHex(
				"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			);
			const id = Uint256.fromBigInt(999n);

			const calldata = ERC1155.encodeBalanceOf(account, id);

			expect(calldata).toMatch(/^0x00fdd58e/);
			expect(calldata).toContain("aaaaaaaaaaaaaaaaaaaaaa");
		});

		it("encodes balanceOf with zero ID", () => {
			const account = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);
			const id = Uint256.fromBigInt(0n);

			const calldata = ERC1155.encodeBalanceOf(account, id);

			expect(calldata).toMatch(/^0x00fdd58e/);
		});
	});

	describe("encodeSetApprovalForAll", () => {
		it("encodes setApprovalForAll(true) calldata", () => {
			const operator = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);

			const calldata = ERC1155.encodeSetApprovalForAll(operator, true);

			expect(calldata).toMatch(/^0xa22cb465/); // setApprovalForAll selector
			expect(calldata.length).toBe(138); // 10 + 64 + 64
			expect(calldata).toContain(
				"0000000000000000000000000000000000000000000000000000000000000001",
			);
		});

		it("encodes setApprovalForAll(false) calldata", () => {
			const operator = Address.fromHex(
				"0x1234567890123456789012345678901234567890",
			);

			const calldata = ERC1155.encodeSetApprovalForAll(operator, false);

			expect(calldata).toMatch(/^0xa22cb465/);
			expect(calldata.length).toBe(138);
			expect(calldata).toContain(
				"0000000000000000000000000000000000000000000000000000000000000000",
			);
		});
	});

	describe("encodeSafeTransferFrom", () => {
		it("encodes safeTransferFrom calldata without data", () => {
			const from = Address.fromHex(
				"0x1111111111111111111111111111111111111111",
			);
			const to = Address.fromHex("0x2222222222222222222222222222222222222222");
			const id = Uint256.fromBigInt(10n);
			const amount = Uint256.fromBigInt(100n);

			const calldata = ERC1155.encodeSafeTransferFrom(from, to, id, amount);

			expect(calldata).toMatch(/^0xf242432a/); // safeTransferFrom selector
			// 10 (0x+selector) + 64 (from) + 64 (to) + 64 (id) + 64 (amount) + 2 (data offset "a0") + 64 (data length = 0) = 332
			expect(calldata.length).toBe(332);
		});

		it("encodes safeTransferFrom calldata with data", () => {
			const from = Address.fromHex(
				"0x1111111111111111111111111111111111111111",
			);
			const to = Address.fromHex("0x2222222222222222222222222222222222222222");
			const id = Uint256.fromBigInt(20n);
			const amount = Uint256.fromBigInt(50n);
			const data = new Uint8Array([1, 2, 3, 4, 5]);

			const calldata = ERC1155.encodeSafeTransferFrom(
				from,
				to,
				id,
				amount,
				data,
			);

			expect(calldata).toMatch(/^0xf242432a/);
			// Should include encoded data
			expect(calldata).toContain(
				"0000000000000000000000000000000000000000000000000000000000000005",
			); // data length
		});

		it("encodes safeTransferFrom with large amounts", () => {
			const from = Address.fromHex(
				"0x1111111111111111111111111111111111111111",
			);
			const to = Address.fromHex("0x2222222222222222222222222222222222222222");
			const id =
				Uint256.fromBigInt(
					115792089237316195423570985008687907853269984665640564039457584007913129639935n,
				); // max uint256
			const amount =
				Uint256.fromBigInt(
					115792089237316195423570985008687907853269984665640564039457584007913129639935n,
				);

			const calldata = ERC1155.encodeSafeTransferFrom(from, to, id, amount);

			expect(calldata).toMatch(/^0xf242432a/);
		});
	});

	describe("encodeIsApprovedForAll", () => {
		it("encodes isApprovedForAll calldata", () => {
			const account = Address.fromHex(
				"0x1111111111111111111111111111111111111111",
			);
			const operator = Address.fromHex(
				"0x2222222222222222222222222222222222222222",
			);

			const calldata = ERC1155.encodeIsApprovedForAll(account, operator);

			expect(calldata).toMatch(/^0xe985e9c5/); // isApprovedForAll selector
			expect(calldata.length).toBe(138); // 10 + 64 + 64
		});

		it("encodes isApprovedForAll with identical addresses", () => {
			const address = Address.fromHex(
				"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			);

			const calldata = ERC1155.encodeIsApprovedForAll(address, address);

			expect(calldata).toMatch(/^0xe985e9c5/);
			expect(calldata).toContain("aaaaaaaaaaaaaaaaaaaaaa");
		});
	});

	describe("encodeURI", () => {
		it("encodes uri calldata", () => {
			const id = Uint256.fromBigInt(1n);

			const calldata = ERC1155.encodeURI(id);

			expect(calldata).toMatch(/^0x0e89341c/); // uri selector
			expect(calldata.length).toBe(74); // 10 + 64
		});

		it("encodes uri with large ID", () => {
			const id = Uint256.fromBigInt(999999999999n);

			const calldata = ERC1155.encodeURI(id);

			expect(calldata).toMatch(/^0x0e89341c/);
			expect(calldata.length).toBe(74);
		});

		it("encodes uri with zero ID", () => {
			const id = Uint256.fromBigInt(0n);

			const calldata = ERC1155.encodeURI(id);

			expect(calldata).toMatch(/^0x0e89341c/);
		});
	});

	describe("decodeTransferSingleEvent", () => {
		it("decodes TransferSingle event", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferSingle,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // operator
					"0x0000000000000000000000002222222222222222222222222222222222222222", // from
					"0x0000000000000000000000003333333333333333333333333333333333333333", // to
				],
				data:
					"0x" +
					"000000000000000000000000000000000000000000000000000000000000000a" + // id = 10
					"0000000000000000000000000000000000000000000000000000000000000064", // value = 100
			};

			const decoded = ERC1155.decodeTransferSingleEvent(log);

			expect(decoded.operator).toBe(
				"0x1111111111111111111111111111111111111111",
			);
			expect(decoded.from).toBe("0x2222222222222222222222222222222222222222");
			expect(decoded.to).toBe("0x3333333333333333333333333333333333333333");
			expect(decoded.id).toBe(10n);
			expect(decoded.value).toBe(100n);
		});

		it("decodes TransferSingle event (mint: from=zero)", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferSingle,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // operator
					"0x0000000000000000000000000000000000000000000000000000000000000000", // from = zero
					"0x0000000000000000000000002222222222222222222222222222222222222222", // to
				],
				data:
					"0x" +
					"0000000000000000000000000000000000000000000000000000000000000001" + // id = 1
					"0000000000000000000000000000000000000000000000000000000000000032", // value = 50
			};

			const decoded = ERC1155.decodeTransferSingleEvent(log);

			expect(decoded.from).toBe("0x0000000000000000000000000000000000000000");
			expect(decoded.id).toBe(1n);
			expect(decoded.value).toBe(50n);
		});

		it("decodes TransferSingle event (burn: to=zero)", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferSingle,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // operator
					"0x0000000000000000000000002222222222222222222222222222222222222222", // from
					"0x0000000000000000000000000000000000000000000000000000000000000000", // to = zero
				],
				data:
					"0x" +
					"0000000000000000000000000000000000000000000000000000000000000005" + // id = 5
					"0000000000000000000000000000000000000000000000000000000000000019", // value = 25
			};

			const decoded = ERC1155.decodeTransferSingleEvent(log);

			expect(decoded.to).toBe("0x0000000000000000000000000000000000000000");
			expect(decoded.value).toBe(25n);
		});

		it("decodes TransferSingle with max uint256 value", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.TransferSingle,
					"0x0000000000000000000000001111111111111111111111111111111111111111",
					"0x0000000000000000000000002222222222222222222222222222222222222222",
					"0x0000000000000000000000003333333333333333333333333333333333333333",
				],
				data:
					"0x" +
					"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" + // id = max
					"ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // value = max
			};

			const decoded = ERC1155.decodeTransferSingleEvent(log);

			expect(decoded.id).toBe(
				115792089237316195423570985008687907853269984665640564039457584007913129639935n,
			);
			expect(decoded.value).toBe(
				115792089237316195423570985008687907853269984665640564039457584007913129639935n,
			);
		});

		it("throws on wrong event signature", () => {
			const log = {
				topics: [
					"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
					"0x0000000000000000000000001111111111111111111111111111111111111111",
					"0x0000000000000000000000002222222222222222222222222222222222222222",
					"0x0000000000000000000000003333333333333333333333333333333333333333",
				],
				data:
					"0x0000000000000000000000000000000000000000000000000000000000000001" +
					"0000000000000000000000000000000000000000000000000000000000000001",
			};

			expect(() => ERC1155.decodeTransferSingleEvent(log)).toThrow(
				"Not a TransferSingle event",
			);
		});
	});

	describe("decodeApprovalForAllEvent", () => {
		it("decodes ApprovalForAll event (true)", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // account
					"0x0000000000000000000000002222222222222222222222222222222222222222", // operator
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000001", // approved = true
			};

			const decoded = ERC1155.decodeApprovalForAllEvent(log);

			expect(decoded.account).toBe(
				"0x1111111111111111111111111111111111111111",
			);
			expect(decoded.operator).toBe(
				"0x2222222222222222222222222222222222222222",
			);
			expect(decoded.approved).toBe(true);
		});

		it("decodes ApprovalForAll event (false)", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // account
					"0x0000000000000000000000002222222222222222222222222222222222222222", // operator
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000000", // approved = false
			};

			const decoded = ERC1155.decodeApprovalForAllEvent(log);

			expect(decoded.approved).toBe(false);
		});

		it("decodes ApprovalForAll with identical addresses", () => {
			const log = {
				topics: [
					ERC1155.EVENTS.ApprovalForAll,
					"0x0000000000000000000000001111111111111111111111111111111111111111", // account = operator
					"0x0000000000000000000000001111111111111111111111111111111111111111",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000001",
			};

			const decoded = ERC1155.decodeApprovalForAllEvent(log);

			expect(decoded.account).toBe(decoded.operator);
		});

		it("throws on wrong event signature", () => {
			const log = {
				topics: [
					"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
					"0x0000000000000000000000001111111111111111111111111111111111111111",
					"0x0000000000000000000000002222222222222222222222222222222222222222",
				],
				data: "0x0000000000000000000000000000000000000000000000000000000000000001",
			};

			expect(() => ERC1155.decodeApprovalForAllEvent(log)).toThrow(
				"Not an ApprovalForAll event",
			);
		});
	});
});
