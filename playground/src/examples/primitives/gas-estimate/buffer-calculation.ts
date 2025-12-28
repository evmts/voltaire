import { GasEstimate } from "@tevm/voltaire";
const base = GasEstimate(100000n);

const buffers = [0, 5, 10, 15, 20, 25, 30, 40, 50];
for (const pct of buffers) {
	const buffered = GasEstimate.withBuffer(base, pct);
	const increase = GasEstimate.toBigInt(buffered) - GasEstimate.toBigInt(base);
}
const recommendations = [
	{ type: "ETH transfer", gas: 21000n, buffer: 20, reason: "Very stable" },
	{
		type: "ERC20 transfer",
		gas: 65000n,
		buffer: 25,
		reason: "Some variability",
	},
	{ type: "DEX swap", gas: 150000n, buffer: 30, reason: "Price slippage" },
	{ type: "Complex DeFi", gas: 250000n, buffer: 35, reason: "State-dependent" },
	{
		type: "Deployment",
		gas: 1000000n,
		buffer: 40,
		reason: "Constructor logic",
	},
];

for (const { type, gas, buffer, reason } of recommendations) {
	const estimate = GasEstimate(gas);
	const buffered = GasEstimate.withBuffer(estimate, buffer);
}
const gasPrice = 50_000_000_000n;
const testEstimate = GasEstimate(100000n);

for (const bufferPct of [10, 20, 30, 40]) {
	const buffered = GasEstimate.withBuffer(testEstimate, bufferPct);
	const cost = GasEstimate.toBigInt(buffered) * gasPrice;
	const ethCost = Number(cost) / 1e18;
	const increase = bufferPct;
}
const estimate = GasEstimate(100000n);
const fractionalBuffers = [12.5, 17.5, 22.5, 27.5];

for (const pct of fractionalBuffers) {
	const buffered = GasEstimate.withBuffer(estimate, pct);
}
const rpcEstimate = GasEstimate(51234n);

// Try different buffers
for (const pct of [20, 25, 30]) {
	const buffered = GasEstimate.withBuffer(rpcEstimate, pct);
	const limit = GasEstimate.toGasLimit(buffered);
}
const actualGas = 51234n;
const noBuffer = GasEstimate(actualGas);
const withBuffer = GasEstimate.withBuffer(actualGas, 20);
