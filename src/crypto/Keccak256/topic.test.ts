import { describe, expect, it } from "vitest";
import { hashString } from "./hashString.js";
import { topic } from "./topic.js";

describe("Keccak256.topic", () => {
	describe("basic functionality", () => {
		it("should return 32-byte topic", () => {
			const result = topic("Transfer(address,address,uint256)");

			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should be equivalent to hashString", () => {
			const sig = "Approval(address,address,uint256)";

			const topicHash = topic(sig);
			const stringHash = hashString(sig);

			expect(topicHash).toEqual(stringHash);
		});
	});

	describe("known Ethereum event topics", () => {
		it("should compute Transfer(address,address,uint256) topic", () => {
			const result = topic("Transfer(address,address,uint256)");

			// Known topic: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
			expect(result[0]).toBe(0xdd);
			expect(result[1]).toBe(0xf2);
			expect(result[2]).toBe(0x52);
			expect(result[3]).toBe(0xad);
		});

		it("should compute Approval(address,address,uint256) topic", () => {
			const result = topic("Approval(address,address,uint256)");

			// Known topic: 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
			expect(result[0]).toBe(0x8c);
			expect(result[1]).toBe(0x5b);
			expect(result[2]).toBe(0xe1);
			expect(result[3]).toBe(0xe5);
		});
	});

	describe("ERC20 event topics", () => {
		it("should compute all ERC20 event topics", () => {
			const erc20Events = [
				"Transfer(address,address,uint256)",
				"Approval(address,address,uint256)",
			];

			for (const event of erc20Events) {
				const result = topic(event);
				expect(result.length).toBe(32);
			}
		});
	});

	describe("ERC721 event topics", () => {
		it("should compute Transfer(address,address,uint256) topic", () => {
			// Same as ERC20 Transfer
			const result = topic("Transfer(address,address,uint256)");

			expect(result[0]).toBe(0xdd);
			expect(result[1]).toBe(0xf2);
			expect(result[2]).toBe(0x52);
			expect(result[3]).toBe(0xad);
		});

		it("should compute Approval(address,address,uint256) topic", () => {
			// Same as ERC20 Approval
			const result = topic("Approval(address,address,uint256)");

			expect(result[0]).toBe(0x8c);
			expect(result[1]).toBe(0x5b);
			expect(result[2]).toBe(0xe1);
			expect(result[3]).toBe(0xe5);
		});

		it("should compute ApprovalForAll(address,address,bool) topic", () => {
			const result = topic("ApprovalForAll(address,address,bool)");

			// Known topic: 0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31
			expect(result[0]).toBe(0x17);
			expect(result[1]).toBe(0x30);
			expect(result[2]).toBe(0x7e);
			expect(result[3]).toBe(0xab);
		});
	});

	describe("determinism", () => {
		it("should produce same topic for same signature", () => {
			const sig = "MyEvent(uint256,address)";

			const topic1 = topic(sig);
			const topic2 = topic(sig);

			expect(topic1).toEqual(topic2);
		});

		it("should produce different topics for different signatures", () => {
			const topic1 = topic("EventA(uint256)");
			const topic2 = topic("EventB(uint256)");

			expect(topic1).not.toEqual(topic2);
		});
	});

	describe("event signature formatting", () => {
		it("should handle no parameters", () => {
			const result = topic("Trigger()");
			expect(result.length).toBe(32);
		});

		it("should handle single parameter", () => {
			const result = topic("ValueChanged(uint256)");
			expect(result.length).toBe(32);
		});

		it("should handle multiple parameters", () => {
			const result = topic("ComplexEvent(uint256,address,bytes32,bool)");
			expect(result.length).toBe(32);
		});

		it("should handle indexed parameters in signature", () => {
			// Note: 'indexed' keyword is NOT part of the signature for topic calculation
			const result = topic("Transfer(address,address,uint256)");
			expect(result.length).toBe(32);
		});

		it("should handle array parameters", () => {
			const result = topic("BatchTransfer(address[],uint256[])");
			expect(result.length).toBe(32);
		});

		it("should handle tuple parameters", () => {
			const result = topic("StructEvent((uint256,address))");
			expect(result.length).toBe(32);
		});
	});

	describe("case sensitivity", () => {
		it("should be case-sensitive for event names", () => {
			const topic1 = topic("transfer(address,address,uint256)");
			const topic2 = topic("Transfer(address,address,uint256)");

			expect(topic1).not.toEqual(topic2);
		});

		it("should be case-sensitive for parameter types", () => {
			const topic1 = topic("Event(address)");
			const topic2 = topic("Event(Address)"); // Invalid type, but tests case sensitivity

			expect(topic1).not.toEqual(topic2);
		});
	});

	describe("whitespace handling", () => {
		it("should be sensitive to spaces in parameters", () => {
			const topic1 = topic("Event(uint256,address)");
			const topic2 = topic("Event(uint256, address)");

			// Should be different due to space
			expect(topic1).not.toEqual(topic2);
		});

		it("should not trim input", () => {
			const topic1 = topic("Event()");
			const topic2 = topic(" Event()");

			expect(topic1).not.toEqual(topic2);
		});
	});

	describe("collision resistance", () => {
		it("should produce unique topics for different events", () => {
			const events = [
				"Transfer(address,address,uint256)",
				"Approval(address,address,uint256)",
				"Mint(address,uint256)",
				"Burn(address,uint256)",
				"Swap(uint256,uint256,address)",
			];

			const topics = events.map((event) => topic(event));

			// Check all are unique
			const uniqueTopics = new Set(topics.map((t) => t.join(",")));

			expect(uniqueTopics.size).toBe(events.length);
		});
	});

	describe("real-world examples", () => {
		it("should compute Uniswap Swap event topic", () => {
			const result = topic(
				"Swap(address,uint256,uint256,uint256,uint256,address)",
			);
			expect(result.length).toBe(32);
		});

		it("should compute Compound Borrow event topic", () => {
			const result = topic("Borrow(address,uint256,uint256,uint256)");
			expect(result.length).toBe(32);
		});

		it("should compute Aave Deposit event topic", () => {
			const result = topic("Deposit(address,address,uint256,uint16)");
			expect(result.length).toBe(32);
		});

		it("should compute ENS NameRegistered event topic", () => {
			const result = topic("NameRegistered(uint256,address,uint256)");
			expect(result.length).toBe(32);
		});
	});

	describe("anonymous events", () => {
		it("should compute topic for anonymous event signature", () => {
			// Anonymous events still have signatures, just no topic0
			const result = topic("AnonymousEvent(uint256)");
			expect(result.length).toBe(32);
		});
	});

	describe("complex parameter types", () => {
		it("should handle nested tuples", () => {
			const result = topic("ComplexEvent((uint256,(address,bytes32)))");
			expect(result.length).toBe(32);
		});

		it("should handle array of tuples", () => {
			const result = topic("BatchEvent((uint256,address)[])");
			expect(result.length).toBe(32);
		});

		it("should handle dynamic arrays", () => {
			const result = topic("DynamicEvent(uint256[])");
			expect(result.length).toBe(32);
		});

		it("should handle fixed arrays", () => {
			const result = topic("FixedEvent(uint256[5])");
			expect(result.length).toBe(32);
		});

		it("should handle bytes types", () => {
			const result = topic("BytesEvent(bytes32,bytes)");
			expect(result.length).toBe(32);
		});

		it("should handle string type", () => {
			const result = topic("StringEvent(string)");
			expect(result.length).toBe(32);
		});
	});

	describe("edge cases", () => {
		it("should handle very long event names", () => {
			const longName = "A".repeat(100);
			const result = topic(`${longName}(uint256)`);
			expect(result.length).toBe(32);
		});

		it("should handle many parameters", () => {
			const params = new Array(20).fill("uint256").join(",");
			const result = topic(`ManyParams(${params})`);
			expect(result.length).toBe(32);
		});
	});

	describe("standard interface events", () => {
		it("should compute ERC165 events if they existed", () => {
			// ERC165 doesn't define events, but testing the pattern
			const result = topic("InterfaceSupported(bytes4)");
			expect(result.length).toBe(32);
		});

		it("should compute common governance events", () => {
			const events = [
				"ProposalCreated(uint256,address)",
				"VoteCast(address,uint256,uint8,uint256)",
				"ProposalExecuted(uint256)",
			];

			for (const event of events) {
				const result = topic(event);
				expect(result.length).toBe(32);
			}
		});

		it("should compute access control events", () => {
			const events = [
				"RoleGranted(bytes32,address,address)",
				"RoleRevoked(bytes32,address,address)",
			];

			for (const event of events) {
				const result = topic(event);
				expect(result.length).toBe(32);
			}
		});
	});

	describe("cross-validation", () => {
		it("should match hashString exactly", () => {
			const signatures = [
				"Event()",
				"MyEvent(uint256)",
				"ComplexEvent(address,bytes32,bool)",
			];

			for (const sig of signatures) {
				const topicHash = topic(sig);
				const stringHash = hashString(sig);

				expect(topicHash).toEqual(stringHash);
			}
		});
	});
});
