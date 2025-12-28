import { GasEstimate } from "voltaire";
// Example: GasEstimate basics

// Create gas estimates from different sources
const ethTransferEstimate = GasEstimate.from(21000n);
const erc20Estimate = GasEstimate.from(65000);
const complexCallEstimate = GasEstimate.from("150000");
const base = GasEstimate.from(100000n);
const rpcEstimate = GasEstimate.from(51234n);

const withSafetyBuffer = GasEstimate.withBuffer(rpcEstimate, 25);

const gasLimit = GasEstimate.toGasLimit(withSafetyBuffer);
const estimate1 = GasEstimate.from(50000n);
const estimate2 = GasEstimate.from(75000n);
const gasPrice = 50_000_000_000n; // 50 gwei in wei
const estimate = GasEstimate.from(65000n);
const estimateWithBuffer = GasEstimate.withBuffer(estimate, 20);
const cost = GasEstimate.toBigInt(estimateWithBuffer) * gasPrice;
const costInEth = Number(cost) / 1e18;
