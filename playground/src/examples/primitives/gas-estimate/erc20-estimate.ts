import { GasEstimate } from "@tevm/voltaire";
// Example: ERC20 token gas estimation

// Typical ERC20 operations
const operations = {
	transfer: GasEstimate(65000n),
	approve: GasEstimate(46000n),
	transferFrom: GasEstimate(70000n),
};
const firstTransfer = GasEstimate(65000n); // Writing to new storage slot
const subsequentTransfer = GasEstimate(45000n); // Updating existing slot
for (const [op, estimate] of Object.entries(operations)) {
	const buffered = GasEstimate.withBuffer(estimate, 25);
}
const usdcEstimate = GasEstimate(68000n); // USDC uses more gas

const withBuffer = GasEstimate.withBuffer(usdcEstimate, 20);

const gasLimit = GasEstimate.toGasLimit(withBuffer);

// Cost calculation at 50 gwei
const gasPrice = 50_000_000_000n;
const cost = gasLimit * gasPrice;
const ethCost = Number(cost) / 1e18;
const ethTransfer = GasEstimate(21000n);
const erc20Transfer = GasEstimate(65000n);
const ratio =
	Number(GasEstimate.toBigInt(erc20Transfer)) /
	Number(GasEstimate.toBigInt(ethTransfer));
