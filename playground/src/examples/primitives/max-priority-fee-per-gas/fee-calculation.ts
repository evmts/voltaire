import * as MaxPriorityFeePerGas from "../../../primitives/MaxPriorityFeePerGas/index.js";
const gasLimit = 21000n; // Standard ETH transfer
const baseFeeGwei = 30n;
const priorityFee = MaxPriorityFeePerGas.fromGwei(2);

const baseFeeWei = baseFeeGwei * 1000000000n;
const priorityFeeWei = MaxPriorityFeePerGas.toWei(priorityFee);
const totalFeePerGas = baseFeeWei + priorityFeeWei;
const totalTxFee = totalFeePerGas * gasLimit;
const swapGasLimit = 200000n; // Uniswap-like swap
const priorityFeeHigh = MaxPriorityFeePerGas.fromGwei(5);

const swapFeePerGas = baseFeeWei + MaxPriorityFeePerGas.toWei(priorityFeeHigh);
const swapTotalFee = swapFeePerGas * swapGasLimit;
const fees = [
	{ label: "Low", tip: MaxPriorityFeePerGas.fromGwei(1) },
	{ label: "Medium", tip: MaxPriorityFeePerGas.fromGwei(2) },
	{ label: "High", tip: MaxPriorityFeePerGas.fromGwei(5) },
	{ label: "Urgent", tip: MaxPriorityFeePerGas.fromGwei(10) },
];

for (const { label, tip } of fees) {
	const feePerGas = baseFeeWei + MaxPriorityFeePerGas.toWei(tip);
	const total = feePerGas * gasLimit;
}
// MaxFeePerGas = Expected Base Fee + Priority Fee + Buffer
const expectedBaseFee = 30n;
const desiredPriorityFee = MaxPriorityFeePerGas.fromGwei(2);
const buffer = 10n; // 10 Gwei buffer for base fee volatility

const maxFeePerGas =
	expectedBaseFee + MaxPriorityFeePerGas.toGwei(desiredPriorityFee) + buffer;
