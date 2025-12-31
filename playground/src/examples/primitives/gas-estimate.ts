import { GasEstimate } from "@tevm/voltaire";
// Example: GasEstimate basics

// Create gas estimates from different sources
const ethTransferEstimate = GasEstimate(21000n);
const erc20Estimate = GasEstimate(65000);
const complexCallEstimate = GasEstimate("150000");
const base = GasEstimate(100000n);
const rpcEstimate = GasEstimate(51234n);

const withSafetyBuffer = GasEstimate.withBuffer(rpcEstimate, 25);

const gasLimit = GasEstimate.toGasLimit(withSafetyBuffer);
const estimate1 = GasEstimate(50000n);
const estimate2 = GasEstimate(75000n);
const gasPrice = 50_000_000_000n; // 50 gwei in wei
const estimate = GasEstimate(65000n);
const estimateWithBuffer = GasEstimate.withBuffer(estimate, 20);
const cost = GasEstimate.toBigInt(estimateWithBuffer) * gasPrice;
const costInEth = Number(cost) / 1e18;
