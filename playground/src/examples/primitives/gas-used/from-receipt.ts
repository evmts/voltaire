import { GasUsed } from "voltaire";
// Simulate different transaction receipt scenarios
const receipts = [
	{
		transactionHash: "0x123...simple transfer",
		gasUsed: 21000n,
		type: "ETH Transfer",
	},
	{
		transactionHash: "0x456...erc20 transfer",
		gasUsed: 65000n,
		type: "ERC-20 Transfer",
	},
	{
		transactionHash: "0x789...swap",
		gasUsed: 180000n,
		type: "Uniswap V3 Swap",
	},
	{
		transactionHash: "0xabc...nft mint",
		gasUsed: 250000n,
		type: "NFT Mint",
	},
	{
		transactionHash: "0xdef...contract deploy",
		gasUsed: 1500000n,
		type: "Contract Deployment",
	},
];

const gasPrice = 30_000_000_000n; // 30 gwei
for (const receipt of receipts) {
	const gasUsed = GasUsed.from(receipt.gasUsed);
	const cost = GasUsed.calculateCost(gasUsed, gasPrice);
	const costInEth = Number(cost) / 1e18;
}
const totalGasUsed = receipts.reduce((sum, r) => sum + r.gasUsed, 0n);
const avgGasUsed = totalGasUsed / BigInt(receipts.length);
const totalCost = GasUsed.calculateCost(totalGasUsed, gasPrice);
