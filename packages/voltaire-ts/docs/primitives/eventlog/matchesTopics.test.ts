/**
 * Tests for docs/primitives/eventlog/matchesTopics.mdx
 * Tests the code examples from the EventLog.matchesTopics() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog matchesTopics.mdx documentation examples", () => {
	describe("Null Wildcard", () => {
		it("null at any position matches any topic value", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const fromHash = Hash.from("0x" + "11".repeat(32));
			const toHash = Hash.from("0x" + "22".repeat(32));

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG, fromHash, toHash],
				data: new Uint8Array([]),
			});

			// Match Transfer events with any from/to addresses
			// NOTE: Docs show log.matchesTopics([...])
			// Actual API: EventLog.matchesTopics(log, [...])
			const matches = EventLog.matchesTopics(log, [
				TRANSFER_SIG, // topic0 must be Transfer signature
				null, // topic1 can be any address
				null, // topic2 can be any address
			]);

			expect(matches).toBe(true);
		});
	});

	describe("Single Hash Match", () => {
		it("specific hash must match exactly at that position", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const userHash = Hash.from(
				"0x000000000000000000000000a1b2c3d4e5f67890abcdef1234567890abcdef12",
			);
			const otherHash = Hash.from("0x" + "99".repeat(32));

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG, otherHash, userHash],
				data: new Uint8Array([]),
			});

			// Match Transfer events TO specific user
			const matches = EventLog.matchesTopics(log, [
				TRANSFER_SIG, // Exact signature
				null, // from: any
				userHash, // to: specific user
			]);

			expect(matches).toBe(true);

			// Should NOT match if user is in wrong position
			const notMatches = EventLog.matchesTopics(log, [
				TRANSFER_SIG,
				userHash, // user in from position
				null,
			]);

			expect(notMatches).toBe(false);
		});
	});

	describe("Array of Hashes (OR Logic)", () => {
		it("matches if log topic equals ANY hash in the array", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const APPROVAL_SIG = Hash.from(
				"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			);

			const transferLog = EventLog.create({
				address: Address.Address.zero(),
				topics: [TRANSFER_SIG],
				data: new Uint8Array([]),
			});

			// Match Transfer OR Approval events
			const matches = EventLog.matchesTopics(transferLog, [
				[TRANSFER_SIG, APPROVAL_SIG], // topic0 can be either
			]);

			expect(matches).toBe(true);
		});
	});

	describe("Empty Filter Array", () => {
		it("empty filter matches all logs", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [Hash.from("0x" + "00".repeat(32))],
				data: new Uint8Array([]),
			});

			// Matches all logs
			const matches = EventLog.matchesTopics(log, []);
			expect(matches).toBe(true);
		});
	});

	describe("ERC-20 Transfer Filtering", () => {
		it("filters all transfers FROM user", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const userHash = Hash.from(
				"0x000000000000000000000000a1b2c3d4e5f67890abcdef1234567890abcdef12",
			);
			const otherHash = Hash.from("0x" + "99".repeat(32));

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, userHash, otherHash], // FROM user
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, otherHash, userHash], // TO user
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, otherHash, otherHash], // Neither
					data: new Uint8Array([]),
				}),
			];

			// All transfers FROM user
			const outgoing = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [TRANSFER_SIG, userHash, null]),
			);

			expect(outgoing.length).toBe(1);

			// All transfers TO user
			const incoming = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [TRANSFER_SIG, null, userHash]),
			);

			expect(incoming.length).toBe(1);

			// All transfers involving user (from OR to)
			const userTransfers = allLogs.filter(
				(log) =>
					EventLog.matchesTopics(log, [TRANSFER_SIG, userHash, null]) ||
					EventLog.matchesTopics(log, [TRANSFER_SIG, null, userHash]),
			);

			expect(userTransfers.length).toBe(2);
		});
	});

	describe("Multiple Event Types", () => {
		it("matches any of multiple event types", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const APPROVAL_SIG = Hash.from(
				"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			);
			const SWAP_SIG = Hash.from("0x" + "99".repeat(32));

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [APPROVAL_SIG],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))], // Unknown event
					data: new Uint8Array([]),
				}),
			];

			// Match any of these event types
			const relevantLogs = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [[TRANSFER_SIG, APPROVAL_SIG, SWAP_SIG]]),
			);

			expect(relevantLogs.length).toBe(2);
		});
	});

	describe("Intra-Group Transfers", () => {
		it("filters transfers between group members", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);

			// Addresses in the group
			const addr1Hash = Hash.from("0x" + "11".repeat(32));
			const addr2Hash = Hash.from("0x" + "22".repeat(32));
			const addr3Hash = Hash.from("0x" + "33".repeat(32));
			const outsideHash = Hash.from("0x" + "99".repeat(32));

			const groupHashes = [addr1Hash, addr2Hash, addr3Hash];

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, addr1Hash, addr2Hash], // Within group
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, addr1Hash, outsideHash], // Outside group
					data: new Uint8Array([]),
				}),
			];

			// Transfers between any group members
			const intraGroupTransfers = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [
					TRANSFER_SIG,
					groupHashes, // from: any group member
					groupHashes, // to: any group member
				]),
			);

			expect(intraGroupTransfers.length).toBe(1);
		});
	});

	describe("NFT Transfer Tracking", () => {
		it("tracks NFT mints and burns", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const TRANSFER_SIG = Hash.from(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			const zeroHash = Hash.from("0x" + "00".repeat(32));
			const userHash = Hash.from("0x" + "11".repeat(32));

			const allLogs = [
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, zeroHash, userHash], // Mint (from zero)
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, userHash, zeroHash], // Burn (to zero)
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG, userHash, Hash.from("0x" + "22".repeat(32))], // Regular transfer
					data: new Uint8Array([]),
				}),
			];

			// NFT mints (from zero address)
			const mints = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [TRANSFER_SIG, zeroHash, null]),
			);

			// NFT burns (to zero address)
			const burns = allLogs.filter((log) =>
				EventLog.matchesTopics(log, [TRANSFER_SIG, null, zeroHash]),
			);

			expect(mints.length).toBe(1);
			expect(burns.length).toBe(1);
		});
	});

	describe("Partial Filter (Fewer Topics)", () => {
		it("filter can have fewer topics than log", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const topic0 = Hash.from("0x" + "00".repeat(32));
			const topic1 = Hash.from("0x" + "11".repeat(32));
			const topic2 = Hash.from("0x" + "22".repeat(32));
			const topic3 = Hash.from("0x" + "33".repeat(32));

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [topic0, topic1, topic2, topic3], // 4 topics
				data: new Uint8Array([]),
			});

			// Match only first 2 topics
			const matches = EventLog.matchesTopics(log, [topic0, topic1]);
			expect(matches).toBe(true); // remaining topics ignored
		});
	});

	describe("Empty Topics Check", () => {
		it("filter with topics fails on empty log topics", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const log = EventLog.create({
				address: Address.Address.zero(),
				topics: [], // No topics
				data: new Uint8Array([]),
			});

			// Filter with topics fails
			const matches1 = EventLog.matchesTopics(log, [
				Hash.from("0x" + "00".repeat(32)),
			]);
			expect(matches1).toBe(false);

			// Empty filter matches
			const matches2 = EventLog.matchesTopics(log, []);
			expect(matches2).toBe(true);
		});
	});
});
