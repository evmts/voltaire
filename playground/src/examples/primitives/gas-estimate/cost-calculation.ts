import { GasEstimate } from "voltaire";
const estimate = GasEstimate.from(65000n);
const gasPrice = 50_000_000_000n; // 50 gwei in wei

const cost = GasEstimate.toBigInt(estimate) * gasPrice;
const ethCost = Number(cost) / 1e18;
const erc20Estimate = GasEstimate.from(65000n);

const gasPrices = [
	{ name: "Low", gwei: 10n, wei: 10_000_000_000n },
	{ name: "Medium", gwei: 50n, wei: 50_000_000_000n },
	{ name: "High", gwei: 100n, wei: 100_000_000_000n },
	{ name: "Extreme", gwei: 200n, wei: 200_000_000_000n },
];

for (const { name, gwei, wei } of gasPrices) {
	const cost = GasEstimate.toBigInt(erc20Estimate) * wei;
	const ethCost = Number(cost) / 1e18;
}
const baseEstimate = GasEstimate.from(100000n);
const buffered = GasEstimate.withBuffer(baseEstimate, 25);
const priceWei = 50_000_000_000n;

const baseCost = GasEstimate.toBigInt(baseEstimate) * priceWei;
const bufferedCost = GasEstimate.toBigInt(buffered) * priceWei;
const transactions = [
	{ name: "ETH transfer", gas: 21000n },
	{ name: "ERC20 transfer", gas: 65000n },
	{ name: "Uniswap swap", gas: 150000n },
	{ name: "NFT mint", gas: 200000n },
	{ name: "Contract deploy", gas: 1000000n },
];

const stdGasPrice = 50_000_000_000n;

for (const { name, gas } of transactions) {
	const estimate = GasEstimate.from(gas);
	const cost = GasEstimate.toBigInt(estimate) * stdGasPrice;
	const ethCost = Number(cost) / 1e18;
}
const txPerDay = 100;
const txEstimate = GasEstimate.from(65000n);
const txGasPrice = 50_000_000_000n;

const singleTxCost = GasEstimate.toBigInt(txEstimate) * txGasPrice;
const dailyCost = singleTxCost * BigInt(txPerDay);
const dailyEthCost = Number(dailyCost) / 1e18;

// USD cost calculation (example ETH price)
const ethPriceUSD = 2000;
const dailyUSDCost = dailyEthCost * ethPriceUSD;
const rpcEstimate = GasEstimate.from(120000n);
const withBuffer = GasEstimate.withBuffer(rpcEstimate, 30);
const maxGasLimit = GasEstimate.toGasLimit(withBuffer);

const maxCost = maxGasLimit * stdGasPrice;
const maxEthCost = Number(maxCost) / 1e18;

// Actual cost will be lower (unused gas refunded)
const actualUsed = 125000n; // Slightly more than estimate
const actualCost = actualUsed * stdGasPrice;
const actualEthCost = Number(actualCost) / 1e18;
const refunded = (maxGasLimit - actualUsed) * stdGasPrice;
const refundedEth = Number(refunded) / 1e18;
const unoptimized = GasEstimate.from(150000n);
const optimized = GasEstimate.from(100000n);
const savings =
	GasEstimate.toBigInt(unoptimized) - GasEstimate.toBigInt(optimized);
const savingsCost = savings * stdGasPrice;
const savingsEth = Number(savingsCost) / 1e18;
