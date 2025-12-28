import { type Uint256Type } from "voltaire";
import { Address, BlockHash, BlockNumber, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "voltaire";

// Example: Successful transaction receipt

// Simple ETH transfer (21,000 gas)
const ethTransfer = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
	),
	transactionIndex: TransactionIndex.from(0),
	blockHash: BlockHash.fromHex(
		"0x4e3a3754410177e6937ef1f84bba68ea139e8d1a2258c5f85db9f1cd715a1bdd",
	),
	blockNumber: BlockNumber.from(46147n),
	from: Address.fromHex("0x5409ed021d9299bf6814279a6a1411a7e866a631"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(21000n as Uint256Type),
	effectiveGasPrice: 20000000000n as Uint256Type,
	type: "legacy",
});

// Check status
if (TransactionStatus.isSuccess(ethTransfer.status)) {
}

// EIP-1559 transaction
const eip1559Receipt = Receipt.from({
	transactionHash: TransactionHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	transactionIndex: TransactionIndex.from(5),
	blockHash: BlockHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	blockNumber: BlockNumber.from(15537394n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
	cumulativeGasUsed: 456789n as Uint256Type,
	gasUsed: 65000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: new Uint8Array(256),
	status: TransactionStatus.success(65000n as Uint256Type),
	effectiveGasPrice: 25000000000n as Uint256Type,
	type: "eip1559",
});
