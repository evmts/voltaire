import { type Uint256Type } from "voltaire";
import { Address, BlockHash, BlockNumber, Hash, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "voltaire";

// Example: Receipt validation

// Valid post-Byzantium receipt
const validReceipt = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: TransactionIndex.from(0),
	blockHash: BlockHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	blockNumber: BlockNumber.from(15537394n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(21000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip1559",
});
try {
	Receipt.assertValid(validReceipt);
} catch (error) {
	console.error("Validation failed:", error);
}

// Pre-Byzantium receipt (with root instead of status)
const preByzantiumReceipt = {
	transactionHash: TransactionHash.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	transactionIndex: TransactionIndex.from(5),
	blockHash: BlockHash.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	),
	blockNumber: BlockNumber.from(4000000n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	root: Hash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	effectiveGasPrice: 20000000000n as Uint256Type,
	type: "legacy" as const,
};
try {
	Receipt.from({
		transactionHash: TransactionHash.fromHex(
			"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
		),
		transactionIndex: TransactionIndex.from(0),
		blockHash: BlockHash.fromHex(
			"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
		),
		blockNumber: BlockNumber.from(15537394n),
		from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
		to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
		cumulativeGasUsed: 21000n as Uint256Type,
		gasUsed: 21000n as Uint256Type,
		contractAddress: null,
		logs: [],
		logsBloom: new Uint8Array(100), // Wrong size!
		status: TransactionStatus.success(21000n as Uint256Type),
		effectiveGasPrice: 30000000000n as Uint256Type,
		type: "eip1559" as const,
	});
} catch (error) {}
try {
	Receipt.from({
		transactionHash: undefined as any,
		transactionIndex: TransactionIndex.from(0),
		blockHash: BlockHash.fromHex(
			"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
		),
		blockNumber: BlockNumber.from(15537394n),
		from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
		to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
		cumulativeGasUsed: 21000n as Uint256Type,
		gasUsed: 21000n as Uint256Type,
		contractAddress: null,
		logs: [],
		logsBloom: new Uint8Array(256),
		status: TransactionStatus.success(21000n as Uint256Type),
		effectiveGasPrice: 30000000000n as Uint256Type,
		type: "eip1559" as const,
	});
} catch (error) {}
