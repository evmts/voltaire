import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Ether conversions (human-readable unit)

console.log("=== Ether: Human-Readable Denomination ===\n");

// Creating Ether values
const oneEther = Ether.from(1n);
const fiveEther = Ether.from(5n);
const tenEther = Ether.from(10n);
const hundredEther = Ether.from(100n);
const thousandEther = Ether.from(1000n);

console.log("Ether values:");
console.log("1 ether:", Uint.toString(Ether.toU256(oneEther)));
console.log("5 ether:", Uint.toString(Ether.toU256(fiveEther)));
console.log("10 ether:", Uint.toString(Ether.toU256(tenEther)));
console.log("100 ether:", Uint.toString(Ether.toU256(hundredEther)));
console.log("1,000 ether:", Uint.toString(Ether.toU256(thousandEther)));

console.log("\n=== Converting Ether to Wei ===\n");

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
console.log(
	"10 ether =",
	Uint.toString(Wei.toU256(Ether.toWei(tenEther))),
	"wei",
);
console.log(
	"100 ether =",
	Uint.toString(Wei.toU256(Ether.toWei(hundredEther))),
	"wei",
);
console.log(
	"1,000 ether =",
	Uint.toString(Wei.toU256(Ether.toWei(thousandEther))),
	"wei",
);

console.log("\n=== Converting Ether to Gwei ===\n");

console.log(
	"1 ether =",
	Uint.toString(Gwei.toU256(Ether.toGwei(oneEther))),
	"gwei",
);
console.log(
	"5 ether =",
	Uint.toString(Gwei.toU256(Ether.toGwei(fiveEther))),
	"gwei",
);
console.log(
	"10 ether =",
	Uint.toString(Gwei.toU256(Ether.toGwei(tenEther))),
	"gwei",
);

console.log("\n=== Converting from Wei to Ether ===\n");

const halfEtherWei = Wei.from(500_000_000_000_000_000n);
const oneEtherWei = Wei.from(1_000_000_000_000_000_000n);
const twoPointFiveEtherWei = Wei.from(2_500_000_000_000_000_000n);
const fiveEtherWei = Wei.from(5_000_000_000_000_000_000n);

console.log(
	"500,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(halfEtherWei))),
	"ether",
);
console.log(
	"1,000,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(oneEtherWei))),
	"ether",
);
console.log(
	"2,500,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(twoPointFiveEtherWei))),
	"ether",
);
console.log(
	"5,000,000,000,000,000,000 wei =",
	Uint.toString(Ether.toU256(Wei.toEther(fiveEtherWei))),
	"ether",
);

console.log("\n=== Converting from Gwei to Ether ===\n");

const oneBillionGwei = Gwei.from(1_000_000_000n);
const fiveBillionGwei = Gwei.from(5_000_000_000n);
const tenBillionGwei = Gwei.from(10_000_000_000n);

console.log(
	"1,000,000,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(oneBillionGwei))),
	"ether",
);
console.log(
	"5,000,000,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(fiveBillionGwei))),
	"ether",
);
console.log(
	"10,000,000,000 gwei =",
	Uint.toString(Ether.toU256(Gwei.toEther(tenBillionGwei))),
	"ether",
);

console.log("\n=== Wallet Balance Examples ===\n");

// Typical wallet balances
const smallWallet = Ether.from(2n);
const mediumWallet = Ether.from(50n);
const largeWallet = Ether.from(500n);
const whaleWallet = Ether.from(10000n);

console.log("Wallet balances:");
console.log("Small:", Uint.toString(Ether.toU256(smallWallet)), "ether");
console.log("Medium:", Uint.toString(Ether.toU256(mediumWallet)), "ether");
console.log("Large:", Uint.toString(Ether.toU256(largeWallet)), "ether");
console.log("Whale:", Uint.toString(Ether.toU256(whaleWallet)), "ether");

console.log("\n=== Transaction Value Examples ===\n");

// Common transaction values
const sendAmount = Ether.from(3n);
const sendAmountWei = Ether.toWei(sendAmount);
const gasPrice = Gwei.from(30n);
const gasUsed = 21000n;
const gasCostWei = Uint.times(Gwei.toU256(gasPrice), Uint.from(gasUsed));
const totalWei = Uint.plus(Wei.toU256(sendAmountWei), gasCostWei);

console.log("Sending 3 ether:");
console.log("Amount:", Uint.toString(Ether.toU256(sendAmount)), "ether");
console.log("Amount (wei):", Uint.toString(Wei.toU256(sendAmountWei)), "wei");
console.log("Gas cost (wei):", Uint.toString(gasCostWei), "wei");
console.log("Total (wei):", Uint.toString(totalWei), "wei");
console.log(
	"Total (ether):",
	Uint.toString(Ether.toU256(Wei.toEther(totalWei as Wei.Type))),
	"ether",
);

console.log("\n=== Smart Contract Balances ===\n");

// Contract holdings
const dexLiquidity = Ether.from(125000n);
const stakingPool = Ether.from(50000n);
const treasuryBalance = Ether.from(75000n);

console.log("Protocol balances:");
console.log(
	"DEX liquidity:",
	Uint.toString(Ether.toU256(dexLiquidity)),
	"ether",
);
console.log("Staking pool:", Uint.toString(Ether.toU256(stakingPool)), "ether");
console.log("Treasury:", Uint.toString(Ether.toU256(treasuryBalance)), "ether");

const totalProtocol = Uint.sum([
	Ether.toU256(dexLiquidity),
	Ether.toU256(stakingPool),
	Ether.toU256(treasuryBalance),
]);

console.log("Total protocol value:", Uint.toString(totalProtocol), "ether");
