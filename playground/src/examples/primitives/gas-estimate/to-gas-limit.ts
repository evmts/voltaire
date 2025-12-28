import { GasEstimate } from "@tevm/voltaire";
const estimate = GasEstimate(51234n);

const gasLimit = GasEstimate.toGasLimit(estimate);
const rpcEstimate = GasEstimate(100000n);

const buffered = GasEstimate.withBuffer(rpcEstimate, 25);

const limit = GasEstimate.toGasLimit(buffered);

const transactions = [
	{ name: "ETH transfer", estimate: 21000n, buffer: 20 },
	{ name: "ERC20 transfer", estimate: 65000n, buffer: 25 },
	{ name: "Uniswap swap", estimate: 150000n, buffer: 30 },
	{ name: "Contract deploy", estimate: 1000000n, buffer: 40 },
];

for (const { name, estimate: est, buffer } of transactions) {
	const gasEstimate = GasEstimate(est);
	const withBuffer = GasEstimate.withBuffer(gasEstimate, buffer);
	const gasLimit = GasEstimate.toGasLimit(withBuffer);
}
const directEstimate = GasEstimate(75000n);
const directLimit = GasEstimate.toGasLimit(directEstimate);
const txEstimate = GasEstimate(120000n);
const txBuffered = GasEstimate.withBuffer(txEstimate, 25);
const txGasLimit = GasEstimate.toGasLimit(txBuffered);
const blockGasLimit = 30_000_000n;
const estimates = [
	GasEstimate(1_000_000n),
	GasEstimate(15_000_000n),
	GasEstimate(25_000_000n),
	GasEstimate(35_000_000n),
];

for (const est of estimates) {
	const withBuffer = GasEstimate.withBuffer(est, 30);
	const limit = GasEstimate.toGasLimit(withBuffer);
	const valid = limit <= blockGasLimit;
}
const est1 = GasEstimate(50000n);
const est2 = GasEstimate(75000n);

if (GasEstimate.compare(est1, est2) < 0) {
	const limit1 = GasEstimate.toGasLimit(est1);
	const limit2 = GasEstimate.toGasLimit(est2);
}
const finalEstimate = GasEstimate(100000n);
const finalBuffered = GasEstimate.withBuffer(finalEstimate, 25);
const finalLimit = GasEstimate.toGasLimit(finalBuffered);
