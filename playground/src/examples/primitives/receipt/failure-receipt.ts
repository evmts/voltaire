import { type Uint256Type, Bytes } from "@tevm/voltaire";
import { Address, BlockHash, BlockNumber, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "@tevm/voltaire";

// Example: Failed transaction receipts

// Transaction reverted with reason
const revertedTransaction = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
	),
	transactionIndex: TransactionIndex(10),
	blockHash: BlockHash.fromHex(
		"0xc5e389416116e3696cce82ec4533cce33efccb24ce245ae9546a4b8f0d5e9a75",
	),
	blockNumber: BlockNumber(15537395n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
	cumulativeGasUsed: 50000n as Uint256Type,
	gasUsed: 50000n as Uint256Type, // Consumed gas even though failed
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.failed("Insufficient balance"),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip1559",
});
if (TransactionStatus.isFailed(revertedTransaction.status)) {
}

// Out of gas error
const outOfGas = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
	),
	transactionIndex: TransactionIndex(3),
	blockHash: BlockHash.fromHex(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	blockNumber: BlockNumber(15537396n),
	from: Address.fromHex("0x5409ed021d9299bf6814279a6a1411a7e866a631"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 100000n as Uint256Type,
	gasUsed: 100000n as Uint256Type, // All gas consumed
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.failed("Out of gas"),
	effectiveGasPrice: 25000000000n as Uint256Type,
	type: "legacy",
});

// Custom error message
const customError = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	),
	transactionIndex: TransactionIndex(7),
	blockHash: BlockHash.fromHex(
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	),
	blockNumber: BlockNumber(15537397n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 75000n as Uint256Type,
	gasUsed: 75000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.failed("ERC20: transfer amount exceeds balance"),
	effectiveGasPrice: 28000000000n as Uint256Type,
	type: "eip1559",
});
