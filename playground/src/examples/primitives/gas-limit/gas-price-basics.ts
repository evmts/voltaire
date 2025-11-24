import * as Gas from "../../../primitives/Gas/index.js";
// Create from wei
const priceWei = Gas.gasPriceFrom(20000000000n); // 20 gwei in wei

// Create from gwei
const priceGwei = Gas.gasPriceFromGwei(20); // 20 gwei
const gasPrice = Gas.gasPriceFrom(50000000000n); // 50 gwei in wei
// Cost = Gas Limit × Gas Price

const gasLimit = 21000n;
const gasPriceInWei = 20000000000n; // 20 gwei

const totalCostWei = gasLimit * gasPriceInWei;

// Convert to ETH
const costInEth = Number(totalCostWei) / 1e18;

// Low (slow, cheap)
const lowGasPrice = Gas.gasPriceFromGwei(5);

// Standard (normal speed)
const standardGasPrice = Gas.gasPriceFromGwei(20);

// Fast (quick confirmation)
const fastGasPrice = Gas.gasPriceFromGwei(50);

// Urgent (immediate)
const urgentGasPrice = Gas.gasPriceFromGwei(100);
const erc20GasLimit = 65000n;

function calculateCost(gasLimit: bigint, gweiPrice: number): string {
	const priceWei = BigInt(gweiPrice) * 1000000000n;
	const cost = gasLimit * priceWei;
	return (Number(cost) / 1e18).toFixed(6);
}
