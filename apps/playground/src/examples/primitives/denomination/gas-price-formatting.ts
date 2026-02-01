import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
const slow = Gwei(10n);
const standard = Gwei(30n);
const fast = Gwei(50n);
const rapid = Gwei(100n);

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
	const costGwei = Uint.times(Gwei.toU256(price), Uint(transferGas));
	const costWei = Gwei.toWei(costGwei as Gwei.Type);
	const costEther = Wei.toEther(costWei);
}

// Token swap (more complex)
const swapGas = 150000n;
const swapGasPrice = Gwei(35n);

const swapCostGwei = Uint.times(Gwei.toU256(swapGasPrice), Uint(swapGas));
const swapCostWei = Gwei.toWei(swapCostGwei as Gwei.Type);
const swapCostEther = Wei.toEther(swapCostWei);

// NFT mint
const mintGas = 200000n;
const mintGasPrice = Gwei(60n);

const mintCostGwei = Uint.times(Gwei.toU256(mintGasPrice), Uint(mintGas));
const mintCostWei = Gwei.toWei(mintCostGwei as Gwei.Type);
const mintCostEther = Wei.toEther(mintCostWei);

const baseFee = Gwei(25n);
const priorityFee = Gwei(2n);
const maxFeePerGas = Gwei(50n);
const maxPriorityFeePerGas = Gwei(3n);

const actualFee = Uint.plus(
	Gwei.toU256(baseFee),
	Gwei.toU256(priorityFee),
) as Gwei.Type;
const actualCost = Uint.times(Gwei.toU256(actualFee), Uint(transferGas));

const maxCost = Uint.times(Gwei.toU256(maxFeePerGas), Uint(transferGas));

const historicalPrices = [
	{ time: "00:00", price: 20n },
	{ time: "06:00", price: 15n },
	{ time: "12:00", price: 35n },
	{ time: "18:00", price: 45n },
	{ time: "23:59", price: 25n },
];
for (const { time, price } of historicalPrices) {
	const gwei = Gwei(price);
	const wei = Gwei.toWei(gwei);
}

const network1 = { name: "Ethereum", price: 30n };
const network2 = { name: "Polygon", price: 50n }; // Higher gwei but cheaper fiat
const network3 = { name: "Arbitrum", price: 1n };
for (const { name, price } of [network1, network2, network3]) {
	const gwei = Gwei(price);
	const costGwei = Uint.times(Gwei.toU256(gwei), Uint(transferGas));
	const costEther = Gwei.toEther(costGwei as Gwei.Type);
}

const originalGasPrice = Gwei(100n);
const optimizedGasPrice = Gwei(30n);
const gasUsed = 150000n;

const originalCost = Uint.times(Gwei.toU256(originalGasPrice), Uint(gasUsed));
const optimizedCost = Uint.times(Gwei.toU256(optimizedGasPrice), Uint(gasUsed));
const savings = Uint.minus(originalCost, optimizedCost);

const estimatedGas = 125000n;
const bufferMultiplier = 120n; // 120% for safety
const recommendedLimit = (estimatedGas * bufferMultiplier) / 100n;

const gasPriceForEstimate = Gwei(35n);
const estimatedCost = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint(estimatedGas),
);
const maxCostWithLimit = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint(recommendedLimit),
);
