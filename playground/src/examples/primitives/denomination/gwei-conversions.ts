import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Gwei conversions (gas price unit)

console.log("=== Gwei: Gas Price Denomination ===\n");

// Creating Gwei values (typical gas prices)
const veryLow = Gwei.from(5n);
const low = Gwei.from(10n);
const medium = Gwei.from(30n);
const high = Gwei.from(100n);
const extreme = Gwei.from(500n);

console.log("Gas price levels (gwei):");
console.log("Very low:", Uint.toString(Gwei.toU256(veryLow)));
console.log("Low:", Uint.toString(Gwei.toU256(low)));
console.log("Medium:", Uint.toString(Gwei.toU256(medium)));
console.log("High:", Uint.toString(Gwei.toU256(high)));
console.log("Extreme:", Uint.toString(Gwei.toU256(extreme)));

console.log("\n=== Converting Gwei to Wei ===\n");

console.log("5 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(veryLow))), "wei");
console.log("10 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(low))), "wei");
console.log("30 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(medium))), "wei");
console.log("100 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(high))), "wei");
console.log(
	"500 gwei =",
	Uint.toString(Wei.toU256(Gwei.toWei(extreme))),
	"wei",
);

console.log("\n=== Converting Gwei to Ether ===\n");

const oneGwei = Gwei.from(1n);
const oneThousandGwei = Gwei.from(1000n);
const oneMillion = Gwei.from(1_000_000n);
const oneBillion = Gwei.from(1_000_000_000n);

console.log(
	"1 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(oneGwei))),
	"ether",
);
console.log(
	"1,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(oneThousandGwei))),
	"ether",
);
console.log(
	"1,000,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(oneMillion))),
	"ether",
);
console.log(
	"1,000,000,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(oneBillion))),
	"ether",
);

console.log("\n=== Converting from Wei to Gwei ===\n");

const smallWei = Wei.from(5_000_000_000n);
const mediumWei = Wei.from(30_000_000_000n);
const largeWei = Wei.from(100_000_000_000n);

console.log(
	"5,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(smallWei))),
	"gwei",
);
console.log(
	"30,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(mediumWei))),
	"gwei",
);
console.log(
	"100,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(largeWei))),
	"gwei",
);

console.log("\n=== Converting from Ether to Gwei ===\n");

const pointZeroOneEther = Ether.from(1n); // Treating as 0.01 for example
const oneEther = Ether.from(1n);
const tenEther = Ether.from(10n);

console.log(
	"1 ether =",
	Uint.toString(Gwei.toU256(Ether.toGwei(oneEther))),
	"gwei",
);
console.log(
	"10 ether =",
	Uint.toString(Gwei.toU256(Ether.toGwei(tenEther))),
	"gwei",
);

console.log("\n=== Gas Price Calculations ===\n");

// Calculate transaction cost at different gas prices
const gasUsed = 21000n;

const costAtLow = Uint.times(Gwei.toU256(low), Uint.from(gasUsed));
const costAtMedium = Uint.times(Gwei.toU256(medium), Uint.from(gasUsed));
const costAtHigh = Uint.times(Gwei.toU256(high), Uint.from(gasUsed));

console.log("Transfer (21,000 gas) costs:");
console.log(
	"At 10 gwei:",
	Uint.toString(costAtLow),
	"gwei =",
	Uint.toString(Wei.toU256(Gwei.toWei(costAtLow as Gwei.Type))),
	"wei",
);
console.log(
	"At 30 gwei:",
	Uint.toString(costAtMedium),
	"gwei =",
	Uint.toString(Wei.toU256(Gwei.toWei(costAtMedium as Gwei.Type))),
	"wei",
);
console.log(
	"At 100 gwei:",
	Uint.toString(costAtHigh),
	"gwei =",
	Uint.toString(Wei.toU256(Gwei.toWei(costAtHigh as Gwei.Type))),
	"wei",
);

// Complex transaction
const swapGasUsed = 150000n;
const swapGasPrice = Gwei.from(40n);
const swapCost = Uint.times(Gwei.toU256(swapGasPrice), Uint.from(swapGasUsed));

console.log("\nToken swap (150,000 gas) at 40 gwei:");
console.log("Cost:", Uint.toString(swapCost), "gwei");
console.log(
	"In wei:",
	Uint.toString(Wei.toU256(Gwei.toWei(swapCost as Gwei.Type))),
	"wei",
);
console.log(
	"In ether:",
	Uint.toString(Ether.toU256(Gwei.toEther(swapCost as Gwei.Type))),
	"ether",
);

console.log("\n=== Priority Fee Examples ===\n");

const baseFee = Gwei.from(25n);
const priorityFee = Gwei.from(2n);
const maxFee = Uint.plus(Gwei.toU256(baseFee), Gwei.toU256(priorityFee));

console.log("EIP-1559 transaction:");
console.log("Base fee:", Uint.toString(Gwei.toU256(baseFee)), "gwei");
console.log("Priority fee:", Uint.toString(Gwei.toU256(priorityFee)), "gwei");
console.log("Max fee:", Uint.toString(maxFee), "gwei");
