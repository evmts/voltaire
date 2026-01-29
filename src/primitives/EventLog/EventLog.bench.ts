/**
 * EventLog Benchmarks: TS vs WASM vs viem
 *
 * Compares performance of event log operations across implementations.
 * Uses realistic ERC20 Transfer event logs as test data.
 */

import { bench, run } from "mitata";
import { decodeEventLog, encodeEventTopics } from "viem";
import { loadWasm } from "../../wasm-loader/loader.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import { create } from "./create.js";
import {
	filterLogsWasm,
	matchesAddressWasm,
	matchesTopicsWasm,
} from "./EventLog.wasm.js";
import { filterLogs } from "./filterLogs.js";
import { matchesAddress } from "./matchesAddress.js";
import { matchesFilter } from "./matchesFilter.js";
import { matchesTopics } from "./matchesTopics.js";

// Initialize WASM
await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));

// ============================================================================
// ERC20 Transfer Event Test Data
// ============================================================================

// ERC20 Transfer(address indexed from, address indexed to, uint256 value)
const TRANSFER_TOPIC =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// Test addresses (USDC, Uniswap V2 Pair, random addresses)
const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const UNISWAP_PAIR = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const RANDOM_ADDR1 = "0x1111111111111111111111111111111111111111";
const RANDOM_ADDR2 = "0x2222222222222222222222222222222222222222";
const RANDOM_ADDR3 = "0x3333333333333333333333333333333333333333";

// Convert hex strings to branded types for TS/WASM
function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function hexToAddress(hex: string): BrandedAddress {
	return hexToBytes(hex) as BrandedAddress;
}

function hexToHash(hex: string): HashType {
	return hexToBytes(hex) as HashType;
}

function addressToTopic(address: string): HashType {
	// Pad address to 32 bytes
	const clean = address.startsWith("0x") ? address.slice(2) : address;
	const padded = `000000000000000000000000${clean}`;
	return hexToHash(`0x${padded}`);
}

// Branded addresses
const usdcAddr = hexToAddress(USDC_ADDRESS);
const uniswapAddr = hexToAddress(UNISWAP_PAIR);
const randomAddr1 = hexToAddress(RANDOM_ADDR1);
const randomAddr2 = hexToAddress(RANDOM_ADDR2);
const randomAddr3 = hexToAddress(RANDOM_ADDR3);

// Topics
const transferTopic = hexToHash(TRANSFER_TOPIC);
const fromTopic = addressToTopic(USDC_ADDRESS);
const toTopic = addressToTopic(UNISWAP_PAIR);

// Transfer value: 100 USDC (6 decimals = 100_000_000)
const transferData = hexToBytes(
	"0x0000000000000000000000000000000000000000000000000000000005f5e100",
);

// Create a realistic ERC20 Transfer log
const transferLog = create({
	address: usdcAddr,
	topics: [transferTopic, fromTopic, toTopic],
	data: transferData,
	blockNumber: 18_000_000n,
	logIndex: 42,
	transactionIndex: 15,
});

// ERC20 ABI for viem
const erc20TransferAbi = [
	{
		type: "event" as const,
		name: "Transfer",
		inputs: [
			{ indexed: true, name: "from", type: "address" },
			{ indexed: true, name: "to", type: "address" },
			{ indexed: false, name: "value", type: "uint256" },
		],
	},
] as const;

// Create large dataset for filtering benchmarks (1000 logs)
const largeLogs = Array.from({ length: 1000 }, (_, i) => {
	const addresses = [
		usdcAddr,
		uniswapAddr,
		randomAddr1,
		randomAddr2,
		randomAddr3,
	];
	const addr = addresses[i % 5];
	const from = addressToTopic(i % 2 === 0 ? USDC_ADDRESS : RANDOM_ADDR1);
	const to = addressToTopic(i % 3 === 0 ? UNISWAP_PAIR : RANDOM_ADDR2);

	return create({
		address: addr,
		topics: [transferTopic, from, to],
		data: transferData,
		blockNumber: BigInt(18_000_000 + i),
		logIndex: i % 100,
	});
});

// ============================================================================
// Benchmarks: matchesAddress
// ============================================================================

bench("matchesAddress - single - TS", () => {
	matchesAddress(transferLog, usdcAddr);
});

