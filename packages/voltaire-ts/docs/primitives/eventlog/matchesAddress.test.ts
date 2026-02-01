/**
 * Tests for docs/primitives/eventlog/matchesAddress.mdx
 * Tests the code examples from the EventLog.matchesAddress() documentation
 */

import { describe, expect, it } from "vitest";

describe("EventLog matchesAddress.mdx documentation examples", () => {
	describe("Single Address Filter", () => {
		it("checks exact address equality", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const usdcAddress = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const daiAddress = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);

			const allLogs = [
				EventLog.create({
					address: usdcAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: daiAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
			];

			// Filter logs from USDC contract
			// NOTE: Docs show allLogs.filter(log => log.matchesAddress(usdcAddress))
			// Actual API: allLogs.filter(log => EventLog.matchesAddress(log, usdcAddress))
			const usdcLogs = allLogs.filter((log) =>
				EventLog.matchesAddress(log, usdcAddress),
			);

			expect(usdcLogs.length).toBe(1);
		});
	});

	describe("Multiple Addresses (OR Logic)", () => {
		it("matches if log address equals ANY of the filter addresses", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const usdcAddress = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const daiAddress = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);
			const usdtAddress = Address.Address(
				"0xdAC17F958D2ee523a2206206994597C13D831ec7",
			);

			const stablecoins = [usdcAddress, daiAddress, usdtAddress];

			const allLogs = [
				EventLog.create({
					address: usdcAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: daiAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(), // Not a stablecoin
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
			];

			// Filter logs from any stablecoin
			// NOTE: Docs show allLogs.filter(log => log.matchesAddress(stablecoins))
			// Actual API: allLogs.filter(log => EventLog.matchesAddress(log, stablecoins))
			const stablecoinLogs = allLogs.filter((log) =>
				EventLog.matchesAddress(log, stablecoins),
			);

			expect(stablecoinLogs.length).toBe(2);
		});
	});

	describe("Multi-Contract Monitoring", () => {
		it("monitors multiple DEX contracts", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Monitor multiple DEX contracts
			const dexContracts = [
				Address.Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // Uniswap V2
				Address.Address("0xE592427A0AEce92De3Edee1F18E0157C05861564"), // Uniswap V3
				Address.Address("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"), // Sushiswap
			];

			const allLogs = [
				EventLog.create({
					address: dexContracts[0]!,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
			];

			const dexLogs = allLogs.filter((log) =>
				EventLog.matchesAddress(log, dexContracts),
			);

			expect(dexLogs.length).toBe(1);
		});
	});

	describe("Excluding Specific Contracts", () => {
		it("filters OUT logs from specific contract", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const excludedContract = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			const allLogs = [
				EventLog.create({
					address: excludedContract,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
			];

			// Filter OUT logs from specific contract
			// NOTE: Docs show allLogs.filter(log => !log.matchesAddress(excludedContract))
			// Actual API: allLogs.filter(log => !EventLog.matchesAddress(log, excludedContract))
			const filtered = allLogs.filter(
				(log) => !EventLog.matchesAddress(log, excludedContract),
			);

			expect(filtered.length).toBe(1);
		});
	});

	describe("Combining with Topic Filters", () => {
		it("combines address and topic filtering", async () => {
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

			const usdcAddress = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const daiAddress = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);
			const wethAddress = Address.Address(
				"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
			);

			const tokens = [usdcAddress, daiAddress, wethAddress];

			const allLogs = [
				EventLog.create({
					address: usdcAddress,
					topics: [TRANSFER_SIG],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: daiAddress,
					topics: [APPROVAL_SIG],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [TRANSFER_SIG],
					data: new Uint8Array([]),
				}),
			];

			// Transfer events from any of these tokens
			// NOTE: Docs show allLogs.filter(log => log.matchesAddress(tokens) && log.matchesTopics([TRANSFER_SIG]))
			// Actual API uses static functions
			const transfers = allLogs.filter(
				(log) =>
					EventLog.matchesAddress(log, tokens) &&
					EventLog.matchesTopics(log, [TRANSFER_SIG]),
			);

			expect(transfers.length).toBe(1);
		});
	});

	describe("Batch Filtering", () => {
		it("filterLogs is more efficient for large arrays", async () => {
			const EventLog = await import(
				"../../../src/primitives/EventLog/index.js"
			);
			const Address = await import("../../../src/primitives/Address/index.js");
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const usdcAddress = Address.Address(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
			const daiAddress = Address.Address(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);
			const wethAddress = Address.Address(
				"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
			);

			const allLogs = [
				EventLog.create({
					address: usdcAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: daiAddress,
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
				EventLog.create({
					address: Address.Address.zero(),
					topics: [Hash.from("0x" + "00".repeat(32))],
					data: new Uint8Array([]),
				}),
			];

			// Efficient: Uses optimized internal filtering
			const filtered = EventLog.filterLogs(allLogs, {
				address: [usdcAddress, daiAddress, wethAddress],
			});

			expect(filtered.length).toBe(2);

			// Less efficient: Filters in JavaScript loop (but same result)
			const filtered2 = allLogs.filter((log) =>
				EventLog.matchesAddress(log, [usdcAddress, daiAddress, wethAddress]),
			);

			expect(filtered2.length).toBe(2);
		});
	});
});
