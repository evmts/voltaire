import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Uint from "../../../primitives/Uint/index.js";

const slow = Gwei.from(10n);
const standard = Gwei.from(30n);
const fast = Gwei.from(50n);
const rapid = Gwei.from(100n);

function formatGasPrice(gwei: Gwei.Type, label: string) {
	const wei = Gwei.toWei(gwei);
}

formatGasPrice(slow, "Slow");
formatGasPrice(standard, "Standard");
formatGasPrice(fast, "Fast");
formatGasPrice(rapid, "Rapid");

// Standard transfer (21,000 gas)
const transferGas = 21000n;

const costs = [
	{ price: slow, label: "Slow" },
	{ price: standard, label: "Standard" },
	{ price: fast, label: "Fast" },
	{ price: rapid, label: "Rapid" },
];

for (const { price, label } of costs) {
	const costGwei = Uint.times(Gwei.toU256(price), Uint.from(transferGas));
	const costWei = Gwei.toWei(costGwei as Gwei.Type);
	const costEther = Wei.toEther(costWei);
}

// Token swap (more complex)
const swapGas = 150000n;
const swapGasPrice = Gwei.from(35n);

const swapCostGwei = Uint.times(Gwei.toU256(swapGasPrice), Uint.from(swapGas));
const swapCostWei = Gwei.toWei(swapCostGwei as Gwei.Type);
const swapCostEther = Wei.toEther(swapCostWei);

// NFT mint
const mintGas = 200000n;
const mintGasPrice = Gwei.from(60n);

const mintCostGwei = Uint.times(Gwei.toU256(mintGasPrice), Uint.from(mintGas));
const mintCostWei = Gwei.toWei(mintCostGwei as Gwei.Type);
const mintCostEther = Wei.toEther(mintCostWei);

const baseFee = Gwei.from(25n);
const priorityFee = Gwei.from(2n);
const maxFeePerGas = Gwei.from(50n);
const maxPriorityFeePerGas = Gwei.from(3n);

const actualFee = Uint.plus(
	Gwei.toU256(baseFee),
	Gwei.toU256(priorityFee),
) as Gwei.Type;
const actualCost = Uint.times(Gwei.toU256(actualFee), Uint.from(transferGas));

const maxCost = Uint.times(Gwei.toU256(maxFeePerGas), Uint.from(transferGas));

const historicalPrices = [
	{ time: "00:00", price: 20n },
	{ time: "06:00", price: 15n },
	{ time: "12:00", price: 35n },
	{ time: "18:00", price: 45n },
	{ time: "23:59", price: 25n },
];
for (const { time, price } of historicalPrices) {
	const gwei = Gwei.from(price);
	const wei = Gwei.toWei(gwei);
}

const network1 = { name: "Ethereum", price: 30n };
const network2 = { name: "Polygon", price: 50n }; // Higher gwei but cheaper fiat
const network3 = { name: "Arbitrum", price: 1n };
for (const { name, price } of [network1, network2, network3]) {
	const gwei = Gwei.from(price);
	const costGwei = Uint.times(Gwei.toU256(gwei), Uint.from(transferGas));
	const costEther = Gwei.toEther(costGwei as Gwei.Type);
}

const originalGasPrice = Gwei.from(100n);
const optimizedGasPrice = Gwei.from(30n);
const gasUsed = 150000n;

const originalCost = Uint.times(
	Gwei.toU256(originalGasPrice),
	Uint.from(gasUsed),
);
const optimizedCost = Uint.times(
	Gwei.toU256(optimizedGasPrice),
	Uint.from(gasUsed),
);
const savings = Uint.minus(originalCost, optimizedCost);

const estimatedGas = 125000n;
const bufferMultiplier = 120n; // 120% for safety
const recommendedLimit = (estimatedGas * bufferMultiplier) / 100n;

const gasPriceForEstimate = Gwei.from(35n);
const estimatedCost = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint.from(estimatedGas),
);
const maxCostWithLimit = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint.from(recommendedLimit),
);
