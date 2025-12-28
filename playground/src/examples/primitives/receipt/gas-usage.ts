import { type Uint256Type, Bytes } from "@tevm/voltaire";
import { Address, BlockHash, BlockNumber, Receipt, TransactionHash, TransactionIndex, TransactionStatus } from "@tevm/voltaire";

// Example: Gas usage analysis

// Simple transfer (21,000 gas - minimum)
const simpleTransfer = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	),
	transactionIndex: TransactionIndex(0),
	blockHash: BlockHash.fromHex(
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	),
	blockNumber: BlockNumber(15537400n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"),
	cumulativeGasUsed: 21000n as Uint256Type,
	gasUsed: 21000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(21000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type, // 30 Gwei
	type: "eip1559",
});
const simpleCost = simpleTransfer.gasUsed * simpleTransfer.effectiveGasPrice;

// ERC20 transfer (higher gas)
const erc20Transfer = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x3333333333333333333333333333333333333333333333333333333333333333",
	),
	transactionIndex: TransactionIndex(1),
	blockHash: BlockHash.fromHex(
		"0x4444444444444444444444444444444444444444444444444444444444444444",
	),
	blockNumber: BlockNumber(15537400n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), // USDC
	cumulativeGasUsed: 86000n as Uint256Type,
	gasUsed: 65000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(65000n as Uint256Type),
	effectiveGasPrice: 30000000000n as Uint256Type,
	type: "eip1559",
});
const erc20Cost = erc20Transfer.gasUsed * erc20Transfer.effectiveGasPrice;

// Complex DeFi interaction (high gas)
const defiInteraction = Receipt({
	transactionHash: TransactionHash.fromHex(
		"0x5555555555555555555555555555555555555555555555555555555555555555",
	),
	transactionIndex: TransactionIndex(2),
	blockHash: BlockHash.fromHex(
		"0x6666666666666666666666666666666666666666666666666666666666666666",
	),
	blockNumber: BlockNumber(15537400n),
	from: Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"),
	to: Address.fromHex("0x7a250d5630b4cf539739df2c5dacb4c659f2488d"), // Uniswap Router
	cumulativeGasUsed: 386000n as Uint256Type,
	gasUsed: 300000n as Uint256Type,
	contractAddress: null,
	logs: [],
	logsBloom: Bytes.zero(256),
	status: TransactionStatus.success(300000n as Uint256Type),
	effectiveGasPrice: 35000000000n as Uint256Type, // 35 Gwei
	type: "eip1559",
});
const defiCost = defiInteraction.gasUsed * defiInteraction.effectiveGasPrice;
