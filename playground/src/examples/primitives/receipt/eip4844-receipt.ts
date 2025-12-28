import { type Uint256Type } from "voltaire";
import { Address, BlockHash, BlockNumber, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "voltaire";

// Example: EIP-4844 blob transaction receipt

// EIP-4844 receipt with blob gas fields
const blobReceipt = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: TransactionIndex.from(3),
	blockHash: BlockHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	blockNumber: BlockNumber.from(19426588n), // Post-Dencun
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 250000n as Uint256Type,
	gasUsed: 100000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(100000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip4844",
	blobGasUsed: 131072n as Uint256Type, // 128 KB blob
	blobGasPrice: 1n as Uint256Type,
});

// Calculate total cost
const executionCost = blobReceipt.gasUsed * blobReceipt.effectiveGasPrice;
const blobCost = blobReceipt.blobGasUsed! * blobReceipt.blobGasPrice!;
const totalCost = executionCost + blobCost;

// Multiple blobs
const multiBlobReceipt = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
	),
	transactionIndex: TransactionIndex.from(5),
	blockHash: BlockHash.fromHex(
		"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	),
	blockNumber: BlockNumber.from(19426589n),
	from: Address.fromHex("0x5409ed021d9299bf6814279a6a1411a7e866a631"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 450000n as Uint256Type,
	gasUsed: 150000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(150000n as Uint256Type),
	effectiveGasPrice: 35000000000n as Uint256Type,
	type: "eip4844",
	blobGasUsed: 393216n as Uint256Type, // 3 blobs (384 KB)
	blobGasPrice: 10n as Uint256Type,
});
const blobCount = Number(multiBlobReceipt.blobGasUsed!) / 131072;
const multiBlobCost =
	multiBlobReceipt.blobGasUsed! * multiBlobReceipt.blobGasPrice!;

// High blob gas price scenario
const expensiveBlobReceipt = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
	),
	transactionIndex: TransactionIndex.from(8),
	blockHash: BlockHash.fromHex(
		"0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
	),
	blockNumber: BlockNumber.from(19426590n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 600000n as Uint256Type,
	gasUsed: 120000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(120000n as Uint256Type),
	effectiveGasPrice: 40000000000n as Uint256Type,
	type: "eip4844",
	blobGasUsed: 131072n as Uint256Type,
	blobGasPrice: 1000000000n as Uint256Type, // 1 Gwei per blob gas
});
const expensiveExecution =
	expensiveBlobReceipt.gasUsed * expensiveBlobReceipt.effectiveGasPrice;
const expensiveBlob =
	expensiveBlobReceipt.blobGasUsed! * expensiveBlobReceipt.blobGasPrice!;
