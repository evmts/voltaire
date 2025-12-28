import { type EventLogType, type Uint256Type } from "voltaire";
import { Address, BlockHash, BlockNumber, Hash, Hex, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "voltaire";

// Example: Receipt with event logs

// ERC20 Transfer event
const transferEventLog: EventLogType = {
	address: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
	topics: [
		Hash.fromHex(
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		), // Transfer(address,address,uint256)
		Hash.fromHex(
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb1",
		), // from
		Hash.fromHex(
			"0x0000000000000000000000001a2b3c4d5e6f7890abcdef1234567890abcdef12",
		), // to
	],
	data: Hex.toBytes(
		"0x00000000000000000000000000000000000000000000000000000000000f4240",
	), // 1,000,000 (6 decimals)
	blockNumber: 15537394n,
	transactionHash: Hash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: 5,
	logIndex: 0,
	removed: false,
};

const receiptWithLogs = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: TransactionIndex.from(5),
	blockHash: BlockHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	blockNumber: BlockNumber.from(15537394n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
	cumulativeGasUsed: 456789n as Uint256Type,
	gasUsed: 65000n as Uint256Type,
	contractAddress: null,
	logs: [transferEventLog],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(65000n as Uint256Type),
	effectiveGasPrice: 25000000000n as Uint256Type,
	type: "eip1559",
});

// Access event logs
for (const log of receiptWithLogs.logs) {
}

// Multiple events in one transaction
const swapLog: EventLogType = {
	address: Address.fromHex("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"), // Uniswap Router
	topics: [
		Hash.fromHex(
			"0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
		), // Swap event
		Hash.fromHex(
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb1",
		),
		Hash.fromHex(
			"0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb1",
		),
	],
	data: Hex.toBytes(
		"0x0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000f4240",
	),
	blockNumber: 15537395n,
	transactionIndex: 8,
	logIndex: 1,
	removed: false,
};

const receiptWithMultipleLogs = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	transactionIndex: TransactionIndex.from(8),
	blockHash: BlockHash.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	),
	blockNumber: BlockNumber.from(15537395n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"),
	cumulativeGasUsed: 1234567n as Uint256Type,
	gasUsed: 180000n as Uint256Type,
	contractAddress: null,
	logs: [transferEventLog, swapLog],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(180000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip1559",
});
for (let i = 0; i < receiptWithMultipleLogs.logs.length; i++) {}
