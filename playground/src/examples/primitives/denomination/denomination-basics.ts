import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Denomination basics - Wei, Gwei, Ether conversions

console.log("=== Creating Denomination Values ===\n");

// Create Wei values
const smallWei = Wei.from(1000n);
const oneGweiInWei = Wei.from(1_000_000_000n);
const oneEtherInWei = Wei.from(1_000_000_000_000_000_000n);

console.log("Wei values:");
console.log("Small:", Uint.toString(Wei.toU256(smallWei)), "wei");
console.log("1 Gwei:", Uint.toString(Wei.toU256(oneGweiInWei)), "wei");
console.log("1 Ether:", Uint.toString(Wei.toU256(oneEtherInWei)), "wei");

// Create Gwei values (common for gas prices)
const lowGasPrice = Gwei.from(10n);
const normalGasPrice = Gwei.from(30n);
const highGasPrice = Gwei.from(100n);

console.log("\nGwei values (gas prices):");
console.log("Low:", Uint.toString(Gwei.toU256(lowGasPrice)), "gwei");
console.log("Normal:", Uint.toString(Gwei.toU256(normalGasPrice)), "gwei");
console.log("High:", Uint.toString(Gwei.toU256(highGasPrice)), "gwei");

// Create Ether values (human-readable)
const smallBalance = Ether.from(1n);
const largeBalance = Ether.from(1000n);

console.log("\nEther values:");
console.log("Small:", Uint.toString(Ether.toU256(smallBalance)), "ether");
console.log("Large:", Uint.toString(Ether.toU256(largeBalance)), "ether");

console.log("\n=== Converting Between Denominations ===\n");

// Wei <-> Gwei
const weiValue = Wei.from(50_000_000_000n);
const asGwei = Wei.toGwei(weiValue);
const backToWei = Gwei.toWei(asGwei);

console.log("Wei to Gwei:");
console.log("50,000,000,000 wei =", Uint.toString(Gwei.toU256(asGwei)), "gwei");
console.log("Back to wei:", Uint.toString(Wei.toU256(backToWei)), "wei");

// Wei <-> Ether
const weiBalance = Wei.from(2_500_000_000_000_000_000n);
const asEther = Wei.toEther(weiBalance);
const backToWeiFromEther = Ether.toWei(asEther);

console.log("\nWei to Ether:");
console.log(
	"2,500,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(asEther)),
	"ether",
);
console.log(
	"Back to wei:",
	Uint.toString(Wei.toU256(backToWeiFromEther)),
	"wei",
);

// Gwei <-> Ether
const gweiAmount = Gwei.from(5_000_000_000n);
const gweiAsEther = Gwei.toEther(gweiAmount);
const backToGwei = Ether.toGwei(gweiAsEther);

console.log("\nGwei to Ether:");
console.log(
	"5,000,000,000 gwei =",
	Uint.toString(Ether.toU256(gweiAsEther)),
	"ether",
);
console.log("Back to gwei:", Uint.toString(Gwei.toU256(backToGwei)), "gwei");

console.log("\n=== Real-World Examples ===\n");

// Gas calculation
const gasPrice = Gwei.from(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));
const gasCostEther = Wei.toEther(gasCostWei as Wei.Type);

console.log("Transaction cost:");
console.log("Gas price:", Uint.toString(Gwei.toU256(gasPrice)), "gwei");
console.log("Gas used:", gasUsed.toString());
console.log(
	"Total cost:",
	Uint.toString(Wei.toU256(gasCostWei as Wei.Type)),
	"wei",
);
console.log("Total cost:", Uint.toString(Ether.toU256(gasCostEther)), "ether");

// Balance conversion
const accountBalanceWei = Wei.from(15_750_000_000_000_000_000n);
const accountBalanceEther = Wei.toEther(accountBalanceWei);

console.log("\nAccount balance:");
console.log("Wei:", Uint.toString(Wei.toU256(accountBalanceWei)), "wei");
console.log(
	"Ether:",
	Uint.toString(Ether.toU256(accountBalanceEther)),
	"ether",
);
