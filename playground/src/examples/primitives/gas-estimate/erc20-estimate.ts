import * as GasEstimate from "../../../primitives/GasEstimate/index.js";

// Example: ERC20 token gas estimation

// Typical ERC20 operations
const operations = {
	transfer: GasEstimate.from(65000n),
	approve: GasEstimate.from(46000n),
	transferFrom: GasEstimate.from(70000n),
};
const firstTransfer = GasEstimate.from(65000n); // Writing to new storage slot
const subsequentTransfer = GasEstimate.from(45000n); // Updating existing slot
for (const [op, estimate] of Object.entries(operations)) {
	const buffered = GasEstimate.withBuffer(estimate, 25);
}
const usdcEstimate = GasEstimate.from(68000n); // USDC uses more gas

const withBuffer = GasEstimate.withBuffer(usdcEstimate, 20);

const gasLimit = GasEstimate.toGasLimit(withBuffer);

// Cost calculation at 50 gwei
const gasPrice = 50_000_000_000n;
const cost = gasLimit * gasPrice;
const ethCost = Number(cost) / 1e18;
const ethTransfer = GasEstimate.from(21000n);
const erc20Transfer = GasEstimate.from(65000n);
const ratio =
	Number(GasEstimate.toBigInt(erc20Transfer)) /
	Number(GasEstimate.toBigInt(ethTransfer));