bench("matchesAddress - single - WASM", () => {
	matchesAddressWasm(transferLog.address, [usdcAddr]);
});

await run();

bench("matchesAddress - array (3) - TS", () => {
	matchesAddress(transferLog, [randomAddr1, randomAddr2, usdcAddr]);
});

bench("matchesAddress - array (3) - WASM", () => {
	matchesAddressWasm(transferLog.address, [randomAddr1, randomAddr2, usdcAddr]);
});

await run();

bench("matchesAddress - no match - TS", () => {
	matchesAddress(transferLog, randomAddr1);
});

bench("matchesAddress - no match - WASM", () => {
	matchesAddressWasm(transferLog.address, [randomAddr1]);
});

await run();

// ============================================================================
// Benchmarks: matchesTopics
// ============================================================================

bench("matchesTopics - exact - TS", () => {
	matchesTopics(transferLog, [transferTopic, fromTopic, toTopic]);
});

bench("matchesTopics - exact - WASM", () => {
	matchesTopicsWasm(transferLog.topics as HashType[], [
		transferTopic,
		fromTopic,
		toTopic,
	]);
});

await run();

bench("matchesTopics - wildcard - TS", () => {
	matchesTopics(transferLog, [transferTopic, null, toTopic]);
});

bench("matchesTopics - wildcard - WASM", () => {
	matchesTopicsWasm(transferLog.topics as HashType[], [
		transferTopic,
		null,
		toTopic,
	]);
});

await run();

bench("matchesTopics - topic0 only - TS", () => {
	matchesTopics(transferLog, [transferTopic]);
});

bench("matchesTopics - topic0 only - WASM", () => {
	matchesTopicsWasm(transferLog.topics as HashType[], [transferTopic]);
});

await run();

// ============================================================================
// Benchmarks: matchesFilter (combined)
// ============================================================================

bench("matchesFilter - address+topics - TS", () => {
	matchesFilter(transferLog, {
		address: usdcAddr,
		topics: [transferTopic, null, toTopic],
	});
});

await run();

bench("matchesFilter - with block range - TS", () => {
	matchesFilter(transferLog, {
		address: usdcAddr,
		topics: [transferTopic],
		fromBlock: 17_000_000n,
		toBlock: 19_000_000n,
	});
});

await run();

// ============================================================================
// Benchmarks: filterLogs (batch operations)
// ============================================================================

bench("filterLogs - 1000 logs by address - TS", () => {
	filterLogs(largeLogs, { address: usdcAddr });
});

bench("filterLogs - 1000 logs by address - WASM", () => {
	filterLogsWasm(largeLogs, [usdcAddr], []);
});

await run();

bench("filterLogs - 1000 logs by topic0 - TS", () => {
	filterLogs(largeLogs, { topics: [transferTopic] });
});

bench("filterLogs - 1000 logs by topic0 - WASM", () => {
	filterLogsWasm(largeLogs, [], [transferTopic]);
});

await run();

bench("filterLogs - 1000 logs address+topics - TS", () => {
	filterLogs(largeLogs, {
		address: usdcAddr,
		topics: [transferTopic, null],
	});
});

bench("filterLogs - 1000 logs address+topics - WASM", () => {
	filterLogsWasm(largeLogs, [usdcAddr], [transferTopic, null]);
});

await run();

// ============================================================================
// Benchmarks: viem decodeEventLog
// ============================================================================

// Hex strings for viem (it expects hex format)
const viemTopics = [
	TRANSFER_TOPIC,
	`0x000000000000000000000000${USDC_ADDRESS.slice(2)}`,
	`0x000000000000000000000000${UNISWAP_PAIR.slice(2)}`,
] as const;

const viemData =
	"0x0000000000000000000000000000000000000000000000000000000005f5e100";

bench("decodeEventLog - viem", () => {
	decodeEventLog({
		abi: erc20TransferAbi,
		data: viemData,
		topics: viemTopics,
	});
});

await run();

// ============================================================================
// Benchmarks: encodeEventTopics (viem)
// ============================================================================

bench("encodeEventTopics - viem", () => {
	encodeEventTopics({
		abi: erc20TransferAbi,
		eventName: "Transfer",
		args: {
			from: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			to: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
		},
	});
});

await run();
