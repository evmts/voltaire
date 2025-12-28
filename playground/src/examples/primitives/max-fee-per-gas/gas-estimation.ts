import { MaxFeePerGas } from "voltaire";

// Common gas limits for different operations
const GAS_LIMITS = {
	transfer: 21000n, // Simple ETH transfer
	erc20Transfer: 65000n, // ERC20 token transfer
	uniswapSwap: 150000n, // Uniswap V2 swap
	nftMint: 200000n, // NFT mint
	complexContract: 500000n, // Complex contract interaction
};

// Fee levels
const lowFee = MaxFeePerGas.fromGwei(30n);
const mediumFee = MaxFeePerGas.fromGwei(50n);
const highFee = MaxFeePerGas.fromGwei(100n);
for (const [label, fee] of [
	["Low", lowFee],
	["Medium", mediumFee],
	["High", highFee],
]) {
	const costWei = MaxFeePerGas.toWei(fee) * GAS_LIMITS.transfer;
	const costGwei = costWei / 1000000000n;
	const costEth = Number(costWei) / 1e18;
}
for (const [label, fee] of [
	["Low", lowFee],
	["Medium", mediumFee],
	["High", highFee],
]) {
	const costWei = MaxFeePerGas.toWei(fee) * GAS_LIMITS.erc20Transfer;
	const costGwei = costWei / 1000000000n;
	const costEth = Number(costWei) / 1e18;
}
for (const [label, fee] of [
	["Low", lowFee],
	["Medium", mediumFee],
	["High", highFee],
]) {
	const costWei = MaxFeePerGas.toWei(fee) * GAS_LIMITS.uniswapSwap;
	const costGwei = costWei / 1000000000n;
	const costEth = Number(costWei) / 1e18;
}
const nftFees = [
	MaxFeePerGas.fromGwei(50n),
	MaxFeePerGas.fromGwei(150n),
	MaxFeePerGas.fromGwei(500n),
];
for (const [i, fee] of nftFees.entries()) {
	const costWei = MaxFeePerGas.toWei(fee) * GAS_LIMITS.nftMint;
	const costGwei = costWei / 1000000000n;
	const costEth = Number(costWei) / 1e18;
}
const budgetGwei = 1000000n; // 0.001 ETH budget
const gasLimit = GAS_LIMITS.erc20Transfer;
const maxAffordable = budgetGwei / gasLimit;
const affordableMaxFee = MaxFeePerGas.fromGwei(maxAffordable);

for (const [name, gasLimit] of Object.entries(GAS_LIMITS)) {
	const cost30 = (30n * gasLimit) / 1000n;
	const cost50 = (50n * gasLimit) / 1000n;
	const cost100 = (100n * gasLimit) / 1000n;
	const paddedName = name.padEnd(18);
}
