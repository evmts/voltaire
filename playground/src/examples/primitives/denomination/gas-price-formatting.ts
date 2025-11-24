import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Gas price formatting and calculations

console.log("=== Gas Price Levels ===\n");

const slow = Gwei.from(10n);
const standard = Gwei.from(30n);
const fast = Gwei.from(50n);
const rapid = Gwei.from(100n);

function formatGasPrice(gwei: Gwei.Type, label: string) {
	const wei = Gwei.toWei(gwei);
	console.log(`${label}:`);
	console.log("  ", Uint.toString(Gwei.toU256(gwei)), "gwei");
	console.log("  ", Uint.toString(Wei.toU256(wei)), "wei");
}

formatGasPrice(slow, "Slow");
formatGasPrice(standard, "Standard");
formatGasPrice(fast, "Fast");
formatGasPrice(rapid, "Rapid");

console.log("\n=== Transaction Cost Calculations ===\n");

// Standard transfer (21,000 gas)
const transferGas = 21000n;
console.log("Standard transfer (21,000 gas):");

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

	console.log(
		`  ${label} (${Uint.toString(Gwei.toU256(price))} gwei): ${Uint.toString(costGwei)} gwei = ${Uint.toString(Ether.toU256(costEther))} ether`,
	);
}

console.log("\n=== Complex Transaction Costs ===\n");

// Token swap (more complex)
const swapGas = 150000n;
const swapGasPrice = Gwei.from(35n);

const swapCostGwei = Uint.times(Gwei.toU256(swapGasPrice), Uint.from(swapGas));
const swapCostWei = Gwei.toWei(swapCostGwei as Gwei.Type);
const swapCostEther = Wei.toEther(swapCostWei);

console.log("Token swap (150,000 gas):");
console.log("  Gas price:", Uint.toString(Gwei.toU256(swapGasPrice)), "gwei");
console.log("  Gas used: ", swapGas.toString());
console.log("  Cost:     ", Uint.toString(swapCostGwei), "gwei");
console.log("            ", Uint.toString(Wei.toU256(swapCostWei)), "wei");
console.log(
	"            ",
	Uint.toString(Ether.toU256(swapCostEther)),
	"ether",
);

// NFT mint
const mintGas = 200000n;
const mintGasPrice = Gwei.from(60n);

const mintCostGwei = Uint.times(Gwei.toU256(mintGasPrice), Uint.from(mintGas));
const mintCostWei = Gwei.toWei(mintCostGwei as Gwei.Type);
const mintCostEther = Wei.toEther(mintCostWei);

console.log("\nNFT mint (200,000 gas):");
console.log("  Gas price:", Uint.toString(Gwei.toU256(mintGasPrice)), "gwei");
console.log("  Gas used: ", mintGas.toString());
console.log("  Cost:     ", Uint.toString(mintCostGwei), "gwei");
console.log("            ", Uint.toString(Wei.toU256(mintCostWei)), "wei");
console.log(
	"            ",
	Uint.toString(Ether.toU256(mintCostEther)),
	"ether",
);

console.log("\n=== EIP-1559 Gas Formatting ===\n");

const baseFee = Gwei.from(25n);
const priorityFee = Gwei.from(2n);
const maxFeePerGas = Gwei.from(50n);
const maxPriorityFeePerGas = Gwei.from(3n);

console.log("EIP-1559 Transaction:");
console.log(
	"  Base fee:              ",
	Uint.toString(Gwei.toU256(baseFee)),
	"gwei",
);
console.log(
	"  Priority fee:          ",
	Uint.toString(Gwei.toU256(priorityFee)),
	"gwei",
);
console.log(
	"  Max fee per gas:       ",
	Uint.toString(Gwei.toU256(maxFeePerGas)),
	"gwei",
);
console.log(
	"  Max priority fee:      ",
	Uint.toString(Gwei.toU256(maxPriorityFeePerGas)),
	"gwei",
);

const actualFee = Uint.plus(
	Gwei.toU256(baseFee),
	Gwei.toU256(priorityFee),
) as Gwei.Type;
const actualCost = Uint.times(Gwei.toU256(actualFee), Uint.from(transferGas));

