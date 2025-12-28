import { GasUsed } from "voltaire";
// Base operation costs (in gas units)
const operations = [
	{ name: "ETH Transfer", gas: 21000n, description: "Simple value transfer" },
	{
		name: "ERC-20 Transfer",
		gas: 65000n,
		description: "Token transfer to new holder",
	},
	{
		name: "ERC-20 Transfer (existing)",
		gas: 45000n,
		description: "Token transfer to existing holder",
	},
	{
		name: "Uniswap V2 Swap",
		gas: 120000n,
		description: "Token swap on Uniswap V2",
	},
	{
		name: "Uniswap V3 Swap",
		gas: 180000n,
		description: "Token swap on Uniswap V3",
	},
	{
		name: "NFT Mint (ERC-721)",
		gas: 250000n,
		description: "Minting single NFT",
	},
	{
		name: "NFT Transfer",
		gas: 85000n,
		description: "ERC-721 safeTransferFrom",
	},
	{
		name: "Multi-sig Execution",
		gas: 200000n,
		description: "Gnosis Safe transaction",
	},
	{
		name: "ENS Registration",
		gas: 280000n,
		description: "Register .eth domain",
	},
	{
		name: "Contract Deployment",
		gas: 1500000n,
		description: "Deploy medium-sized contract",
	},
];

const gasPrices = [
	{ label: "Low", wei: 15_000_000_000n },
	{ label: "Medium", wei: 30_000_000_000n },
	{ label: "High", wei: 60_000_000_000n },
];

for (const op of operations) {
	const gasUsed = GasUsed.from(op.gas);

	for (const price of gasPrices) {
		const cost = GasUsed.calculateCost(gasUsed, price.wei);
		const costInEth = Number(cost) / 1e18;
		const gwei = Number(price.wei) / 1e9;
	}
}
const storageOps = [
	{ name: "SSTORE (zero → non-zero)", gas: 20000n },
	{ name: "SSTORE (non-zero → non-zero)", gas: 5000n },
	{ name: "SSTORE (non-zero → zero)", gas: 5000n, refund: 15000n },
	{ name: "SLOAD", gas: 2100n },
];

const mediumGasPrice = 30_000_000_000n;

for (const op of storageOps) {
	const gasUsed = GasUsed.from(op.gas);
	const cost = GasUsed.calculateCost(gasUsed, mediumGasPrice);
	if (op.refund) {
		const refund = GasUsed.calculateCost(op.refund, mediumGasPrice);
	}
}
