import { Wei, Gwei, Ether } from "@tevm/voltaire";

// GasPrice: Gas price calculations and conversions
// Wei is the base unit (1 ETH = 10^18 wei)

// Create gas prices in different units
const gasPriceWei = Wei(20000000000n); // 20 gwei in wei
const gasPriceGwei = Gwei(20n); // 20 gwei
const tipGwei = Gwei(2n); // 2 gwei priority fee

console.log("Gas price (wei):", Wei.toString(gasPriceWei));
console.log("Gas price (gwei):", Gwei.toString(gasPriceGwei));

// Convert between units
const gweiAsWei = Gwei.toWei(gasPriceGwei);
console.log("20 gwei in wei:", Wei.toString(gweiAsWei));

const weiAsGwei = Wei.toGwei(gasPriceWei);
console.log("20 gwei back:", Gwei.toString(weiAsGwei));

// Calculate transaction cost
const gasLimit = 21000n; // Standard transfer
const gasCost = gasLimit * Wei.toBigInt(gasPriceWei);
console.log("Transfer cost (wei):", gasCost);
console.log("Transfer cost (ETH):", Number(gasCost) / 1e18);

// EIP-1559 fee calculation
const baseFee = Gwei(15n);
const maxPriorityFee = Gwei(2n);
const maxFee = Gwei(30n);

// Effective gas price = min(baseFee + maxPriorityFee, maxFee)
const effectiveBaseFee = Gwei.toBigInt(baseFee);
const effectivePriority = Gwei.toBigInt(maxPriorityFee);
const effectiveMax = Gwei.toBigInt(maxFee);
const effectivePrice = BigInt(Math.min(
	Number(effectiveBaseFee + effectivePriority),
	Number(effectiveMax),
));

console.log("Effective gas price:", effectivePrice / BigInt(1e9), "gwei");

// Estimate costs for different transaction types
const txTypes = {
	transfer: 21000n,
	erc20Transfer: 65000n,
	uniswapSwap: 150000n,
	nftMint: 200000n,
};

console.log("\nEstimated costs at 20 gwei:");
for (const [name, gas] of Object.entries(txTypes)) {
	const cost = gas * 20n * BigInt(1e9);
	const ethCost = Number(cost) / 1e18;
	console.log(`  ${name}: ${ethCost.toFixed(6)} ETH`);
}

// Compare historical gas prices
const gasHistory = [
	Gwei(10n),  // Low traffic
	Gwei(50n),  // Medium traffic
	Gwei(200n), // High traffic (NFT mint)
];

console.log("\nGas price comparison:");
gasHistory.forEach((price, i) => {
	const swapCost = 150000n * Gwei.toBigInt(price);
	console.log(`  ${Gwei.toString(price)} gwei: ${(Number(swapCost) / 1e18).toFixed(4)} ETH swap`);
});
