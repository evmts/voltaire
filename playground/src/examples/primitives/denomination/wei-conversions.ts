import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Wei conversions (smallest unit)

console.log("=== Wei: The Smallest Denomination ===\n");

// Creating Wei values
const oneWei = Wei.from(1n);
const thousandWei = Wei.from(1000n);
const millionWei = Wei.from(1_000_000n);

console.log("Wei values:");
console.log("1 wei:", Uint.toString(Wei.toU256(oneWei)));
console.log("1,000 wei:", Uint.toString(Wei.toU256(thousandWei)));
console.log("1,000,000 wei:", Uint.toString(Wei.toU256(millionWei)));

console.log("\n=== Converting Wei to Gwei ===\n");

const oneBillionWei = Wei.from(1_000_000_000n);
const tenBillionWei = Wei.from(10_000_000_000n);
const hundredBillionWei = Wei.from(100_000_000_000n);

console.log(
	"1,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(oneBillionWei))),
	"gwei",
);
console.log(
	"10,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(tenBillionWei))),
	"gwei",
);
console.log(
	"100,000,000,000 wei =",
	Uint.toString(Gwei.toU256(Wei.toGwei(hundredBillionWei))),
	"gwei",
);

console.log("\n=== Converting Wei to Ether ===\n");

const quarterEther = Wei.from(250_000_000_000_000_000n);
const halfEther = Wei.from(500_000_000_000_000_000n);
const fullEther = Wei.from(1_000_000_000_000_000_000n);
const tenEther = Wei.from(10_000_000_000_000_000_000n);

console.log(
	"250,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(quarterEther))),
	"ether",
);
console.log(
	"500,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(halfEther))),
	"ether",
);
console.log(
	"1,000,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(fullEther))),
	"ether",
);
console.log(
	"10,000,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(tenEther))),
	"ether",
);

console.log("\n=== Converting from Gwei to Wei ===\n");

const oneGwei = Gwei.from(1n);
const tenGwei = Gwei.from(10n);
const hundredGwei = Gwei.from(100n);

console.log("1 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(oneGwei))), "wei");
console.log("10 gwei =", Uint.toString(Wei.toU256(Gwei.toWei(tenGwei))), "wei");
console.log(
	"100 gwei =",
	Uint.toString(Wei.toU256(Gwei.toWei(hundredGwei))),
	"wei",
);

console.log("\n=== Converting from Ether to Wei ===\n");

const pointOneEther = Ether.from(1n); // 0.1 represented as integer
const oneEther = Ether.from(1n);
const fiveEther = Ether.from(5n);

console.log(
	"1 ether =",
	Uint.toString(Wei.toU256(Ether.toWei(oneEther))),
	"wei",
);
console.log(
	"5 ether =",
	Uint.toString(Wei.toU256(Ether.toWei(fiveEther))),
	"wei",
);

console.log("\n=== Practical Examples ===\n");

// Transaction value
const txValue = Wei.from(100_000_000_000_000_000n);
console.log("Transaction value:", Uint.toString(Wei.toU256(txValue)), "wei");
console.log(
	"As ether:",
	Uint.toString(Ether.toU256(Wei.toEther(txValue))),
	"ether",
);

// Gas cost calculation
const gasPrice = Wei.from(30_000_000_000n); // 30 gwei in wei
const gasUsed = 21000n;
const totalCost = Uint.times(Wei.toU256(gasPrice), Uint.from(gasUsed));

console.log("\nGas cost:");
console.log("Gas price:", Uint.toString(Wei.toU256(gasPrice)), "wei");
console.log("Gas used:", gasUsed.toString());
console.log("Total:", Uint.toString(totalCost), "wei");
console.log(
	"Total:",
	Uint.toString(Ether.toU256(Wei.toEther(totalCost as Wei.Type))),
	"ether",
);

// Dust amount (very small wei value)
const dust = Wei.from(123n);
console.log("\nDust amount:", Uint.toString(Wei.toU256(dust)), "wei");
console.log(
	"In gwei:",
	Uint.toString(Gwei.toU256(Wei.toGwei(dust))),
	"gwei (rounded down)",
);