console.log(
	"\n  Actual fee per gas:    ",
	Uint.toString(Gwei.toU256(actualFee)),
	"gwei",
);
console.log("  Total cost (21k gas):  ", Uint.toString(actualCost), "gwei");
console.log(
	"                         ",
	Uint.toString(Ether.toU256(Gwei.toEther(actualCost as Gwei.Type))),
	"ether",
);

const maxCost = Uint.times(Gwei.toU256(maxFeePerGas), Uint.from(transferGas));
console.log("  Max possible cost:     ", Uint.toString(maxCost), "gwei");
console.log(
	"                         ",
	Uint.toString(Ether.toU256(Gwei.toEther(maxCost as Gwei.Type))),
	"ether",
);

console.log("\n=== Gas Price History Display ===\n");

const historicalPrices = [
	{ time: "00:00", price: 20n },
	{ time: "06:00", price: 15n },
	{ time: "12:00", price: 35n },
	{ time: "18:00", price: 45n },
	{ time: "23:59", price: 25n },
];

console.log("24-hour gas price history:");
for (const { time, price } of historicalPrices) {
	const gwei = Gwei.from(price);
	const wei = Gwei.toWei(gwei);
	console.log(
		`  ${time}: ${Uint.toString(Gwei.toU256(gwei)).padStart(3)} gwei (${Uint.toString(Wei.toU256(wei))} wei)`,
	);
}

console.log("\n=== Gas Price Comparison ===\n");

const network1 = { name: "Ethereum", price: 30n };
const network2 = { name: "Polygon", price: 50n }; // Higher gwei but cheaper fiat
const network3 = { name: "Arbitrum", price: 1n };

console.log("Cross-network gas prices:");
for (const { name, price } of [network1, network2, network3]) {
	const gwei = Gwei.from(price);
	const costGwei = Uint.times(Gwei.toU256(gwei), Uint.from(transferGas));
	const costEther = Gwei.toEther(costGwei as Gwei.Type);

	console.log(
		`  ${name.padEnd(10)}: ${Uint.toString(Gwei.toU256(gwei)).padStart(3)} gwei/gas`,
	);
	console.log(
		`    Transfer cost: ${Uint.toString(Ether.toU256(costEther))} ether`,
	);
}

console.log("\n=== Gas Savings Calculator ===\n");

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

console.log("Gas optimization savings:");
console.log(
	"  Original:  ",
	Uint.toString(Gwei.toU256(originalGasPrice)),
	"gwei/gas",
);
console.log(
	"  Optimized: ",
	Uint.toString(Gwei.toU256(optimizedGasPrice)),
	"gwei/gas",
);
console.log("  Gas used:  ", gasUsed.toString());
console.log("\n  Original cost:  ", Uint.toString(originalCost), "gwei");
console.log("  Optimized cost: ", Uint.toString(optimizedCost), "gwei");
console.log("  Savings:        ", Uint.toString(savings), "gwei");
console.log(
	"                  ",
	Uint.toString(Ether.toU256(Gwei.toEther(savings as Gwei.Type))),
	"ether",
);

console.log("\n=== Gas Limit Estimation Display ===\n");

const estimatedGas = 125000n;
const bufferMultiplier = 120n; // 120% for safety
const recommendedLimit = (estimatedGas * bufferMultiplier) / 100n;

console.log("Gas limit recommendation:");
console.log("  Estimated:   ", estimatedGas.toString(), "gas");
console.log("  Buffer:      ", bufferMultiplier.toString(), "%");
console.log("  Recommended: ", recommendedLimit.toString(), "gas");

const gasPriceForEstimate = Gwei.from(35n);
const estimatedCost = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint.from(estimatedGas),
);
const maxCostWithLimit = Uint.times(
	Gwei.toU256(gasPriceForEstimate),
	Uint.from(recommendedLimit),
);

console.log("\n  At 35 gwei:");
console.log("    Expected cost: ", Uint.toString(estimatedCost), "gwei");
console.log("    Max cost:      ", Uint.toString(maxCostWithLimit), "gwei");
console.log(
	"                   ",
	Uint.toString(Ether.toU256(Gwei.toEther(maxCostWithLimit as Gwei.Type))),
	"ether",
);
